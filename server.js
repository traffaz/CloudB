const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: true } : false
});

// GET health
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// GET all items
app.get("/api/items", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM public.items ORDER BY id DESC LIMIT 100");
    res.json({ count: r.rows.length, data: r.rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST create item
app.post("/api/items", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: "Missing field: name"
      });
    }

    const query = `
      INSERT INTO public.items (name)
      VALUES ($1)
      RETURNING *
    `;

    const result = await pool.query(query, [name]);

    res.status(201).json({
      ok: true,
      data: result.rows[0]
    });

  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

let pool;
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(dbConfig);
  return pool;
}

app.get("/api/health", async (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// Simple DB connectivity check
app.get("/api/db/ping", async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query("SELECT 1 AS ok");
    res.json({ ok: true, result: r.recordset?.[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Example: read from a table (change dbo.Items to your table)
app.get("/api/items", async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query("SELECT TOP (100) * FROM dbo.Items ORDER BY 1 DESC");
    res.json({ count: r.recordset.length, data: r.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
