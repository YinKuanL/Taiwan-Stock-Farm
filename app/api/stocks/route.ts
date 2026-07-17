import { searchListedStocks } from "@/lib/data/researchAdapter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 30) ?? "";
  const data = await searchListedStocks(query);
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}

