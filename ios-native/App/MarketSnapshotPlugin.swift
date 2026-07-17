import Capacitor
import Foundation
import WidgetKit

@objc(MarketSnapshotPlugin)
public final class MarketSnapshotPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "MarketSnapshotPlugin"
    public let jsName = "MarketSnapshot"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "saveSnapshot", returnType: CAPPluginReturnPromise)
    ]

    @objc func saveSnapshot(_ call: CAPPluginCall) {
        guard
            let json = call.getString("snapshot"),
            let data = json.data(using: .utf8)
        else {
            call.reject("snapshot must be a UTF-8 JSON string")
            return
        }

        do {
            _ = try JSONDecoder().decode(MarketSnapshot.self, from: data)
            guard let defaults = UserDefaults(suiteName: SharedMarketStore.appGroup) else {
                call.reject("App Group is not configured for the App target")
                return
            }
            defaults.set(json, forKey: SharedMarketStore.snapshotKey)
            defaults.set(Date(), forKey: "marketSnapshotSavedAt")
            WidgetCenter.shared.reloadTimelines(ofKind: "FarmMarketBattleWidget")
            call.resolve(["saved": true])
        } catch {
            call.reject("MarketSnapshot validation failed", nil, error)
        }
    }
}
