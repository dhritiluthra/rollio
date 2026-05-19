import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../src/utils/sendEmail.js";

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
    console.log("Login Testing ");
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── FORGOT PASSWORD ───────────────────────────
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Check if user exists
    const result = await pool.query(
      "SELECT id, name FROM users WHERE email = $1",
      [email],
    );

    // 2. Always return success even if email not found
    //    Why? If you return "email not found", attackers can
    //    use your forgot password form to check which emails
    //    are registered. This is called user enumeration.
    if (result.rows.length === 0) {
      return res.status(200).json({
        message: "If this email exists, a reset link has been sent",
      });
    }

    const user = result.rows[0];

    // 3. Generate a secure random token
    //    crypto.randomBytes(32) generates 32 random bytes
    //    .toString("hex") converts to a readable hex string
    //    Result: a 64 character random string like "a3f8c2..."
    const resetToken = crypto.randomBytes(32).toString("hex");

    // 4. Set expiry to 1 hour from now
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    // 5. Save token and expiry to database
    await pool.query(
      `UPDATE users
       SET reset_token = $1, reset_token_expiry = $2
       WHERE id = $3`,
      [resetToken, expiry, user.id],
    );

    // 6. Build the reset link
    //    Frontend will have a page at this URL that reads the token
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // 7. Send the email
    await sendEmail({
      to: email,
      subject: "Reset your Rollio password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #f97316;">Rollio</h2>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Click the button below:</p>
          <a
            href="${resetLink}"
            style="
              display: inline-block;
              background: #f97316;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              margin: 16px 0;
            "
          >
            Reset Password
          </a>
          <p style="color: #999; font-size: 13px;">
            This link expires in 1 hour. If you didn't request this, ignore this email.
          </p>
        </div>
      `,
    });

    res.status(200).json({
      message: "If this email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── RESET PASSWORD ────────────────────────────
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // 1. Find user with this token
    const result = await pool.query(
      `SELECT id FROM users
       WHERE reset_token = $1
       AND reset_token_expiry > NOW()`,
      [token],
    );

    // 2. Token not found or expired
    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Reset link is invalid or has expired",
      });
    }

    const user = result.rows[0];

    // 3. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password AND clear the token
    //    Why clear the token? So the same link can't be used twice
    await pool.query(
      `UPDATE users
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expiry = NULL
       WHERE id = $2`,
      [hashedPassword, user.id],
    );

    res.status(200).json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
