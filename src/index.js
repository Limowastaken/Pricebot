// ================= CONFIG =================
const CONFIG = {
  STATE_KEY: "telegraph_state",
  PRICES_CACHE_KEY: "prices_cache",
  HISTORY_KEY: "price_history",
  CACHE_TTL_SECONDS: 60,
  FETCH_TIMEOUT_MS: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  HISTORY_DAYS: 7,
};

// Price items configuration
const PRICE_ITEMS = {
  usd: { key: "price_dollar_rl", label: "دلار آمریکا", emoji: "💵", category: "currency" },
  eur: { key: "price_eur", label: "یورو", emoji: "💶", category: "currency" },
  gbp: { key: "price_gbp", label: "پوند انگلیس", emoji: "💷", category: "currency" },
  aed: { key: "price_aed", label: "درهم امارات", emoji: "🇦🇪", category: "currency" },
  try: { key: "price_try", label: "لیر ترکیه", emoji: "🇹🇷", category: "currency" },
  cny: { key: "price_cny", label: "یوان چین", emoji: "🇨🇳", category: "currency" },
  gold18: { key: "geram18", label: "طلا ۱۸ عیار", emoji: "🥇", category: "gold", unit: "گرم" },
  gold24: { key: "geram24", label: "طلا ۲۴ عیار", emoji: "🏆", category: "gold", unit: "گرم" },
  goldMesghal: { key: "mesghal", label: "مثقال طلا", emoji: "⚖️", category: "gold" },
  goldOunce: { key: "ounce", label: "اونس جهانی", emoji: "🌍", category: "gold", unit: "دلار" },
  coin: { key: "sekee", label: "سکه امامی", emoji: "🪙", category: "coin" },
  halfCoin: { key: "nim", label: "نیم سکه", emoji: "🪙", category: "coin" },
  quarterCoin: { key: "rob", label: "ربع سکه", emoji: "🪙", category: "coin" },
  coinGerami: { key: "gerami", label: "سکه گرمی", emoji: "🪙", category: "coin" },
};

const CATEGORIES = {
  currency: { label: "💱 ارز", order: 1 },
  gold: { label: "🥇 طلا", order: 2 },
  coin: { label: "🪙 سکه", order: 3 },
};

// ================= UTILITIES =================

function formatNumber(num, locale = "fa-IR") {
  if (!num) return "—";
  const cleaned = String(num).replace(/,/g, "");
  const number = parseFloat(cleaned);
  if (isNaN(number)) return "—";
  return number.toLocaleString(locale);
}

function formatNumberEn(num) {
  return formatNumber(num, "en-US");
}

function getPriceChange(current, previous) {
  if (!current || !previous) return { direction: "neutral", percent: 0 };
  const curr = parseFloat(String(current).replace(/,/g, ""));
  const prev = parseFloat(String(previous).replace(/,/g, ""));
  if (isNaN(curr) || isNaN(prev) || prev === 0) return { direction: "neutral", percent: 0 };
  
  const percent = ((curr - prev) / prev) * 100;
  let direction = "neutral";
  if (curr > prev) direction = "up";
  if (curr < prev) direction = "down";
  
  return { direction, percent: Math.abs(percent).toFixed(2) };
}

function getChangeEmoji(direction) {
  const emojis = { up: "📈", down: "📉", neutral: "➖" };
  return emojis[direction] || "";
}

async function fetchWithRetry(url, options = {}, retries = CONFIG.MAX_RETRIES) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok && retries > 0) throw new Error(`HTTP ${response.status}`);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`⚠️ Retry ${CONFIG.MAX_RETRIES - retries + 1}/${CONFIG.MAX_RETRIES}`);
      await new Promise((r) => setTimeout(r, CONFIG.RETRY_DELAY_MS));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkRateLimit(env, ip) {
  const key = `ratelimit:${ip}`;
  const count = parseInt((await env.PRICE_STATE.get(key)) || "0", 10);
  if (count >= 30) return false;
  await env.PRICE_STATE.put(key, String(count + 1), { expirationTtl: 60 });
  return true;
}

// ================= JALALI DATE =================

function toJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
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

const JALALI_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

