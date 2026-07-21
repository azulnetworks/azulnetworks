// Shared TikTok Marketing API helpers (server-side only).
// The access token and advertiser id live in Vercel env vars — never in the browser.

const BASE = "https://business-api.tiktok.com/open_api/v1.3";
const TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
const ADV = process.env.TIKTOK_ADVERTISER_ID;

// TikTok returns HTTP 200 even on errors; the real status is in body.code (0 = OK).
async function call(path, params) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  const res = await fetch(`${BASE}${path}${qs}`, { headers: { "Access-Token": TOKEN } });
  const json = await res.json();
  if (json.code !== 0) throw new Error(`TikTok ${json.code}: ${json.message}`);
  return json.data;
}

// Map a UI range to TikTok report date params.
// Note: TikTok BASIC reports are daily-grained — a true 1-hour view isn't available,
// so "1h" falls back to today's data.
function rangeParams(range) {
  const fmt = d => d.toISOString().slice(0, 10);
  const today = new Date();
  const start = new Date();
  if (range === "all") return { query_lifetime: "true" };
  if (range === "30d") start.setDate(today.getDate() - 29);
  else if (range === "7d") start.setDate(today.getDate() - 6);
  else start.setDate(today.getDate()); // 1h + 1d => today
  return { start_date: fmt(start), end_date: fmt(today) };
}

const METRICS = ["campaign_name","spend","impressions","clicks","conversion","ctr","cpc","cpm","cost_per_conversion"];

// Per-campaign performance for the given range and (optionally) a specific ad account.
async function getReport(range, advertiserId = ADV) {
  const data = await call("/report/integrated/get/", {
    advertiser_id: advertiserId,
    report_type: "BASIC",
    data_level: "AUCTION_CAMPAIGN",
    dimensions: JSON.stringify(["campaign_id"]),
    metrics: JSON.stringify(METRICS),
    page_size: "100",
    ...rangeParams(range),
  });

  const rows = (data.list || []).map(item => {
    const m = item.metrics || {};
    const impr = +m.impressions || 0, clicks = +m.clicks || 0, spend = +m.spend || 0, conv = +m.conversion || 0;
    return {
      name: m.campaign_name || item.dimensions.campaign_id,
      status: "live",
      impr, clicks, spend, conv,
      ctr: +m.ctr || (impr ? clicks / impr * 100 : 0),
      cpc: +m.cpc || (clicks ? spend / clicks : 0),
      cpm: +m.cpm || (impr ? spend / impr * 1000 : 0),
      costConv: +m.cost_per_conversion || (conv ? spend / conv : 0),
    };
  });

  const t = rows.reduce((a, c) => ({ impr: a.impr + c.impr, clicks: a.clicks + c.clicks, spend: a.spend + c.spend, conv: a.conv + c.conv }), { impr: 0, clicks: 0, spend: 0, conv: 0 });
  t.cpc = t.clicks ? t.spend / t.clicks : 0;
  t.cpm = t.impr ? t.spend / t.impr * 1000 : 0;
  t.ctr = t.impr ? t.clicks / t.impr * 100 : 0;
  t.costConv = t.conv ? t.spend / t.conv : 0;

  // daily spend series for the chart
  let series = [], labels = [];
  try {
    const sd = await call("/report/integrated/get/", {
      advertiser_id: advertiserId, report_type: "BASIC", data_level: "AUCTION_ADVERTISER",
      dimensions: JSON.stringify(["stat_time_day"]),
      metrics: JSON.stringify(["spend"]), page_size: "100",
      ...rangeParams(range === "all" ? "30d" : range),
    });
    const list = (sd.list || []).sort((a, b) => (a.dimensions.stat_time_day > b.dimensions.stat_time_day ? 1 : -1));
    series = list.map(x => +(+x.metrics.spend).toFixed(2));
    labels = list.map(x => x.dimensions.stat_time_day.slice(5)); // MM-DD
  } catch (_) {}
  if (!series.length) { series = [t.spend]; labels = ["Total"]; }

  return { rows, totals: t, series, labels };
}

// List the Business Centers this token can access, each with its ad-account count and total balance.
async function getBusinessCenters() {
  const data = await call("/bc/get/", { page: "1", page_size: "50" });
  const list = data.list || [];
  const bcs = await Promise.all(list.map(async (item) => {
    const info = item.bc_info || item;
    const bcId = info.bc_id;
    let accountCount = 0, balance = 0;
    try {
      const bal = await call("/bc/advertiser/balance/get/", { bc_id: bcId, page: "1", page_size: "100" });
      const accts = bal.list || [];
      accountCount = accts.length;
      balance = accts.reduce((s, a) => s + (Number(a.balance ?? a.cash_balance ?? 0)), 0);
    } catch (_) {}
    return { id: bcId, name: info.name || info.bc_name || bcId, accountCount, balance };
  }));
  return bcs;
}

// List the ad accounts under one Business Center, merged with their balance and 7-day spend.
async function getAccounts(bcId) {
  const [accData, balData] = await Promise.all([
    call("/bc/advertiser/get/", { bc_id: bcId, page: "1", page_size: "100" }),
    call("/bc/advertiser/balance/get/", { bc_id: bcId, page: "1", page_size: "100" }).catch(() => ({ list: [] })),
  ]);
  const balById = {};
  (balData.list || []).forEach(b => { balById[b.advertiser_id] = Number(b.balance ?? b.cash_balance ?? 0); });

  return Promise.all((accData.list || []).map(async (a) => {
    const id = a.advertiser_id;
    let spend7d = 0, conv7d = 0;
    try {
      const r = await getReport("7d", id);
      spend7d = r.totals.spend; conv7d = r.totals.conv;
    } catch (_) {}
    return {
      id,
      name: a.advertiser_name || a.name || id,
      status: (a.status || "").toUpperCase().includes("DISABLE") ? "pause" : "live",
      balance: balById[id] ?? 0,
      spend7d, conv7d,
    };
  }));
}

// Cash balance for the advertiser account (read-only; top-up is not available via API).
async function getBalance(advertiserId = ADV) {
  try {
    const d = await call("/advertiser/balance/get/", { advertiser_id: advertiserId });
    return {
      cash: Number(d.cash_balance ?? d.balance ?? 0),
      credit: Number(d.grant_balance ?? 0),
      currency: d.currency ?? "USD",
    };
  } catch (_) {
    return { cash: 0, credit: 0, currency: "USD" };
  }
}

module.exports = { getReport, getBalance, getBusinessCenters, getAccounts };
