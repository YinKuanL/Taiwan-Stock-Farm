import type { MarketSnapshot } from "@/lib/types/market";

export function createNarration(snapshot: MarketSnapshot, detailed = false) {
  const lead = {
    celebration: "金色稻穗灑滿田野，多軍吹響豐收號角，整座農場正在慶典中。",
    bull: "今天多軍穿過玉米田向前推進，太陽露臉，作物跟著市場動能抬頭。",
    bear: "熊軍帶著烏雲壓過北邊田埂，韭菜迎風彎腰，農夫先把穀倉門關緊。",
    panic: "空軍突襲韭菜園，收割機轟隆進場；這是一場戲劇性十足的風險警報。",
    neutral: "多空雙方隔著田埂互看，羊群安靜吃草，市場還在等待下一陣風。",
  }[snapshot.farmMood];

  if (!detailed) return lead;

  const breadth = snapshot.advancersCount - snapshot.declinersCount;
  const breadthText =
    breadth > 0
      ? `上漲家數多出 ${breadth} 家，牛群的腳步比較整齊。`
      : breadth < 0
        ? `下跌家數多出 ${Math.abs(breadth)} 家，田間壓力不只集中在少數作物。`
        : "漲跌家數幾乎相當，兩邊都還沒搶下主導權。";

  return `${lead} 加權指數今日 ${snapshot.taiexChangePercent >= 0 ? "上漲" : "下跌"} ${Math.abs(snapshot.taiexChangePercent).toFixed(2)}%，${breadthText} 這是市場情緒的視覺故事，不是買賣指令。`;
}

