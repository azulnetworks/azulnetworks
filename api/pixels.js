const { cors, requireAuth } = require("./_auth");
const { getPixels } = require("./_tiktok");

// GET /api/pixels?advertiser_id=...
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });

  const advertiserId = (req.query.advertiser_id || "").toString();
  if (!advertiserId) return res.status(400).json({ error: "advertiser_id required" });
  try {
    return res.status(200).json({ pixels: await getPixels(advertiserId) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
