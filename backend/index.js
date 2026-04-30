import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/carts.js";
dotenv.config();

const app = express();

// Middleware
// allows frontend to talk to this backend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json()); // lets Express read JSON from request body

app.use("/auth", authRoutes);
app.use("/carts", cartRoutes);

// Health check — just to confirm server is running
app.get("/", (req, res) => {
  res.json({ message: "Rollio API is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
