// ================= CONFIG =================
const STATE_KEY = "telegraph_state";
// ==========================================

// ---------- Jalali Date Converter ----------
function toJalali(gy, gm, gd) {
    let g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    let gy2 = (gm > 2) ? (gy + 1) : gy;

    let days =
        (365 * gy) +
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

    let jm = (days < 186)
        ? 1 + Math.floor(days / 31)
        : 7 + Math.floor((days - 186) / 30);

    let jd = 1 + (
        (days < 186)
            ? (days % 31)
            : ((days - 186) % 30)
    );

    return { jy, jm, jd };
}

// ---------- Iran Date & Time ----------
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
        hour12: false
    });

    const parts = formatter.formatToParts(now);
    const get = t => parts.find(p => p.type === t)?.value;

    const year = Number(get("year"));
    const month = Number(get("month"));
    const day = Number(get("day"));

    const jalali = toJalali(year, month, day);

    return {
        dateFa: `${jalali.jy}/${String(jalali.jm).padStart(2, "0")}/${String(jalali.jd).padStart(2, "0")}`,
        timeFa: `${get("hour")}:${get("minute")}:${get("second")}`
    };
}

// ---------- Fetch Prices ----------
async function getPrices() {
    const res = await fetch("https://call.tgju.org/ajax.json", {
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`);
    }

    const data = await res.json();

    return {
        usd: data.current.price_dollar_rl.p,
        gold18: data.current.geram18.p,
        gold24: data.current.geram24.p
    };
}

// ---------- Telegraph Content ----------
function buildContent(usd, gold18, gold24) {
    const { dateFa, timeFa } = iranDateTime();

    return [
        { tag: "h3", children: ["📊 قیمت لحظه‌ای بازار ایران"] },

        {
            tag: "p",
            children: [{ tag: "b", children: ["💵 دلار: "] }, `${usd} تومان`]
        },
        {
            tag: "p",
            children: [{ tag: "b", children: ["🥇 طلا ۱۸ عیار: "] }, `${gold18} تومان`]
        },
        {
            tag: "p",
            children: [{ tag: "b", children: ["🥇 طلا ۲۴ عیار: "] }, `${gold24} تومان`]
        },
        {
            tag: "p",
            children: [
                { tag: "b", children: ["🕒 زمان بروزرسانی: "] },
                `${dateFa} — ${timeFa}`
            ]
        },
        {
            tag: "p",
            children: [{ tag: "i", children: ["بروزرسانی خودکار هر ۱ ساعت"] }]
        }
    ];
}

// ---------- Telegraph API ----------
async function createPage(content, token) {
    const res = await fetch("https://api.telegra.ph/createPage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            access_token: token,
            title: "قیمت دلار و طلا | بروزرسانی خودکار",
            author_name: "Auto Price Bot",
            content,
            return_content: true
        })
    });

    const data = await res.json();
    if (!data.ok) throw new Error(JSON.stringify(data));
    return data.result;
}

async function editPage(path, content, token) {
    const res = await fetch("https://api.telegra.ph/editPage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            access_token: token,
            path,
            title: "قیمت دلار و طلا | بروزرسانی خودکار",
            content,
            return_content: true
        })
    });

    const data = await res.json();
    if (!data.ok) throw new Error(JSON.stringify(data));
    return data.result;
}

// ---------- KV State ----------
async function loadState(env) {
    return await env.PRICE_STATE.get(STATE_KEY, { type: "json" });
}

async function saveState(env, path, url) {
    await env.PRICE_STATE.put(STATE_KEY, JSON.stringify({ path, url }));
}

// ---------- Core Logic ----------
async function handleUpdate(env) {
    const token = env.TELEGRAPH_TOKEN;
    const { usd, gold18, gold24 } = await getPrices();
    const content = buildContent(usd, gold18, gold24);
    const state = await loadState(env);

    if (!state) {
        const page = await createPage(content, token);
        await saveState(env, page.path, page.url);
        return { action: "created", url: page.url };
    } else {
        await editPage(state.path, content, token);
        return { action: "updated", url: state.url };
    }
}

// ================= WORKER =================
export default {
    async scheduled(event, env, ctx) {
        ctx.waitUntil(handleUpdate(env));
    },

    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/health") {
            return new Response(JSON.stringify({ ok: true }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        if (url.pathname === "/state") {
            return new Response(JSON.stringify(await loadState(env)), {
                headers: { "Content-Type": "application/json" }
            });
        }

        try {
            const result = await handleUpdate(env);
            return new Response(JSON.stringify(result), {
                headers: { "Content-Type": "application/json" }
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }
};
