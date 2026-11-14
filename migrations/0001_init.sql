CREATE TABLE messages (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL CHECK (type IN ('quote','feedback','advisory_reply','other')),
  name          TEXT,
  company       TEXT,
  email         TEXT,
  phone         TEXT,
  service       TEXT,
  origin        TEXT,
  destination   TEXT,
  commodity     TEXT,
  weight_volume TEXT,
  readiness     TEXT,
  incoterm      TEXT,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','quoted','closed')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_messages_status_created ON messages (status, created_at DESC);
CREATE INDEX idx_messages_type_created   ON messages (type, created_at DESC);

CREATE TABLE feedback (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  company     TEXT,
  service     TEXT,
  quote       TEXT NOT NULL,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  published   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE advisories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  severity    TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  published   INTEGER NOT NULL DEFAULT 1,
  published_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_advisories_pub ON advisories (published, published_at DESC);
