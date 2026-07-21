const { cors, requireAuth } = require("./_auth");
const { getBusinessCenters } = require("./_tiktok");

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });
  try {
    return res.status(200).json({ businessCenters: await getBusinessCenters() });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
