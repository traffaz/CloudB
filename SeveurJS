// server.js (Node LTS 22 - Azure Web App friendly)
const express = require("express");
const cors = require("cors");

const app = express();

// Azure App Service fournit le port via process.env.PORT
const PORT = process.env.PORT || 80 ;

// CORS: en prod tu peux restreindre via FRONTEND_ORIGIN
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
app.use(
  cors({
    origin: FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN,
  })
);

app.use(express.json());

// --- Fake data (à remplacer par DB / API externe) ---
const items = [
  { id: 1, name: "Alpha", createdAt: new Date().toISOString() },
  { id: 2, name: "Beta", createdAt: new Date().toISOString() },
  { id: 3, name: "Gamma", createdAt: new Date().toISOString() },
];

// --- Routes ---
app.get("/", (req, res) => {
  res.json({
    service: "backend",
    status: "ok",
    routes: ["/api/health", "/api/items", "/api/items/:id", "/api/version"],
  });
});

// Healthcheck (utile pour tester rapidement sur Azure)
app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Version/runtime (utile pour vérifier Node 22)
app.get("/api/version", (req, res) => {
  res.json({
    node: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || "development",
  });
});

// GET list
app.get("/api/items", (req, res) => {
  // optionnel: filtre ?q=...
  const q = (req.query.q || "").toString().toLowerCase().trim();
  const filtered = q
    ? items.filter((x) => x.name.toLowerCase().includes(q))
    : items;

  res.json({
    count: filtered.length,
    data: filtered,
  });
});

// GET by id
app.get("/api/items/:id", (req, res) => {
  const id = Number(req.params.id);
  const item = items.find((x) => x.id === id);

  if (!item) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Item not found" });
  }

  res.json(item);
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
