const express = require("express");
const cors = require("cors");
const sql = require("mssql");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Use the standard server name (ex: myserver.database.windows.net).
// With Private Endpoint + Private DNS zone, it resolves to private IP automatically.
const dbConfig = {
  server: process.env.DB_SERVER,      // e.g. "myserver.database.windows.net"
  database: process.env.DB_NAME,      // e.g. "mydb"
  user: process.env.DB_USER,          // e.g. "sqladmin"
  password: process.env.DB_PASSWORD,  // e.g. "*****"
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

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
