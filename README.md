# Farm Market Battle｜台股開心農場戰場

把台股多空、上漲／下跌家數與市場風險轉成一座會呼吸的原創農場。多軍推進時作物成長、牛群巡田；空軍壓境時烏雲、熊軍與烏鴉出現；重挫時啟動誇張但不血腥的韭菜收割場景。

這是一個可執行的 Next.js 響應式產品，同時包含 PWA、Capacitor iOS 設定、App Group native bridge 與小／中／大型 SwiftUI Widget source。沒有登入、資料庫、券商串接、自動交易、廣告或追蹤 SDK。

## 畫面與功能

- `/`：Hero、官方市場摘要、個股搜尋、財報與日 K、農場戰場、排行榜、趨勢與圖例。
- `/battle`：Widget 與 deep link 的指定戰場入口，載入後直接定位核心農場。
- `/offline`：PWA 無網路時的農場風格 fallback。
- 原創 CSS 農場：天空、山景、風車、農舍、稻田、韭菜田、多空前線、雞、羊、烏鴉、牛熊與收割機。
- 動畫：進場、scroll reveal、數字滾動、雲層、光暈、風車、作物、動物、粒子、雨與收割機。
- 互動：市場情境沙盒、場景探索、tooltip、刷新、股票 autocomplete、財報 tabs、20／40／60 日 K 線。
- 響應式：320px 手機、iPhone safe area、平板與桌面，並支援 `prefers-reduced-motion`。

畫面資產：`public/og.png` 是社群預覽，PWA 使用原創 `public/favicon.svg`。主要場景不是靜態背景圖，而是 CSS、React 與有限數量的程式化元素。

## 架構

```text
app/
  api/market/route.ts       canonical MarketSnapshot API
  api/realtime/route.ts     TWSE MIS 指數行情
  battle/page.tsx           deep-link 戰場路由
  offline/page.tsx          PWA offline fallback
  manifest.ts               PWA manifest
components/
  FarmMarketBattle.tsx      主要產品與互動場景
  StockResearch.tsx         股票／財報查詢
lib/market/
  types.ts
  market-provider.ts
  public-market-provider.ts
  mock-market-provider.ts
  normalize-market-data.ts
  calculate-sentiment.ts
  calculate-scene.ts
  generate-narration.ts
  scene-config.ts
lib/native/snapshotBridge.ts
ios-native/
  App/                      Capacitor local plugin
  Shared/                   Swift Codable model
  Widget/                   Small / Medium / Large Widget
  Entitlements/             App Group templates
```

## 市場資料流程

單一 canonical 入口：

```ts
getMarketSnapshot(): Promise<MarketSnapshot>
```

1. 優先使用臺灣證券交易所 OpenAPI 的盤後資料。
2. 加權指數由 TWSE MIS 基本市況報導校正；盤中依來源建議採 5 秒更新。
3. 背景分頁降低請求頻率，回到前景立即同步。
4. 所有外部數值經 `normalize-market-data.ts` 驗證、限縮與 safe fallback。
5. 來源失敗時先嘗試本次 server runtime 最後成功快照，狀態標示為 `cached`。
6. 沒有成功快照時使用 deterministic demo，狀態明確標示為 `demo`。
7. API failure 不會變成整頁錯誤，農場仍可完整互動。

狀態包括 `live`、`delayed`、`cached`、`demo`、`unavailable`。盤中指數可快速更新；市場廣度與排行榜仍屬盤後頻率，UI 會在來源說明中區分。

資料來源：臺灣證券交易所 OpenAPI、TWSE MIS 基本市況報導、公開資訊觀測站公開資料。不得把資料重新傳播或商業加值前，應另行確認證交所授權條件。

## 本機開發

需求：Node.js 22.13+。專案目前保留 npm lockfile，也可使用 pnpm。

```bash
pnpm install
pnpm dev
```

或：

```bash
npm install
npm run dev
```

一般網址是 `http://localhost:3000`。

## 型別、測試、Lint 與 production build

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

測試涵蓋大漲、小漲、盤整、小跌、大跌、provider failure、不完整資料 normalization、收割場景與旁白 variation。

