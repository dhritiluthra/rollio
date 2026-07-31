ALTER TABLE cart_locations
ADD COLUMN address TEXT;

CREATE TABLE IF NOT EXISTS public.reviews (
  id         SERIAL PRIMARY KEY,
  cart_id    INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (cart_id, user_id)
);


  ALTER TABLE users
  ADD COLUMN reset_token TEXT,
  ADD COLUMN reset_token_expiry TIMESTAMP;