import { spawnSync } from "node:child_process";
import process from "node:process";

const action = process.argv[2];
const supported = new Set(["add", "sync", "open", "run"]);
if (!supported.has(action)) {
  console.error("Usage: node scripts/ios-command.mjs <add|sync|open|run>");
  process.exit(1);
}

if ((action === "add" || action === "sync" || action === "run") && !process.env.CAPACITOR_SERVER_URL) {
  console.error("CAPACITOR_SERVER_URL is required. Copy .env.example to .env.local and set the deployed HTTPS URL or a device-reachable LAN URL.");
  process.exit(1);
}

const executable = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(executable, ["cap", action, "ios"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
