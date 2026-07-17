export default function Loading() {
  return (
    <main className="farm-loading" role="status" aria-label="正在載入市場農場">
      <section>
        <span className="loading-sun" />
        <div className="loading-cloud"><i /><i /></div>
        <div className="loading-hill one" /><div className="loading-hill two" />
        <div className="loading-barn"><i /></div>
        <div className="loading-crops">||||||||||||</div>
      </section>
      <div><strong>正在打開農場大門</strong><span>市場資料尚未送達，雞群正在確認風向…</span><i /></div>
    </main>
  );
}
