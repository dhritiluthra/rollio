import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ── REGISTER ──────────────────────────────────
export const register = async (req, res) => {
  // 1. Pull data from request body
  const { name, email, password, role } = req.body;

  try {
    // 2. Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    //console.log(existingUser);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 3. Hash the password — never store plain text
    // 10 is the "salt rounds" — how many times it scrambles the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert user into database
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role || "user"],
    );

    const user = result.rows[0];

    // 5. Create JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 6. Send back the token and user info
    res.status(201).json({
      message: "Registration successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── LOGIN ─────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    console.log("User info from db :", user);

    // 2. Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3. Create JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // 4. Send token back
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
