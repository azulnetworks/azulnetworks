const { cors, requireAuth } = require("./_auth");
const { getAdgroups } = require("./_tiktok");

// GET /api/adgroups?advertiser_id=...&campaign_id=...
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });

  const advertiserId = (req.query.advertiser_id || "").toString();
  const campaignId = (req.query.campaign_id || "").toString();
  if (!advertiserId || !campaignId) return res.status(400).json({ error: "advertiser_id and campaign_id required" });
  try {
    return res.status(200).json({ adgroups: await getAdgroups(advertiserId, campaignId) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
