import { useState, useEffect } from "react";
import api from "../../api/axios.js";
import { useParams } from "react-router-dom";
import FoodItemForm from "./FoodItemForm";

export default function FoodItemDetails() {
  const { id } = useParams();
  // Food item form state
  const [showItemForm, setShowItemForm] = useState(false);

  const [foodItems, setFoodItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState(null);

  const fetchFoodItems = async () => {
    try {
      const response = await api.get(`/carts/${id}/items`);
      setFoodItems(response.data.items);
    } catch (err) {
      console.error("Failed to load food items");
    }
  };
  useEffect(() => {
    fetchFoodItems();
  }, [id]);

  // When pencil icon is clicked — populate form with existing data
  const handleEditClick = (item) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleCancelItem = () => {
    setShowItemForm(false);
    setEditingItem(null);
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
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      {error && (
        <p className="text-red-500 text-xs mb-3">{error}</p>
      )}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Menu Items
        </h2>
        {/* Only show Add button when form is hidden */}
        {!showItemForm && (
          <button
            onClick={() => {
              setEditingItem(null);
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
                <p className="text-gray-800 text-sm font-medium">{item.name}</p>
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
  );
}
