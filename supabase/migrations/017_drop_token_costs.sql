-- token_costs was used as a per-program gate threshold before calling the AI API.
-- Removed in favour of a simpler check: available > 0.
-- Actual consumption always uses real API token counts from the response.
ALTER TABLE programs DROP COLUMN IF EXISTS token_costs;
