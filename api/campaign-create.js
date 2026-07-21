const { cors, requireAuth } = require("./_auth");
const { createCampaign } = require("./_tiktok");

// POST /api/campaign-create
// body: { advertiser_id, name, objective, budgetMode, budget, cbo }
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const b = req.body || {};
  if (!b.name || !b.objective) return res.status(400).json({ error: "name and objective required" });
  try {
    const data = await createCampaign({
      advertiserId: b.advertiser_id,
      name: b.name,
      objective: b.objective,
      budgetMode: b.budgetMode,
      budget: b.budget,
      cbo: !!b.cbo,
    });
    return res.status(200).json({ ok: true, ...data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
