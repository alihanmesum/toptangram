// ============================================================
// backend/src/controllers/followController.js
// Gizlilik & Takip İsteği — Toptangram Final
// ============================================================
const { pool } = require('../config/db');

// ── Yardımcı: Mağaza gizlilik bilgisini çek ──────────────────────────────
const getStorePrivacy = async (storeUserId) => {
  const res = await pool.query(
    'SELECT is_private FROM store_profiles WHERE user_id = $1',
    [storeUserId]
  );
  return res.rows[0]?.is_private ?? false;
};

// ── Yardımcı: Mevcut takip durumunu çek ──────────────────────────────────
const getFollowStatus = async (followerId, followingId) => {
  const res = await pool.query(
    `SELECT id, status FROM follows
     WHERE follower_id = $1 AND following_id = $2`,
    [followerId, followingId]
  );
  return res.rows[0] || null;
};

// ============================================================
// POST /api/follows/:storeId
// Takip et (public → accepted, private → pending)
// ============================================================
const followStore = async (req, res) => {
  const customerId = req.user.id;
  const { storeId } = req.params;

  if (customerId === storeId) {
    return res.status(400).json({ success: false, message: 'Kendinizi takip edemezsiniz.' });
  }

  // Mağaza var mı ve kullanıcı store mu?
  const storeCheck = await pool.query(
    `SELECT u.id, sp.is_private, sp.store_name
     FROM users u
     JOIN store_profiles sp ON sp.user_id = u.id
     WHERE u.id = $1 AND u.role = 'store' AND u.is_active = true AND u.suspended_at IS NULL`,
    [storeId]
  );

  if (storeCheck.rowCount === 0) {
    return res.status(404).json({ success: false, message: 'Mağaza bulunamadı.' });
  }

  const { is_private, store_name } = storeCheck.rows[0];

  // Zaten takip var mı?
  const existing = await getFollowStatus(customerId, storeId);
  if (existing) {
    if (existing.status === 'accepted') {
      return res.status(409).json({ success: false, message: 'Bu mağazayı zaten takip ediyorsunuz.' });
    }
    if (existing.status === 'pending') {
      return res.status(409).json({ success: false, message: 'Takip isteğiniz zaten beklemede.' });
    }
    // Reddedilmişse yeniden istek oluştur
    if (existing.status === 'rejected') {
      const newStatus = is_private ? 'pending' : 'accepted';
      await pool.query(
        `UPDATE follows SET status = $1, requested_at = NOW(), responded_at = NULL
         WHERE id = $2`,
        [newStatus, existing.id]
      );
      return res.json({
        success: true,
        status: newStatus,
        message: newStatus === 'pending'
          ? `${store_name} mağazasına takip isteği gönderildi.`
          : `${store_name} mağazasını takip etmeye başladınız.`
      });
    }
  }

  // Yeni takip kaydı oluştur
  const status = is_private ? 'pending' : 'accepted';
  await pool.query(
    `INSERT INTO follows (follower_id, following_id, status, requested_at)
     VALUES ($1, $2, $3, NOW())`,
    [customerId, storeId, status]
  );

  // TODO: push notification — "X size takip isteği gönderdi"
  if (is_private) {
    // Mağazaya bildirim gönder
    await createNotification(storeId, customerId, 'follow_request');
  }

  return res.status(201).json({
    success: true,
    status,
    isPrivate: is_private,
    message: status === 'pending'
      ? `${store_name} gizli bir mağaza. Takip isteğiniz gönderildi.`
      : `${store_name} mağazasını takip etmeye başladınız.`
  });
};

// ============================================================
// DELETE /api/follows/:storeId
// Takibi bırak veya bekleyen isteği geri çek
// ============================================================
const unfollowStore = async (req, res) => {
  const customerId = req.user.id;
  const { storeId } = req.params;

  const result = await pool.query(
    `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2 RETURNING status`,
    [customerId, storeId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, message: 'Takip kaydı bulunamadı.' });
  }

  const wasStatus = result.rows[0].status;
  res.json({
    success: true,
    message: wasStatus === 'pending'
      ? 'Takip isteği geri çekildi.'
      : 'Mağaza takibi bırakıldı.'
  });
};

