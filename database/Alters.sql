ALTER TABLE cart_locations
ADD COLUMN address TEXT;


  ALTER TABLE users
  ADD COLUMN reset_token TEXT,
  ADD COLUMN reset_token_expiry TIMESTAMP;