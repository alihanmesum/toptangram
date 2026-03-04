-- ============================================================
-- TOPTANGRAM — Gizlilik & Takip İsteği Migration
-- 004_privacy_follow_requests.sql
-- ============================================================

-- 1. store_profiles tablosuna gizlilik ayarı
ALTER TABLE store_profiles
  ADD COLUMN IF NOT EXISTS is_private        BOOLEAN    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS private_since     TIMESTAMPTZ;

-- 2. follows tablosuna onay durumu
--    Mevcut "accepted" kayıtlar korunur (DEFAULT accepted)
ALTER TABLE follows
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'accepted'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  ADD COLUMN IF NOT EXISTS requested_at  TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS responded_at  TIMESTAMPTZ;

-- Mevcut kayıtlar zaten onaylı sayılır
UPDATE follows SET status = 'accepted' WHERE status IS NULL OR status = '';

-- 3. Sık kullanılan sorgular için indexler
CREATE INDEX IF NOT EXISTS idx_follows_status
  ON follows(following_id, status);        -- Mağazanın bekleyen isteklerini hızlı çek

CREATE INDEX IF NOT EXISTS idx_follows_follower_status
  ON follows(follower_id, status);         -- Müşterinin onaylı takiplerini hızlı çek

CREATE INDEX IF NOT EXISTS idx_store_profiles_private
  ON store_profiles(user_id) WHERE is_private = true;

-- 4. Feed privacy view — sadece erişim hakkı olan postları döndürür
--    Parametre: $viewer_id (izleyen kullanıcının ID'si)
CREATE OR REPLACE VIEW accessible_posts AS
  SELECT
    p.*,
    sp.is_private,
    -- Viewer bu postu görebilir mi?
    CASE
      -- Kendi postum
      WHEN p.store_user_id = current_setting('app.viewer_id', true)::uuid THEN true
      -- Mağaza public
      WHEN sp.is_private = false THEN true
      -- Private mağaza: onaylı takip var mı?
      WHEN EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id  = current_setting('app.viewer_id', true)::uuid
          AND f.following_id = p.store_user_id
          AND f.status = 'accepted'
      ) THEN true
      ELSE false
    END AS can_view
  FROM posts p
  JOIN store_profiles sp ON sp.user_id = p.store_user_id;