// ============================================================
// GET /api/stores/:storeId/follow-requests
// Mağaza: Gelen takip isteklerini listele (sadece store owner)
// ============================================================
const getFollowRequests = async (req, res) => {
  const storeOwnerId = req.user.id;
  const { storeId } = req.params;
  const { status = 'pending', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  // Yetki: sadece kendi mağazası
  if (storeOwnerId !== storeId) {
    return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
  }

  const result = await pool.query(
    `SELECT
      f.id           AS follow_id,
      f.status,
      f.requested_at,
      f.responded_at,
      u.id           AS customer_id,
      u.full_name,
      u.username,
      u.avatar_url,
      u.city,
      -- Kaç mağaza takip ediyor
      (SELECT COUNT(*) FROM follows f2
       WHERE f2.follower_id = u.id AND f2.status = 'accepted')::int AS following_count
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = $1
       AND f.status = $2
     ORDER BY f.requested_at DESC
     LIMIT $3 OFFSET $4`,
    [storeId, status, limit, offset]
  );

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM follows
     WHERE following_id = $1 AND status = $2`,
    [storeId, status]
  );

  res.json({
    success: true,
    requests: result.rows,
    total: countRes.rows[0].total,
    page: parseInt(page),
    hasMore: result.rows.length === parseInt(limit)
  });
};

// ============================================================
// PATCH /api/stores/:storeId/follow-requests/:followId
// Mağaza: İsteği onayla veya reddet
// Body: { action: "accept" | "reject" }
// ============================================================
const respondToFollowRequest = async (req, res) => {
  const storeOwnerId = req.user.id;
  const { storeId, followId } = req.params;
  const { action } = req.body;

  if (storeOwnerId !== storeId) {
    return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
  }
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'action "accept" veya "reject" olmalı.' });
  }

  const newStatus = action === 'accept' ? 'accepted' : 'rejected';

  const result = await pool.query(
    `UPDATE follows
     SET status = $1, responded_at = NOW()
     WHERE id = $2
       AND following_id = $3
       AND status = 'pending'
     RETURNING follower_id`,
    [newStatus, followId, storeId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({
      success: false,
      message: 'Bekleyen takip isteği bulunamadı.'
    });
  }

  // Müşteriye bildirim gönder
  const followerId = result.rows[0].follower_id;
  await createNotification(
    followerId,
    storeOwnerId,
    action === 'accept' ? 'follow_accepted' : 'follow_rejected'
  );

  res.json({
    success: true,
    status: newStatus,
    message: action === 'accept'
      ? 'Takip isteği onaylandı. Kullanıcı artık postlarınızı görebilir.'
      : 'Takip isteği reddedildi.'
  });
};

// ============================================================
// PATCH /api/stores/:storeId/privacy
// Mağaza: Gizlilik modunu aç/kapat
// Body: { is_private: true | false }
// ============================================================
const updatePrivacySetting = async (req, res) => {
  const storeOwnerId = req.user.id;
  const { storeId } = req.params;
  const { is_private } = req.body;

  if (storeOwnerId !== storeId) {
    return res.status(403).json({ success: false, message: 'Yetkisiz erişim.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE store_profiles
       SET is_private = $1,
           private_since = CASE WHEN $1 = true AND is_private = false THEN NOW() ELSE private_since END
       WHERE user_id = $2`,
      [is_private, storeId]
    );

    // Gizlilik KAPANIYORSA → tüm pending istekleri otomatik accepted yap
    if (is_private === false) {
      const autoAccepted = await client.query(
        `UPDATE follows SET status = 'accepted', responded_at = NOW()
         WHERE following_id = $1 AND status = 'pending'
         RETURNING follower_id`,
        [storeId]
      );
      console.log(`[Privacy] ${autoAccepted.rowCount} bekleyen istek otomatik onaylandı.`);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      is_private,
      message: is_private
        ? 'Hesabınız gizli moda alındı. Yeni takipçiler için onay gerekecek.'
        : 'Hesabınız herkese açık yapıldı. Bekleyen tüm istekler otomatik onaylandı.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[updatePrivacySetting] Error:', error);
    res.status(500).json({ success: false, message: 'Güncelleme başarısız.' });
  } finally {
    client.release();
  }
};

