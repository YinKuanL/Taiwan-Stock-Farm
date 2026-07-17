import type { FarmSceneState, MarketSnapshot } from "@/lib/market/types";

export function calculateScene(snapshot: MarketSnapshot): FarmSceneState {
  switch (snapshot.farmMood) {
    case "celebration":
      return { sky: "golden", crops: "ripe", animalActivity: "high", windIntensity: 3, showHarvester: false, showCelebration: true, showCrows: false, label: "慶典大多頭" };
    case "bull":
      return { sky: "sunny", crops: "growing", animalActivity: "high", windIntensity: 2, showHarvester: false, showCelebration: false, showCrows: false, label: "多軍春耕" };
    case "bear":
      return { sky: "cloudy", crops: "bent", animalActivity: "sheltering", windIntensity: Math.max(3, snapshot.weatherLevel) as 3 | 4 | 5, showHarvester: false, showCelebration: false, showCrows: true, label: "熊軍壓境" };
    case "panic":
      return { sky: "storm", crops: "harvest", animalActivity: "sheltering", windIntensity: 5, showHarvester: true, showCelebration: false, showCrows: true, label: "韭菜收割警報" };
    default:
      return { sky: "mixed", crops: "steady", animalActivity: "watching", windIntensity: 1, showHarvester: false, showCelebration: false, showCrows: snapshot.weatherLevel >= 3, label: "多空田埂拉鋸" };
  }
}
