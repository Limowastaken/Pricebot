import requests
import time
import json
import os
from datetime import datetime
import pytz
import jdatetime

# ================= CONFIG =================
TELEGRAPH_TOKEN = "fb56a1ddbc42bb99d57aeff12db7598370d5410e004c2e2116039260de33"
UPDATE_INTERVAL = 6 * 60 * 60  # 6 hours (seconds)
STATE_FILE = "telegraph_state.json"
TIMEZONE = pytz.timezone("Asia/Tehran")
# =========================================


def get_prices():
    """
    Fetch Iran market prices from TGJU
    """
    url = "https://call.tgju.org/ajax.json"
    r = requests.get(url, timeout=10)
    data = r.json()["current"]

    usd = data["price_dollar_rl"]["p"]
    gold18 = data["geram18"]["p"]
    gold24 = data["geram24"]["p"]

    return usd, gold18, gold24


def iran_datetime():
    now = datetime.now(TIMEZONE)
    jdate = jdatetime.datetime.fromgregorian(datetime=now)

    return (
        jdate.strftime("%Y/%m/%d"),
        now.strftime("%H:%M:%S")
    )


def build_content(usd, gold18, gold24):
    date_fa, time_fa = iran_datetime()

    return [
        {"tag": "h3", "children": ["📊 قیمت لحظه‌ای بازار ایران"]},

        {"tag": "p", "children": [
            {"tag": "b", "children": ["💵 دلار: "]},
            f"{usd} تومان"
        ]},

        {"tag": "p", "children": [
            {"tag": "b", "children": ["🥇 طلا ۱۸ عیار: "]},
            f"{gold18} تومان"
        ]},

        {"tag": "p", "children": [
            {"tag": "b", "children": ["🥇 طلا ۲۴ عیار: "]},
            f"{gold24} تومان"
        ]},

        {"tag": "p", "children": [
            {"tag": "b", "children": ["🕒 زمان بروزرسانی:\n"]},
            f"{date_fa} — {time_fa}",
            "\n(به وقت ایران 🇮🇷)"
        ]},

        {"tag": "p", "children": [
            {"tag": "i", "children": ["این صفحه هر ۶ ساعت به‌صورت خودکار بروزرسانی می‌شود."]}
        ]}
    ]


def create_page(content):
    r = requests.post(
        "https://api.telegra.ph/createPage",
        data={
            "access_token": TELEGRAPH_TOKEN,
            "title": "قیمت دلار و طلا | بروزرسانی خودکار",
            "author_name": "Auto Price Bot",
            "content": json.dumps(content),
            "return_content": True
        }
    )

    result = r.json()["result"]
    return result["path"], result["url"]


def edit_page(path, content):
    requests.post(
        "https://api.telegra.ph/editPage",
        data={
            "access_token": TELEGRAPH_TOKEN,
            "path": path,
            "title": "قیمت دلار و طلا | بروزرسانی خودکار",
            "content": json.dumps(content),
            "return_content": True
        }
    )


def load_state():
    if not os.path.exists(STATE_FILE):
        return None
    with open(STATE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_state(path, url):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump({"path": path, "url": url}, f, ensure_ascii=False)


def main():
    state = load_state()

    while True:
        try:
            usd, gold18, gold24 = get_prices()
            content = build_content(usd, gold18, gold24)

            if state is None:
                path, url = create_page(content)
                save_state(path, url)
                state = {"path": path, "url": url}
                print("✅ Telegraph page created:")
                print(url)
            else:
                edit_page(state["path"], content)
                print("🔁 Page updated:", state["url"])

        except Exception as e:
            print("❌ Error:", e)

        time.sleep(UPDATE_INTERVAL)


if __name__ == "__main__":
    main()