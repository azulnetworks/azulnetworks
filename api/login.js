const { sign, cors } = require("./_auth");

// Set DASHBOARD_EMAIL and DASHBOARD_PASSWORD in Vercel env vars.
module.exports = async (req, res) => {
  if (cors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { email, password } = req.body || {};
  const okEmail = (email || "").toLowerCase() === (process.env.DASHBOARD_EMAIL || "").toLowerCase();
  const okPass = password === process.env.DASHBOARD_PASSWORD;

  if (!okEmail || !okPass) return res.status(401).json({ error: "invalid credentials" });
  return res.status(200).json({ token: sign({ email }) });
};