function iranDateTime() {
  const now = new Date();
  const iranFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });

  const parts = iranFormatter.formatToParts(now);
  const getPart = (type) => parts.find((p) => p.type === type)?.value;

  const year = parseInt(getPart("year"));
  const month = parseInt(getPart("month"));
  const day = parseInt(getPart("day"));
  const hour = getPart("hour");
  const minute = getPart("minute");
  const second = getPart("second");

  const jalali = toJalali(year, month, day);
  const dayOfWeek = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tehran" })).getDay();

  return {
    dateFa: `${WEEKDAYS[dayOfWeek]}، ${jalali.jd} ${JALALI_MONTHS[jalali.jm - 1]} ${jalali.jy}`,
    dateShort: `${jalali.jy}/${String(jalali.jm).padStart(2, "0")}/${String(jalali.jd).padStart(2, "0")}`,
    timeFa: `${hour}:${minute}:${second}`,
    timestamp: now.getTime(),
  };
}

// ================= PRICE FETCHING =================

async function getPrices(env) {
  const cached = await env.PRICE_STATE.get(CONFIG.PRICES_CACHE_KEY, { type: "json" });
  if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL_SECONDS * 1000) {
    return { prices: cached.prices, fromCache: true, timestamp: cached.timestamp };
  }

  const response = await fetchWithRetry("https://call.tgju.org/ajax.json", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
  });

  const data = await response.json();
  if (!data?.current) throw new Error("Invalid API response");

  const prices = {};
  const timestamp = Date.now();

  for (const [key, config] of Object.entries(PRICE_ITEMS)) {
    const item = data.current[config.key];
    if (item) {
      prices[key] = {
        price: item.p,
        change: item.d,
        changePercent: item.dp,
        high: item.h,
        low: item.l,
        time: item.t,
      };
    }
  }

  await env.PRICE_STATE.put(
    CONFIG.PRICES_CACHE_KEY,
    JSON.stringify({ prices, timestamp }),
    { expirationTtl: CONFIG.CACHE_TTL_SECONDS * 2 }
  );

  // Save to history
  await saveToHistory(env, prices, timestamp);

  return { prices, fromCache: false, timestamp };
}

async function saveToHistory(env, prices, timestamp) {
  try {
    let history = await env.PRICE_STATE.get(CONFIG.HISTORY_KEY, { type: "json" }) || [];
    
    // Add new entry
    history.push({
      timestamp,
      prices: Object.fromEntries(
        Object.entries(prices).map(([k, v]) => [k, v.price])
      ),
    });

    // Keep only last 7 days (assuming ~4 updates per day = 28 entries)
    const maxEntries = CONFIG.HISTORY_DAYS * 4;
    if (history.length > maxEntries) {
      history = history.slice(-maxEntries);
    }

    await env.PRICE_STATE.put(CONFIG.HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save history:", e.message);
  }
}

async function getHistory(env) {
  try {
    return await env.PRICE_STATE.get(CONFIG.HISTORY_KEY, { type: "json" }) || [];
  } catch {
    return [];
  }
}

// ================= TELEGRAPH CONTENT =================

function buildTelegraphContent(prices, previousPrices = null) {
  const { dateFa, timeFa } = iranDateTime();
  const content = [
    { tag: "h3", children: ["📊 قیمت لحظه‌ای بازار ایران"] },
    { tag: "p", children: [{ tag: "i", children: [`🗓 ${dateFa}`] }] },
    { tag: "hr" },
  ];

  // Group by category
  for (const [catKey, catConfig] of Object.entries(CATEGORIES).sort((a, b) => a[1].order - b[1].order)) {
    content.push({ tag: "h4", children: [catConfig.label] });

    for (const [key, config] of Object.entries(PRICE_ITEMS)) {
      if (config.category !== catKey || !prices[key]) continue;

      const priceData = prices[key];
      const change = previousPrices?.[key]
        ? getPriceChange(priceData.price, previousPrices[key].price)
        : { direction: "neutral" };

      const unit = config.unit || "تومان";
      const changeEmoji = getChangeEmoji(change.direction);

      content.push({
        tag: "p",
        children: [
          { tag: "b", children: [`${config.emoji} ${config.label}: `] },
          `${formatNumber(priceData.price)} ${unit} ${changeEmoji}`,
        ],
      });
    }
  }

  content.push(
    { tag: "hr" },
    { tag: "p", children: [{ tag: "b", children: ["🕒 بروزرسانی: "] }, timeFa] },
    { tag: "p", children: [{ tag: "i", children: ["بروزرسانی خودکار هر ۶ ساعت"] }] },
    { tag: "p", children: [{ tag: "a", attrs: { href: "https://your-worker.workers.dev" }, children: ["📱 مشاهده داشبورد"] }] }
  );

  return content;
}

// ================= TELEGRAPH API =================

async function createPage(content, token) {
  const response = await fetchWithRetry("https://api.telegra.ph/createPage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: token,
      title: "قیمت دلار، درهم و طلا",
      author_name: "Limo Price Bot",
      content,
      return_content: true,
    }),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`Telegraph error: ${JSON.stringify(data)}`);
  return { path: data.result.path, url: data.result.url };
}

