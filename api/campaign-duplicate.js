const { cors, requireAuth } = require("./_auth");
const { duplicateCampaign } = require("./_tiktok");

// POST /api/campaign-duplicate
// body: { advertiser_id, campaign_id }
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { advertiser_id, campaign_id } = req.body || {};
  if (!campaign_id) return res.status(400).json({ error: "campaign_id required" });
  try {
    const data = await duplicateCampaign({ advertiserId: advertiser_id, campaignId: campaign_id });
    return res.status(200).json({ ok: true, ...data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
