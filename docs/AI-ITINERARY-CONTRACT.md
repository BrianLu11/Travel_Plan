# Travel Plan AI 行程資料契約 (v1)

旅行建立及 Firebase 身分權限由平台後端處理；AI **不得**編造帳本、相簿成員或修改 Firebase Security Rules。AI 只需要把旅行資訊輸出為符合以下結構的 JSON，由開團者在 Travel Club 後台貼上發布。

## 支援四個視覺模板

| templateType | 設計 | 適用情境 |
|---|---|---|
| `day-trip` | 深青、米白、日間旅行卡片 | 單日城市散步 |
| `multi-day-trip` | 藍灰漸層、日期切換、旅遊日誌 | 住宿及長途旅行 |
| `event-trip` | 深紫、莓紅重點色、活動時間軸 | 花火、節慶、展覽 |
| `regional-trip` | 森林綠、土黃、戶外路線 | 自然、登山、公路旅行 |

模板由 `trips/{tripId}.templateType` 決定，不由 AI 提交的自由 HTML 決定；共用網站 `trip/?trip={tripId}` 讀取 `publishedTrips/{tripId}` 的公開行程。只有開團者能發布。從靜態站內複製 URL 不會改變身份授權。

## 例子：JSON

```json
{
  "title": {"zh-Hant":"京都茶葉與紅葉之旅","ja":"京都のお茶と紅葉","en":"Kyoto Tea and Foliage"},
  "subtitle": {"zh-Hant":"茶屋、紅葉、古寺，按交通方向安排"},
  "days": [
    {
      "date": "2027-11-20",
      "label": {"zh-Hant":"Day 1 · 京都"},
      "stops": [
        {
          "time": "10:30",
          "title": {"zh-Hant":"京都車站集合"},
          "description": {"zh-Hant":"確認集合地點及交通方式；尚未代表已訂車。"},
          "location": "京都駅, 京都市"
        }
      ]
    }
  ]
}
```

## API 與限制

- 平台主辦人在 `travel-club/` 建團，再輸入 JSON（不得包括電話、私人地址、帳目、旅伴 Email 或 API key）。
- 服務端 `publishItinerary` 驗證資料型別、日期與最多 31 天／每日最多 60 個停靠點；文字長度有限制；不接受任意 HTML、CSS 或 JavaScript。
- 所有文字會作為純文字插入 DOM，景點地圖採 Google Maps 搜尋連結，不執行 AI 生成的腳本。
- 公開資料會讓未登入訪客看到，**不適合放置私人集合方式或尚未公開的個人安排**。
- `?day=YYYY-MM-DD` 讓朋友直接打開指定日期的時間軸。
- 分帳與相簿沿用 `tripId`，由 Firebase 成員權限隔離，即使行程公開也不會公開財務或照片。

## 發布前需要確認

核對日期、時區、景點營業資訊、費用、交通可行性、預約是否成立；旅行建立者需明確確認內容可公開。AI 只能擬稿，不能認定推薦的店家已訂位。
