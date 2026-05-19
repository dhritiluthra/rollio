import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", { email });
      // Always show success even if email doesn't exist
      // matches the backend's user enumeration protection
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl px-8 py-10">
        {/* Back arrow + header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-500 tracking-widest uppercase">
            Rollio
          </h1>
          <p className="text-gray-500 text-sm mt-1">Reset your password</p>
        </div>

        {/* Success state — shown after form submission */}
        {/*
          submitted is a boolean state that flips to true after
          the API call succeeds. Instead of showing the form,
          we show a confirmation message. No redirect needed —
          user needs to go check their email.
        */}
        {submitted ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-gray-800 font-semibold text-lg mb-2">
              Check your email
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              If an account exists for{" "}
              <span className="text-gray-600 font-medium">{email}</span>, a
              reset link has been sent.
            </p>
            <Link
              to="/login"
              className="text-orange-500 text-sm font-medium hover:underline"
            >
              Back to login
            </Link>
          </div>
        ) : (
          // Form state
          <>
            {error && (
              <div className="bg-red-50 text-red-500 text-sm px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              Enter your email and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-sm text-gray-600 font-medium"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-orange-400 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 text-white py-3 rounded-lg font-semibold text-sm mt-2 hover:bg-orange-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Remembered it?{" "}
              <Link
                to="/login"
                className="text-orange-500 font-medium hover:underline"
              >
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
