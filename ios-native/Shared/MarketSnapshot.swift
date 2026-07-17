import Foundation

enum FarmMood: String, Codable {
    case celebration, bull, neutral, bear, panic
}

enum MarketDataStatus: String, Codable {
    case live, delayed, cached, demo, unavailable

    var displayName: String {
        switch self {
        case .live: return "即時"
        case .delayed: return "延遲"
        case .cached: return "快取"
        case .demo: return "示範資料"
        case .unavailable: return "無法更新"
        }
    }
}

struct StockMover: Codable, Hashable {
    let code: String
    let name: String
    let price: Double?
    let change: Double
    let changePercent: Double
}

struct MarketSnapshot: Codable, Hashable {
    let marketName: String
    let tradingDate: String
    let lastUpdated: String
    let status: MarketDataStatus
    let indexValue: Double?
    let indexChange: Double
    let indexChangePercent: Double
    let advancersCount: Int
    let declinersCount: Int
    let unchangedCount: Int
    let turnover: Double?
    let volume: Double?
    let topGainers: [StockMover]
    let topLosers: [StockMover]
    let sentimentScore: Int
    let bullPower: Int
    let bearPower: Int
    let harvestLevel: Int
    let weatherLevel: Int
    let farmMood: FarmMood
    let narration: String
    let sourceName: String
    let sourceNote: String

    var updateDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: lastUpdated) ?? ISO8601DateFormatter().date(from: lastUpdated)
    }

    var isStale: Bool {
        guard let updateDate else { return true }
        return Date().timeIntervalSince(updateDate) > 3 * 60 * 60
    }

    static let sample = MarketSnapshot(
        marketName: "臺灣證券交易所｜示範戰場",
        tradingDate: "2026-07-17",
        lastUpdated: ISO8601DateFormatter().string(from: Date()),
        status: .demo,
        indexValue: 42671.27,
        indexChange: -2953.71,
        indexChangePercent: -6.47,
        advancersCount: 154,
        declinersCount: 821,
        unchangedCount: 74,
        turnover: nil,
        volume: nil,
        topGainers: [StockMover(code: "2330", name: "台積電", price: 1000, change: 25, changePercent: 2.56)],
        topLosers: [StockMover(code: "2603", name: "長榮", price: 202, change: -13, changePercent: -6.05)],
        sentimentScore: -91,
        bullPower: 6,
        bearPower: 94,
        harvestLevel: 5,
        weatherLevel: 5,
        farmMood: .panic,
        narration: "收割警報響起，收割機駛入韭菜田，農場進入最高防守狀態。",
        sourceName: "Widget placeholder",
        sourceNote: "開啟 App 後會同步最新資料"
    )
}

enum SharedMarketStore {
    static let appGroup = "group.com.kuan.farmmarketbattle"
    static let snapshotKey = "marketSnapshot"

    static func load() -> MarketSnapshot? {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let json = defaults.string(forKey: snapshotKey),
            let data = json.data(using: .utf8)
        else { return nil }
        return try? JSONDecoder().decode(MarketSnapshot.self, from: data)
    }
}
