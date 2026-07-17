export function marketApiUrl() {
  const configured = process.env.NEXT_PUBLIC_MARKET_API_URL?.trim();
  return configured || "/api/market";
}
