import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state for creating a new cart
  const [showModal, setShowModal] = useState(false);
  const [newCart, setNewCart] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  // Fetch vendor's carts when page loads
  useEffect(() => {
    fetchMyCarts();
  }, []);

  const fetchMyCarts = async () => {
    try {
      const response = await api.get("/carts/my-carts");
      setCarts(response.data.carts);
    } catch (err) {
      setError("Failed to load carts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCart = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.post("/carts", newCart);
      setShowModal(false);
      setNewCart({ name: "", description: "" });
      fetchMyCarts(); // refresh list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create cart");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading your carts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Carts</h1>
          <p className="text-sm text-gray-400">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
        >
          + New Cart
        </button>
      </div>

      <div className="px-6 py-6 max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* No carts state */}
        {carts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl mb-4" />
            <h2 className="text-gray-700 font-semibold text-lg mb-1">
              No carts yet
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Create your first cart to get discovered on Rollio
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-orange-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition"
            >
              Create Your First Cart
            </button>
          </div>
        ) : (
          // Cart list
          <div className="flex flex-col gap-3">
            {carts.map((cart) => (
              <div
                key={cart.id}
                onClick={() => navigate(`/dashboard/cart/${cart.id}`)}
                className="bg-white rounded-xl px-5 py-4 flex items-center justify-between shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition cursor-pointer"
              >
                <div>
                  <h3 className="font-semibold text-gray-800">{cart.name}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {cart.description || "No description"}
                  </p>
                  {/* Location status */}
                  <p className="text-xs text-gray-400 mt-1">
                    {cart.latitude ? `📍 Location set` : "No location set yet"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Active badge */}
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      cart.is_active
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {cart.is_active ? "● Live" : "○ Offline"}
                  </span>

                  {/* Arrow */}
                  <svg
                    className="w-4 h-4 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Cart Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl px-8 py-8 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-800 mb-1">New Cart</h2>
            <p className="text-sm text-gray-400 mb-6">Add your cart details</p>

            <form onSubmit={handleCreateCart} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cartName"
                  className="text-sm text-gray-600 font-medium"
                >
                  Cart Name
                </label>
                <input
                  id="cartName"
                  type="text"
                  value={newCart.name}
                  onChange={(e) =>
                    setNewCart({ ...newCart, name: e.target.value })
                  }
                  placeholder="e.g. Raja ki Chaat"
                  required
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-400 transition"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="cartDesc"
                  className="text-sm text-gray-600 font-medium"
                >
                  Description
                </label>
                <textarea
                  id="cartDesc"
                  value={newCart.description}
                  onChange={(e) =>
                    setNewCart({ ...newCart, description: e.target.value })
                  }
                  placeholder="What do you sell? e.g. Best golgappe in Delhi"
                  rows={3}
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-400 transition resize-none"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Cart"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
