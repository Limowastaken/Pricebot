// ================= CONFIG =================
const STATE_KEY = "telegraph_state";
// ==========================================

// Jalali Date Converter
function toJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;

  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;

  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);

  return { jy, jm, jd };
}

function iranDateTime() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;

  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));

  const { jy, jm, jd } = toJalali(year, month, day);

  return {
    dateFa: `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`,
    timeFa: `${get("hour")}:${get("minute")}:${get("second")}`,
  };
}

function persianToEnglish(str) {
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  return str.replace(/[۰-۹]/g, (d) => digits.indexOf(d));
}

function cleanPrice(str) {
  if (!str) return "N/A";
  return Number(
    persianToEnglish(str).replace(/[,،\s]/g, "")
  ).toLocaleString("en-US");
}

async function getPrices() {
  const res = await fetch("https://alanchand.com/", {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "fa-IR,fa;q=0.9",
    },
  });

  if (!res.ok) throw new Error("Failed to fetch prices");
  const html = await res.text();

  const extract = (patterns) => {
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]) return cleanPrice(m[1]);
    }
    return "N/A";
  };

  return {
    usd: extract([/دلار[^۰-۹0-9]*([۰-۹0-9,]+)/i]),
    gold18: extract([/۱۸\s*عیار[^۰-۹0-9]*([۰-۹0-9,]+)/i]),
    gold24: extract([/۲۴\s*عیار[^۰-۹0-9]*([۰-۹0-9,]+)/i]),
  };
}

function buildContent(usd, gold18, gold24) {
  const { dateFa, timeFa } = iranDateTime();

  return [
    { tag: "h3", children: ["📊 قیمت لحظه‌ای بازار ایران"] },
    { tag: "p", children: [{ tag: "b", children: ["💵 دلار: "] }, `${usd} تومان`] },
    { tag: "p", children: [{ tag: "b", children: ["🥇 طلا ۱۸ عیار: "] }, `${gold18} تومان`] },
    { tag: "p", children: [{ tag: "b", children: ["🥇 طلا ۲۴ عیار: "] }, `${gold24} تومان`] },
    {
      tag: "p",
      children: [
        { tag: "b", children: ["🕒 زمان بروزرسانی: "] },
        `${dateFa} — ${timeFa} (به وقت ایران 🇮🇷)`,
      ],
    },
  ];
}

async function createPage(content, token) {
  const r = await fetch("https://api.telegra.ph/createPage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: token,
      title: "قیمت دلار و طلا | بروزرسانی خودکار",
      author_name: "Auto Price Bot",
      content,
    }),
  });

  const d = await r.json();
  if (!d.ok) throw new Error("Telegraph create failed");
  return d.result;
}

async function editPage(path, content, token) {
  const r = await fetch("https://api.telegra.ph/editPage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: token,
      path,
      title: "قیمت دلار و طلا | بروزرسانی خودکار",
      content,
    }),
  });

  const d = await r.json();
  if (!d.ok) throw new Error("Telegraph edit failed");
  return d.result;
}

async function loadState(env) {
  return env.PRICE_STATE.get(STATE_KEY, { type: "json" });
}

async function saveState(env, path, url) {
  await env.PRICE_STATE.put(STATE_KEY, JSON.stringify({ path, url }));
}

async function handleUpdate(env) {
  const prices = await getPrices();
  const content = buildContent(prices.usd, prices.gold18, prices.gold24);
  const state = await loadState(env);

  if (!state) {
    const { path, url } = await createPage(content, env.TELEGRAPH_TOKEN);
    await saveState(env, path, url);
    return { action: "created", url };
  }

  await editPage(state.path, content, env.TELEGRAPH_TOKEN);
  return { action: "updated", url: state.url };
}

export default {
  async scheduled(_, env, ctx) {
    ctx.waitUntil(handleUpdate(env));
  },

  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true });
    }

    const result = await handleUpdate(env);
    return Response.json(result);
  },
};
