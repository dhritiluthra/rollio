import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import MapView from "./pages/customer/MapView.jsx";
import VendorDashboard from "./pages/vendor/VendorDashboard.jsx";
import CartDetail from "./pages/vendor/CartDetail.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute vendorOnly>
        <VendorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/cart/:id",
    element: (
      <ProtectedRoute vendorOnly>
        <CartDetail />
      </ProtectedRoute>
    ),
  },
  { path: "/map", element: <MapView /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
