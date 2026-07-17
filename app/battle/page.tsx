import FarmMarketBattle from "@/components/FarmMarketBattle";
import { getMarketSnapshot } from "@/lib/market/market-provider";
import { toLegacyMarketSnapshot } from "@/lib/market/normalize-market-data";

export default async function BattlePage() {
  const snapshot = await getMarketSnapshot();
  return <FarmMarketBattle initialData={toLegacyMarketSnapshot(snapshot)} initialSection="battle" />;
}
