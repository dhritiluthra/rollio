import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function FloatingNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  return (
    <div>
      {/* ── FLOATING BOTTOM NAV ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-fit bg-white/90 rounded-full px-6 md:px-8 py-2 flex items-center gap-6 md:gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.15)] backdrop-blur-md border border-white/30">
        {/* Left button — changes based on role */}
        {user?.role === "vendor" ? (
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-500 hover:text-orange-500 transition text-sm font-medium"
          >
            Dashboard
          </button>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="text-orange-500 font-medium text-sm"
          >
            Home
          </button>
        )}

        {/* Center logo */}
        <div
          onClick={() => navigate("/")}
          className="bg-amber-500 text-white px-5 md:px-6 py-2 rounded-full font-bold text-sm cursor-pointer hover:bg-orange-500 transition"
        >
          rollio
        </div>

        {/* Right button — login or profile */}
        {user ? (
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="text-gray-500 hover:text-red-400 transition text-sm font-medium"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-gray-500 hover:text-orange-500 transition text-sm font-medium"
          >
            Login
          </button>
        )}
      </div>
    </div>
  );
}
