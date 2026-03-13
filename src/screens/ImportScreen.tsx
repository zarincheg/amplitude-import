import React, { useState, useEffect } from "react"
import { Box, Text, useInput } from "ink"
import TextInput from "ink-text-input"
import SelectInput from "ink-select-input"
import Spinner from "ink-spinner"
import { Header } from "../components/Header.js"
import { ValidationReport } from "../components/ValidationReport.js"
import { SummaryTable } from "../components/SummaryTable.js"
import { CheckboxList, type CheckboxItem } from "../components/CheckboxList.js"
import { EventTable, type EventRow } from "../components/EventTable.js"
import { parseCsv, type ParsedEvent } from "../lib/csv-parser.js"
import { createAmplitudeClient } from "../lib/amplitude-client.js"
import { type Config } from "../lib/config.js"

type Props = {
    config: Config | null
    onBack: () => void
}

type Phase =
    | "no-config"
    | "file-input"
    | "validating"
    | "file-error"
    | "validation-error"
    | "select"        // checkbox picker
    | "importing"     // table view, live
    | "done"          // table view, final

// ── FileInput sub-component ───────────────────────────────────────────────────

function FileInput({ value, onChange, onSubmit, onBack }: {
    value: string
    onChange: (v: string) => void
    onSubmit: (v: string) => void
    onBack: () => void
}): React.ReactElement {
    useInput((_, key) => { if (key.escape) onBack() })
    return (
        <Box flexDirection="column" gap={1}>
            <Header subtitle="Import" />
            <Box gap={1}>
                <Text>CSV file path: </Text>
                <TextInput
                    value={value}
                    onChange={onChange}
                    onSubmit={(val) => { const p = val.trim(); if (p) onSubmit(p) }}
                />
            </Box>
            <Text dimColor>Enter to confirm · Esc to go back</Text>
            <Text dimColor>e.g. ./events.csv or /Users/me/events.csv</Text>
        </Box>
    )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function ImportScreen({ config, onBack }: Props): React.ReactElement {
    const [phase, setPhase] = useState<Phase>(config ? "file-input" : "no-config")
    const [filePath, setFilePath] = useState("")
    const [fileInput, setFileInput] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [validationErrors, setValidationErrors] = useState<Array<{ row: number; message: string }>>([])

    // All parsed events from CSV
    const [allEvents, setAllEvents] = useState<ParsedEvent[]>([])
    // Checkbox state for the select phase
    const [checkboxItems, setCheckboxItems] = useState<CheckboxItem<string>[]>([])
    // Events chosen for import (post-selection)
    const [selectedEvents, setSelectedEvents] = useState<ParsedEvent[]>([])

    // Table rows — one per event, updated live during import
    const [rows, setRows] = useState<EventRow[]>([])
    const [summary, setSummary] = useState({ eventsCreated: 0, propertiesCreated: 0, eventsSkipped: 0, eventsFailed: 0, propertiesFailed: 0 })

    // ── Validate CSV ──────────────────────────────────────────────────────────

    async function validate(path: string): Promise<void> {
        setPhase("validating")
        try {
            const parsed = await parseCsv(path)
            if (parsed.errors.length > 0) {
                setValidationErrors(parsed.errors)
                setPhase("validation-error")
                return
            }
            setAllEvents(parsed.events)
            setCheckboxItems(parsed.events.map((e) => ({
                value: e.event_type,
                label: e.event_type,
                sublabel: [
                    e.properties.length ? `${e.properties.length} prop${e.properties.length !== 1 ? "s" : ""}` : "no properties",
                    e.category,
                    e.description,
                ].filter(Boolean).join("  ·  "),
                checked: true,
            })))
            setPhase("select")
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : String(err))
            setPhase("file-error")
        }
    }

    // ── Start import with chosen events ───────────────────────────────────────

    function startImport(chosenTypes: string[]): void {
        const chosen = allEvents.filter((e) => chosenTypes.includes(e.event_type))
        setSelectedEvents(chosen)
        setRows(chosen.map((e) => ({
            event_type: e.event_type,
            category: e.category,
            propertiesTotal: e.properties.length,
            propertiesDone: 0,
            status: "pending",
        })))
        setPhase("importing")
    }

    // ── Live import ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (phase === "importing" && config) void doImport()
    }, [phase])

    function updateRow(event_type: string, update: Partial<EventRow>): void {
        setRows((prev) => prev.map((r) => r.event_type === event_type ? { ...r, ...update } : r))
    }

    async function doImport(): Promise<void> {
        if (!config) return
        const client = createAmplitudeClient(config)

        let existingTypes = new Set<string>()
        try {
            const existing = await client.listEvents()
            existingTypes = new Set(existing.map((e) => e.event_type))
        } catch {
            // Non-fatal
        }

        const stats = { eventsCreated: 0, propertiesCreated: 0, eventsSkipped: 0, eventsFailed: 0, propertiesFailed: 0 }

        for (const event of selectedEvents) {
            if (existingTypes.has(event.event_type)) {
                updateRow(event.event_type, { status: "skipped", detail: "already exists" })
                stats.eventsSkipped++
            } else {
                updateRow(event.event_type, { status: "running" })
                try {
                    await client.createEvent({ event_type: event.event_type, description: event.description, category: event.category })
                    updateRow(event.event_type, { status: "done" })
                    stats.eventsCreated++
                } catch (err) {
                    updateRow(event.event_type, { status: "error", detail: err instanceof Error ? err.message : String(err) })
                    stats.eventsFailed++
                    continue
                }
            }

            let propsDone = 0
            for (const prop of event.properties) {
                try {
                    await client.createEventProperty({ event_type: event.event_type, event_property: prop.property_name, type: prop.property_type, description: prop.description, is_required: prop.is_required, enum_values: prop.enum_values })
                    propsDone++
                    updateRow(event.event_type, { propertiesDone: propsDone })
                    stats.propertiesCreated++
                } catch (err) {
                    propsDone++
                    updateRow(event.event_type, { propertiesDone: propsDone, detail: `prop error: ${err instanceof Error ? err.message : String(err)}` })
                    stats.propertiesFailed++
                }
            }
        }

        setSummary(stats)
        setPhase("done")
    }

    // ── Render ────────────────────────────────────────────────────────────────

    const errorItems = [
        { label: "Try another file", value: "retry" },
        { label: "← Back to menu", value: "back" },
    ]

    if (phase === "no-config") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Import" />
                <Text color="yellow">⚠ No credentials configured — go to Settings first.</Text>
                <Box marginTop={1}>
                    <SelectInput items={[{ label: "← Back", value: "back" }]} onSelect={onBack} />
                </Box>
            </Box>
        )
    }

    if (phase === "file-input") {
        return (
            <FileInput
                value={fileInput}
                onChange={setFileInput}
                onSubmit={(val) => { setFilePath(val); void validate(val) }}
                onBack={onBack}
            />
        )
    }

    if (phase === "validating") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Import" />
                <Box gap={1}>
                    <Text color="cyan"><Spinner type="dots" /></Text>
                    <Text>Validating {filePath}…</Text>
                </Box>
            </Box>
        )
    }

    if (phase === "file-error") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Import" />
                <Text color="red">✗ Could not read file: {errorMessage}</Text>
                <Box marginTop={1}>
                    <SelectInput items={errorItems} onSelect={(item) => {
                        if (item.value === "retry") { setPhase("file-input"); setFileInput("") }
                        else onBack()
                    }} />
                </Box>
            </Box>
        )
    }

    if (phase === "validation-error") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Import" />
                <ValidationReport errors={validationErrors} />
                <Box marginTop={1}>
                    <SelectInput items={errorItems} onSelect={(item) => {
                        if (item.value === "retry") { setPhase("file-input"); setFileInput("") }
                        else onBack()
                    }} />
                </Box>
            </Box>
        )
    }

    if (phase === "select") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Import › Select Events" />
                <Box gap={3} marginBottom={1}>
                    <Box gap={1}><Text dimColor>File</Text><Text>{filePath}</Text></Box>
                    <Box gap={1}><Text dimColor>Total</Text><Text>{allEvents.length} events</Text></Box>
                </Box>
                <CheckboxList
                    items={checkboxItems}
                    onChange={setCheckboxItems}
                    onConfirm={startImport}
                    onBack={() => { setPhase("file-input"); setFileInput("") }}
                />
            </Box>
        )
    }

    if (phase === "importing") {
        const done = rows.filter((r) => r.status === "done" || r.status === "skipped" || r.status === "error").length
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Import › Running" />
                <Box gap={1} marginBottom={1}>
                    <Text color="cyan"><Spinner type="dots" /></Text>
                    <Text dimColor>{done}/{rows.length} events processed</Text>
                </Box>
                <EventTable rows={rows} />
            </Box>
        )
    }

    // done
    const doneItems = [
        { label: "Import another file", value: "again" },
        { label: "← Back to menu", value: "back" },
    ]
    return (
        <Box flexDirection="column" gap={1}>
            <Header subtitle="Import › Done" />
            <EventTable rows={rows} />
            <SummaryTable {...summary} />
            <Box marginTop={1}>
                <SelectInput items={doneItems} onSelect={(item) => {
                    if (item.value === "again") { setPhase("file-input"); setFileInput(""); setRows([]) }
                    else onBack()
                }} />
            </Box>
        </Box>
    )
}
