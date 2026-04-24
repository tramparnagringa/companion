-- Store fields for programs
-- abacatepay_product_id: product ID in AbacatePay dashboard (set by admin)
-- store_visible: controls visibility on the pricing/purchase page
-- display_order: sort order on pricing page (lower = first)

ALTER TABLE programs ADD COLUMN abacatepay_product_id text;
ALTER TABLE programs ADD COLUMN store_visible boolean NOT NULL DEFAULT false;
ALTER TABLE programs ADD COLUMN display_order integer NOT NULL DEFAULT 0;
