const { cors, requireAuth } = require("./_auth");
const { getAccounts } = require("./_tiktok");

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });

  const bcId = (req.query.bc_id || "").toString();
  if (!bcId) return res.status(400).json({ error: "bc_id required" });
  try {
    return res.status(200).json({ accounts: await getAccounts(bcId) });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
