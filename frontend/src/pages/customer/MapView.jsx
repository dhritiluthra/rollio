import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import L from "leaflet";
import { WS_URL } from "../../config.js";

// ─── MAP ICONS ────────────────────────────────────────────────────────────────
// Orange teardrop pin for vendor carts
const cartIcon = new L.DivIcon({
  html: `<div style="background:#f97316;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Blue dot for the user's own position
const userIcon = new L.DivIcon({
  html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CATEGORIES = ["All", "Chaat", "Momos", "Juice", "Meals", "Snacks"];
const RADII = [1, 3, 5, 10];

// The WebSocket URL — same host/port as the REST API, just ws:// scheme.
// When both REST and WS share one HTTP server, this is all you need.
// const WS_URL = "ws://localhost:5000";

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
//
// This component has two screens that live inside the same React component:
//
//   "discovery" — the search screen you see first
//   "results"   — the filtered results (list or map) after you search
//
// Why one component and not two separate pages?
// Because they share location, carts, WebSocket connection, and search state.
// Splitting them across routes would mean re-fetching location and reconnecting
// the WebSocket every time the user switches between them.
//
export default function MapView() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Location ────────────────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // ── Search / filter ─────────────────────────────────────────────────────────
  // `pendingQuery` is what the user is typing. `query` is what was submitted.
  const [pendingQuery, setPendingQuery] = useState("");
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(5); // km
  const [category, setCategory] = useState("All");

  // ── Screen state ────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState("discovery"); // 'discovery' | 'results'
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'map'

  // ── Cart data ────────────────────────────────────────────────────────────────
  const [carts, setCarts] = useState([]);
  const [cartsLoading, setCartsLoading] = useState(false);

  // ── WebSocket ────────────────────────────────────────────────────────────────
  // We use a ref (not state) for the WebSocket instance so storing it here
  // does not trigger a re-render. The WS connection outlives any screen change.
  const wsRef = useRef(null);
  const mountedRef = useRef(true); // prevents reconnect after unmount

  // ── Step 1: get the user's GPS position ─────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!mountedRef.current) return;
        setUserLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        setLocationLoading(false);
      },
      () => {
        if (!mountedRef.current) return;
        setLocationError("Please allow location access to find nearby carts");
        setLocationLoading(false);
      },
    );

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Step 2: once we have location, load the discovery carts ──────────────────
  useEffect(() => {
    if (userLocation) fetchCarts("", "All", radius);
  }, [userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 3: open a WebSocket once we have location ───────────────────────────
  //
  // What is a WebSocket?
  // A normal HTTP request is one-shot: browser asks, server replies, done.
  // A WebSocket is a persistent two-way channel: after the opening handshake
  // the connection stays open and the server can push messages at any moment.
  //
  // The server pushes three event types:
  //   cart_live      — vendor just went live (trigger a re-fetch)
  //   cart_offline   — vendor went offline (remove from list instantly)
  //   location_update — vendor moved their cart (update pin in place)
  //
  useEffect(() => {
    if (!userLocation) return;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => console.log("[WS] Connected to Rollio live feed");

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "cart_offline") {
          // Remove the cart right away so the user doesn't walk to a closed stall.
          setCarts((prev) => prev.filter((c) => c.id !== msg.cartId));
          setSelectedCart((prev) => (prev?.id === msg.cartId ? null : prev));
        } else if (msg.type === "cart_live") {
          // Re-fetch so the backend can calculate distance and apply filters.
          fetchCarts(query, category, radius);
        } else if (msg.type === "location_update") {
          // Mutate only the coords — keeps the rest of the cart data intact.
          setCarts((prev) =>
            prev.map((c) =>
              c.id === msg.cartId
                ? {
                    ...c,
                    latitude: msg.latitude,
                    longitude: msg.longitude,
                    address: msg.address,
                  }
                : c,
            ),
          );
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected. Reconnecting in 3s...");
        if (mountedRef.current) setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close(); // triggers onclose -> reconnect
    };

    connect();
    return () => wsRef.current?.close();
  }, [userLocation]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Core fetch function ──────────────────────────────────────────────────────
  //
  // We always pass filter values explicitly rather than reading from state,
  // because setState is async — right after setRadius(r) the state variable
  // `radius` still holds the old value inside this call frame.
  //
  const fetchCarts = async (searchQuery, searchCategory, searchRadius) => {
    if (!userLocation) return;
    setCartsLoading(true);
    try {
      const params = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: searchRadius,
        ...(searchQuery && { search: searchQuery }),
        ...(searchCategory &&
          searchCategory !== "All" && { category: searchCategory }),
      };
      const response = await api.get("/carts/nearby", { params });
      setCarts(response.data.carts);
    } catch (err) {
      console.error("Failed to fetch carts:", err);
    } finally {
      setCartsLoading(false);
    }
  };

  // ── Event handlers ──────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    e.preventDefault();
    const q = pendingQuery.trim();
    if (!q) return;
    setQuery(q);
    setScreen("results");
    setViewMode("list");
    fetchCarts(q, category, radius);
  };

  const handleBack = () => {
    setScreen("discovery");
    setQuery("");
    setPendingQuery("");
    setViewMode("list");
    fetchCarts("", "All", radius);
  };

  const handleRadiusChange = (r) => {
    setRadius(r);
    if (screen === "results") fetchCarts(query, category, r);
    else fetchCarts("", category, r);
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    if (screen === "results") fetchCarts(query, cat, radius);
    else fetchCarts("", cat, radius);
  };

  // ─── RENDER: loading ────────────────────────────────────────────────────────
  if (locationLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div
          className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p className="text-gray-400 text-sm">Finding carts near you...</p>
      </div>
    );
  }

  // ─── RENDER: location error ──────────────────────────────────────────────────
  if (locationError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center gap-4">
        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
          <svg
            className="w-7 h-7 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
            />
          </svg>
        </div>
        <h2 className="text-gray-800 font-semibold text-lg">Location needed</h2>
        <p className="text-gray-400 text-sm max-w-xs">{locationError}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ─── RENDER: discovery screen ────────────────────────────────────────────────
  //
  // The landing experience. User sees a search bar, filters, and a live list
  // of active nearby carts — all before typing anything.
  //
  if (screen === "discovery") {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-bold text-orange-500 tracking-widest uppercase">
            Rollio
          </h1>
          {user ? (
            <button
              onClick={() =>
                navigate(user.role === "vendor" ? "/dashboard" : "/")
              }
              className="text-sm text-gray-500 hover:text-orange-500 transition"
            >
              {user.role === "vendor" ? "Dashboard" : "Home"}
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="bg-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-orange-600 transition"
            >
              Login
            </button>
          )}
        </div>

        <div className="flex-1 px-5 pt-8 pb-28 overflow-y-auto">
          {/* Hero text */}
          <p className="text-gray-400 text-sm mb-1">
            Find street food near you
          </p>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            What are you craving?
          </h2>

          {/* Search bar
            Submitting the form fires handleSearch, which switches to "results" screen.
          */}
          <form onSubmit={handleSearch} className="relative mb-5">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              value={pendingQuery}
              onChange={(e) => setPendingQuery(e.target.value)}
              placeholder="chaat, momos, juice..."
              className="w-full pl-10 pr-20 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-orange-600 transition"
            >
              Search
            </button>
          </form>

          {/* Radius chips — clicking refetches discovery list instantly */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-xs text-gray-400">Near me</span>
            {RADII.map((r) => (
              <button
                key={r}
                onClick={() => handleRadiusChange(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  radius === r
                    ? "bg-orange-500 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-orange-300"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>

          {/* Category pills — clicking refetches and filters by food type */}
          <div className="flex gap-2 mb-7 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  category === cat
                    ? "bg-gray-800 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Active right now section */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
              Active right now
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {cartsLoading ? (
            <div className="flex justify-center py-8">
              <div
                className="w-6 h-6 rounded-full border-2 border-orange-200 border-t-orange-500"
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
          ) : carts.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">
              No active carts within {radius} km right now
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {carts.map((cart) => (
                <CartPreviewCard
                  key={cart.id}
                  cart={cart}
                  onClick={() => navigate(`/cart/${cart.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bottom sheet: tap a discovery cart to see its details */}
      </div>
    );
  }

  // ─── RENDER: results screen ──────────────────────────────────────────────────
  //
  // Shown after search. Default view is "list" (less overwhelming than map).
  // Toggle to "map" shows the same results as pins on Leaflet.
  //
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Results header */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="font-medium text-gray-700 text-sm">"{query}"</span>
        </div>

        {/* List / Map toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              viewMode === "list"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              viewMode === "map"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Map
          </button>
        </div>
      </div>

      {/* Results count bar */}
      <div className="bg-white px-5 py-2 border-b border-gray-100 shrink-0">
        <p className="text-xs text-gray-400">
          {cartsLoading
            ? "Searching..."
            : `${carts.length} result${carts.length !== 1 ? "s" : ""} within ${radius} km`}
        </p>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {/* LIST VIEW */}
        {viewMode === "list" && (
          <div className="h-full overflow-y-auto px-5 py-4">
            {cartsLoading ? (
              <div className="flex justify-center py-8">
                <div
                  className="w-6 h-6 rounded-full border-2 border-orange-200 border-t-orange-500"
                  style={{ animation: "spin 1s linear infinite" }}
                />
              </div>
            ) : carts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 font-medium mb-1">
                  No results for "{query}"
                </p>
                <p className="text-gray-400 text-sm">
                  Try a different search or expand your radius
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {carts.map((cart) => (
                  <CartResultCard
                    key={cart.id}
                    cart={cart}
                    onClick={() => navigate(`/cart/${cart.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MAP VIEW
          `key` forces a Leaflet remount when switching back from list — prevents
          the common blank-map bug caused by Leaflet not knowing its container resized.
        */}
        {viewMode === "map" && userLocation && (
          <MapContainer
            key="results-map"
            center={[userLocation.latitude, userLocation.longitude]}
            zoom={14}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userIcon}
            />
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={radius * 1000}
              pathOptions={{
                color: "#f97316",
                fillColor: "#f97316",
                fillOpacity: 0.05,
                weight: 1,
              }}
            />
            {carts.map((cart) => (
              <Marker
                key={cart.id}
                position={[cart.latitude, cart.longitude]}
                icon={cartIcon}
                eventHandlers={{ click: () => navigate(`/cart/${cart.id}`) }}
              />
            ))}
          </MapContainer>
        )}

        {/* Empty state overlay on map */}
        {viewMode === "map" && carts.length === 0 && !cartsLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full px-5 py-2 shadow-lg pointer-events-none">
            <p className="text-gray-500 text-sm">No results on map</p>
          </div>
        )}
      </div>

      {/* No bottom sheet needed — cart taps navigate to /cart/:id */}
    </div>
  );
}

// ─── CART PREVIEW CARD (discovery screen) ────────────────────────────────────
// Compact row shown in the "Active right now" section before any search.
function CartPreviewCard({ cart, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
          <div className="w-3 h-3 bg-orange-500 rounded-full" />
        </div>
        <div className="min-w-0">
          <p className="text-gray-800 font-semibold text-sm">{cart.name}</p>
          {cart.address && (
            <p className="text-gray-400 text-xs mt-0.5 truncate">
              {cart.address}
            </p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className="text-orange-500 text-xs font-medium">
          {parseFloat(cart.distance_km).toFixed(1)} km
        </p>
        <span className="text-green-500 text-xs">● Open</span>
      </div>
    </button>
  );
}

// ─── CART RESULT CARD (results list view) ────────────────────────────────────
// Richer card with description and top food items embedded from the API response.
// `top_items` comes from the backend's json_agg subquery — no extra API call needed.
function CartResultCard({ cart, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 pr-3">
          <h3 className="font-bold text-gray-800">{cart.name}</h3>
          {cart.description && (
            <p className="text-gray-400 text-sm mt-0.5 line-clamp-2">
              {cart.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium">
            ● Live
          </span>
          <p className="text-gray-400 text-xs mt-1">
            {parseFloat(cart.distance_km).toFixed(1)} km
          </p>
        </div>
      </div>

      {cart.top_items && cart.top_items.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-2">
          {cart.top_items.map((item) => (
            <span
              key={item.id}
              className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full"
            >
              {item.name} ₹{item.price}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── CART BOTTOM SHEET ────────────────────────────────────────────────────────
// Slides up from the bottom when a cart is tapped in either screen.
// z-[1000] keeps it above Leaflet's internal z-index layers.
function CartBottomSheet({ cart, onClose }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl px-5 py-5">
      <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="flex items-start justify-between mb-3 pr-6">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{cart.name}</h3>
          <p className="text-gray-400 text-sm mt-0.5">
            {cart.description || "Street food cart"}
          </p>
        </div>
        <div className="text-right">
          <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-medium">
            ● Active
          </span>
          <p className="text-gray-400 text-xs mt-1">
            {parseFloat(cart.distance_km).toFixed(1)} km away
          </p>
        </div>
      </div>

      {cart.address && (
        <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          {cart.address}
        </p>
      )}

      <div className="border-t border-gray-100 my-3" />
      <FoodItemsPreview cartId={cart.id} />
    </div>
  );
}

// ─── FOOD ITEMS PREVIEW ────────────────────────────────────────────────────────
// Fetches the full menu for a cart inside the bottom sheet.
// cartId in the dep array means React re-fetches whenever a different cart is tapped.
function FoodItemsPreview({ cartId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/carts/${cartId}/items`)
      .then((res) => setItems(res.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cartId]);

  if (loading) return <p className="text-gray-400 text-xs">Loading menu...</p>;
  if (items.length === 0)
    return <p className="text-gray-400 text-xs">No menu items listed yet</p>;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Menu
      </p>
      <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div className="min-w-0 pr-2">
              <p className="text-gray-800 text-sm font-medium">{item.name}</p>
              {item.description && (
                <p className="text-gray-400 text-xs">{item.description}</p>
              )}
            </div>
            <p className="text-orange-500 font-semibold text-sm shrink-0">
              Rs.{item.price}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
