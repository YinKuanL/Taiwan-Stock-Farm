import Capacitor

final class FarmBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(MarketSnapshotPlugin())
    }
}
