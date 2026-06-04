import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios.js";

export default function CartDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(
    location.state?.cart || null, // use dashboard data instantly if available
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Location form state
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationData, setLocationData] = useState({
    latitude: "",
    longitude: "",
    address: "",
  });
  const [savingLocation, setSavingLocation] = useState(false);

  // Food item form state
  const [showItemForm, setShowItemForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [foodItems, setFoodItems] = useState([]);
  const [savingItem, setSavingItem] = useState(false);

  // Toggle loading state
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchCart();
    fetchFoodItems();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get(`/carts/${id}`);
      const cart = response.data.cart;

      setCart(cart);

      // Pre-fill location form if location already exists
      setLocationData({
        latitude: cart.latitude || "",
        longitude: cart.longitude || "",
        address: cart.address || "",
      });
      console.log(response.data.cart);
    } catch (err) {
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodItems = async () => {
    try {
      const response = await api.get(`/carts/${id}/items`);
      setFoodItems(response.data.items);
    } catch (err) {
      console.error("Failed to load food items");
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const response = await api.put("/carts/toggle", {
        cart_id: parseInt(id),
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

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    try {
      await api.put("/carts/location", {
        cart_id: parseInt(id),
        latitude: parseFloat(locationData.latitude),
        longitude: parseFloat(locationData.longitude),
        address: locationData.address,
      });
      setShowLocationForm(false);
      fetchCart(); // refresh to show new location
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update location");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setSavingItem(true);
    try {
      await api.post(`/carts/${id}/items`, {
        name: newItem.name,
        price: parseFloat(newItem.price),
        description: newItem.description,
      });
      setNewItem({ name: "", price: "", description: "" });
      setShowItemForm(false);
      fetchFoodItems(); // refresh list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add item");
    } finally {
      setSavingItem(false);
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

        {/* ── LOCATION CARD ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Location
            </h2>
            <button
              onClick={() => setShowLocationForm(!showLocationForm)}
              className="text-orange-500 text-xs font-medium hover:underline"
            >
              {cart.latitude ? "Update" : "Set Location"}
            </button>
          </div>

          {cart.latitude ? (
            <div>
              <p className="text-gray-800 text-sm font-medium">
                {cart.address || "Location set"}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {parseFloat(cart.latitude).toFixed(6)},{" "}
                {parseFloat(cart.longitude).toFixed(6)}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Last updated{" "}
                {new Date(cart.location_updated_at).toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              No location set yet. Set your location to appear on the map.
            </p>
          )}

          {/* Location form */}
          {showLocationForm && (
            <form
              onSubmit={handleLocationSubmit}
              className="mt-4 flex flex-col gap-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="lat"
                    className="text-xs text-gray-500 font-medium"
                  >
                    Latitude
                  </label>
                  <input
                    id="lat"
                    type="number"
                    step="any"
                    value={locationData.latitude}
                    onChange={(e) =>
                      setLocationData({
                        ...locationData,
                        latitude: e.target.value,
                      })
                    }
                    placeholder="28.6139"
                    required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="lng"
                    className="text-xs text-gray-500 font-medium"
                  >
                    Longitude
                  </label>
                  <input
                    id="lng"
                    type="number"
                    step="any"
                    value={locationData.longitude}
                    onChange={(e) =>
                      setLocationData({
                        ...locationData,
                        longitude: e.target.value,
                      })
                    }
                    placeholder="77.2090"
                    required
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="address"
                  className="text-xs text-gray-500 font-medium"
                >
                  Address{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="address"
                  type="text"
                  value={locationData.address}
                  onChange={(e) =>
                    setLocationData({
                      ...locationData,
                      address: e.target.value,
                    })
                  }
                  placeholder="e.g. Near Connaught Place Metro Gate 4"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLocationForm(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLocation}
                  className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-60"
                >
                  {savingLocation ? "Saving..." : "Save Location"}
                </button>
              </div>
            </form>
          )}
        </div>

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

        {/* Hint text below toggle button */}
        {!cart.latitude && (
          <p className="text-center text-gray-400 text-xs -mt-2">
            You need to set a location before going live
          </p>
        )}

        {/* ── FOOD ITEMS CARD ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Menu Items
            </h2>
            <button
              onClick={() => setShowItemForm(!showItemForm)}
              className="text-orange-500 text-xs font-medium hover:underline"
            >
              + Add Item
            </button>
          </div>

          {/* Add item form */}
          {showItemForm && (
            <form
              onSubmit={handleAddItem}
              className="mb-4 flex flex-col gap-3 pb-4 border-b border-gray-100"
            >
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="itemName"
                  className="text-xs text-gray-500 font-medium"
                >
                  Item Name
                </label>
                <input
                  id="itemName"
                  type="text"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                  placeholder="e.g. Pani Puri"
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="itemPrice"
                  className="text-xs text-gray-500 font-medium"
                >
                  Price (₹)
                </label>
                <input
                  id="itemPrice"
                  type="number"
                  step="0.01"
                  value={newItem.price}
                  onChange={(e) =>
                    setNewItem({ ...newItem, price: e.target.value })
                  }
                  placeholder="20"
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="itemDesc"
                  className="text-xs text-gray-500 font-medium"
                >
                  Description{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="itemDesc"
                  type="text"
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  placeholder="e.g. Crispy with tangy water"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemForm(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-60"
                >
                  {savingItem ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          )}

          {/* Food items list */}
          {foodItems.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No items yet. Add what your cart sells.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {foodItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-gray-800 text-sm font-medium">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <p className="text-orange-500 font-semibold text-sm">
                    ₹{item.price}
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
