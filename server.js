const express = require("express");
const cors = require("cors");
const sql = require("mssql");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ✅ MUST be set in Azure App Settings
// DB_SERVER must be like: "myserver.database.windows.net"  (no https, no port)
const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

function assertEnv() {
  const required = ["DB_SERVER", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
}

let pool;
async function getPool() {
  if (pool) return pool;
  assertEnv();
  pool = await sql.connect(dbConfig);
  return pool;
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get("/api/db/ping", async (req, res) => {
  try {
    const p = await getPool();
    const r = await p.request().query("SELECT 1 AS ok");
    res.json({ ok: true, result: r.recordset?.[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ GET items (table: dbo.Items)
app.get("/api/items", async (req, res) => {
  try {
    const p = await getPool();
    const r = await p
      .request()
      .query("SELECT TOP (100) id, name, created_at FROM dbo.Items ORDER BY id DESC");

    res.json({ count: r.recordset.length, data: r.recordset });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ✅ POST items (insert into dbo.Items)
app.post("/api/items", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ ok: false, error: "Missing or invalid field: name" });
    }

    const p = await getPool();

    const r = await p
      .request()
      .input("name", sql.NVarChar(255), name)
      .query(`
        INSERT INTO dbo.Items (name)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.created_at
        VALUES (@name)
      `);

    res.status(201).json({ ok: true, data: r.recordset?.[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
