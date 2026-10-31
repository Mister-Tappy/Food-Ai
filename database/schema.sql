-- =========================================================
-- DATABASE SCHEMA — V2
-- Source: docs/PROJECT_BIBLE_V2.md § Database
-- restaurants, menus, users, favorites, history, ratings, training_dataset
-- Compatible with PostgreSQL (Supabase) — adjust types for MySQL if needed.
-- =========================================================

CREATE TABLE IF NOT EXISTS restaurants (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  food_type     VARCHAR(50)  NOT NULL,
  price_level   SMALLINT     NOT NULL CHECK (price_level BETWEEN 1 AND 4),
  latitude      DECIMAL(9,6) NOT NULL,
  longitude     DECIMAL(9,6) NOT NULL,
  rating        DECIMAL(2,1) DEFAULT 0,
  open_breakfast BOOLEAN DEFAULT FALSE,
  open_lunch     BOOLEAN DEFAULT FALSE,
  open_dinner    BOOLEAN DEFAULT FALSE,
  open_late      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Restaurant 1:N Menu
CREATE TABLE IF NOT EXISTS menus (
  id            SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          VARCHAR(150) NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name  VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- User 1:N History
CREATE TABLE IF NOT EXISTS user_history (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  viewed_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, restaurant_id)
);

-- New in V2: user star ratings, separate from the aggregate restaurants.rating
CREATE TABLE IF NOT EXISTS ratings (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- New in V2: raw feedback log feeding nightly retraining.
-- action: 'selected' | 'ignored' | 'favorited' | 'rated'
-- See docs/PROJECT_BIBLE_V2.md § Learning From User
CREATE TABLE IF NOT EXISTS training_dataset (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  action        VARCHAR(20) NOT NULL CHECK (action IN ('selected','ignored','favorited','rated')),
  rating        SMALLINT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menus_restaurant ON menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_restaurant ON ratings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_training_dataset_created ON training_dataset(created_at);