## PWA

- Manifest：`app/manifest.ts`
- Service Worker：`public/sw.js`
- Offline fallback：`/offline`
- standalone、theme color、Apple web app metadata、safe-area inset 已設定
- API request 不進入 cache；離線時保留明確的斷線畫面，不把舊行情偽裝為即時

在瀏覽器使用「加入主畫面」即可測試。正式環境必須使用 HTTPS（localhost 開發例外）。

## 市場 API 設定

複製 `.env.example`：

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_MARKET_API_URL`：保留空白時使用同源 `/api/market`。若日後把市場 API 移到獨立 HTTPS 服務，可在這裡設定。
- `NEXT_PUBLIC_APP_ENV`：`development` 或 `production`。
- `CAPACITOR_SERVER_URL`：iOS 原生殼層載入的部署網址，正式版必須是 HTTPS。

## Capacitor iOS

App ID：`com.kuan.farmmarketbattle`  
App Name：`Farm Market Battle`

本專案採架構 B：Capacitor 指向已部署網站，因 Next.js Route Handlers 不能在純 static bundle 裡執行。設定不會硬編碼 localhost。

在 Mac：

```bash
pnpm build
pnpm ios:add
pnpm ios:sync
pnpm ios:open
```

add、sync、run 會先檢查 `CAPACITOR_SERVER_URL`。完整 Xcode 步驟見 [docs/ios-setup.md](docs/ios-setup.md)。

## App Group 與 Native Bridge

- App Group：`group.com.kuan.farmmarketbattle`
- Shared key：`marketSnapshot`
- TypeScript：`lib/native/snapshotBridge.ts`
- Swift plugin：`ios-native/App/MarketSnapshotPlugin.swift`
- Swift model：`ios-native/Shared/MarketSnapshot.swift`

Web 每分鐘至多同步一次 canonical JSON；普通瀏覽器會安全跳過。Swift 先用 Codable 驗證，再寫入 App Group，成功後呼叫 `WidgetCenter.shared.reloadTimelines`。

## SwiftUI Widget

Widget：`FarmMarketWidget`  
Kind：`FarmMarketBattleWidget`  
Bundle ID：`com.kuan.farmmarketbattle.widget`

- Small：情緒、指數漲跌幅、Bull／Bear、更新狀態。
- Medium：簡化農場、指數、多空 bars、漲跌家數與狀態。
- Large：完整簡化農場、旁白、指數、收割等級、漲跌家數與榜首。
- 沒有共享資料時顯示 sample placeholder。
- 超過三小時顯示「等待 App 更新」。
- Timeline 依狀態每 15～45 分鐘讀取共享資料；不宣稱逐秒更新。
- 點擊 Widget 開啟 `farmmarketbattle://battle`，App 導航至 `/battle`。

## 實體 iPhone

需要 macOS、Xcode、Apple Developer signing，以及 App／Widget 兩個 target 共同啟用 App Group。執行 `pnpm ios:open` 後依 [iOS 設定文件](docs/ios-setup.md) 加入 source、target membership、entitlements、URL scheme 與 signing，再從 Xcode 安裝至裝置。

## 已知限制

- TWSE MIS 是公開基本市況介面；大量傳播、商業加值或正式服務應另行確認授權與流量政策。
- 市場廣度與排行不是 5 秒更新，採證交所盤後摘要。
- PWA 離線模式不會創造假行情，只顯示離線提示。
- WidgetKit 不允許網頁動畫或逐秒刷新；資料主要在 App 開啟／回前景後同步。
- Windows 環境無法執行 Xcode、Swift compile、signing、Simulator 或實機測試。
- 尚未建立由 Xcode 管理的 Widget target 與 provisioning profile；必須在 Mac 依文件完成。
- 交付時 `npm audit --omit=dev` 回報 Next.js 內含 PostCSS 的 2 個 moderate 公告；自動修復建議會造成不相容的 major downgrade，因此未套用 `--force`。

## 免責聲明

本產品只提供市場視覺化及娛樂體驗，不構成投資建議、招攬、交易訊號或任何具體買賣建議。
