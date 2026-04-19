-- ============================================================
--  Warehouse Inventory Management System — PostgreSQL Schema
-- ============================================================

-- Drop tables if they exist
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS warehouses;

-- ---------------------------------------------------------------
-- Table: warehouses
-- ---------------------------------------------------------------
CREATE TABLE warehouses (
    id       SERIAL PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL
);

-- ---------------------------------------------------------------
-- Table: items
-- ---------------------------------------------------------------
CREATE TABLE items (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(150)   NOT NULL,
    category     VARCHAR(100)   NOT NULL,
    quantity     INTEGER        NOT NULL DEFAULT 0,
    price        NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    warehouse_id INTEGER        NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- Seed Data: Warehouses
-- ---------------------------------------------------------------
INSERT INTO warehouses (name, location) VALUES
    ('Main Hub',   'Chicago, IL'),
    ('East Coast', 'New York, NY'),
    ('West Coast', 'Los Angeles, CA'),
    ('South Hub',  'Houston, TX');

-- ---------------------------------------------------------------
-- Seed Data: Items
-- ---------------------------------------------------------------
INSERT INTO items (name, category, quantity, price, warehouse_id) VALUES
    ('Steel Bolts M8',       'Hardware',  1240,  0.15, 1),
    ('Copper Wire 12AWG',    'Electrical',  35,   1.20, 1),
    ('Safety Helmets',       'PPE',         89,  24.99, 2),
    ('LED Strip Lights',     'Electrical', 210,   8.49, 2),
    ('Work Gloves (L)',      'PPE',          8,  12.50, 3),
    ('PVC Conduit 20mm',     'Plumbing',   320,   3.75, 3),
    ('Circuit Breakers',     'Electrical',   6,  45.00, 1),
    ('Hard Hats (Yellow)',   'PPE',        150,  18.00, 2),
    ('Stainless Nuts M10',   'Hardware',   890,   0.25, 3),
    ('Fire Extinguisher 5L', 'Safety',       4,  89.99, 1);