async function editPage(path, content, token) {
  const response = await fetchWithRetry("https://api.telegra.ph/editPage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: token,
      path,
      title: "قیمت دلار، درهم و طلا",
      content,
      return_content: true,
    }),
  });
  const data = await response.json();
  if (!data.ok) throw new Error(`Telegraph error: ${JSON.stringify(data)}`);
  return data.result;
}

// ================= STATE MANAGEMENT =================

async function loadState(env) {
  try {
    return await env.PRICE_STATE.get(CONFIG.STATE_KEY, { type: "json" });
  } catch {
    return null;
  }
}

async function saveState(env, path, url, prices) {
  await env.PRICE_STATE.put(CONFIG.STATE_KEY, JSON.stringify({
    path, url, lastPrices: prices, lastUpdate: new Date().toISOString(),
  }));
}

// ================= MAIN HANDLER =================

async function handleUpdate(env, source = "unknown") {
  const startTime = Date.now();
  const token = env.TELEGRAPH_TOKEN;
  if (!token) throw new Error("TELEGRAPH_TOKEN not configured");

  const { prices, fromCache } = await getPrices(env);
  const state = await loadState(env);
  const content = buildTelegraphContent(prices, state?.lastPrices);

  let result;
  if (!state?.path) {
    const { path, url } = await createPage(content, token);
    await saveState(env, path, url, prices);
    result = { action: "created", url };
  } else {
    await editPage(state.path, content, token);
    await saveState(env, state.path, state.url, prices);
    result = { action: "updated", url: state.url };
  }

  return { ...result, source, duration: `${Date.now() - startTime}ms`, fromCache };
}

// ================= PWA DASHBOARD =================

