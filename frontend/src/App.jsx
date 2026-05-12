import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";
import MapView from "./pages/customer/MapView.jsx";
import VendorDashboard from "./pages/vendor/VendorDashboard.jsx";

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/dashboard", element: <VendorDashboard /> },
  { path: "/map", element: <MapView /> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
