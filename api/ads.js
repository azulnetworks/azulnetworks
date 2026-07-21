const { cors, requireAuth } = require("./_auth");
const { getAds } = require("./_tiktok");

// GET /api/ads?advertiser_id=...&adgroup_id=...
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });

  const advertiserId = (req.query.advertiser_id || "").toString();
  const adgroupId = (req.query.adgroup_id || "").toString();
  if (!advertiserId || !adgroupId) return res.status(400).json({ error: "advertiser_id and adgroup_id required" });
  try {
    return res.status(200).json({ ads: await getAds(advertiserId, adgroupId) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
