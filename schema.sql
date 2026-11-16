
CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  caption TEXT DEFAULT '',
  image BLOB NOT NULL,
  mime_type TEXT DEFAULT 'image/webp',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO albums (name, description) VALUES
('Wedding', 'Our wedding memories'),
('Mehendi', 'Mehendi celebration'),
('Getting Ready', 'Getting ready moments'),
('Wedding Day', 'Our special day');

CREATE INDEX IF NOT EXISTS idx_photos_album
ON photos(album_id);
