import pool from "../config/db.js";
import { broadcast } from "../src/utils/broadcast.js";

// ── CREATE CART ───────────────────────────────
export const createCart = async (req, res) => {
  const { name, description } = req.body;

  // req.user comes from our protect middleware
  const owner_id = req.user.userId;

  try {
    const result = await pool.query(
      `INSERT INTO carts (name, description, owner_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, owner_id],
    );

    res.status(201).json({
      message: "Cart created successfully",
      cart: result.rows[0],
    });
  } catch (error) {
    console.error("Create cart error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── UPDATE LOCATION ───────────────────────────
export const updateLocation = async (req, res) => {
  // cart_id now comes from the request body
  const { cart_id, latitude, longitude, address } = req.body;
  const owner_id = req.user.userId;

  try {
    // Verify this cart actually belongs to this vendor
    // This is called an "ownership check" — very important for security
    const cartResult = await pool.query(
      "SELECT id FROM carts WHERE id = $1 AND owner_id = $2",
      [cart_id, owner_id],
    );

    if (cartResult.rows.length === 0) {
      return res.status(404).json({
        message: "Cart not found or you don't own this cart",
      });
    }

    // Rest stays the same
    const result = await pool.query(
      `INSERT INTO cart_locations (cart_id, latitude, longitude, address)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cart_id)
       DO UPDATE SET
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         address = EXCLUDED.address,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [cart_id, latitude, longitude, address],
    );

    res.status(200).json({
      message: "Location updated",
      location: result.rows[0],
    });

    // Push the new coords to every connected customer tab so map pins move live.
    broadcast({ type: "location_update", cartId: cart_id, latitude, longitude, address });
  } catch (error) {
    console.error("Update location error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET NEARBY CARTS ──────────────────────────
export const getNearbyCarts = async (req, res) => {
  const { latitude, longitude, radius = 5, search, category } = req.query;

  // $1 = user lat, $2 = user lng, $3 = radius km
  // $4 = search text (null = no filter), $5 = category (null = no filter)
  const getNearByQuery = `
    SELECT * FROM (
      SELECT
        c.id,
        c.name,
        c.description,
        cl.latitude,
        cl.longitude,
        cl.address,
        cl.updated_at,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(cl.latitude)) *
            cos(radians(cl.longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(cl.latitude))
          )
        ) AS distance_km,
        (
          SELECT json_agg(sub)
          FROM (
            SELECT id, name, price
            FROM food_items
            WHERE cart_id = c.id AND is_available = true
            ORDER BY id
            LIMIT 3
          ) sub
        ) AS top_items
      FROM carts c
      JOIN cart_locations cl ON cl.cart_id = c.id
      WHERE c.is_active = true
        AND ($4::text IS NULL OR (
          c.name ILIKE '%' || $4 || '%'
          OR c.description ILIKE '%' || $4 || '%'
          OR EXISTS (
            SELECT 1 FROM food_items fi
            WHERE fi.cart_id = c.id
              AND fi.is_available = true
              AND fi.name ILIKE '%' || $4 || '%'
          )
        ))
        AND ($5::text IS NULL OR EXISTS (
          SELECT 1 FROM food_items fi
          WHERE fi.cart_id = c.id
            AND fi.is_available = true
            AND LOWER(fi.category) = LOWER($5)
        ))
    ) AS carts_with_distance
    WHERE distance_km < $3
    ORDER BY distance_km ASC
  `;

  try {
    const result = await pool.query(getNearByQuery, [
      latitude,
      longitude,
      radius,
      search || null,
      category || null,
    ]);

    console.log("getNearByCarts result count:", result.rows.length);
    res.status(200).json({ count: result.rows.length, carts: result.rows });
  } catch (error) {
    console.error("Nearby carts error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleCart = async (req, res) => {
  const { cart_id } = req.body;
  const owner_id = req.user.userId;

  try {
    // Ownership check first
    const cartResult = await pool.query(
      "SELECT id, is_active FROM carts WHERE id = $1 AND owner_id = $2",
      [cart_id, owner_id],
    );

    if (cartResult.rows.length === 0) {
      return res.status(404).json({
        message: "Cart not found or you don't own this cart",
      });
    }

    const currentStatus = cartResult.rows[0].is_active;

    // Flip whatever the current status is
    const result = await pool.query(
      `UPDATE carts SET is_active = $1 WHERE id = $2 RETURNING id, name, is_active`,
      [!currentStatus, cart_id],
    );

    const newStatus = result.rows[0].is_active;

    // Broadcast the status change to all connected customers in real-time.
    // If the cart went live, also grab its location so the frontend can
    // place it on the map without a round-trip.
    if (newStatus) {
      const locResult = await pool.query(
        `SELECT latitude, longitude, address FROM cart_locations WHERE cart_id = $1`,
        [cart_id],
      );
      broadcast({
        type: "cart_live",
        cart: { ...result.rows[0], ...locResult.rows[0] },
      });
    } else {
      broadcast({ type: "cart_offline", cartId: cart_id });
    }

    res.status(200).json({
      message: `Cart is now ${newStatus ? "active" : "offline"}`,
      cart: result.rows[0],
    });
  } catch (error) {
    console.error("Toggle cart error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyCarts = async (req, res) => {
  const owner_id = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.description,
         c.is_active,
         c.created_at,
         cl.latitude,
         cl.longitude,
         cl.address,
         cl.updated_at as location_updated_at
       FROM carts c
       LEFT JOIN cart_locations cl ON cl.cart_id = c.id
       WHERE c.owner_id = $1
       ORDER BY c.created_at DESC`,
      [owner_id],
    );

    res.status(200).json({
      carts: result.rows,
    });
  } catch (error) {
    console.error("Get my carts error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCartById = async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.name,
         c.description,
         c.is_active,
         c.created_at,
         cl.latitude,
         cl.longitude,
         cl.address,
         cl.updated_at as location_updated_at
       FROM carts c
       LEFT JOIN cart_locations cl ON cl.cart_id = c.id
       WHERE c.id = $1 AND c.owner_id = $2`,
      [id, owner_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json({ cart: result.rows[0] });
  } catch (error) {
    console.error("Get cart error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPublicCart = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.description, c.is_active,
              cl.latitude, cl.longitude, cl.address, cl.updated_at as location_updated_at
       FROM carts c
       LEFT JOIN cart_locations cl ON cl.cart_id = c.id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Cart not found" });
    res.status(200).json({ cart: result.rows[0] });
  } catch (err) {
    console.error("Get public cart error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getReviews = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, u.name as user_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.cart_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );
    res.status(200).json({ reviews: result.rows });
  } catch (err) {
    console.error("Get reviews error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const addReview = async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const user_id = req.user.userId;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO reviews (cart_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cart_id, user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [id, user_id, rating, comment || null]
    );
    res.status(201).json({ review: result.rows[0] });
  } catch (err) {
    console.error("Add review error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFoodItems = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM food_items WHERE cart_id = $1 ORDER BY id ASC",
      [id],
    );
    res.status(200).json({ items: result.rows });
  } catch (error) {
    console.error("Get food items error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const addFoodItem = async (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  const owner_id = req.user.userId;

  try {
    // Ownership check — verify this cart belongs to this vendor
    const cartCheck = await pool.query(
      "SELECT id FROM carts WHERE id = $1 AND owner_id = $2",
      [id, owner_id],
    );

    if (cartCheck.rows.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const result = await pool.query(
      `INSERT INTO food_items (cart_id, name, price, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name, price, description],
    );

    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error("Add food item error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateFoodItem = async (req, res) => {
  const { id, itemId } = req.params;
  const { name, price, description } = req.body;
  const owner_id = req.user.userId;

  try {
    // Ownership check — verify cart belongs to this vendor
    const cartCheck = await pool.query(
      "SELECT id FROM carts WHERE id = $1 AND owner_id = $2",
      [id, owner_id],
    );

    if (cartCheck.rows.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const result = await pool.query(
      `UPDATE food_items
       SET name = $1, price = $2, description = $3
       WHERE id = $4 AND cart_id = $5
       RETURNING *`,
      [name, price, description, itemId, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ item: result.rows[0] });
  } catch (error) {
    console.error("Update food item error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteFoodItem = async (req, res) => {
  const { id, itemId } = req.params;
  const owner_id = req.user.userId;

  try {
    // Ownership check
    const cartCheck = await pool.query(
      "SELECT id FROM carts WHERE id = $1 AND owner_id = $2",
      [id, owner_id],
    );

    if (cartCheck.rows.length === 0) {
      return res.status(404).json({ message: "Cart not found" });
    }

    await pool.query("DELETE FROM food_items WHERE id = $1 AND cart_id = $2", [
      itemId,
      id,
    ]);

    res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    console.error("Delete food item error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
