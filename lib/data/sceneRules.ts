import type { MarketSnapshot, SceneState } from "@/lib/types/market";

export function getSceneState(snapshot: MarketSnapshot): SceneState {
  const { farmMood, bullPower, harvestLevel, weatherLevel } = snapshot;
  const battleLine = Math.min(82, Math.max(18, bullPower));

  if (farmMood === "celebration") {
    return {
      sky: "golden",
      cropState: "harvest",
      windSpeed: 2.2,
      showHarvester: false,
      showCelebration: true,
      battleLine,
      label: "多軍豐收慶典",
      weatherLabel: "金色豐收日",
      advice: "今天適合把心情放晴，仍記得替風險留一塊休耕地。",
    };
  }

  if (farmMood === "panic") {
    return {
      sky: "storm",
      cropState: "harvest",
      windSpeed: 0.65,
      showHarvester: true,
      showCelebration: false,
      battleLine,
      label: `韭菜收割警報 Lv.${harvestLevel}`,
      weatherLabel: "金融強風暴",
      advice: "今天農場風勢很強，適合先顧好穀倉，不急著追著動物跑。",
    };
  }

  if (farmMood === "bear") {
    return {
      sky: weatherLevel >= 3 ? "storm" : "cloudy",
      cropState: harvestLevel >= 2 ? "bent" : "steady",
      windSpeed: 1,
      showHarvester: harvestLevel >= 2,
      showCelebration: false,
      battleLine,
      label: "熊軍推進中",
      weatherLabel: weatherLevel >= 3 ? "陰雨強風" : "多雲偏涼",
      advice: "今天適合先巡田、補圍籬，市場情緒偏向保守觀望。",
    };
  }

  if (farmMood === "bull") {
    return {
      sky: "sunny",
      cropState: "growing",
      windSpeed: 1.7,
      showHarvester: false,
      showCelebration: false,
      battleLine,
      label: "牛軍春耕推進",
      weatherLabel: "晴朗有風",
      advice: "今天田裡動能充足，適合保持節奏，也別忘了留意午後變天。",
    };
  }

  return {
    sky: "cloudy",
    cropState: "steady",
    windSpeed: 1.15,
    showHarvester: false,
    showCelebration: false,
    battleLine,
    label: "多空田埂拉鋸",
    weatherLabel: "晴時多雲",
    advice: "今天適合觀察土壤，不搶播種；羊群也還在等風向。",
  };
}

