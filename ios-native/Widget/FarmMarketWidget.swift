import SwiftUI
import WidgetKit

private let widgetKind = "FarmMarketBattleWidget"

struct FarmMarketEntry: TimelineEntry {
    let date: Date
    let snapshot: MarketSnapshot
    let hasSharedData: Bool
}

struct FarmMarketProvider: TimelineProvider {
    func placeholder(in context: Context) -> FarmMarketEntry {
        FarmMarketEntry(date: Date(), snapshot: .sample, hasSharedData: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (FarmMarketEntry) -> Void) {
        let snapshot = SharedMarketStore.load() ?? .sample
        completion(FarmMarketEntry(date: Date(), snapshot: snapshot, hasSharedData: SharedMarketStore.load() != nil))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<FarmMarketEntry>) -> Void) {
        let shared = SharedMarketStore.load()
        let entry = FarmMarketEntry(date: Date(), snapshot: shared ?? .sample, hasSharedData: shared != nil)
        let nextRefresh = Calendar.current.date(byAdding: .minute, value: shared?.status == .live ? 15 : 45, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
}

struct FarmMarketWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: FarmMarketEntry

    var body: some View {
        Group {
            switch family {
            case .systemSmall: SmallFarmWidget(entry: entry)
            case .systemMedium: MediumFarmWidget(entry: entry)
            default: LargeFarmWidget(entry: entry)
            }
        }
        .widgetURL(URL(string: "farmmarketbattle://battle"))
        .farmWidgetBackground()
    }
}

private struct SmallFarmWidget: View {
    let entry: FarmMarketEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                MoodMark(mood: entry.snapshot.farmMood, compact: true)
                Spacer()
                StatusPill(entry: entry)
            }
            Text(moodTitle(entry.snapshot.farmMood)).font(.caption.bold()).foregroundStyle(.secondary)
            Text(percent(entry.snapshot.indexChangePercent))
                .font(.system(size: 29, weight: .bold, design: .rounded))
                .foregroundStyle(marketColor(entry.snapshot.indexChangePercent))
                .minimumScaleFactor(0.7)
            PowerBars(snapshot: entry.snapshot)
            Text(updateLabel(entry)).font(.system(size: 9)).foregroundStyle(.secondary)
        }
        .padding(14)
    }
}

private struct MediumFarmWidget: View {
    let entry: FarmMarketEntry
    var body: some View {
        HStack(spacing: 14) {
            MiniFarmScene(snapshot: entry.snapshot)
                .frame(width: 126)
            VStack(alignment: .leading, spacing: 7) {
                HStack { Text(moodTitle(entry.snapshot.farmMood)).font(.headline); Spacer(); StatusPill(entry: entry) }
                Text("TAIEX  \(index(entry.snapshot.indexValue))")
                    .font(.caption.monospacedDigit()).foregroundStyle(.secondary)
                Text("\(signed(entry.snapshot.indexChange))  \(percent(entry.snapshot.indexChangePercent))")
                    .font(.title3.bold()).foregroundStyle(marketColor(entry.snapshot.indexChangePercent))
                PowerBars(snapshot: entry.snapshot)
                HStack { Label("\(entry.snapshot.advancersCount)", systemImage: "arrow.up"); Label("\(entry.snapshot.declinersCount)", systemImage: "arrow.down") }
                    .font(.caption2).foregroundStyle(.secondary)
            }
        }
        .padding(14)
    }
}

private struct LargeFarmWidget: View {
    let entry: FarmMarketEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("FARM MARKET BATTLE").font(.system(size: 10, weight: .black)).tracking(1.2).foregroundStyle(.secondary)
                    Text(moodTitle(entry.snapshot.farmMood)).font(.title3.bold())
                }
                Spacer(); StatusPill(entry: entry)
            }
            MiniFarmScene(snapshot: entry.snapshot).frame(height: 94)
            HStack(alignment: .firstTextBaseline) {
                Text(index(entry.snapshot.indexValue)).font(.system(size: 27, weight: .bold, design: .rounded)).monospacedDigit()
                Text("\(signed(entry.snapshot.indexChange))  \(percent(entry.snapshot.indexChangePercent))").font(.caption.bold()).foregroundStyle(marketColor(entry.snapshot.indexChangePercent))
                Spacer(); Text("收割 Lv.\(entry.snapshot.harvestLevel)").font(.caption2.bold()).foregroundStyle(.orange)
            }
            PowerBars(snapshot: entry.snapshot)
            Text(entry.snapshot.narration).font(.caption).foregroundStyle(.secondary).lineLimit(2)
            HStack(spacing: 9) {
                MoverChip(title: "豐收", mover: entry.snapshot.topGainers.first, positive: true)
                MoverChip(title: "收割", mover: entry.snapshot.topLosers.first, positive: false)
            }
            HStack { Text("上漲 \(entry.snapshot.advancersCount)  ·  下跌 \(entry.snapshot.declinersCount)  ·  平盤 \(entry.snapshot.unchangedCount)"); Spacer(); Text(updateLabel(entry)) }
                .font(.system(size: 9)).foregroundStyle(.secondary)
        }
        .padding(15)
    }
}

