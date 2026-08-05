import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { setWss } from "./src/utils/broadcast.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/carts.js";
dotenv.config();

const app = express();

// Middleware
// allows frontend to talk to this backend
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev
      process.env.FRONTEND_URL, // production (from .env)
    ],
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

// Wrap Express in a plain HTTP server so the WebSocket server
// can share the same port — one port for both REST and WS.
const server = createServer(app);
const wss = new WebSocketServer({ server });
setWss(wss); // make `broadcast()` usable in controllers

wss.on("connection", (ws) => {
  console.log("[WS] Client connected — total:", wss.clients.size);
  ws.on("close", () =>
    console.log("[WS] Client disconnected — total:", wss.clients.size),
  );
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
