import { getRealtimeIndexQuote } from "@/lib/data/realtimeAdapter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(await getRealtimeIndexQuote(), {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.warn("Realtime index request failed:", error);
    return Response.json({ message: "即時加權指數暫時無法取得" }, { status: 503 });
  }
}
