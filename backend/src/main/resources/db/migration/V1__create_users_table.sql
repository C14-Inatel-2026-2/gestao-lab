-- Migration script for SQLite
-- Task: SCRUM-7: Create users table in SQLite with support for ADMIN and PARTICIPANT roles

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'PARTICIPANT'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
