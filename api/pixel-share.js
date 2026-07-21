const { cors, requireAuth } = require("./_auth");
const { sharePixel } = require("./_tiktok");

// POST /api/pixel-share
// body: { bc_id, pixel_id, advertiser_ids: string|string[] }
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { bc_id, pixel_id, advertiser_ids } = req.body || {};
  if (!bc_id || !pixel_id || !advertiser_ids) return res.status(400).json({ error: "bc_id, pixel_id, advertiser_ids required" });
  try {
    const data = await sharePixel({ bcId: bc_id, pixelId: pixel_id, advertiserIds: advertiser_ids });
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
