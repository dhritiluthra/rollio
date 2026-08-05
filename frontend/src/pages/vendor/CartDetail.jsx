import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios.js";
import FoodItemDetails from "./FoodItemDetails.jsx";
import CartLocationForm from "./CartLocationForm.jsx";

export default function CartDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(
    location.state?.cart || null, // use dashboard data instantly if available
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Toggle loading state
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [id]);

  const fetchCart = async () => {
    try {
      const response = await api.get(`/carts/${id}`);
      const cart = response.data.cart;

      setCart(cart);

      console.log(response.data.cart);
    } catch (err) {
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.put("/carts/toggle", {
        cart_id: parseInt(id, 10),
      });
      // Update cart state locally instead of refetching
      // This is called optimistic update — feels faster
      setCart((prev) => ({ ...prev, is_active: !prev.is_active }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle cart");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading cart...</p>
      </div>
    );
  }

  if (error && !cart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={() => navigate("/dashboard")}
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
          <div>
            <h1 className="text-lg font-bold text-gray-800">{cart.name}</h1>
            <p className="text-xs text-gray-400">Cart Details</p>
          </div>
        </div>

        {/* Live badge */}
        <span
          className={`text-xs px-3 py-1 rounded-full font-medium ${
            cart.is_active
              ? "bg-green-100 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {cart.is_active ? "● Live" : "○ Offline"}
        </span>
      </div>

      <div className="px-6 py-6 max-w-2xl mx-auto flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ── CART INFO CARD ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Cart Info
          </h2>
          <p className="text-gray-800 font-semibold text-lg">{cart.name}</p>
          <p className="text-gray-500 text-sm mt-1">
            {cart.description || "No description added"}
          </p>
          <p className="text-gray-400 text-xs mt-3">
            Created{" "}
            {new Date(cart.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <CartLocationForm cart={cart} fetchCart={fetchCart} setError={setError} />

        {/* ── GO LIVE / GO OFFLINE BUTTON ── */}
        <button
          onClick={handleToggle}
          disabled={toggling || !cart.latitude}
          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            cart.is_active
              ? "bg-gray-800 text-white hover:bg-gray-900"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          {toggling
            ? "Updating..."
            : cart.is_active
              ? "Go Offline"
              : cart.latitude
                ? "Go Live"
                : "Set location first to go live"}
        </button>

        {!cart.latitude && (
          <p className="text-center text-gray-400 text-xs -mt-2">
            You need to set a location before going live
          </p>
        )}

        {/* ── FOOD ITEMS CARD ── */}
        <FoodItemDetails />
      </div>
    </div>
  );
}
