// ================= CONFIG =================
const STATE_KEY = "telegraph_state";
// ==========================================

// Jalali Date Converter
function toJalali(gy, gm, gd) {
    let g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    let gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) 
               + (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * (Math.floor(days / 12053));
    days %= 12053;
    jy += 4 * (Math.floor(days / 1461));
    days %= 1461;
    jy += Math.floor((days - 1) / 365);
    if (days > 365) days = (days - 1) % 365;
    let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return { jy, jm, jd };
}

function iranDateTime() {
    const now = new Date();
    const iranFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Tehran',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = iranFormatter.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type)?.value;
    
    const year = parseInt(getPart('year'));
    const month = parseInt(getPart('month'));
    const day = parseInt(getPart('day'));
    const hour = getPart('hour');
    const minute = getPart('minute');
    const second = getPart('second');
    
    const jalali = toJalali(year, month, day);
    
    const dateFa = `${jalali.jy}/${String(jalali.jm).padStart(2, '0')}/${String(jalali.jd).padStart(2, '0')}`;
    const timeFa = `${hour}:${minute}:${second}`;
    
    return { dateFa, timeFa };
}

async function getPrices() {
    const url = "https://call.tgju.org/ajax.json";
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const usd = data.current.price_dollar_rl.p;
    const gold18 = data.current.geram18.p;
    const gold24 = data.current.geram24.p;
    
    return { usd, gold18, gold24 };
}

function buildContent(usd, gold18, gold24) {
    const { dateFa, timeFa } = iranDateTime();
    
    return [
        { tag: "h3", children: ["📊 قیمت لحظه‌ای بازار ایران"] },
        
        { tag: "p", children: [
            { tag: "b", children: ["💵 دلار: "] },
            `${usd} تومان`
        ]},
        
        { tag: "p", children: [
            { tag: "b", children: ["🥇 طلا ۱۸ عیار: "] },
            `${gold18} تومان`
        ]},
        
        { tag: "p", children: [
            { tag: "b", children: ["🥇 طلا ۲۴ عیار: "] },
            `${gold24} تومان`
        ]},
        
        { tag: "p", children: [
            { tag: "b", children: ["🕒 زمان بروزرسانی:\n"] },
            `${dateFa} — ${timeFa}`,
            "\n(به وقت ایران 🇮🇷)"
        ]},
        
        { tag: "p", children: [
            { tag: "i", children: ["این صفحه هر ۶ ساعت به‌صورت خودکار بروزرسانی می‌شود."] }
        ]}
    ];
}

async function createPage(content, token) {
    const response = await fetch("https://api.telegra.ph/createPage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            access_token: token,
            title: "قیمت دلار و طلا | بروزرسانی خودکار",
            author_name: "Auto Price Bot",
            content: content,
            return_content: true
        })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
        throw new Error(`Telegraph API error: ${JSON.stringify(data)}`);
    }
    
    return {
        path: data.result.path,
        url: data.result.url
    };
}

async function editPage(path, content, token) {
    const response = await fetch("https://api.telegra.ph/editPage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            access_token: token,
            path: path,
            title: "قیمت دلار و طلا | بروزرسانی خودکار",
            content: content,
            return_content: true
        })
    });
    
    const data = await response.json();
    
    if (!data.ok) {
        throw new Error(`Telegraph API error: ${JSON.stringify(data)}`);
    }
    
    return data.result;
}

async function loadState(env) {
    try {
        const state = await env.PRICE_STATE.get(STATE_KEY, { type: "json" });
        return state;
    } catch (e) {
        return null;
    }
}

async function saveState(env, path, url) {
    await env.PRICE_STATE.put(STATE_KEY, JSON.stringify({ path, url }));
}

async function handleUpdate(env) {
    const token = env.TELEGRAPH_TOKEN;
    
    // Get current prices
    const { usd, gold18, gold24 } = await getPrices();
    console.log(`Prices fetched - USD: ${usd}, Gold18: ${gold18}, Gold24: ${gold24}`);
    
    // Build content
    const content = buildContent(usd, gold18, gold24);
    
    // Load state
    let state = await loadState(env);
    
    if (!state) {
        // Create new page
        const { path, url } = await createPage(content, token);
        await saveState(env, path, url);
        console.log(`✅ Telegraph page created: ${url}`);
        return { action: "created", url };
    } else {
        // Edit existing page
        await editPage(state.path, content, token);
        console.log(`🔁 Page updated: ${state.url}`);
        return { action: "updated", url: state.url };
    }
}

// ================= EXPORTS =================

export default {
    // Scheduled trigger (cron)
    async scheduled(event, env, ctx) {
        console.log("⏰ Cron triggered at:", new Date().toISOString());
        ctx.waitUntil(
            handleUpdate(env)
                .then(result => console.log("Result:", result))
                .catch(err => console.error("❌ Error:", err.message))
        );
    },
    
    // HTTP trigger (manual/test)
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Health check endpoint
        if (url.pathname === "/health") {
            return new Response(JSON.stringify({ status: "ok", time: new Date().toISOString() }), {
                headers: { "Content-Type": "application/json" }
            });
        }
        
        // Get current state
        if (url.pathname === "/state") {
            const state = await loadState(env);
            return new Response(JSON.stringify(state || { error: "No state found" }), {
                headers: { "Content-Type": "application/json" }
            });
        }
        
        // Manual update trigger
        if (url.pathname === "/update" || url.pathname === "/") {
            try {
                const result = await handleUpdate(env);
                return new Response(JSON.stringify({
                    success: true,
                    ...result,
                    timestamp: new Date().toISOString()
                }), {
                    headers: { "Content-Type": "application/json" }
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    error: error.message
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }
        
        // Default response
        return new Response(JSON.stringify({
            endpoints: {
                "/": "Trigger update",
                "/update": "Trigger update",
                "/state": "Get current state",
                "/health": "Health check"
            }
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }
};    headers: { "Content-Type": "application/json" },
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