function generateDashboardHTML(prices, history, dateTime) {
  const priceCards = Object.entries(CATEGORIES)
    .sort((a, b) => a[1].order - b[1].order)
    .map(([catKey, catConfig]) => {
      const items = Object.entries(PRICE_ITEMS)
        .filter(([_, c]) => c.category === catKey && prices[_])
        .map(([key, config]) => {
          const p = prices[key];
          const changeClass = parseFloat(String(p.changePercent || 0)) >= 0 ? "up" : "down";
          const unit = config.unit || "تومان";
          return `
            <div class="price-item">
              <div class="price-header">
                <span class="price-emoji">${config.emoji}</span>
                <span class="price-label">${config.label}</span>
              </div>
              <div class="price-value">${formatNumber(p.price)}</div>
              <div class="price-unit">${unit}</div>
              <div class="price-change ${changeClass}">
                ${changeClass === "up" ? "▲" : "▼"} ${p.changePercent || "0"}%
              </div>
              <div class="price-range">
                <span>L: ${formatNumber(p.low)}</span>
                <span>H: ${formatNumber(p.high)}</span>
              </div>
            </div>
          `;
        }).join("");

      return `
        <div class="category">
          <h2 class="category-title">${catConfig.label}</h2>
          <div class="price-grid">${items}</div>
        </div>
      `;
    }).join("");

  // Prepare chart data
  const chartLabels = history.slice(-24).map(h => {
    const d = new Date(h.timestamp);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  
  const usdData = history.slice(-24).map(h => 
    parseInt(String(h.prices?.usd || 0).replace(/,/g, ""))
  );
  
  const aedData = history.slice(-24).map(h => 
    parseInt(String(h.prices?.aed || 0).replace(/,/g, ""))
  );

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#1a1a2e">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="description" content="قیمت لحظه‌ای دلار، درهم، یورو و طلا">
  
  <title>💰 قیمت ارز و طلا</title>
  
  <link rel="manifest" href="/manifest.json">
  <link rel="apple-touch-icon" href="/icon-192.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --bg-primary: #0f0f1a;
      --bg-secondary: #1a1a2e;
      --bg-card: #16213e;
      --accent: #e94560;
      --accent-2: #0f3460;
      --text-primary: #ffffff;
      --text-secondary: #a0a0a0;
      --up-color: #00d26a;
      --down-color: #ff6b6b;
      --gold-color: #ffd700;
      --shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Vazirmatn', sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      padding-bottom: 80px;
    }

    .header {
      background: linear-gradient(135deg, var(--bg-secondary), var(--accent-2));
      padding: 20px;
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: var(--shadow);
    }

    .header h1 {
      font-size: 1.5rem;
      margin-bottom: 8px;
    }

    .header .date {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .header .time {
      font-size: 1.1rem;
      color: var(--accent);
      font-weight: bold;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px;
    }

    .quick-prices {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 16px 0;
      scrollbar-width: none;
    }

    .quick-prices::-webkit-scrollbar {
      display: none;
    }

    .quick-price {
      flex-shrink: 0;
      background: var(--bg-card);
      border-radius: 16px;
      padding: 16px 20px;
      min-width: 140px;
      text-align: center;
      box-shadow: var(--shadow);
    }

    .quick-price .emoji {
      font-size: 2rem;
      margin-bottom: 8px;
    }

    .quick-price .label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .quick-price .value {
      font-size: 1.1rem;
      font-weight: bold;
    }

    .quick-price .change {
      font-size: 0.8rem;
      margin-top: 4px;
    }

    .quick-price .change.up { color: var(--up-color); }
    .quick-price .change.down { color: var(--down-color); }

    .category {
      margin-bottom: 24px;
    }

    .category-title {
      font-size: 1.2rem;
      padding: 12px 0;
      border-bottom: 2px solid var(--accent);
      margin-bottom: 16px;
    }

    .price-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }

    .price-item {
      background: var(--bg-card);
      border-radius: 16px;
      padding: 16px;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: var(--shadow);
    }

    .price-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(233, 69, 96, 0.2);
    }

    .price-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .price-emoji {
      font-size: 1.5rem;
    }

    .price-label {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .price-value {
      font-size: 1.3rem;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .price-unit {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .price-change {
      font-size: 0.85rem;
      margin-top: 8px;
      padding: 4px 8px;
      border-radius: 8px;
      display: inline-block;
    }

    .price-change.up {
      background: rgba(0, 210, 106, 0.2);
      color: var(--up-color);
    }

    .price-change.down {
      background: rgba(255, 107, 107, 0.2);
      color: var(--down-color);
    }

    .price-range {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 0.7rem;
      color: var(--text-secondary);
    }

    .chart-container {
      background: var(--bg-card);
      border-radius: 16px;
      padding: 16px;
      margin: 24px 0;
      box-shadow: var(--shadow);
    }

    .chart-title {
      font-size: 1rem;
      margin-bottom: 12px;
      text-align: center;
    }

    #priceChart {
      width: 100%;
      height: 200px;
    }

    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-secondary);
      padding: 12px 20px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    }

    .footer-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-family: inherit;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      transition: color 0.2s;
    }

    .footer-btn:hover, .footer-btn.active {
      color: var(--accent);
    }

    .footer-btn .icon {
      font-size: 1.5rem;
    }

    .refresh-indicator {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-card);
      padding: 20px 40px;
      border-radius: 16px;
      display: none;
      z-index: 1000;
      box-shadow: var(--shadow);
    }

    .refresh-indicator.show {
      display: block;
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--accent-2);
      border-top: 4px solid var(--accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .toast {
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--accent);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 0.9rem;
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 1000;
    }

    .toast.show {
      opacity: 1;
    }

    .install-prompt {
      position: fixed;
      bottom: 80px;
      left: 16px;
      right: 16px;
      background: var(--bg-card);
      padding: 16px;
      border-radius: 16px;
      display: none;
      box-shadow: var(--shadow);
      z-index: 999;
    }

    .install-prompt.show {
      display: block;
      animation: slideUp 0.3s;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .install-prompt h3 {
      margin-bottom: 8px;
    }

    .install-prompt p {
      font-size: 0.9rem;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }

    .install-prompt .buttons {
      display: flex;
      gap: 12px;
    }

    .install-prompt button {
      flex: 1;
      padding: 12px;
      border: none;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .install-prompt .install-btn {
      background: var(--accent);
      color: white;
    }

    .install-prompt .dismiss-btn {
      background: var(--accent-2);
      color: var(--text-secondary);
    }

    @media (max-width: 480px) {
      .price-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .header h1 {
        font-size: 1.2rem;
      }

      .price-value {
        font-size: 1.1rem;
      }
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>💰 قیمت لحظه‌ای ارز و طلا</h1>
    <div class="date">${dateTime.dateFa}</div>
    <div class="time" id="clock">${dateTime.timeFa}</div>
  </header>

  <main class="container">
    <!-- Quick Prices -->
    <div class="quick-prices">
      ${["usd", "aed", "eur", "gold18", "coin"].map(key => {
        const p = prices[key];
        const config = PRICE_ITEMS[key];
        if (!p) return "";
        const changeClass = parseFloat(String(p.changePercent || 0)) >= 0 ? "up" : "down";
        return `
          <div class="quick-price">
            <div class="emoji">${config.emoji}</div>
            <div class="label">${config.label}</div>
            <div class="value">${formatNumber(p.price)}</div>
            <div class="change ${changeClass}">
              ${changeClass === "up" ? "▲" : "▼"} ${p.changePercent || "0"}%
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <!-- Chart -->
    <div class="chart-container">
      <h3 class="chart-title">📈 نمودار دلار و درهم (۲۴ ساعت اخیر)</h3>
      <canvas id="priceChart"></canvas>
    </div>

    <!-- Price Categories -->
    ${priceCards}
  </main>

  <div class="refresh-indicator" id="refreshIndicator">
    <div class="spinner"></div>
    <div>در حال بروزرسانی...</div>
  </div>

  <div class="toast" id="toast"></div>

  <div class="install-prompt" id="installPrompt">
    <h3>📱 نصب اپلیکیشن</h3>
    <p>برای دسترسی سریع‌تر، اپلیکیشن را روی گوشی خود نصب کنید.</p>
    <div class="buttons">
      <button class="install-btn" onclick="installApp()">نصب</button>
      <button class="dismiss-btn" onclick="dismissInstall()">بعداً</button>
    </div>
  </div>

  <footer class="footer">
    <button class="footer-btn active" onclick="scrollToTop()">
      <span class="icon">🏠</span>
      <span>خانه</span>
    </button>
    <button class="footer-btn" onclick="refreshPrices()">
      <span class="icon">🔄</span>
      <span>بروزرسانی</span>
    </button>
    <button class="footer-btn" onclick="sharePrices()">
      <span class="icon">📤</span>
      <span>اشتراک</span>
    </button>
    <button class="footer-btn" onclick="openTelegraph()">
      <span class="icon">📰</span>
      <span>تلگراف</span>
    </button>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    // Data from server
    const chartLabels = ${JSON.stringify(chartLabels)};
    const usdData = ${JSON.stringify(usdData)};
    const aedData = ${JSON.stringify(aedData)};

    // Initialize Chart
    const ctx = document.getElementById('priceChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: 'دلار',
            data: usdData,
            borderColor: '#e94560',
            backgroundColor: 'rgba(233, 69, 96, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'درهم',
            data: aedData,
            borderColor: '#00d26a',
            backgroundColor: 'rgba(0, 210, 106, 0.1)',
            fill: true,
            tension: 0.4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#fff', font: { family: 'Vazirmatn' } }
          }
        },
        scales: {
          x: {
            ticks: { color: '#a0a0a0' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          },
          y: {
            ticks: { color: '#a0a0a0' },
            grid: { color: 'rgba(255,255,255,0.1)' }
          }
        }
      }
    });

    // Live Clock
    function updateClock() {
      const now = new Date();
      const time = now.toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran' });
      document.getElementById('clock').textContent = time;
    }
    setInterval(updateClock, 1000);

    // Refresh Prices
    async function refreshPrices() {
      const indicator = document.getElementById('refreshIndicator');
      indicator.classList.add('show');
      
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        if (data.success) {
          showToast('✅ قیمت‌ها بروزرسانی شد');
          setTimeout(() => location.reload(), 1000);
        }
      } catch (e) {
        showToast('❌ خطا در بروزرسانی');
      } finally {
        indicator.classList.remove('show');
      }
    }

    // Toast
    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Share
    async function sharePrices() {
      const text = \`💰 قیمت لحظه‌ای ارز و طلا

💵 دلار: ${formatNumber(prices.usd?.price)} تومان
🇦🇪 درهم: ${formatNumber(prices.aed?.price)} تومان
🥇 طلا ۱۸: ${formatNumber(prices.gold18?.price)} تومان

🔗 ${typeof location !== 'undefined' ? location.href : ''}\`;

      if (navigator.share) {
        try {
          await navigator.share({ title: 'قیمت ارز و طلا', text });
        } catch {}
      } else {
        await navigator.clipboard.writeText(text);
        showToast('📋 کپی شد');
      }
    }

    // Telegraph
    function openTelegraph() {
      window.open('${(await loadState(env))?.url || "#"}', '_blank');
    }

    // Scroll to top
    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // PWA Install
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (!localStorage.getItem('installDismissed')) {
        setTimeout(() => {
          document.getElementById('installPrompt').classList.add('show');
        }, 3000);
      }
    });

    async function installApp() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('✅ نصب شد');
        }
        deferredPrompt = null;
      }
      document.getElementById('installPrompt').classList.remove('show');
    }

    function dismissInstall() {
      document.getElementById('installPrompt').classList.remove('show');
      localStorage.setItem('installDismissed', 'true');
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registered'))
        .catch(err => console.error('SW failed:', err));
    }

    // Auto-refresh every 5 minutes
    setInterval(refreshPrices, 5 * 60 * 1000);

    // Pull to refresh
    let startY = 0;
    document.addEventListener('touchstart', (e) => {
      startY = e.touches[0].pageY;
    });

    document.addEventListener('touchmove', (e) => {
      if (window.scrollY === 0 && e.touches[0].pageY > startY + 100) {
        refreshPrices();
      }
    });
  </script>
</body>
</html>`;
}

// ================= STATIC ASSETS =================

const MANIFEST = {
  name: "قیمت ارز و طلا",
  short_name: "قیمت‌ها",
  description: "قیمت لحظه‌ای دلار، درهم، یورو و طلا",
  start_url: "/",
  display: "standalone",
  background_color: "#0f0f1a",
  theme_color: "#1a1a2e",
  orientation: "portrait",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
  ]
};

const SERVICE_WORKER = `
const CACHE_NAME = 'limo-price-v1';
const ASSETS = ['/', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(
      caches.match(e.request).then((r) => r || fetch(e.request))
    );
  }
});
`;

// SVG Icon (simple placeholder - replace with your own)
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1a1a2e"/>
  <text x="256" y="300" font-size="200" text-anchor="middle" fill="#e94560">💰</text>
</svg>`;

// ================= EXPORTS =================

export default {
  async scheduled(event, env, ctx) {
    console.log(`⏰ Cron: ${event.cron} at ${new Date().toISOString()}`);
    ctx.waitUntil(
      handleUpdate(env, `cron:${event.cron}`)
        .then((r) => console.log("✅", r))
        .catch((e) => console.error("❌", e.message))
    );
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    };

    // Static Assets
    if (path === "/manifest.json") {
      return new Response(JSON.stringify(MANIFEST), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (path === "/sw.js") {
      return new Response(SERVICE_WORKER, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    if (path === "/icon-192.png" || path === "/icon-512.png") {
      // Return a simple SVG as PNG placeholder
      return new Response(ICON_SVG, {
        headers: { "Content-Type": "image/svg+xml" },
      });
    }

    // API Endpoints
    if (path === "/api/prices" || path === "/prices") {
      try {
        const { prices, fromCache, timestamp } = await getPrices(env);
        return new Response(JSON.stringify({ success: true, prices, fromCache, timestamp }), {
          headers: corsHeaders,
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500, headers: corsHeaders,
        });
      }
    }

    if (path === "/api/history" || path === "/history") {
      const history = await getHistory(env);
      return new Response(JSON.stringify({ success: true, history }), {
        headers: corsHeaders,
      });
    }

    if (path === "/api/update" || path === "/update") {
      const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
      if (!(await checkRateLimit(env, clientIP))) {
        return new Response(JSON.stringify({ success: false, error: "Rate limited" }), {
          status: 429, headers: corsHeaders,
        });
      }

      try {
        const result = await handleUpdate(env, "http");
        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: corsHeaders,
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500, headers: corsHeaders,
        });
      }
    }

    if (path === "/health") {
      return new Response(JSON.stringify({ status: "ok", time: new Date().toISOString() }), {
        headers: corsHeaders,
      });
    }

    if (path === "/state") {
      const state = await loadState(env);
      return new Response(JSON.stringify(state || { error: "No state" }), {
        headers: corsHeaders,
      });
    }

    // Dashboard (PWA)
    if (path === "/" || path === "/dashboard") {
      try {
        const { prices } = await getPrices(env);
        const history = await getHistory(env);
        const dateTime = iranDateTime();
        const html = generateDashboardHTML(prices, history, dateTime);

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      } catch (error) {
        return new Response(`<h1>Error: ${error.message}</h1>`, {
          status: 500,
          headers: { "Content-Type": "text/html" },
        });
      }
    }

    // 404
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404, headers: corsHeaders,
    });
  },
};