private struct MiniFarmScene: View {
    let snapshot: MarketSnapshot
    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .bottom) {
                LinearGradient(colors: skyColors(snapshot.farmMood), startPoint: .top, endPoint: .bottom)
                Circle().fill(snapshot.farmMood == .panic ? Color.gray.opacity(0.25) : Color.yellow.opacity(0.85))
                    .frame(width: 27, height: 27).position(x: proxy.size.width * 0.22, y: 23)
                Ellipse().fill(Color.green.opacity(0.72)).frame(width: proxy.size.width * 1.3, height: 72).offset(y: 35)
                HStack(alignment: .bottom, spacing: 5) {
                    Image(systemName: snapshot.farmMood == .bear || snapshot.farmMood == .panic ? "cloud.rain.fill" : "sun.max.fill")
                    Spacer()
                    Image(systemName: snapshot.farmMood == .panic ? "car.side.fill" : snapshot.bullPower >= snapshot.bearPower ? "hare.fill" : "tortoise.fill")
                    Image(systemName: "house.and.flag.fill")
                }
                .font(.title3).foregroundStyle(.white.opacity(0.9)).padding(12)
            }
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
    }
}

private struct PowerBars: View {
    let snapshot: MarketSnapshot
    var body: some View {
        VStack(spacing: 4) {
            GeometryReader { proxy in
                HStack(spacing: 2) {
                    Capsule().fill(Color.green).frame(width: max(4, proxy.size.width * CGFloat(snapshot.bullPower) / 100))
                    Capsule().fill(Color.purple.opacity(0.72))
                }
            }.frame(height: 6)
            HStack { Text("牛 \(snapshot.bullPower)%"); Spacer(); Text("熊 \(snapshot.bearPower)%") }.font(.system(size: 9, weight: .semibold)).foregroundStyle(.secondary)
        }
    }
}

private struct MoodMark: View {
    let mood: FarmMood
    var compact = false
    var body: some View {
        Image(systemName: mood == .celebration ? "sparkles" : mood == .bull ? "sun.max.fill" : mood == .neutral ? "arrow.left.and.right" : mood == .bear ? "cloud.fill" : "cloud.bolt.rain.fill")
            .font(compact ? .headline : .title2).foregroundStyle(mood == .panic ? .orange : .green)
    }
}

private struct StatusPill: View {
    let entry: FarmMarketEntry
    var body: some View {
        Text(!entry.hasSharedData ? "等待 App" : entry.snapshot.isStale ? "等待更新" : entry.snapshot.status.displayName)
            .font(.system(size: 8, weight: .bold)).padding(.horizontal, 6).padding(.vertical, 4)
            .background(.white.opacity(0.64), in: Capsule())
    }
}

private struct MoverChip: View {
    let title: String
    let mover: StockMover?
    let positive: Bool
    var body: some View {
        HStack { Text(title); Spacer(); Text(mover.map { "\($0.code) \(percent($0.changePercent))" } ?? "—") }
            .font(.system(size: 9, weight: .semibold)).padding(7)
            .background((positive ? Color.green : Color.orange).opacity(0.1), in: RoundedRectangle(cornerRadius: 8))
    }
}

private extension View {
    @ViewBuilder func farmWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            containerBackground(for: .widget) { Color(red: 0.96, green: 0.95, blue: 0.89) }
        } else {
            background(Color(red: 0.96, green: 0.95, blue: 0.89))
        }
    }
}

private func moodTitle(_ mood: FarmMood) -> String {
    switch mood { case .celebration: return "豐收慶典"; case .bull: return "多軍春耕"; case .neutral: return "田埂拉鋸"; case .bear: return "熊軍壓境"; case .panic: return "收割警報" }
}
private func marketColor(_ value: Double) -> Color { value >= 0 ? Color(red: 0.76, green: 0.26, blue: 0.22) : Color(red: 0.16, green: 0.49, blue: 0.28) }
private func percent(_ value: Double) -> String { String(format: "%@%.2f%%", value >= 0 ? "+" : "", value) }
private func signed(_ value: Double) -> String { String(format: "%@%.2f", value >= 0 ? "+" : "", value) }
private func index(_ value: Double?) -> String { value.map { String(format: "%.2f", $0) } ?? "—" }
private func skyColors(_ mood: FarmMood) -> [Color] { mood == .panic ? [.gray, .indigo.opacity(0.8)] : mood == .bear ? [.gray.opacity(0.8), .green.opacity(0.55)] : mood == .celebration ? [.orange.opacity(0.75), .yellow.opacity(0.55)] : [.cyan.opacity(0.65), .green.opacity(0.55)] }
private func updateLabel(_ entry: FarmMarketEntry) -> String { !entry.hasSharedData ? "開啟 App 取得資料" : entry.snapshot.isStale ? "等待 App 更新" : "更新 \(entry.snapshot.tradingDate)" }

@main
struct FarmMarketWidgetBundle: WidgetBundle {
    var body: some Widget { FarmMarketWidget() }
}

struct FarmMarketWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: widgetKind, provider: FarmMarketProvider()) { entry in
            FarmMarketWidgetView(entry: entry)
        }
        .configurationDisplayName("台股開心農場戰場")
        .description("用農場場景查看最新台股多空與收割等級。")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
