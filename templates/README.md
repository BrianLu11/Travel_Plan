# Travel Plan — 新行程模板

這裡存放**供複製的範例，不是既有上野／秩父行程的重構**。

| 模板 | 適用情況 | 動態互動 |
| --- | --- | --- |
| `day-trip/` | 單日行程，例如晴天／雨天備案 | 模式切換、時間軸、三語、分享 |
| `multi-day-trip/` | 兩日以上行程／旅行日記 | 日期切換、時間軸、三語、分享 |
| `shared/` | 兩種模板共用的程式與 CSS | 品牌導覽、路徑、語言、時間軸、工具入口 |

## 一次產生新的行程資料夾

在 repo 根目錄執行：

```bash
node scripts/new-trip.mjs day-trip kawagoe-day-trip
# 或
node scripts/new-trip.mjs multi-day-trip kyoto-2027
```

這會在根目錄建立新資料夾（例如 `kyoto-2027/`），並**自動修正模板的相對路徑**；不要直接複製 HTML 而漏掉路徑修改。

新資料夾包含：
- `index.html`：品牌首頁連結、語言按鈕、Hero、行程時間軸、共用工具區。
- `trip-data.js`：旅行內容及兩種模式／每日停靠點。
- `app.js`：引入 `../templates/shared/trip.js` 的精簡進入點。

生成後請：

1. 在 `trip-data.js` 換掉全部範例文字、日期、地點、`tripId`（唯一且與 Firebase 文件一致）；保持 `features.ledger/gallery: false`，直到資料庫和會員授權完成。
2. 檢查每個 stop 的 `time`、`title`、`description` 和 `map`。複製時留有示範資料，**不可當成實際訂位資訊**。
3. 若要三語，為資料欄位提供 `zh-Hant`、`ja`、`en`；沒有翻譯會回退為繁體中文。
4. 在根目錄 `index.html` 加上新行程入口，避免行程只有直接網址可以進入。
5. 執行 `node scripts/check-site.mjs`，並透過本機 HTTP server 預覽（例如 `python3 -m http.server 8000`）。
6. 開 PR，確認手機寬度、左上角「地點圖示 / TRAVEL PLAN ↗」能回總首頁、日期／語言／模式連結可分享。

## 資料契約（簡化）

```js
export const trip = {
  tripId: "my-unique-trip-id",
  mark: "旅",
  title: { "zh-Hant": "行程標題", ja: "旅のタイトル", en: "Trip title" },
  shortLabel: { "zh-Hant": "地點", ja: "場所", en: "Location" },
  subtitle: { "zh-Hant": "內容說明", ja: "...", en: "..." },
  features: { ledger: false, gallery: false },
  days: [{
    id: "2027-05-01",
    label: { "zh-Hant": "Day 1", ja: "1日目", en: "Day 1" },
    plans: {
      default: {
        label: { "zh-Hant": "一般行程", ja: "通常プラン", en: "Standard plan" },
        stops: [{ time: "10:00", title: { "zh-Hant": "景點", ja: "...", en: "..." }, description: { "zh-Hant": "備註" }, map: "Tokyo Station" }]
      }
    }
  }]
};
```

`days[].plans` 可用 `default` 或 `sunny`／`rain` 等模式。URL 用 `?day=YYYY-MM-DD&mode=rain&lang=ja`；不需要資料庫即可切換。地圖查詢是一般地址文字，模板會產生 Google Maps search URL。

## 注意

- 模板的 `templates/day-trip/` 路徑是兩層深，新行程在根目錄一層深。一定使用產生器自動調整 `../../` 和 shared assets 路徑。
- `shared/` 的任何變動將影響**所有由模板產生的新行程**；不要在沒有回歸驗證的情況下直接修改。
- 共享相簿／分帳的 Firebase 設定、成員邀請、安全規則並**不會**因新增行程而自動建立。詳細安全邊界見 [架構文件](../docs/ARCHITECTURE.md)。