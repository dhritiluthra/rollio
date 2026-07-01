import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, vendorOnly = false }) {
  const { user, loading } = useAuth();
  console.log(user);

  // Wait for AuthContext to finish reading localStorage
  // Without this, user is null for a split second on refresh
  // and the user gets redirected even though they're logged in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  // Not logged in → send to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not a vendor → send to map
  if (vendorOnly && user.role !== "vendor") {
    return <Navigate to="/map" replace />;
  }

  // All checks passed → render the actual page
  return children;
}
