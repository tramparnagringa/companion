-- Feature bullets for the store/pricing page
-- Admin fills these in the program editor
ALTER TABLE programs ADD COLUMN features text[] NOT NULL DEFAULT '{}';
