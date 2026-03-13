#!/usr/bin/env tsx
/**
 * Debug script — tests all Amplitude API endpoints and prints raw responses.
 * Usage:  yarn debug
 *         yarn debug --raw        (print full response bodies)
 */
import { readConfig } from "../src/lib/config.js"

const showRaw = process.argv.includes("--raw")

function authHeader(apiKey: string, apiSecret: string): string {
    return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`
}

async function probe(label: string, url: string, init: RequestInit = {}): Promise<void> {
    process.stdout.write(`\n  ${label}\n  ${url}\n`)
    try {
        const res = await fetch(url, init)
        const body = await res.text()
        const isJson = body.trimStart().startsWith("{") || body.trimStart().startsWith("[")
        const preview = showRaw ? body : body.slice(0, 200).replace(/\s+/g, " ")

        const statusColor = res.ok ? "\x1b[32m" : "\x1b[31m"
        const reset = "\x1b[0m"
        console.log(`  Status  : ${statusColor}${res.status} ${res.statusText}${reset}`)
        console.log(`  Content : ${res.headers.get("content-type") ?? "(none)"}`)
        console.log(`  JSON    : ${isJson ? "\x1b[32myes\x1b[0m" : "\x1b[31mno\x1b[0m"}`)
        console.log(`  Body    : ${preview}`)
    } catch (err) {
        console.log(`  \x1b[31mFetch error: ${err instanceof Error ? err.message : String(err)}\x1b[0m`)
    }
}

async function main(): Promise<void> {
    console.log("\n\x1b[1mAmplitude API Debug\x1b[0m")
    console.log("─".repeat(60))

    let config
    try {
        config = readConfig()
    } catch (err) {
        console.error(`\x1b[31mNo config found — run \`yarn dev\` and set up credentials first.\x1b[0m`)
        process.exit(1)
    }

    const apiKey = config.apiKey
    const apiSecret = config.apiSecret
    const baseUrl = config.baseUrl.replace(/\/+$/, "")
    const httpBaseUrl = config.httpBaseUrl.replace(/\/+$/, "")
    const auth = authHeader(apiKey, apiSecret)

    console.log(`\n  API Key     : ${apiKey.slice(0, 6)}${"*".repeat(Math.max(0, apiKey.length - 6))}`)
    console.log(`  Taxonomy    : ${baseUrl}`)
    console.log(`  HTTP Track  : ${httpBaseUrl}`)

    console.log("\n\x1b[1mTaxonomy API (Basic auth, apiKey:apiSecret)\x1b[0m")
    console.log("─".repeat(60))

    await probe(
        "GET taxonomy events",
        `${baseUrl}/api/2/taxonomy/event`,
        { headers: { Authorization: auth } }
    )

    await probe(
        "GET taxonomy events  (alternate path without /api)",
        `${baseUrl}/2/taxonomy/event`,
        { headers: { Authorization: auth } }
    )

    console.log("\n\x1b[1mHTTP Tracking API (api_key in body)\x1b[0m")
    console.log("─".repeat(60))

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
                    insert_id: `debug-${Date.now()}`,
                }],
            }),
        }
    )

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
                    insert_id: `debug-${Date.now()}-2`,
                }],
            }),
        }
    )

    console.log("\n" + "─".repeat(60))
    console.log("Done. Use --raw to see full response bodies.\n")
}

main().catch((err) => { console.error(err); process.exit(1) })
