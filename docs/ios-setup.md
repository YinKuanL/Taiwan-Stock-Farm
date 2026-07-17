# iOS、Capacitor 與 Widget 設定

本專案採用 Capacitor 架構 B：iOS App 是原生殼層，載入已部署的 HTTPS 網站。原因是網站使用 Next.js Route Handlers 提供市場、財報與 K 線 API，不能把純 static export 當成完整產品。設定中沒有硬編碼 `localhost`。

## 需求

- macOS 與 Xcode 16 或更新版本
- Apple Developer 帳號（實體裝置與發佈需要）
- Node.js 22.13+
- pnpm 或 npm
- CocoaPods 不是 Capacitor 8 的必要條件；若你的其他原生套件要求，再另外安裝

## 1. 安裝與 Web 驗證

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

複製環境範例：

```bash
cp .env.example .env.local
```

將 `.env.local` 的 `CAPACITOR_SERVER_URL` 設為已部署的 HTTPS 網站，例如：

```dotenv
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_MARKET_API_URL=
CAPACITOR_SERVER_URL=https://your-real-domain.example.com
```

開發實體機時可以暫時使用 Mac 的 LAN URL，但該位址必須能從 iPhone 存取；請勿填 `localhost`。正式封裝必須使用 HTTPS。

## 2. 產生 Capacitor iOS 專案

只需第一次執行：

```bash
pnpm ios:add
```

之後同步設定與原生套件：

```bash
pnpm ios:sync
pnpm ios:open
```

對應的底層指令是 `npx cap add ios`、`npx cap sync ios` 與 `npx cap open ios`。腳本會在 add、sync、run 前檢查 `CAPACITOR_SERVER_URL`，避免產生無法連線的 App。

## 3. App target

在 Xcode 選取 App target：

1. Bundle Identifier 設為 `com.kuan.farmmarketbattle`。
2. Signing & Capabilities 選擇 Team，加入 **App Groups**。
3. 勾選／建立 `group.com.kuan.farmmarketbattle`。
4. 將 `ios-native/Entitlements/FarmMarketBattle.entitlements` 內容合併至 App target entitlement。
5. 將下列檔案加入 App target：
   - `ios-native/Shared/MarketSnapshot.swift`
   - `ios-native/App/MarketSnapshotPlugin.swift`
   - `ios-native/App/FarmBridgeViewController.swift`
6. 在 `Main.storyboard` 選取 Bridge View Controller，將 Custom Class 改為 `FarmBridgeViewController`。這會註冊本機 `MarketSnapshot` Capacitor plugin。

## 4. URL Scheme 與 deep link

在 App target 的 Info → URL Types 新增：

- Identifier：`com.kuan.farmmarketbattle.deeplink`
- URL Schemes：`farmmarketbattle`

也可以直接在 Info.plist 合併：

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.kuan.farmmarketbattle.deeplink</string>
    <key>CFBundleURLSchemes</key>
    <array><string>farmmarketbattle</string></array>
  </dict>
</array>
```

Widget 使用 `farmmarketbattle://battle`。Web runtime 透過 `@capacitor/app` 接收連結並導向 `/battle`。

## 5. 建立 Widget Extension

1. Xcode：File → New → Target → **Widget Extension**。
2. Product Name：`FarmMarketWidget`。
3. Bundle Identifier：`com.kuan.farmmarketbattle.widget`。
4. 取消勾選 Live Activity 與 Configuration App Intent（本版不需要）。
5. 刪除 Xcode 產生的示範 Widget Swift 檔，避免出現兩個 `@main`。
6. 將以下檔案加入 Widget target：
   - `ios-native/Shared/MarketSnapshot.swift`
   - `ios-native/Widget/FarmMarketWidget.swift`
7. Widget target → Signing & Capabilities → 加入 **App Groups**，勾選 `group.com.kuan.farmmarketbattle`。
8. 將 `ios-native/Entitlements/FarmMarketWidget.entitlements` 內容合併至 Widget target entitlement。

Widget kind 固定為 `FarmMarketBattleWidget`，支援 `systemSmall`、`systemMedium`、`systemLarge`。

## 6. App Group 資料流

1. Web 取得 canonical `MarketSnapshot`。
2. `lib/native/snapshotBridge.ts` 確認正在原生 Capacitor 環境。
3. 每分鐘至多呼叫一次 `MarketSnapshot.saveSnapshot`，避免不合理地頻繁刷新 Widget。
4. Swift plugin 先用 `JSONDecoder` 驗證資料。
5. JSON 寫入 App Group UserDefaults 的 `marketSnapshot`。
6. `WidgetCenter.shared.reloadTimelines(ofKind:)` 要求 Widget 更新。
7. Widget 沒有資料時顯示 sample placeholder；資料超過三小時會顯示「等待 App 更新」。

## 7. Simulator 測試

```bash
pnpm ios:sync
pnpm ios:open
```

在 Xcode：

1. 先執行 App scheme。
2. 確認首頁載入後 App Group 中出現 `marketSnapshot`。
3. 回到模擬器主畫面，長按 → `+` → 搜尋「台股開心農場戰場」。
4. 分別加入小型、中型、大型 Widget。
5. 點擊 Widget，確認 App 開啟並導航到 `/battle`。
6. 使用飛航模式確認網站顯示 PWA 離線頁、Widget 保留最後快照。

## 8. 實體 iPhone

1. App 與 Widget target 使用同一 Team。
2. 兩個 target 的 App Group capability 必須完全相同。
3. 用 USB 或 Xcode wireless debugging 選擇 iPhone。
4. 第一次安裝若為個人開發簽章，依 iPhone 提示信任開發者。
5. 確認 iPhone 能存取 `CAPACITOR_SERVER_URL`。
6. 測試背景／前景切換、deep link、三尺寸 Widget 與資料過舊提示。

## 9. 發佈前檢查

- 將 `CAPACITOR_SERVER_URL` 設為正式 HTTPS 網域。
- App target：`com.kuan.farmmarketbattle`。
- Widget target：`com.kuan.farmmarketbattle.widget`。
- App Group：`group.com.kuan.farmmarketbattle`。
- 確認 App Store Connect provisioning profile 包含 App Group。
- Archive 前執行 `pnpm typecheck && pnpm test && pnpm build && pnpm ios:sync`。
- 本專案未加入分析、廣告、券商登入或自動交易 SDK。
