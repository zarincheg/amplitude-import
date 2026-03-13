import React from "react"
import { Box, Text } from "ink"
import SelectInput from "ink-select-input"
import { Header } from "../components/Header.js"
import { type Config, type ConnectionStatus } from "../lib/config.js"

export type Screen = "menu" | "settings" | "import" | "track"

type Props = {
    config: Config | null
    onSelect: (screen: Screen) => void
}

const STATUS_ICON: Record<ConnectionStatus, string> = {
    ok: "✓",
    error: "✗",
    untested: "○",
}

const STATUS_COLOR: Record<ConnectionStatus, string> = {
    ok: "green",
    error: "red",
    untested: "yellow",
}

const items = [
    { label: "Import from CSV", value: "import" as Screen },
    { label: "Track Test Event", value: "track" as Screen },
    { label: "Settings", value: "settings" as Screen },
]

export function MainMenu({ config, onSelect }: Props): React.ReactElement {
    const status = config?.connectionStatus ?? "untested"

    return (
        <Box flexDirection="column">
            <Header />
            <Box flexDirection="column" marginBottom={1}>
                {config ? (
                    <>
                        <Box gap={2}>
                            <Text dimColor>API Key</Text>
                            <Text>{config.apiKey.slice(0, 6)}{"*".repeat(Math.max(0, config.apiKey.length - 6))}</Text>
                        </Box>
                        <Box gap={2}>
                            <Text dimColor>Base URL</Text>
                            <Text>{config.baseUrl}</Text>
                        </Box>
                        <Box gap={2}>
                            <Text dimColor>Connection</Text>
                            <Text color={STATUS_COLOR[status]}>
                                {STATUS_ICON[status]}{" "}
                                {status === "ok" && "Connected"}
                                {status === "error" && `Failed — ${config.connectionError ?? "unknown error"}`}
                                {status === "untested" && "Not tested yet"}
                            </Text>
                        </Box>
                        {config.connectionTestedAt && (
                            <Box gap={2}>
                                <Text dimColor>Last tested</Text>
                                <Text dimColor>{new Date(config.connectionTestedAt).toLocaleString()}</Text>
                            </Box>
                        )}
                    </>
                ) : (
                    <Text color="yellow">⚠ No credentials configured — go to Settings first.</Text>
                )}
            </Box>
            <Text dimColor>{"─".repeat(40)}</Text>
            <Box marginTop={1}>
                <SelectInput
                    items={items}
                    onSelect={(item) => onSelect(item.value)}
                />
            </Box>
            <Text dimColor>↑↓ navigate · Enter select · Ctrl+C quit</Text>
        </Box>
    )
}
