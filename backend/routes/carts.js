import express from "express";
import protect, { vendorOnly } from "../middleware/auth.js";
import {
  createCart,
  updateLocation,
  getNearbyCarts,
  toggleCart,
  getMyCarts,
  getCartById,
  getFoodItems,
  addFoodItem,
  updateFoodItem,
  deleteFoodItem,
} from "../controllers/cartController.js";

const router = express.Router();

// Public — anyone can browse
router.get("/nearby", getNearbyCarts);

// Protected — must be logged in AND be a vendor
router.post("/", protect, vendorOnly, createCart);
router.put("/location", protect, vendorOnly, updateLocation);
router.put("/toggle", protect, vendorOnly, toggleCart);
router.get("/my-carts", protect, vendorOnly, getMyCarts);

// Food items — public GET, protected POST
router.get("/:id/items", getFoodItems);
router.post("/:id/items", protect, vendorOnly, addFoodItem);

router.put("/:id/items/:itemId", protect, vendorOnly, updateFoodItem);
router.delete("/:id/items/:itemId", protect, vendorOnly, deleteFoodItem);

router.get("/:id", protect, vendorOnly, getCartById);

export default router;
