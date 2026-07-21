const { cors, requireAuth } = require("./_auth");
const { setStatus } = require("./_tiktok");

// POST /api/campaign-status
// body: { level: "campaign"|"adgroup"|"ad", ids: string|string[], enable: bool, advertiser_id? }
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { level, ids, enable, advertiser_id } = req.body || {};
  if (!level || ids == null) return res.status(400).json({ error: "level and ids required" });
  try {
    const data = await setStatus({ level, ids, enable: !!enable, advertiserId: advertiser_id });
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
