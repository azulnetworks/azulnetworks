const { cors, requireAuth } = require("./_auth");
const { getCampaigns } = require("./_tiktok");

// GET /api/campaigns?advertiser_id=...
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });

  const advertiserId = (req.query.advertiser_id || "").toString();
  if (!advertiserId) return res.status(400).json({ error: "advertiser_id required" });
  try {
    return res.status(200).json({ campaigns: await getCampaigns(advertiserId) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
