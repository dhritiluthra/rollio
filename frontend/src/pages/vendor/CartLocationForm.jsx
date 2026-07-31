import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios.js";

export default function CartLocationForm({ cart, fetchCart, setError }) {
  const { id } = useParams();
  // Location form state
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [address, setAddress] = useState("");
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    // Don't overwrite user input while form is open
    if (!showLocationForm) {
      setAddress(cart.address || "");
    }
  }, [cart, showLocationForm]);

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    try {
      // Geocode address via Nominatim
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const results = await geoRes.json();
      if (!results.length) {
        setError("Address not found. Try a more specific address.");
        return;
      }
      const { lat, lon } = results[0];
      await api.put("/carts/location", {
        cart_id: parseInt(id),
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        address,
      });
      setShowLocationForm(false);
      fetchCart();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update location");
    } finally {
      setSavingLocation(false);
    }
  };
  return (
    <div>
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
              {new Date(cart.location_updated_at).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
            <div className="flex flex-col gap-1">
              <label
                htmlFor="address"
                className="text-xs text-gray-500 font-medium"
              >
                Address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Connaught Place, New Delhi"
                required
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
    </div>
  );
}
