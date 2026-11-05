# Travel Plan — 網站架構與設計規範

> **目的：** 讓新行程能穩定套用模板，修改舊行程時有明確的相容性與測試標準。這份文件是維護規範，不表示現有所有頁面已完成重構。

## 1. 技術架構

- Hosting：GitHub Pages，來源為 `main` / `(root)`。正式站：https://brianlu11.github.io/Travel_Plan/
- Frontend：靜態 HTML、CSS、原生 JavaScript／ES modules；無需 SPA 路由器或打包工具。
- Trip pages：`ueno-trip/`（單日晴雨模式、三語）、`chichibu-kawagoe/`（三日切換），目前各有獨立實作；保留不重寫。
- Shared services：`expense-tracker/`（Google 登入、Firestore 帳本）、`photo-gallery/`（同一會員、Firestore 索引及 Cloud Storage 照片）。
- Scaffolds：`templates/day-trip/`、`templates/multi-day-trip/`，共用 `templates/shared/trip.js` 與 `trip.css`。未來新行程優先使用這套。
- QA：`node scripts/check-site.mjs` + GitHub Actions 靜態檢查；Firebase 實際權限另外驗證。

```text
Travel_Plan/
├── index.html                      # 正式首頁／行程入口
├── AGENTS.md                       # 給編輯程式的 AI / 開發者守則
├── docs/ARCHITECTURE.md            # 本文件
├── templates/
│   ├── README.md
│   ├── shared/{trip.js,trip.css}    # 新行程共用顯示引擎及樣式
│   ├── day-trip/                    # 單日雨天／晴天示範
│   └── multi-day-trip/              # 多天日期切換示範
├── scripts/{new-trip.mjs,check-site.mjs}
├── ueno-trip/                       # 已上線行程，獨立維護
├── chichibu-kawagoe/               # 已上線行程，獨立維護
├── expense-tracker/
└── photo-gallery/
```

## 2. 三層職責

| 層 | 負責內容 | 修改範圍 |
| --- | --- | --- |
| HTML | 語意結構、品牌導覽、必需的 ID、無 JS 提示 | 不放行程商業邏輯 |
| CSS | 顏色、排版、元件、RWD、focus/motion | 不以大量 inline styles 覆蓋 |
| trip-data.js | 旅行名稱、日期、每日行程、雨天備案、資訊來源 | 新行程主要只改這裡 |
| templates/shared/trip.js | 切換日期／模式／語言、渲染時間軸、分享連結、共用功能入口 | 多行程共同修復、一起測試 |
| Firebase tools | 身分認證、費用、相片、權限 | 維持獨立服務，不塞進行程模板 |

資料內容可能由不同旅伴維護，應以 `textContent` 呈現，避免直接拼接 HTML。特殊行程可在自己的 `app.js` 補充，但不要複製並修改整份共用引擎。

## 3. 網址與導航契約（必須遵守）

正式網站是 GitHub Pages **專案子路徑** `/Travel_Plan/`，不是網站網域根目錄。請勿在 HTML 寫死 `href="/"`、`/photo-gallery/` 之類的絕對路徑。

- 根層行程資料夾（例如 `/ueno-trip/`）的左上角品牌：**`href="../"`**，返回 Travel Plan 總首頁。
- 頁面內「回到頂部」：`href="#top"`，不應取代左上角首頁連結。
- 行程→相簿：`../photo-gallery/?trip=EXISTING_FIRESTORE_TRIP_ID`。
- 行程→分帳：`../expense-tracker/?trip=EXISTING_FIRESTORE_TRIP_ID`。
- 頁面內選擇狀態可以使用 `?day=YYYY-MM-DD&mode=rain&lang=ja`，保留可分享的 URL；瀏覽器更新不應導向其他旅行。

現有不可更動的 Firebase trip IDs：

| 旅程 | Folder | Firebase trip ID |
| --- | --- | --- |
| 上野 | `ueno-trip/` | `ueno-2026` |
| 秩父・長瀞 | `chichibu-kawagoe/` | `chichibu-kawagoe-2026` |

**新行程預設不啟用共同帳本與相簿。** 完成 Firestore `trips/{id}`、`members/{uid}` 的可信任初始化、權限驗證，並在兩個共用工具的有效旅程清單加入 ID 後，才把 `features.ledger/gallery` 設為 `true`。不可只改前端連結就宣稱多人功能已開通。

## 4. 設計語言（保留各地特色）

整體品牌：編輯式旅行筆記、深青綠色導航、米白紙張、柔和陶土色重點；不要求所有旅程的插畫完全相同。

| CSS token | 基準值 | 用途 |
| --- | --- | --- |
| `--ink` | `#102c34` | 導覽／主標深青 |
| `--cream` | `#f5f2e9` | 頁面背景 |
| `--paper` | `#fffdf8` | 資訊卡 |
| `--accent` | `#cb7144` | 主題焦點與時間 |
| `--mint` | `#d9e8db` | 輕量提示 |
| `--line` | `#d8dcd6` | 邊線 |

- Header：左側地點識別符號（如「上」）+ `TRAVEL PLAN ↗` + 地點副標；整個品牌區是首頁連結。右側語言／分享／日期依可用空間調整。
- Hero：大標題使用襯線字、正文無襯線字；可以有獨立地點插畫／幾何元素，但不要求複製另一趟旅行的視覺。
- 內容區：集合資訊、行程切換、時間軸、交通／住宿／餐飲、共同工具、來源／提醒。
- Mobile first：最小 320px 寬度不應出現橫向捲動；在窄屏仍需能找到首頁連結、模式切換、閱讀行程。
- Interactive：焦點狀態可見、支援鍵盤、`aria-pressed` 或 `aria-selected`、尊重 `prefers-reduced-motion`。沒有 JavaScript 時顯示說明，而不是空白頁。
- 文字來源／日期／預約狀態要清楚。建議與實際訂位不能混寫。

## 5. Firebase 安全、隱私與計費

Auth 與兩個工具各自負責存取授權；GitHub Pages 是公開前端，不是授權伺服器。Firestore/Storage Rules 須在 Firebase Console **另行發布**，不隨 PR 合併自動部署。照片只能在 Storage 透過會員授權讀取，勿寫入 GitHub；不要把長期可分享的 `getDownloadURL()` token 放在公開頁面。帳本屬個人支出，不能用公開 JSON 檔儲存。

Firebase Storage Blaze 會有計費風險；Google Cloud 的預算警報並非硬性上限。對外分享前確認隱私及權限。所有圖片原始檔可能包含 EXIF／GPS 資訊。

## 6. 修改與合併流程

1. 從最新 `main` 建立功能分支；修改前讀懂該頁 HTML / CSS / JS 與現有導覽。
2. 新行程優先跑 `node scripts/new-trip.mjs day-trip <slug>` 或 `multi-day-trip`；依 `templates/README.md` 修改資料檔，不複製既有行程。
3. `node scripts/check-site.mjs`，檢查錯誤、站內連結、首頁品牌、JS 語法。
4. 本機用 HTTP server 預覽而非 `file://`（ES modules 通常需要 HTTP origin）；檢查手機與桌面、語言切換、日期／模式 URL 分享、Google Maps 連結。
5. 若動到 Ledger / Gallery：另驗證 Google 登入、非會員拒絕、成員區隔、上傳／下載／刪除權限；任何 Security Rules 變更需明確列在 PR checklist。
6. 開 PR、確認差異沒有覆蓋他人改動；合併至 main 後再檢查 GitHub Pages Actions 成功及正式網址。

**靜態測試不能取代 Firebase Emulator 或實際權限測試。**