import React, { useState } from "react"
import { Box, Text, useInput } from "ink"
import SelectInput from "ink-select-input"
import TextInput from "ink-text-input"
import Spinner from "ink-spinner"
import { Header } from "../components/Header.js"
import { readConfig, writeConfig, configExists, REGION_PRESETS, type Config, type ConnectionStatus } from "../lib/config.js"
import { createAmplitudeClient } from "../lib/amplitude-client.js"

type Props = {
    onBack: (updatedConfig: Config | null) => void
}

type View =
    | "menu"
    | "edit-projectName"
    | "edit-apiKey"
    | "edit-apiSecret"
    | "edit-baseUrl"
    | "edit-httpBaseUrl"
    | "pick-region"
    | "testing"

const STATUS_ICON: Record<ConnectionStatus, string> = { ok: "✓", error: "✗", untested: "○" }
const STATUS_COLOR: Record<ConnectionStatus, string> = { ok: "green", error: "red", untested: "yellow" }

function emptyConfig(): Config {
    return {
        apiKey: "",
        apiSecret: "",
        baseUrl: REGION_PRESETS.US.baseUrl,
        httpBaseUrl: REGION_PRESETS.US.httpBaseUrl,
        connectionStatus: "untested",
    }
}

function loadConfig(): Config {
    if (configExists()) {
        try { return readConfig() } catch { /* fall through */ }
    }
    return emptyConfig()
}

// Isolated text field — no SelectInput rendered alongside
function EditField({ label, current, mask, hint, onSave, onBack }: {
    label: string
    current: string
    mask?: string
    hint?: string
    onSave: (val: string) => void
    onBack: () => void
}): React.ReactElement {
    const [value, setValue] = useState(current)
    useInput((_, key) => { if (key.escape) onBack() })
    return (
        <Box flexDirection="column" gap={1}>
            <Header subtitle={`Settings › ${label}`} />
            <Box gap={1}>
                <Text bold>{label}: </Text>
                <TextInput value={value} onChange={setValue} mask={mask} onSubmit={(v) => { if (v.trim()) onSave(v.trim()); else onBack() }} />
            </Box>
            {hint && <Text dimColor>{hint}</Text>}
            <Text dimColor>Enter to save · Esc or empty to cancel</Text>
        </Box>
    )
}

