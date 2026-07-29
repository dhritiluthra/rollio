import { useState, useEffect } from "react";
import api from "../../api/axios.js";

export default function FoodItemForm({
  cartId,
  editingItem,
  onSuccess,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // When editingItem changes, populate the form
  // This handles switching from add to edit mode
  useEffect(() => {
    if (editingItem) {
      setFormData({
        name: editingItem.name,
        price: editingItem.price,
        description: editingItem.description || "",
      });
    } else {
      setFormData({ name: "", price: "", description: "" });
    }
  }, [editingItem]);

  const handleSubmitItem = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingItem) {
        // Update flow
        const response = await api.put(
          `/carts/${cartId}/items/${editingItem.id}`,
          {
            name: formData.name,
            price: parseFloat(formData.price),
            description: formData.description,
          },
        );
        onSuccess(response.data.item, "update");
      } else {
        // Add flow
        const response = await api.post(`/carts/${cartId}/items`, {
          name: formData.name,
          price: parseFloat(formData.price),
          description: formData.description,
        });
        onSuccess(response.data.item, "add");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmitItem}
      className="mb-4 flex flex-col gap-3 pb-4 border-b border-gray-100"
    >
      <p className="text-sm font-medium text-gray-700">
        {editingItem ? "Edit Item" : "New Item"}
      </p>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <div className="flex flex-col gap-1">
        <label htmlFor="itemName" className="text-xs text-gray-500 font-medium">
          Item Name
        </label>
        <input
          id="itemName"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="20"
          required
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="itemDesc" className="text-xs text-gray-500 font-medium">
          Description{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="itemDesc"
          type="text"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="e.g. Crispy with tangy water"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 transition"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition disabled:opacity-60"
        >
          {saving ? "Saving..." : editingItem ? "Save Item" : "Add Item"}
        </button>
      </div>
    </form>
  );
}
