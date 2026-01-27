-- Fix SSL certificate column sizes
-- fingerprint: SHA-256 with colons is 95 chars (64 hex + 31 colons)
-- issuer: Can be long with multiple RDN components

ALTER TABLE ssl_certificates 
  ALTER COLUMN fingerprint TYPE VARCHAR(128),
  ALTER COLUMN issuer TYPE VARCHAR(512);
