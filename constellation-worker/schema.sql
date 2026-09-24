-- One row per day the owner marked as "done". A missing date just means
-- that day has no star — there is no "failed" state stored anywhere.
CREATE TABLE IF NOT EXISTS checkins (
  date       TEXT PRIMARY KEY,  -- 'YYYY-MM-DD'
  note       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL      -- ISO timestamp, for ordering/debugging only
);
