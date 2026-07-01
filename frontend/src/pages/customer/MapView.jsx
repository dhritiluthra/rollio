import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";
import L from "leaflet";

// Custom orange pin for active carts
// We create a custom icon using Leaflet's DivIcon
// DivIcon lets you use HTML/CSS as a map marker instead of an image
const cartIcon = new L.DivIcon({
  html: `
    <div style="
      background: #f97316;
      width: 36px;
      height: 36px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  className: "", // removes leaflet's default white box around icon
  iconSize: [36, 36],
  iconAnchor: [18, 36], // point of the icon that corresponds to marker's location
  popupAnchor: [0, -36], // where the popup opens relative to icon
});

// Blue pin for user's own location
const userIcon = new L.DivIcon({
  html: `
    <div style="
      background: #3b82f6;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MapView() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [userLocation, setUserLocation] = useState(null);
  const [carts, setCarts] = useState([]);
  const [selectedCart, setSelectedCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [radius, setRadius] = useState(5); // km

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    // navigator.geolocation is the browser API for GPS
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        fetchNearbyCarts(latitude, longitude);
      },
      (error) => {
        // User denied location permission
        setLocationError("Please allow location access to find nearby carts");
        setLoading(false);
      },
    );
  };

  const fetchNearbyCarts = async (latitude, longitude) => {
    try {
      const response = await api.get("/carts/nearby", {
        params: { latitude, longitude, radius },
      });
      setCarts(response.data.carts);
    } catch (err) {
      console.error("Failed to fetch carts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div
          className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
        <p className="text-gray-400 text-sm">Finding carts near you...</p>
      </div>
    );
  }

  // Location permission denied
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
          onClick={getUserLocation}
          className="bg-orange-500 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center justify-between z-10 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-orange-500 tracking-widest uppercase">
            Rollio
          </h1>
          <p className="text-xs text-gray-400">
            {carts.length} active cart{carts.length !== 1 ? "s" : ""} nearby
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Radius selector */}
          <select
            value={radius}
            onChange={(e) => {
              setRadius(Number(e.target.value));
              if (userLocation) {
                fetchNearbyCarts(userLocation.latitude, userLocation.longitude);
              }
            }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none text-gray-600"
          >
            <option value={1}>1 km</option>
            <option value={3}>3 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
          </select>

          {/* Auth button */}
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
      </div>

      {/* Map — takes remaining height */}
      {/*
        flex-1 makes the map fill all remaining vertical space
        after the header. Without this the map has no height and
        won't render at all — common Leaflet gotcha.
      */}
      <div className="flex-1 relative">
        {userLocation && (
          <MapContainer
            center={[userLocation.latitude, userLocation.longitude]}
            zoom={14}
            className="h-full w-full"
            zoomControl={false} // we'll position zoom controls manually
          >
            {/*
              TileLayer is the actual map imagery.
              OpenStreetMap is free — no API key needed.
              {z}/{x}/{y} are tile coordinates Leaflet fills in automatically.
            */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
            />

            {/* User location marker */}
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userIcon}
            />

            {/* Radius circle around user */}
            {/*
              Circle shows the search area visually.
              radius in meters — so km * 1000
            */}
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

            {/* Cart markers */}
            {carts.map((cart) => (
              <Marker
                key={cart.id}
                position={[cart.latitude, cart.longitude]}
                icon={cartIcon}
                eventHandlers={{
                  click: () => setSelectedCart(cart),
                }}
              />
            ))}
          </MapContainer>
        )}

        {/* No carts found message — overlays on map */}
        {carts.length === 0 && !loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-full px-5 py-2 shadow-lg">
            <p className="text-gray-500 text-sm">No active carts nearby</p>
          </div>
        )}
      </div>

      {/* ── CART INFO BOTTOM SHEET ── */}
      {/*
        This slides up from the bottom when a cart pin is clicked.
        translate-y-0 when visible, translate-y-full when hidden.
        transition-transform makes it animate smoothly.
        z-[1000] keeps it above the Leaflet map (which uses z-index internally)
      */}
      {selectedCart && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl px-5 py-5 transition-transform">
          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

          {/* Close button */}
          <button
            onClick={() => setSelectedCart(null)}
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

          {/* Cart info */}
          <div className="flex items-start justify-between mb-3 pr-6">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                {selectedCart.name}
              </h3>
              <p className="text-gray-400 text-sm mt-0.5">
                {selectedCart.description || "Street food cart"}
              </p>
            </div>
            <div className="text-right">
              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full font-medium">
                ● Active
              </span>
              <p className="text-gray-400 text-xs mt-1">
                {parseFloat(selectedCart.distance_km).toFixed(1)} km away
              </p>
            </div>
          </div>

          {/* Address if available */}
          {selectedCart.address && (
            <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
              {selectedCart.address}
            </p>
          )}

          {/* Divider */}
          <div className="border-t border-gray-100 my-3" />

          {/* Food items preview */}
          <FoodItemsPreview cartId={selectedCart.id} />
        </div>
      )}
    </div>
  );
}

// ── FOOD ITEMS PREVIEW ────────────────────────
// Separate small component — fetches and shows
// food items when a cart is selected on the map
function FoodItemsPreview({ cartId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get(`/carts/${cartId}/items`);
        setItems(response.data.items);
      } catch (err) {
        console.error("Failed to load items");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [cartId]);
  // cartId in the dependency array means — re-fetch whenever
  // a different cart is selected on the map

  if (loading) return <p className="text-gray-400 text-xs">Loading menu...</p>;

  if (items.length === 0) {
    return <p className="text-gray-400 text-xs">No menu items listed yet</p>;
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Menu
      </p>
      <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div>
              <p className="text-gray-800 text-sm font-medium">{item.name}</p>
              {item.description && (
                <p className="text-gray-400 text-xs">{item.description}</p>
              )}
            </div>
            <p className="text-orange-500 font-semibold text-sm">
              ₹{item.price}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
