import React from "react";

export default function LandingPage() {
  return (
    <div className="h-[85vh] relative bg-linear-to-br from-orange-500 via-orange-400 to-amber-400 px-20 py-10 rounded-b-3xl overflow-hidden">
      <div className="absolute inset-0 overflow-hidden z-10">
        <svg
          className="absolute top-32 left-40 opacity-40 w-32 float-animation"
          viewBox="0 0 24 24"
          fill="white"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
        </svg>
      </div>

      <div className="w-full flex flex-col items-center justify-center text-center">
        <p className="text-4xl text-white">rollio</p>

        <p className="text-5xl text-white font-bold mt-10">
          Discover street food{" "}
          <span className="underline decoration-wavy decoration-amber-200">
            near you
          </span>{" "}
          in Real-Time
        </p>

        <p className="text-xl text-white my-10">
          Find the best local food carts live!
        </p>

        <div className="flex gap-4">
          <button className="bg-white px-6 py-2 rounded text-orange-500 font-semibold cursor-pointer">
            Find Vendors Near me
          </button>
          <button className="bg-white px-6 py-2 rounded text-orange-500 font-semibold cursor-pointer">
            Join as a Vendor
          </button>
        </div>
      </div>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-lg rounded-full px-10 py-3 flex items-center gap-8">
        <button className="text-gray-500">Home</button>

        <div className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold">
          rollio
        </div>

        <button className="text-gray-500">Profile</button>
      </div>
    </div>
  );
}
