CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS search_text TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS category TEXT;

UPDATE restaurants
SET category = 'restaurant'
WHERE category IS NULL OR btrim(category) = '';

CREATE INDEX IF NOT EXISTS restaurants_embedding_idx
ON restaurants USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX IF NOT EXISTS restaurants_category_idx ON restaurants(category);

CREATE OR REPLACE FUNCTION search_restaurants_hybrid(
  query_embedding vector(1536),
  filter_category TEXT DEFAULT NULL,
  max_price INT DEFAULT NULL,
  user_lat FLOAT DEFAULT NULL,
  user_lng FLOAT DEFAULT NULL,
  max_distance_km FLOAT DEFAULT 50,
  match_limit INT DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name_en TEXT,
  name_cn TEXT,
  cuisine TEXT,
  category TEXT,
  price_per_person INT,
  rating DECIMAL,
  foreigner_hook TEXT,
  english_description TEXT,
  vibe TEXT,
  best_for TEXT[],
  latitude DECIMAL,
  longitude DECIMAL,
  images JSONB,
  signature_dishes JSONB,
  ordering_guide JSONB,
  spice_and_dietary_notes JSONB,
  practical_tips JSONB,
  common_complaints JSONB,
  value_for_money TEXT,
  similarity FLOAT
)
LANGUAGE sql
AS $$
  SELECT
    r.id, r.slug, r.name_en, r.name_cn,
    r.cuisine, r.category, r.price_per_person, r.rating,
    r.foreigner_hook, r.english_description, r.vibe, r.best_for,
    r.latitude, r.longitude, r.images,
    r.signature_dishes, r.ordering_guide, r.spice_and_dietary_notes,
    r.practical_tips, r.common_complaints, r.value_for_money,
    1 - (r.embedding <=> query_embedding) as similarity
  FROM restaurants r
  WHERE r.embedding IS NOT NULL
    AND (filter_category IS NULL OR r.category = filter_category)
    AND (max_price IS NULL OR r.price_per_person <= max_price)
    AND (user_lat IS NULL OR user_lng IS NULL OR
         (6371 * acos(
            LEAST(
              1.0,
              GREATEST(
                -1.0,
                cos(radians(user_lat)) * cos(radians(r.latitude)) *
                cos(radians(r.longitude) - radians(user_lng)) +
                sin(radians(user_lat)) * sin(radians(r.latitude))
              )
            )
          )) <= max_distance_km)
    AND 1 - (r.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_limit;
$$;
