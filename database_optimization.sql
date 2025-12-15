-- FREE DATABASE OPTIMIZATIONS FOR SCALING
-- Run these in Supabase SQL Editor

-- 1. FASTER USER INTERACTIONS QUERIES (most important!)
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_time
ON user_interactions(user_id, created_at DESC);

-- 2. FASTER PRODUCT SEARCHES BY GENDER
CREATE INDEX IF NOT EXISTS idx_products_gender_category
ON products(gender, category);

-- 3. FASTER PRODUCT SEARCHES BY BRAND
CREATE INDEX IF NOT EXISTS idx_products_brand
ON products(brand);

-- 4. FASTER USER PROFILE LOOKUPS
CREATE INDEX IF NOT EXISTS idx_profiles_user_id
ON profiles(id);

-- 5. FASTER AESTHETIC PROFILE LOOKUPS
CREATE INDEX IF NOT EXISTS idx_aesthetic_profiles_user_id
ON user_aesthetic_profiles(user_id);

-- OPTIMIZE EXISTING TABLES (run these manually)
-- CLUSTER user_interactions USING idx_user_interactions_user_time;
-- ANALYZE user_interactions;
-- ANALYZE products;
-- ANALYZE profiles;
