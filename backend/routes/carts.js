import express from "express";
import protect, { vendorOnly } from "../middleware/auth.js";
import {
  createCart,
  updateLocation,
  getNearbyCarts,
  toggleCart,
} from "../controllers/cartController.js";

const router = express.Router();

// Public — anyone can browse
router.get("/nearby", getNearbyCarts);

// Protected — must be logged in AND be a vendor
router.post("/", protect, vendorOnly, createCart);
router.put("/location", protect, vendorOnly, updateLocation);
router.put("/toggle", protect, vendorOnly, toggleCart);

export default router;
