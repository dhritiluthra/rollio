import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  // Vendor pins scattered around the hero
  // Each has a position (top/left as %), size, animation delay, and a label
  const pins = [
    {
      top: "15%",
      left: "8%",
      delay: "0s",
      size: "w-8 h-8",
      label: "Chaat Corner",
    },
    {
      top: "55%",
      left: "5%",
      delay: "0.6s",
      size: "w-6 h-6",
      label: "Juice Wala",
    },
    {
      top: "20%",
      left: "82%",
      delay: "0.3s",
      size: "w-9 h-9",
      label: "Taco Stand",
    },
    {
      top: "60%",
      left: "78%",
      delay: "1s",
      size: "w-7 h-7",
      label: "Momos Cart",
    },
    {
      top: "75%",
      left: "20%",
      delay: "0.8s",
      size: "w-6 h-6",
      label: "Bhel Puri",
    },
    { top: "10%", left: "50%", delay: "0.4s", size: "w-5 h-5", label: null },
    { top: "70%", left: "55%", delay: "1.2s", size: "w-5 h-5", label: null },
    { top: "40%", left: "92%", delay: "0.2s", size: "w-6 h-6", label: null },
  ];

  return (
    <div className="pb-20">
      {/* ── HERO ── */}
      <div className="min-h-[85vh] relative bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 px-6 md:px-20 py-10 overflow-hidden flex items-center">
        {/* ── HERO CONTENT ── */}
        {/*
          relative z-20: sits above the pins layer (z-10)
          so text and buttons are always on top and clickable
        */}
        <div className="w-full flex flex-col items-center justify-center text-center relative z-20">
          {/* Logo */}
          <p
            className="hero-fade text-3xl md:text-4xl text-white font-bold tracking-widest uppercase"
            style={{ animationDelay: "0.1s" }}
          >
            rollio
          </p>

          {/* Headline */}
          <p
            className="hero-fade text-3xl md:text-5xl text-white font-bold mt-6 md:mt-10 leading-tight max-w-3xl"
            style={{ animationDelay: "0.3s" }}
          >
            Discover street food{" "}
            <span className="underline decoration-wavy decoration-amber-200">
              near you
            </span>{" "}
            in Real-Time
          </p>

          {/* Subheadline */}
          <p
            className="hero-fade text-lg md:text-xl text-white my-6 md:my-10 opacity-90"
            style={{ animationDelay: "0.5s" }}
          >
            Find the best local food carts live!
          </p>

          {/* Buttons */}
          <div
            className="hero-fade flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto"
            style={{ animationDelay: "0.7s" }}
          >
            {/* Primary CTA */}
            <button
              onClick={() => navigate("/map")}
              className="bg-white px-7 py-3 rounded-full text-orange-500 font-semibold cursor-pointer hover:shadow-lg hover:scale-105 transition-all text-sm"
            >
              Find Carts Near Me
            </button>

            {/* Secondary CTA with arrow */}
            {/*
              inline-flex items-center gap-2: puts text and arrow
              icon side by side with a small gap between them
              The arrow SVG is inline so it inherits the text color
            */}
            <button
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-2 border-2 border-white px-7 py-3 rounded-full text-white font-semibold cursor-pointer hover:bg-white/10 transition-all text-sm"
            >
              Get Started
              {/*
                Arrow SVG — simple right-pointing chevron
                w-4 h-4: small size to match text
                strokeWidth 2.5: slightly bolder stroke to match font weight
              */}
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── WHY ROLLIO ── */}
      <div className="py-16 md:py-20 px-6 md:px-20 bg-white">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-2">
          Why Rollio?
        </h2>
        <p className="text-center text-gray-400 text-sm mb-10 md:mb-14">
          Everything you need to find great street food
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
          <div className="p-6 rounded-xl shadow-lg hover:shadow-orange-100 hover:-translate-y-1 transition-all duration-300 bg-orange-50">
            <div className="text-3xl mb-4">📍</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              Real-time Cart Location
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              See exactly where food carts are live right now on the map.
            </p>
          </div>
          <div className="p-6 rounded-xl shadow-lg hover:shadow-orange-100 hover:-translate-y-1 transition-all duration-300 bg-orange-50">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              Live Availability
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Know which carts are currently active and serving near you.
            </p>
          </div>
          <div className="p-6 rounded-xl shadow-lg hover:shadow-orange-100 hover:-translate-y-1 transition-all duration-300 bg-orange-50">
            <div className="text-3xl mb-4">🍜</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">
              Discover Hidden Gems
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Find amazing street food carts you never knew existed nearby.
            </p>
          </div>
        </div>
      </div>

      <footer className="relative bg-gradient-to-b from-white to-orange-50 border-t border-orange-100 overflow-hidden">
        {/* subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-200/20 blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 md:px-20 py-16">
          {/* top section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* brand */}
            <div className="md:col-span-2">
              <h2 className="text-3xl font-black tracking-widest uppercase text-orange-500">
                rollio
              </h2>

              <p className="mt-4 text-gray-500 leading-relaxed max-w-md">
                Discover live street food carts around you in real time. Built
                for food lovers, local vendors, and spontaneous cravings.
              </p>
            </div>

            {/* product links */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4">Product</h3>

              <div className="flex flex-col gap-3 text-sm">
                <button
                  onClick={() => navigate("/map")}
                  className="text-gray-500 hover:text-orange-500 transition text-left"
                >
                  Explore Carts
                </button>

                <button
                  onClick={() => navigate("/register")}
                  className="text-gray-500 hover:text-orange-500 transition text-left"
                >
                  Create Account
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="text-gray-500 hover:text-orange-500 transition text-left"
                >
                  Login
                </button>
              </div>
            </div>

            {/* vendor links */}
            <div>
              <h3 className="text-gray-800 font-semibold mb-4">Vendors</h3>

              <div className="flex flex-col gap-3 text-sm">
                <button
                  onClick={() => navigate("/register")}
                  className="text-gray-500 hover:text-orange-500 transition text-left"
                >
                  Join Rollio
                </button>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-gray-500 hover:text-orange-500 transition text-left"
                >
                  Vendor Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* divider */}
          <div className="my-10 h-px bg-gradient-to-r from-transparent via-orange-200 to-transparent" />

          {/* bottom */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              © 2026 Rollio. Built for street food culture.
            </p>

            {/* social icons */}
            <div className="flex items-center gap-4">
              <button className="w-9 h-9 rounded-full bg-white border border-orange-100 flex items-center justify-center text-gray-500 hover:text-orange-500 hover:-translate-y-1 transition-all shadow-sm">
                🌎
              </button>

              <button className="w-9 h-9 rounded-full bg-white border border-orange-100 flex items-center justify-center text-gray-500 hover:text-orange-500 hover:-translate-y-1 transition-all shadow-sm">
                📷
              </button>

              <button className="w-9 h-9 rounded-full bg-white border border-orange-100 flex items-center justify-center text-gray-500 hover:text-orange-500 hover:-translate-y-1 transition-all shadow-sm">
                ✕
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* ── FLOATING BOTTOM NAV ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-fit bg-white/90 rounded-full px-6 md:px-8 py-2 flex items-center gap-6 md:gap-8 shadow-[0_10px_40px_rgba(0,0,0,0.15)] backdrop-blur-md border border-white/30">
        <button
          onClick={() => navigate("/")}
          className="text-orange-500 font-medium text-sm"
        >
          Home
        </button>
        <div
          onClick={() => navigate("/")}
          className="bg-amber-500 text-white px-5 md:px-6 py-2 rounded-full font-bold text-sm cursor-pointer hover:bg-orange-500 transition"
        >
          rollio
        </div>
        <button
          onClick={() => navigate("/login")}
          className="text-gray-500 hover:text-orange-500 transition text-sm"
        >
          Profile
        </button>
      </div>
    </div>
  );
}
