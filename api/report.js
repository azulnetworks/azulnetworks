const { cors, requireAuth } = require("./_auth");
const { getReport, getBalance } = require("./_tiktok");

module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (!requireAuth(req)) return res.status(401).json({ error: "unauthorized" });

  const range = (req.query.range || "7d").toString();
  const advId = req.query.advertiser_id ? req.query.advertiser_id.toString() : undefined;
  try {
    const [report, balance] = await Promise.all([getReport(range, advId), getBalance(advId)]);
    // 7-day average daily spend drives the runway estimate on the balance banner
    const sevenDay = range === "7d" ? report : await getReport("7d", advId);
    const avgDailySpend = sevenDay.totals.spend / 7;

    return res.status(200).json({
      rows: report.rows,
      totals: report.totals,
      series: report.series,
      labels: report.labels,
      balance: { cash: balance.cash, avgDailySpend },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
