import { getStockCandles } from "@/lib/data/candleAdapter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim() ?? "";
  if (!/^\d{4}$/.test(code)) {
    return Response.json({ message: "請提供四位數上市股票代碼" }, { status: 400 });
  }
  const data = await getStockCandles(code);
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
