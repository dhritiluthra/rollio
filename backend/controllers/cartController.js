import pool from "../config/db.js";

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
  } catch (error) {
    console.error("Update location error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── GET NEARBY CARTS ──────────────────────────
export const getNearbyCarts = async (req, res) => {
  const { latitude, longitude, radius = 5 } = req.query;
  // radius is in kilometers, default 5km
  const getNearByQuery = `SELECT * FROM (
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
          ) AS distance_km
        FROM carts c
        JOIN cart_locations cl ON cl.cart_id = c.id
        WHERE c.is_active = true
      ) AS carts_with_distance
      WHERE distance_km < $3
      ORDER BY distance_km ASC`;
  try {
    // Haversine formula — calculates distance between two GPS coordinates
    const result = await pool.query(getNearByQuery, [
      latitude,
      longitude,
      radius,
    ]);

    // console.log("GetNearByQuery", {
    //   getNearByQuery,
    //   values: [latitude, longitude, radius],
    // });
    console.log("Result for getNearByCarts Query", result.rows);
    res.status(200).json({
      count: result.rows.length,
      carts: result.rows,
    });
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

    res.status(200).json({
      message: `Cart is now ${!currentStatus ? "active" : "offline"}`,
      cart: result.rows[0],
    });
  } catch (error) {
    console.error("Toggle cart error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
