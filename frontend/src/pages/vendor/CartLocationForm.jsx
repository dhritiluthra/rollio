import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios.js";

export default function CartLocationForm({ cart, fetchCart, setError }) {
  const { id } = useParams();
  // Location form state
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationData, setLocationData] = useState({
    latitude: "",
    longitude: "",
    address: "",
  });
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    // Pre-fill location form if location already exists
    setLocationData({
      latitude: cart.latitude || "",
      longitude: cart.longitude || "",
      address: cart.address || "",
    });
  }, [cart]);

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
    </div>
  );
}
