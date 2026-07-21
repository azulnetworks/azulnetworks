// Minimal signed-token session (no dependencies). Not a full JWT — enough for a solo tool.
const crypto = require("crypto");
const SECRET = process.env.AUTH_SECRET || "change-me";
const TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function sign(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + TTL_MS })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}

// CORS so the GitHub Pages front-end can call this Vercel backend.
function cors(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.status(204).end(); return true; }
  return false;
}

function requireAuth(req) {
  const h = req.headers.authorization || "";
  return verify(h.replace(/^Bearer\s+/i, ""));
}

module.exports = { sign, verify, cors, requireAuth };
