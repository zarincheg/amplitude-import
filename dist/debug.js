#!/usr/bin/env tsx
#!/usr/bin/env node
import {
  readConfig
} from "./chunk-PK5MXZU5.js";

// scripts/debug-api.ts
var showRaw = process.argv.includes("--raw");
function authHeader(apiKey, apiSecret) {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}
async function probe(label, url, init = {}) {
  process.stdout.write(`
  ${label}
  ${url}
`);
  try {
    const res = await fetch(url, init);
    const body = await res.text();
    const isJson = body.trimStart().startsWith("{") || body.trimStart().startsWith("[");
    const preview = showRaw ? body : body.slice(0, 200).replace(/\s+/g, " ");
    const statusColor = res.ok ? "\x1B[32m" : "\x1B[31m";
    const reset = "\x1B[0m";
    console.log(`  Status  : ${statusColor}${res.status} ${res.statusText}${reset}`);
    console.log(`  Content : ${res.headers.get("content-type") ?? "(none)"}`);
    console.log(`  JSON    : ${isJson ? "\x1B[32myes\x1B[0m" : "\x1B[31mno\x1B[0m"}`);
    console.log(`  Body    : ${preview}`);
  } catch (err) {
    console.log(`  \x1B[31mFetch error: ${err instanceof Error ? err.message : String(err)}\x1B[0m`);
  }
}
async function main() {
  console.log("\n\x1B[1mAmplitude API Debug\x1B[0m");
  console.log("\u2500".repeat(60));
  let config;
  try {
    config = readConfig();
  } catch (err) {
    console.error(`\x1B[31mNo config found \u2014 run \`yarn dev\` and set up credentials first.\x1B[0m`);
    process.exit(1);
  }
  const apiKey = config.apiKey;
  const apiSecret = config.apiSecret;
  const baseUrl = config.baseUrl.replace(/\/+$/, "");
  const httpBaseUrl = config.httpBaseUrl.replace(/\/+$/, "");
  const auth = authHeader(apiKey, apiSecret);
  console.log(`
  API Key     : ${apiKey.slice(0, 6)}${"*".repeat(Math.max(0, apiKey.length - 6))}`);
  console.log(`  Taxonomy    : ${baseUrl}`);
  console.log(`  HTTP Track  : ${httpBaseUrl}`);
  console.log("\n\x1B[1mTaxonomy API (Basic auth, apiKey:apiSecret)\x1B[0m");
  console.log("\u2500".repeat(60));
  await probe(
    "GET taxonomy events",
    `${baseUrl}/api/2/taxonomy/event`,
    { headers: { Authorization: auth } }
  );
  await probe(
    "GET taxonomy events  (alternate path without /api)",
    `${baseUrl}/2/taxonomy/event`,
    { headers: { Authorization: auth } }
  );
  console.log("\n\x1B[1mHTTP Tracking API (api_key in body)\x1B[0m");
  console.log("\u2500".repeat(60));
  await probe(
    "POST track event",
    `${httpBaseUrl}/2/httpapi`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        events: [{
          user_id: "debug-user-001",
          event_type: "[Amplitude] Debug Test",
          time: Date.now(),
          insert_id: `debug-${Date.now()}`
        }]
      })
    }
  );
  await probe(
    "POST track event  (alternate path without /2)",
    `${httpBaseUrl}/httpapi`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        events: [{
          user_id: "debug-user-001",
          event_type: "[Amplitude] Debug Test",
          time: Date.now(),
          insert_id: `debug-${Date.now()}-2`
        }]
      })
    }
  );
  console.log("\n" + "\u2500".repeat(60));
  console.log("Done. Use --raw to see full response bodies.\n");
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
