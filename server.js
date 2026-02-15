const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Fake in-memory data (no DB)
let items = [
  { id: 1, name: "Alpha", createdAt: new Date().toISOString() },
  { id: 2, name: "Beta", createdAt: new Date().toISOString() },
  { id: 3, name: "Gamma", createdAt: new Date().toISOString() }
];

// Root
app.get("/", (req, res) => {
  res.json({
    service: "azure-node22-api",
    status: "ok",
    routes: [
      "GET /api/health",
      "GET /api/version",
      "GET /api/items",
      "GET /api/items/:id",
      "POST /api/items"
    ]
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Node version
app.get("/api/version", (req, res) => {
  res.json({
    node: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || "development"
  });
});

// GET all items
app.get("/api/items", (req, res) => {
  const q = String(req.query.q || "").toLowerCase().trim();
  const data = q
    ? items.filter((x) => x.name.toLowerCase().includes(q))
    : items;

  res.json({ count: data.length, data });
});

// GET by id
app.get("/api/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = items.find((x) => x.id === id);

  if (!item) {
    return res.status(404).json({
      ok: false,
      error: "NOT_FOUND",
      message: "Item not found"
    });
  }

  res.json({ ok: true, data: item });
});

// ✅ POST create new item
app.post("/api/items", (req, res) => {
  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({
      ok: false,
      error: "Name is required"
    });
  }

  const newItem = {
    id: items.length ? items[items.length - 1].id + 1 : 1,
    name,
    createdAt: new Date().toISOString()
  };

  items.push(newItem);

  res.status(201).json({
    ok: true,
    data: newItem
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