// ============================================================
// Privacy Filter Middleware
// GET /api/posts/:postId gibi endpointlerde kullan
// Viewer'ın bu postu görme hakkı var mı?
// ============================================================
const privacyFilter = async (req, res, next) => {
  const viewerId = req.user?.id || null;
  const { postId } = req.params;

  try {
    const postRes = await pool.query(
      `SELECT p.store_user_id, sp.is_private
       FROM posts p
       JOIN store_profiles sp ON sp.user_id = p.store_user_id
       WHERE p.id = $1 AND p.is_available = true`,
      [postId]
    );

    if (postRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Post bulunamadı.' });
    }

    const { store_user_id, is_private } = postRes.rows[0];

    // Public mağaza — herkes görebilir
    if (!is_private) {
      req.storeUserId = store_user_id;
      return next();
    }

    // Kendi mağazası — görebilir
    if (viewerId === store_user_id) {
      req.storeUserId = store_user_id;
      return next();
    }

    // Private mağaza: onaylı takip var mı?
    if (!viewerId) {
      return res.status(403).json({
        success: false,
        code: 'PRIVATE_STORE',
        message: 'Bu mağaza gizlidir. İçerikleri görmek için takip isteği gönderin.'
      });
    }

    const followCheck = await pool.query(
      `SELECT status FROM follows
       WHERE follower_id = $1 AND following_id = $2`,
      [viewerId, store_user_id]
    );

    const followStatus = followCheck.rows[0]?.status;

    if (followStatus === 'accepted') {
      req.storeUserId = store_user_id;
      return next();
    }

    if (followStatus === 'pending') {
      return res.status(403).json({
        success: false,
        code: 'FOLLOW_PENDING',
        message: 'Takip isteğiniz henüz onaylanmadı.'
      });
    }

    // Takip yok ya da reddedildi
    return res.status(403).json({
      success: false,
      code: 'NOT_FOLLOWING',
      message: 'Bu mağaza gizlidir. İçerikleri görmek için takip isteği gönderin.'
    });

  } catch (error) {
    console.error('[privacyFilter] Error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
};

// ============================================================
// Feed Privacy Filter — SQL seviyesinde filtreleme
// feedController.js içindeki WHERE koşuluna eklenir
// ============================================================
const FEED_PRIVACY_SQL = `
  -- Sadece erişim hakkı olan mağazaların postları
  AND (
    sp.is_private = false                        -- Public mağaza
    OR p.store_user_id = $viewer_id              -- Kendi postu
    OR EXISTS (                                   -- Onaylı takip var
      SELECT 1 FROM follows f
      WHERE f.follower_id  = $viewer_id
        AND f.following_id = p.store_user_id
        AND f.status = 'accepted'
    )
  )
`;
// Kullanım: feedController.js içinde $viewer_id parametresini bind et

// ============================================================
// Bildirim helper (stub — FCM/push notification ile genişlet)
// ============================================================
const createNotification = async (userId, actorId, type) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, is_read, created_at)
       VALUES ($1, $2, $3, false, NOW())
       ON CONFLICT DO NOTHING`,
      [userId, actorId, type]
    );
  } catch (e) {
    // Bildirim tablosu yoksa sessizce geç
    console.warn('[Notification] Table may not exist yet:', e.message);
  }
};

module.exports = {
  followStore,
  unfollowStore,
  getFollowRequests,
  respondToFollowRequest,
  updatePrivacySetting,
  privacyFilter,
  FEED_PRIVACY_SQL,
};


// ============================================================
// backend/src/routes/follows.js — Route tanımları
// ============================================================
/*
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  followStore, unfollowStore,
  getFollowRequests, respondToFollowRequest,
  updatePrivacySetting
} = require('../controllers/followController');

// Müşteri işlemleri
router.post  ('/:storeId',          authenticate, followStore);
router.delete('/:storeId',          authenticate, unfollowStore);

// Mağaza işlemleri (store role zorunlu)
router.get   ('/:storeId/requests', authenticate, getFollowRequests);
router.patch ('/:storeId/requests/:followId', authenticate, respondToFollowRequest);
router.patch ('/:storeId/privacy',  authenticate, updatePrivacySetting);

module.exports = router;
*/


// ============================================================
// backend/src/routes/posts.js — privacyFilter eklentisi
// ============================================================
/*
const { privacyFilter } = require('../controllers/followController');

// Ürün detayı — privacy kontrolü ile
router.get('/:postId',
  optionalAuthenticate,   // JWT varsa kullan, zorunlu değil
  privacyFilter,          // Erişim hakkını kontrol et
  getPostDetail           // Asıl handler
);
*/
