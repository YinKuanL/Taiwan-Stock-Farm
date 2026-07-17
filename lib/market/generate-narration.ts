import type { MarketSnapshot } from "@/lib/market/types";

const copy = {
  celebration: ["金色陽光灑過稻田，牛軍穿越玉米田，整座農場正在舉行豐收慶典。", "多軍把旗幟插上穀倉，雞群沿著成熟稻穗巡田，今天的農場格外熱鬧。"],
  bull: ["牛群穩穩向前巡邏，新芽沿著田埂長高，農場吹著偏暖的順風。", "陽光替作物補足能量，多軍守住前線，農夫繼續照顧剛冒出的嫩芽。"],
  neutral: ["多空雙方仍在田邊拉鋸，羊群保持觀望，市場尚未決定下一陣風。", "風車慢慢轉動，雞群四處巡田，牛熊隔著田埂等待新的訊號。"],
  bear: ["烏雲從山後壓近，熊軍沿著田埂推進，農夫先把播種工具收進穀倉。", "冷風吹彎作物，烏鴉繞過農舍上空，農場正提高警戒。"],
  panic: ["收割警報響起，收割機駛入韭菜田；場面誇張但安全，農夫正忙著守住穀倉。", "風暴讓韭菜田整排彎腰，熊軍逼近前線，農場進入最高防守狀態。"],
} as const;

export function generateNarration(snapshot: Pick<MarketSnapshot, "farmMood" | "tradingDate">) {
  const choices = copy[snapshot.farmMood];
  const seed = [...snapshot.tradingDate].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return choices[seed % choices.length];
}
