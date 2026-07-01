import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import FoodItemForm from "./FoodItemForm.jsx";
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
  const [editingItem, setEditingItem] = useState(null);

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

  // Rename to handleSubmitItem — handles both add and update
  const handleSubmitItem = async (e) => {
    e.preventDefault();
    setSavingItem(true);

    try {
      if (editingItem) {
        // UPDATE flow
        const response = await api.put(`/carts/${id}/items/${editingItem.id}`, {
          name: newItem.name,
          price: parseFloat(newItem.price),
          description: newItem.description,
        });

        // Update that one item in local state
        // map returns a new array — replaces the matching item, keeps rest
        setFoodItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id ? response.data.item : item,
          ),
        );
      } else {
        // ADD flow
        const response = await api.post(`/carts/${id}/items`, {
          name: newItem.name,
          price: parseFloat(newItem.price),
          description: newItem.description,
        });

        // Append new item to existing list
        setFoodItems((prev) => [...prev, response.data.item]);
      }

      // Reset form either way
      handleCancelItem();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save item");
    } finally {
      setSavingItem(false);
    }
  };

  // When pencil icon is clicked — populate form with existing data
  const handleEditClick = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      price: item.price,
      description: item.description || "",
    });
    setShowItemForm(true);
  };

  // When form is cancelled — reset everything
  const handleCancelItem = () => {
    setShowItemForm(false);
    setEditingItem(null);
    setNewItem({ name: "", price: "", description: "" });
  };

  const handleDeleteItem = async (itemId) => {
    // Simple confirm before deleting
    if (!window.confirm("Delete this item?")) return;

    try {
      await api.delete(`/carts/${id}/items/${itemId}`);
      // Remove from local state instead of refetching
      // filter returns a new array without the deleted item
      setFoodItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setError("Failed to delete item");
    }
  };
  // CartDetail
  const onItemSuccess = (savedItem, mode) => {
    if (mode === "add") {
      setFoodItems((prev) => [...prev, savedItem]);
    } else {
      setFoodItems((prev) =>
        prev.map((item) => (item.id === savedItem.id ? savedItem : item)),
      );
    }
    handleCancelItem();
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
            {/* Only show Add button when form is hidden */}
            {!showItemForm && (
              <button
                onClick={() => {
                  setEditingItem(null); // make sure we're in add mode
                  setNewItem({ name: "", price: "", description: "" });
                  setShowItemForm(true);
                }}
                className="text-orange-500 text-xs font-medium hover:underline"
              >
                + Add Item
              </button>
            )}
          </div>

          {/* Add / Edit form — same form, different mode */}
          {showItemForm && (
            <FoodItemForm
              cartId={id}
              editingItem={editingItem}
              onSuccess={onItemSuccess}
              onCancel={handleCancelItem}
            />
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

                  <div className="flex items-center gap-3">
                    <p className="text-orange-500 font-semibold text-sm">
                      ₹{item.price}
                    </p>

                    {/* Edit button */}
                    <button
                      onClick={() => handleEditClick(item)}
                      className="text-gray-400 hover:text-orange-500 transition"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
