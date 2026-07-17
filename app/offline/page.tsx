import { CloudOff, RefreshCw, Sprout } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section>
        <span className="offline-brand"><Sprout /> FARM MARKET BATTLE</span>
        <div className="offline-icon"><CloudOff /></div>
        <p className="eyebrow">FARM SIGNAL LOST</p>
        <h1>農場通訊暫時中斷，<br />雞群正在尋找訊號。</h1>
        <p>網路恢復後重新整理，就能回到最新市場戰場；Widget 仍會保留最後一次成功快照。</p>
        <Link href="/"><RefreshCw />重新連線</Link>
      </section>
    </main>
  );
}
