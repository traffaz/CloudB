const express = require("express");
const cors = require("cors");
const sql = require("mssql");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

function missingDbVars() {
  const required = ["DB_SERVER", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === "");
  return missing;
}

// Build config only if env is present
function buildDbConfig() {
  return {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: { encrypt: true, trustServerCertificate: false },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  };
}

let poolPromise = null;

async function getPoolOrNull() {
  const missing = missingDbVars();
  if (missing.length) return null;

  if (!poolPromise) {
    poolPromise = sql.connect(buildDbConfig());
  }
  return poolPromise;
}

// Always available
app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Helpful debug (don’t expose passwords)
app.get("/api/config-status", (req, res) => {
  const missing = missingDbVars();
  res.json({
    ok: missing.length === 0,
    missing,
    DB_SERVER: process.env.DB_SERVER || null,
    DB_NAME: process.env.DB_NAME || null,
    DB_USER: process.env.DB_USER || null
  });
});

// DB ping: returns 503 if not configured
app.get("/api/db/ping", async (req, res) => {
  try {
    const pool = await getPoolOrNull();
    if (!pool) {
      return res.status(503).json({
        ok: false,
        error: "DB_NOT_CONFIGURED",
        message: "Set DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD in App Service Configuration."
      });
    }

    const r = await pool.request().query("SELECT 1 AS ok");
    res.json({ ok: true, result: r.recordset?.[0] });
  } catch (err) {
    res.sta
