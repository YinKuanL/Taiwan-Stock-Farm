import { getMarketSnapshot } from "@/lib/market/market-provider";

export const dynamic = "force-dynamic";
const requestWindows = new Map<string, { count: number; resetAt: number }>();

export async function GET(request: Request) {
  const now = Date.now();
  const client = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const current = requestWindows.get(client);
  const windowState = !current || current.resetAt <= now ? { count: 1, resetAt: now + 60_000 } : { ...current, count: current.count + 1 };
  requestWindows.set(client, windowState);
  if (requestWindows.size > 500) for (const [key, value] of requestWindows) if (value.resetAt <= now) requestWindows.delete(key);
  if (windowState.count > 60) return Response.json({ message: "農場更新太頻繁，請稍後再試" }, { status: 429, headers: { "Retry-After": "60" } });
  const data = await getMarketSnapshot();
  return Response.json(data, {
    headers: {
      "Cache-Control": data.status === "live" ? "public, max-age=0, s-maxage=5, stale-while-revalidate=10" : "no-store, max-age=0",
    },
  });
}
