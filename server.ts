import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// WooCommerce configuration
const WC_URL = process.env.WC_URL || "";
const WC_KEY = process.env.WC_CONSUMER_KEY || "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET || "";

const wcApi = axios.create({
  baseURL: `${WC_URL}/wp-json/wc/v3`,
  auth: {
    username: WC_KEY,
    password: WC_SECRET,
  },
});

// --- API Routes ---

// Fetch Orders
app.get("/api/woo/orders", async (req, res) => {
  try {
    const response = await wcApi.get("/orders", { params: req.query });
    res.json(response.data);
  } catch (error: any) {
    console.error("WooCommerce API Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: "Internal Server Error" });
  }
});

// Create Order
app.post("/api/woo/orders", async (req, res) => {
  try {
    const response = await wcApi.post("/orders", req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error("WooCommerce API Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: "Internal Server Error" });
  }
});

// Update Order
app.put("/api/woo/orders/:id", async (req, res) => {
  try {
    const response = await wcApi.put(`/orders/${req.params.id}`, req.body);
    res.json(response.data);
  } catch (error: any) {
    console.error("WooCommerce API Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: "Internal Server Error" });
  }
});

// Fetch Products
app.get("/api/woo/products", async (req, res) => {
  try {
    const response = await wcApi.get("/products", { params: { per_page: 100, ...req.query } });
    res.json(response.data);
  } catch (error: any) {
    console.error("WooCommerce API Error:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: "Internal Server Error" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