export function SettingsScreen({ onBack }: Props): React.ReactElement {
    const [config, setConfig] = useState<Config>(loadConfig)
    const [view, setView] = useState<View>("menu")

    function save(updated: Config): void {
        writeConfig(updated)
        setConfig(updated)
    }

    function resetConnectionStatus(partial: Partial<Config>): Config {
        return { ...config, ...partial, connectionStatus: "untested", connectionTestedAt: undefined, connectionError: undefined }
    }

    async function runTest(): Promise<void> {
        setView("testing")
        try {
            const client = createAmplitudeClient(config)
            await client.testConnection()
            save({ ...config, connectionStatus: "ok", connectionTestedAt: new Date().toISOString(), connectionError: undefined })
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            save({ ...config, connectionStatus: "error", connectionTestedAt: new Date().toISOString(), connectionError: msg })
        }
        setView("menu")
    }

    // ── Region picker ─────────────────────────────────────────────────────────
    if (view === "pick-region") {
        const regionItems = [
            { label: REGION_PRESETS.US.label, value: "US" as const },
            { label: REGION_PRESETS.EU.label, value: "EU" as const },
            { label: "← Back", value: "back" as const },
        ]
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Settings › Region" />
                <SelectInput
                    items={regionItems}
                    onSelect={(item) => {
                        if (item.value === "back") { setView("menu"); return }
                        const preset = REGION_PRESETS[item.value]
                        save(resetConnectionStatus({ baseUrl: preset.baseUrl, httpBaseUrl: preset.httpBaseUrl }))
                        setView("menu")
                    }}
                />
                <Text dimColor>↑↓ navigate · Enter select</Text>
            </Box>
        )
    }

    // ── Field editors ─────────────────────────────────────────────────────────
    if (view === "edit-projectName") {
        return (
            <EditField
                label="Project Name"
                current={config.projectName ?? ""}
                hint="A label to identify which Amplitude project these credentials belong to"
                onSave={(v) => { save({ ...config, projectName: v }); setView("menu") }}
                onBack={() => setView("menu")}
            />
        )
    }
    if (view === "edit-apiKey") {
        return <EditField label="API Key" current={config.apiKey} onSave={(v) => { save(resetConnectionStatus({ apiKey: v })); setView("menu") }} onBack={() => setView("menu")} />
    }
    if (view === "edit-apiSecret") {
        return <EditField label="API Secret" current={config.apiSecret} mask="*" onSave={(v) => { save(resetConnectionStatus({ apiSecret: v })); setView("menu") }} onBack={() => setView("menu")} />
    }
    if (view === "edit-baseUrl") {
        return (
            <EditField
                label="Taxonomy Base URL"
                current={config.baseUrl}
                hint="Used for taxonomy API calls  e.g. https://amplitude.com or https://analytics.eu.amplitude.com"
                onSave={(v) => { save(resetConnectionStatus({ baseUrl: v })); setView("menu") }}
                onBack={() => setView("menu")}
            />
        )
    }
    if (view === "edit-httpBaseUrl") {
        return (
            <EditField
                label="HTTP Tracking Base URL"
                current={config.httpBaseUrl}
                hint="Used for tracking events  e.g. https://api2.amplitude.com or https://api.eu.amplitude.com"
                onSave={(v) => { save(resetConnectionStatus({ httpBaseUrl: v })); setView("menu") }}
                onBack={() => setView("menu")}
            />
        )
    }

    // ── Testing ───────────────────────────────────────────────────────────────
    if (view === "testing") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Settings" />
                <Box gap={1}>
                    <Text color="cyan"><Spinner type="dots" /></Text>
                    <Text>Testing connection to {config.baseUrl}…</Text>
                </Box>
            </Box>
        )
    }

    // ── Main menu ─────────────────────────────────────────────────────────────
    const status = config.connectionStatus
    const menuItems = [
        { label: `Edit Project Name    ${config.projectName ?? "(not set)"}`, value: "edit-projectName" },
        { label: `Edit API Key         ${config.apiKey ? config.apiKey.slice(0, 6) + "…" : "(not set)"}`, value: "edit-apiKey" },
        { label: `Edit API Secret      ${config.apiSecret ? "•".repeat(8) : "(not set)"}`, value: "edit-apiSecret" },
        { label: "Set Region           (sets both URLs)", value: "pick-region" },
        { label: `Edit Taxonomy URL    ${config.baseUrl}`, value: "edit-baseUrl" },
        { label: `Edit HTTP Track URL  ${config.httpBaseUrl}`, value: "edit-httpBaseUrl" },
        { label: "Test Connection", value: "test" },
        { label: "← Back", value: "back" },
    ]

    return (
        <Box flexDirection="column">
            <Header subtitle="Settings" />
            <Box flexDirection="column" marginBottom={1}>
                <Box gap={2}>
                    <Text dimColor>Project     </Text>
                    <Text>{config.projectName ?? <Text dimColor>(not set)</Text>}</Text>
                </Box>
                <Box gap={2}>
                    <Text dimColor>Connection  </Text>
                    <Text color={STATUS_COLOR[status]}>
                        {STATUS_ICON[status]}{" "}
                        {status === "ok" && "OK"}
                        {status === "error" && (config.connectionError ?? "Error")}
                        {status === "untested" && "Not tested"}
                    </Text>
                </Box>
                {config.connectionTestedAt && (
                    <Box gap={2}>
                        <Text dimColor>Tested at   </Text>
                        <Text dimColor>{new Date(config.connectionTestedAt).toLocaleString()}</Text>
                    </Box>
                )}
                <Box gap={2}>
                    <Text dimColor>Taxonomy    </Text>
                    <Text dimColor>{config.baseUrl}</Text>
                </Box>
                <Box gap={2}>
                    <Text dimColor>HTTP Track  </Text>
                    <Text dimColor>{config.httpBaseUrl}</Text>
                </Box>
            </Box>
            <Text dimColor>{"─".repeat(40)}</Text>
            <Box marginTop={1}>
                <SelectInput
                    items={menuItems}
                    onSelect={(item) => {
                        if (item.value === "back") onBack(config)
                        else if (item.value === "test") void runTest()
                        else setView(item.value as View)
                    }}
                />
            </Box>
            <Text dimColor>↑↓ navigate · Enter select</Text>
        </Box>
    )
}
