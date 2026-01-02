const TELEGRAPH_API = "https://api.telegra.ph";
const STATE_KEY = "PRICE_STATE";

// ---------- FETCH PRICES ----------
async function getPrices() {
  const res = await fetch("https://alanchand.com/");
  const data = await res.json();

  return {
    usd: data.usd,              // تومان
    derham: data.derham,        // تومان
    euro: data.euro,            // تومان
    tether: data.tether,        // تومان
    bitcoin: data.bitcoin,      // دلار
    gold18: data.gold18         // گرم طلای ۱۸ عیار
  };
}

// ---------- BUILD TELEGRAPH CONTENT ----------
function buildContent(p) {
  return [
    {
      tag: "h3",
      children: ["📊 قیمت لحظه‌ای بازار ایران"]
    },
    {
      tag: "p",
      children: [
        `💵 دلار: ${p.usd} تومان\n`,
        `💶 یورو: ${p.euro} تومان\n`,
        `🇦🇪 درهم: ${p.derham} تومان\n`,
        `🪙 تتر: ${p.tether} تومان\n`,
        `₿ بیت‌کوین: ${p.bitcoin} دلار\n`,
        `🥇 گرم طلای ۱۸ عیار: ${p.gold18} تومان\n\n`,
        `🕒 زمان بروزرسانی: ${new Date().toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })} (به وقت ایران 🇮🇷)`
      ]
    }
  ];
}

// ---------- TELEGRAPH API ----------
async function createPage(content, token) {
  const res = await fetch(`${TELEGRAPH_API}/createPage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: token,
      title: "قیمت لحظه‌ای بازار",
      author_name: "Market Bot",
      content,
      return_content: false
    })
  });
  const json = await res.json();
  return json.result;
}

async function editPage(path, content, token) {
  await fetch(`${TELEGRAPH_API}/editPage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: token,
      path,
      title: "قیمت لحظه‌ای بازار",
      content,
      return_content: false
    })
  });
}

// ---------- KV STATE ----------
async function loadState(env) {
  const raw = await env.PRICE_STATE.get(STATE_KEY);
  return raw ? JSON.parse(raw) : null;
}

async function saveState(env, state) {
  await env.PRICE_STATE.put(STATE_KEY, JSON.stringify(state));
}

function pricesChanged(oldP, newP) {
  if (!oldP) return true;
  return Object.keys(newP).some(k => oldP[k] !== newP[k]);
}

// ---------- MAIN LOGIC ----------
async function handleUpdate(env) {
  const prices = await getPrices();
  const content = buildContent(prices);
  const state = await loadState(env);

  if (!state) {
    const page = await createPage(content, env.TELEGRAPH_TOKEN);
    await saveState(env, {
      path: page.path,
      url: page.url,
      prices
    });
    return new Response(`Created: ${page.url}`);
  }

  if (!pricesChanged(state.prices, prices)) {
    return new Response("No price change. Skipped.");
  }

  await editPage(state.path, content, env.TELEGRAPH_TOKEN);
  await saveState(env, {
    path: state.path,
    url: state.url,
    prices
  });

  return new Response(`Updated: ${state.url}`);
}

// ---------- WORKER EXPORT ----------
export default {
  async fetch(req, env) {
    return handleUpdate(env);
  },

  async scheduled(event, env) {
    await handleUpdate(env);
  }
};
