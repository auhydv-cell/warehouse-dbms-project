# 🏭 Warehouse Inventory Management System

A full-stack inventory management system with a Node.js/Express backend, MySQL database, and a dark-theme HTML/CSS/JS frontend.

---

## 📁 Project Structure

```
dbms 3/
├── schema.sql          ← Database schema + seed data
├── README.md
├── backend/
│   ├── server.js       ← Express REST API
│   ├── package.json
│   └── .env            ← DB credentials (edit this)
└── frontend/
    └── index.html      ← Single-page UI (open in browser)
```

---

## ⚙️ Setup Instructions

### 1. Database Setup (MySQL)

Open MySQL CLI or MySQL Workbench and run:

```sql
CREATE DATABASE warehouse_db;
USE warehouse_db;
SOURCE /full/path/to/schema.sql;
```

Or via command line:

```bash
mysql -u root -p warehouse_db < schema.sql
```

---

### 2. Configure Backend

Edit `backend/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=warehouse_db
PORT=5000
```

---

### 3. Install & Run Backend

```bash
cd backend
npm install
npm run dev       # uses nodemon (auto-restart)
# or
npm start         # plain node
```

The API will be available at `http://localhost:5000`.

---

### 4. Open Frontend

Simply open `frontend/index.html` in your browser — no build step needed.

> Make sure the backend is running before opening the frontend.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/warehouses` | List all warehouses |
| GET | `/items` | List all items (supports `?warehouse=<id>`) |
| POST | `/items` | Add a new item |
| DELETE | `/items/:id` | Delete an item |
| POST | `/transfer` | Transfer stock between warehouses |

### POST `/items` — Request Body
```json
{
  "name": "Steel Bolts M8",
  "category": "Hardware",
  "quantity": 500,
  "price": 0.15,
  "warehouse_id": 1
}
```

### POST `/transfer` — Request Body
```json
{
  "item_id": 1,
  "destination_warehouse_id": 2,
  "quantity": 100
}
```

---

## 🏗️ Seeded Warehouses

| ID | Name | Location |
|----|------|----------|
| 1 | Main Hub | Chicago, IL |
| 2 | East Coast | New York, NY |
| 3 | West Coast | Los Angeles, CA |

---

## ✨ Features

- 📦 View all inventory with live filtering by warehouse
- ➕ Add new items via form
- 🗑️ Delete items with confirmation
- 🔄 Transfer stock between warehouses (uses SQL transactions)
- 🔴🟢 Quantity badges — red if < 10, green otherwise
- 📊 Stats bar: total items, total units, low-stock count, total value
- 🔔 Toast notifications for all actions
