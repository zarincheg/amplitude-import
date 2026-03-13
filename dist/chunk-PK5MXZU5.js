#!/usr/bin/env node

// src/lib/config.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
var REGION_PRESETS = {
  US: {
    label: "US  (amplitude.com / api2.amplitude.com)",
    baseUrl: "https://amplitude.com",
    httpBaseUrl: "https://api2.amplitude.com"
  },
  EU: {
    label: "EU  (analytics.eu.amplitude.com / api.eu.amplitude.com)",
    baseUrl: "https://analytics.eu.amplitude.com",
    httpBaseUrl: "https://api.eu.amplitude.com"
  }
};
var CONFIG_DIR = join(homedir(), ".amplitude-import");
var CONFIG_PATH = join(CONFIG_DIR, "config.json");
function configExists() {
  return existsSync(CONFIG_PATH);
}
function readConfig() {
  if (!configExists()) {
    throw new Error("No config found. Open Settings to configure credentials.");
  }
  const raw = readFileSync(CONFIG_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  if (!parsed.httpBaseUrl) {
    parsed.httpBaseUrl = "https://api2.amplitude.com";
  }
  return parsed;
}
function writeConfig(config) {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  const clean = {
    ...config,
    baseUrl: config.baseUrl.replace(/\/+$/, ""),
    httpBaseUrl: config.httpBaseUrl.replace(/\/+$/, "")
  };
  writeFileSync(CONFIG_PATH, JSON.stringify(clean, null, 2), "utf-8");
}

export {
  REGION_PRESETS,
  configExists,
  readConfig,
  writeConfig
};
