/**
 * Warehouse Inventory Management System — Express + PostgreSQL Backend
 */

require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors    = require("cors");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── DB Pool ───────────────────────────────────────────────────
const pool = new Pool({
  host    : process.env.DB_HOST     || "localhost",
  port    : parseInt(process.env.DB_PORT || "5432"),
  user    : process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "warehouse_db",
});

const query = (sql, params = []) => pool.query(sql, params);

// ── GET /warehouses ───────────────────────────────────────────
app.get("/warehouses", async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM warehouses ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch warehouses." });
  }
});

// ── GET /items ────────────────────────────────────────────────
app.get("/items", async (req, res) => {
  try {
    const { warehouse } = req.query;
    let sql = `
      SELECT i.id, i.name, i.category, i.quantity, i.price,
             i.warehouse_id, w.name AS warehouse_name, w.location AS warehouse_location
      FROM items i JOIN warehouses w ON i.warehouse_id = w.id
    `;
    const params = [];
    if (warehouse) {
      params.push(warehouse);
      sql += ` WHERE i.warehouse_id = $1`;
    }
    sql += " ORDER BY i.name";
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch items." });
  }
});

// ── POST /items ───────────────────────────────────────────────
app.post("/items", async (req, res) => {
  try {
    const { name, category, quantity, price, warehouse_id } = req.body;
    if (!name || !category || quantity == null || price == null || !warehouse_id)
      return res.status(400).json({ error: "All fields are required." });
    if (parseInt(quantity) < 0) return res.status(400).json({ error: "Quantity must be ≥ 0." });
    if (parseFloat(price)   < 0) return res.status(400).json({ error: "Price must be ≥ 0." });

    const { rows } = await query(
      `INSERT INTO items (name, category, quantity, price, warehouse_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name.trim(), category.trim(), parseInt(quantity), parseFloat(price), parseInt(warehouse_id)]
    );
    const item = await query(
      `SELECT i.*, w.name AS warehouse_name, w.location AS warehouse_location
       FROM items i JOIN warehouses w ON i.warehouse_id = w.id WHERE i.id = $1`,
      [rows[0].id]
    );
    res.status(201).json(item.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create item." });
  }
});

// ── DELETE /items/:id ─────────────────────────────────────────
app.delete("/items/:id", async (req, res) => {
  try {
    const { rowCount } = await query("DELETE FROM items WHERE id = $1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "Item not found." });
    res.json({ message: "Item deleted.", id: parseInt(req.params.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete item." });
  }
});

// ── POST /transfer ────────────────────────────────────────────
app.post("/transfer", async (req, res) => {
  const client = await pool.connect();
  try {
    const { item_id, destination_warehouse_id, quantity } = req.body;
    if (!item_id || !destination_warehouse_id || !quantity)
      return res.status(400).json({ error: "item_id, destination_warehouse_id and quantity are required." });

    const qty = parseInt(quantity);
    if (qty <= 0) return res.status(400).json({ error: "Quantity must be > 0." });

    await client.query("BEGIN");

    // Lock source row
    const { rows: src } = await client.query(
      "SELECT * FROM items WHERE id = $1 FOR UPDATE", [item_id]
    );
    if (!src.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Item not found." }); }

    const sourceItem = src[0];
    if (sourceItem.warehouse_id === parseInt(destination_warehouse_id)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Source and destination must be different." });
    }
    if (sourceItem.quantity < qty) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Insufficient stock. Available: ${sourceItem.quantity}` });
    }

    // Deduct from source
    await client.query("UPDATE items SET quantity = quantity - $1 WHERE id = $2", [qty, item_id]);

    // Upsert at destination
    const { rows: dest } = await client.query(
      "SELECT id FROM items WHERE name=$1 AND category=$2 AND warehouse_id=$3",
      [sourceItem.name, sourceItem.category, destination_warehouse_id]
    );
    if (dest.length) {
      await client.query("UPDATE items SET quantity = quantity + $1 WHERE id = $2", [qty, dest[0].id]);
    } else {
      await client.query(
        "INSERT INTO items (name, category, quantity, price, warehouse_id) VALUES ($1,$2,$3,$4,$5)",
        [sourceItem.name, sourceItem.category, qty, sourceItem.price, destination_warehouse_id]
      );
    }

    await client.query("COMMIT");
    res.json({ message: `Successfully transferred ${qty} unit(s).` });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Transfer failed. Transaction rolled back." });
  } finally {
    client.release();
  }
});

app.listen(PORT, () => console.log(`\n  🏭  Warehouse API → http://localhost:${PORT}\n`));
