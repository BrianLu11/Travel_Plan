# Travel Plan 🧭

一個和朋友共享旅行行程的小網站。把集合時間、景點、交通、餐廳、預算與雨天備案集中在同一頁，出遊時用手機就能快速查看。

*A shared collection of itineraries for trips with friends — built for easy viewing on mobile.*

## 🌏 旅行行程

| 目的地 | 日期 | 人數 | 行程 |
| --- | --- | --- | --- |
| 🎆 土浦全國花火競技大會 | 2026/11/7（六） | 東京／筑波旅伴 | [花火、壽司、管制地圖與交通](https://brianlu11.github.io/Travel_Plan/tsuchiura-hanabi/) |
| 🇯🇵 東京・上野（Ueno） | 2026/10/25（日） | 6 人 | [開啟互動行程](https://brianlu11.github.io/Travel_Plan/ueno-trip/) |
| 🇯🇵 秩父・長瀞 | 2026/10/30–11/1 | 人數可調 | [開啟三天兩夜行程](https://brianlu11.github.io/Travel_Plan/chichibu-kawagoe/) |

**[旅行計畫總首頁 →](https://brianlu11.github.io/Travel_Plan/)**

**上野集合資訊：2026/10/25（日）10:30，JR 上野站公園口（建議 10:20 抵達）。**

> 上述網址透過 GitHub Pages 提供；若尚未啟用 Pages 或部署未完成，可先閱讀下方原始檔案。

## ✨ 網站功能

- 🎆 **土浦花火專頁**：2026 官方資訊／往年小紅書經驗分開標示；地圖示意不能取代官方精確管制範圍。
- 📱 **手機優先**：方便旅伴隨時查閱。
- 🌐 **繁中／日本語／English**：上野行程支援三語切換，網址可加入 `?lang=ja`、`?lang=en` 或 `?lang=zh-Hant`。
- ☀️🌦️🌧️ **晴天／小雨／雨天方案**：依現場天氣切換行程。
- 🕒 **互動時間軸**：清楚顯示集合、用餐與參觀時段。
- 🗺️ **地圖與導航**：快速開啟景點的 Google Maps。
- 🍽️ **聚餐資訊**：適合團體的午晚餐備選方案。
- 💴 **預算估算與行前清單**：減少臨時找資料的時間。

## 💴 多人分帳（Travel Ledger）

- 透過 Google 登入，受邀旅伴共同記帳；每趟旅行使用獨立帳本。
- 預設平均分攤，也能自訂每人的實際消費金額，並提供結算轉帳建議與 CSV 匯出。
- [上野帳本](https://brianlu11.github.io/Travel_Plan/expense-tracker/?trip=ueno-2026) / [秩父・長瀞帳本](https://brianlu11.github.io/Travel_Plan/expense-tracker/?trip=chichibu-kawagoe-2026)
- [Firebase 設定與安全規則](expense-tracker/README.md)。帳目儲存在 Firestore，請勿把私人帳目提交至公開 GitHub。

## 📸 共享相簿（Travel Gallery）

- [上野共享相簿](https://brianlu11.github.io/Travel_Plan/photo-gallery/?trip=ueno-2026) / [秩父・長瀞共享相簿](https://brianlu11.github.io/Travel_Plan/photo-gallery/?trip=chichibu-kawagoe-2026)
- 使用同一組 Firebase Google 登入及旅行成員邀請。照片放在 Cloud Storage，照片索引放在 Firestore；詳細部署步驟見 [photo-gallery/README.md](photo-gallery/README.md)。
- **相簿需完成 Blaze、Storage Bucket、Firestore 與 Storage 規則及 CORS 設定才能實際使用。**

## 📁 專案結構

```text
Travel_Plan/
├── index.html           # 所有旅程的入口首頁
├── tsuchiura-hanabi/    # 2026/11/7 花火與互動管制位置地圖
├── README.md
├── expense-tracker/    # 共用分帳功能與 Firebase 規則
├── photo-gallery/      # 旅行共享相簿與 Storage 安全規則
└── ueno-trip/
    ├── index.html       # 上野六人一日遊
    ├── app.js           # 行程切換及互動功能
    ├── i18n.js          # 三語翻譯字典及切換
    ├── styles.css       # 網頁樣式
    └── favicon.svg      # 網站圖示
└── chichibu-kawagoe/
    ├── index.html       # 三日切換及住宿資訊
    ├── app.js           # 每日時程、天氣、預算與日曆
    ├── styles.css       # 延續上野頁設計風格
    └── favicon.svg
```

## 🚀 使用與更新

本站是 **HTML + CSS + JavaScript** 靜態網站，不需要安裝 Node.js 或額外套件。可以直接打開 `index.html` 查看；公開分享則使用 GitHub Pages。

新增旅行時，建立新資料夾（例如 `kawagoe-trip/`），放入 `index.html` 等檔案，再在根目錄 `index.html` 加入該行程入口。

GitHub Pages 設定：**Settings → Pages → Deploy from a branch → `main` / `(root)`**。之後推送到 `main` 的變更會由 GitHub Pages 重新部署。

## 📌 出發前提醒

行程時間、餐廳座位、展覽場次與天氣可能變動；請以景點和店家的當日公告為準，尤其團體訂位務必事先確認。

---

Made for shared journeys. · [GitHub Repository](https://github.com/BrianLu11/Travel_Plan)
