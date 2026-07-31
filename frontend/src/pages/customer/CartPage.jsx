import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";

const WS_URL = "ws://localhost:5000";

const cartIcon = new L.DivIcon({
  html: `<div style="background:#f97316;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

// Moves the map centre when the cart's live position changes
function LiveCenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition ${star <= value ? "text-orange-400" : "text-gray-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }) {
  return (
    <span className="text-orange-400 text-sm">
      {"★".repeat(Math.round(value))}
      {"☆".repeat(5 - Math.round(value))}
    </span>
  );
}

export default function CartPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live location state — updated by WebSocket
  const [livePos, setLivePos] = useState(null);

  // Review form
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  const wsRef = useRef(null);
  const mountedRef = useRef(true);

  // ── Fetch cart, items, and reviews in parallel ───────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    const fetchAll = async () => {
      try {
        const [cartRes, itemsRes, reviewsRes] = await Promise.all([
          api.get(`/carts/${id}/public`),
          api.get(`/carts/${id}/items`),
          api.get(`/carts/${id}/reviews`),
        ]);
        if (!mountedRef.current) return;
        const c = cartRes.data.cart;
        setCart(c);
        if (c.latitude) setLivePos({ lat: parseFloat(c.latitude), lng: parseFloat(c.longitude) });
        setItems(itemsRes.data.items);
        setReviews(reviewsRes.data.reviews);
      } catch (err) {
        if (mountedRef.current) setError("Cart not found");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    fetchAll();
    return () => { mountedRef.current = false; };
  }, [id]);

  // ── WebSocket: receive live location updates ─────────────────────────────
  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === "location_update" && String(msg.cartId) === String(id)) {
          setLivePos({ lat: msg.latitude, lng: msg.longitude });
          setCart((prev) => prev ? { ...prev, address: msg.address } : prev);
        }
        if (msg.type === "cart_offline" && String(msg.cartId) === String(id)) {
          setCart((prev) => prev ? { ...prev, is_active: false } : prev);
        }
      };
      ws.onclose = () => { if (mountedRef.current) setTimeout(connect, 3000); };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => wsRef.current?.close();
  }, [id]);

  const handleDirections = () => {
    if (!livePos) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${livePos.lat},${livePos.lng}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setReviewError("Please select a rating"); return; }
    setSubmitting(true);
    setReviewError(null);
    try {
      await api.post(`/carts/${id}/reviews`, { rating, comment });
      const res = await api.get(`/carts/${id}/reviews`);
      setReviews(res.data.reviews);
      setRating(0);
      setComment("");
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-4 border-orange-200 border-t-orange-500"
          style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <p className="text-gray-500">{error || "Cart not found"}</p>
        <button onClick={() => navigate(-1)} className="text-orange-500 text-sm font-medium">← Go back</button>
      </div>
    );
  }

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const canReview = user && user.role !== "vendor";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-base truncate">{cart.name}</h1>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
          cart.is_active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
        }`}>
          {cart.is_active ? "● Open" : "Closed"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Cart info */}
        <div className="px-5 pt-5 pb-3">
          {cart.description && (
            <p className="text-gray-500 text-sm mb-1">{cart.description}</p>
          )}
          {cart.address && (
            <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
              <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
              {cart.address}
            </p>
          )}
        </div>

        {/* Live map */}
        {livePos ? (
          <div className="mx-5 rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: 220 }}>
            <MapContainer
              center={[livePos.lat, livePos.lng]}
              zoom={16}
              className="h-full w-full"
              zoomControl={false}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
              />
              <LiveCenter lat={livePos.lat} lng={livePos.lng} />
              <Marker position={[livePos.lat, livePos.lng]} icon={cartIcon} />
            </MapContainer>
          </div>
        ) : (
          <div className="mx-5 rounded-2xl border border-gray-100 bg-white flex items-center justify-center text-gray-400 text-sm" style={{ height: 120 }}>
            No location set
          </div>
        )}

        {/* Get directions button */}
        {livePos && (
          <div className="px-5 mt-3">
            <button
              onClick={handleDirections}
              className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Get directions
            </button>
          </div>
        )}

        {/* Menu */}
        <div className="px-5 mt-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Menu</h2>
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm">No items listed yet</p>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0 pr-3">
                    <p className="text-gray-800 text-sm font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-gray-400 text-xs mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <p className="text-orange-500 font-semibold text-sm shrink-0">₹{item.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="px-5 mt-6">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Reviews</h2>
            {avgRating && (
              <span className="flex items-center gap-1 text-sm">
                <span className="text-orange-400">★</span>
                <span className="font-semibold text-gray-700">{avgRating}</span>
                <span className="text-gray-400 text-xs">({reviews.length})</span>
              </span>
            )}
          </div>

          {/* Add review form */}
          {canReview && (
            <form onSubmit={handleReviewSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Your review</p>
              <StarRating value={rating} onChange={setRating} />
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment (optional)..."
                rows={2}
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400 transition resize-none"
              />
              {reviewError && <p className="text-red-500 text-xs mt-1">{reviewError}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}

          {!user && (
            <p className="text-gray-400 text-xs mb-3">
              <button onClick={() => navigate("/login")} className="text-orange-500 font-medium">Log in</button> to leave a review
            </p>
          )}

          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-gray-700 text-sm font-medium">{r.user_name}</p>
                    <StarDisplay value={r.rating} />
                  </div>
                  {r.comment && <p className="text-gray-500 text-sm">{r.comment}</p>}
                  <p className="text-gray-300 text-xs mt-1">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
