const taipeiMarketFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const taipeiQuoteFormatter = new Intl.DateTimeFormat("zh-TW", {
  timeZone: "Asia/Taipei",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function dateFromIso(isoTimestamp: string): Date | null {
  const parsed = new Date(isoTimestamp);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parts(formatter: Intl.DateTimeFormat, date: Date) {
  return Object.fromEntries(
    formatter.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
}

export function formatMarketUpdatedAt(isoTimestamp: string): string {
  const parsed = dateFromIso(isoTimestamp);
  if (!parsed) return "--/-- --:--";
  const value = parts(taipeiMarketFormatter, parsed);
  return `${value.month}/${value.day} ${value.hour}:${value.minute}`;
}

export function formatTaipeiQuoteTime(isoTimestamp: string): string {
  const parsed = dateFromIso(isoTimestamp);
  if (!parsed) return "--:--:--";
  const value = parts(taipeiQuoteFormatter, parsed);
  return `${value.hour}:${value.minute}:${value.second}`;
}

