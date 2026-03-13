import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export type ConnectionStatus = "ok" | "error" | "untested"

export type Config = {
    apiKey: string
    apiSecret: string
    /** Human-readable project name shown in the UI */
    projectName?: string
    /** Taxonomy API base URL  e.g. https://amplitude.com */
    baseUrl: string
    /** HTTP Tracking API base URL  e.g. https://api2.amplitude.com */
    httpBaseUrl: string
    connectionStatus: ConnectionStatus
    connectionTestedAt?: string
    connectionError?: string
}

export type RegionPreset = "US" | "EU" | "custom"

export const REGION_PRESETS: Record<Exclude<RegionPreset, "custom">, { baseUrl: string; httpBaseUrl: string; label: string }> = {
    US: {
        label: "US  (amplitude.com / api2.amplitude.com)",
        baseUrl: "https://amplitude.com",
        httpBaseUrl: "https://api2.amplitude.com",
    },
    EU: {
        label: "EU  (analytics.eu.amplitude.com / api.eu.amplitude.com)",
        baseUrl: "https://analytics.eu.amplitude.com",
        httpBaseUrl: "https://api.eu.amplitude.com",
    },
}

const CONFIG_DIR = join(homedir(), ".amplitude-import")
const CONFIG_PATH = join(CONFIG_DIR, "config.json")

export function configExists(): boolean {
    return existsSync(CONFIG_PATH)
}

export function readConfig(): Config {
    if (!configExists()) {
        throw new Error("No config found. Open Settings to configure credentials.")
    }
    const raw = readFileSync(CONFIG_PATH, "utf-8")
    const parsed = JSON.parse(raw) as Partial<Config>
    // Back-compat: configs written before httpBaseUrl was added
    if (!parsed.httpBaseUrl) {
        parsed.httpBaseUrl = "https://api2.amplitude.com"
    }
    return parsed as Config
}

export function writeConfig(config: Config): void {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true })
    }
    const clean: Config = {
        ...config,
        baseUrl: config.baseUrl.replace(/\/+$/, ""),
        httpBaseUrl: config.httpBaseUrl.replace(/\/+$/, ""),
    }
    writeFileSync(CONFIG_PATH, JSON.stringify(clean, null, 2), "utf-8")
}

export function getConfigPath(): string {
    return CONFIG_PATH
}
