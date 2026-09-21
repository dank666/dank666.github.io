-- City-level, anonymous visit counters. No IP addresses, no user agents.
-- lat/lon are rounded to ~0.1 degree by the Worker before they get here.
-- city is '' (not NULL) when Cloudflare doesn't know it, so the UNIQUE key
-- below behaves (SQLite treats NULLs as distinct, which would break upserts).
CREATE TABLE IF NOT EXISTS visits (
  city    TEXT    NOT NULL DEFAULT '',
  country TEXT    NOT NULL,
  lat     REAL    NOT NULL,
  lon     REAL    NOT NULL,
  count   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (country, city, lat, lon)
);
