import React, { useState, useEffect } from "react"
import { Box, Text, useInput } from "ink"
import SelectInput from "ink-select-input"
import TextInput from "ink-text-input"
import Spinner from "ink-spinner"
import { Header } from "../components/Header.js"
import { CheckboxList, type CheckboxItem } from "../components/CheckboxList.js"
import { createAmplitudeClient, type AmplitudeEvent, type AmplitudeEventProperty } from "../lib/amplitude-client.js"
import { type Config } from "../lib/config.js"

type Props = {
    config: Config | null
    onBack: () => void
}

type Phase =
    | "no-config"
    | "loading-events"
    | "select-event"        // list from taxonomy + "type manually" option
    | "enter-event-name"    // manual event name input
    | "loading-props"
    | "select-properties"   // checkboxes from taxonomy + "add custom"
    | "add-prop-name"       // custom property key input
    | "add-prop-value"      // custom property value input
    | "enter-user-id"
    | "review"
    | "sending"
    | "done"
    | "error"

type PropertyEntry = {
    key: string
    value: string
    fromTaxonomy: boolean
    hint?: string   // type / enum hint from taxonomy
}

// ── Isolated text input (no SelectInput conflict) ─────────────────────────────

function FieldInput({ label, hint, placeholder, onSubmit, onBack }: {
    label: string
    hint?: string
    placeholder?: string
    onSubmit: (val: string) => void
    onBack: () => void
}): React.ReactElement {
    const [value, setValue] = useState(placeholder ?? "")
    useInput((_, key) => { if (key.escape) onBack() })
    return (
        <Box flexDirection="column" gap={1}>
            <Box gap={1}>
                <Text bold>{label}: </Text>
                <TextInput value={value} onChange={setValue} onSubmit={(v) => onSubmit(v.trim())} />
            </Box>
            {hint && <Text dimColor>{hint}</Text>}
            <Text dimColor>Enter to confirm · Esc to go back</Text>
        </Box>
    )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function TrackScreen({ config, onBack }: Props): React.ReactElement {
    const [phase, setPhase] = useState<Phase>(config ? "loading-events" : "no-config")
    const [taxonomyEvents, setTaxonomyEvents] = useState<AmplitudeEvent[]>([])
    const [selectedEvent, setSelectedEvent] = useState("")
    const [taxonomyProps, setTaxonomyProps] = useState<AmplitudeEventProperty[]>([])
    const [propCheckboxes, setPropCheckboxes] = useState<CheckboxItem<string>[]>([])
    const [properties, setProperties] = useState<PropertyEntry[]>([])
    const [pendingPropKey, setPendingPropKey] = useState("")
    const [userId, setUserId] = useState("test-user-001")
    const [errorMessage, setErrorMessage] = useState("")

    const client = config ? createAmplitudeClient(config) : null

    // ── Load taxonomy events ──────────────────────────────────────────────────

    useEffect(() => {
        if (phase !== "loading-events" || !client) return
        client.listEvents()
            .then((list) => { setTaxonomyEvents(list); setPhase("select-event") })
            .catch((err) => { setErrorMessage(err instanceof Error ? err.message : String(err)); setPhase("error") })
    }, [phase])

    // ── Select event from taxonomy ────────────────────────────────────────────

    function handleTaxonomyEventSelected(event_type: string): void {
        setSelectedEvent(event_type)
        setPhase("loading-props")
        client!.listEventProperties(event_type)
            .then((props) => {
                setTaxonomyProps(props)
                setPropCheckboxes(props.map((p) => ({
                    value: p.event_property,
                    label: p.event_property,
                    sublabel: buildPropHint(p),
                    checked: true,
                })))
                setPhase("select-properties")
            })
            .catch(() => {
                setTaxonomyProps([])
                setPropCheckboxes([])
                setPhase("select-properties")
            })
    }

    function handleManualEventName(name: string): void {
        if (!name) return
        setSelectedEvent(name)
        setTaxonomyProps([])
        setPropCheckboxes([])
        setPhase("select-properties")
    }

    // ── Property selection ────────────────────────────────────────────────────

    function confirmPropertySelection(selectedKeys: string[]): void {
        const fromTaxonomy: PropertyEntry[] = selectedKeys.map((key) => {
            const p = taxonomyProps.find((tp) => tp.event_property === key)
            return { key, value: "", fromTaxonomy: true, hint: p ? buildPropHint(p) : undefined }
        })
        setProperties(fromTaxonomy)
        setPhase("enter-user-id")
    }

    function skipAllProperties(): void {
        setProperties([])
        setPhase("enter-user-id")
    }

    function startAddCustomProp(): void {
        // Commit current taxonomy selections first
        const selectedKeys = propCheckboxes.filter((c) => c.checked).map((c) => c.value)
        const fromTaxonomy: PropertyEntry[] = selectedKeys.map((key) => {
            const p = taxonomyProps.find((tp) => tp.event_property === key)
            return { key, value: "", fromTaxonomy: true, hint: p ? buildPropHint(p) : undefined }
        })
        setProperties(fromTaxonomy)
        setPendingPropKey("")
        setPhase("add-prop-name")
    }

    function commitCustomPropKey(key: string): void {
        if (key) { setPendingPropKey(key); setPhase("add-prop-value") }
        else setPhase("select-properties")
    }

    function commitCustomPropValue(value: string): void {
        setProperties((prev) => [...prev, { key: pendingPropKey, value, fromTaxonomy: false }])
        setPhase("select-properties")
    }

    // ── Send ──────────────────────────────────────────────────────────────────

    async function sendEvent(): Promise<void> {
        setPhase("sending")
        try {
            const event_properties: Record<string, string> = {}
            for (const { key, value } of properties) {
                if (value) event_properties[key] = value
            }
            await client!.trackEvent({ event_type: selectedEvent, user_id: userId, event_properties })
            setPhase("done")
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : String(err))
            setPhase("error")
        }
    }

    function reset(): void {
        setSelectedEvent("")
        setTaxonomyProps([])
        setPropCheckboxes([])
        setProperties([])
        setUserId("test-user-001")
        setPhase("loading-events")
    }

    // ── Render ────────────────────────────────────────────────────────────────

    if (phase === "no-config") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Track Event" />
                <Text color="yellow">⚠ No credentials configured — go to Settings first.</Text>
                <Box marginTop={1}>
                    <SelectInput items={[{ label: "← Back", value: "back" }]} onSelect={onBack} />
                </Box>
            </Box>
        )
    }

    if (phase === "loading-events" || phase === "loading-props") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Track Event" />
                <Box gap={1}>
                    <Text color="cyan"><Spinner type="dots" /></Text>
                    <Text dimColor>
                        {phase === "loading-events" ? "Loading taxonomy events…" : `Loading properties for ${selectedEvent}…`}
                    </Text>
                </Box>
            </Box>
        )
    }

    // ── Step 1: Select or type event ──────────────────────────────────────────

    if (phase === "select-event") {
        const items = [
            ...taxonomyEvents.map((e) => ({
                label: e.display_name ? `${e.event_type}  (${e.display_name})` : e.event_type,
                value: e.event_type,
            })),
            { label: "✎  Type event name manually…", value: "__manual__" },
            { label: "← Back", value: "__back__" },
        ]
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Track Event › Step 1 — Event" />
                <Text dimColor>
                    {taxonomyEvents.length > 0
                        ? `${taxonomyEvents.length} events in taxonomy — pick one or enter manually:`
                        : "No events in taxonomy — enter name manually:"}
                </Text>
                <SelectInput
                    items={items}
                    onSelect={(item) => {
                        if (item.value === "__back__") onBack()
                        else if (item.value === "__manual__") setPhase("enter-event-name")
                        else handleTaxonomyEventSelected(item.value)
                    }}
                />
                <Text dimColor>↑↓ navigate · Enter select</Text>
            </Box>
        )
    }

    if (phase === "enter-event-name") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Track Event › Step 1 — Event" />
                <FieldInput
                    label="Event name"
                    hint="Exact event_type string (e.g. user_signed_up)"
                    onSubmit={handleManualEventName}
                    onBack={() => setPhase("select-event")}
                />
            </Box>
        )
    }

    // ── Step 2: Select / add properties ──────────────────────────────────────

    if (phase === "select-properties") {
        const customProps = properties.filter((p) => !p.fromTaxonomy)
        const actionItems = [
            { label: "✎  Add custom property…", value: "__add__" },
            { label: "→  Continue (no more properties)", value: "__done__" },
            { label: "← Back", value: "__back__" },
        ]
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle={`Track Event › Step 2 — Properties  [${selectedEvent}]`} />
                {propCheckboxes.length > 0 && (
                    <Box flexDirection="column" marginBottom={1}>
                        <Text dimColor>Taxonomy properties — toggle to include:</Text>
                        <CheckboxList
                            items={propCheckboxes}
                            onChange={setPropCheckboxes}
                            onConfirm={confirmPropertySelection}
                            onBack={() => setPhase("select-event")}
                        />
                    </Box>
                )}
                {customProps.length > 0 && (
                    <Box flexDirection="column" marginBottom={1}>
                        <Text dimColor>Custom properties added:</Text>
                        {customProps.map((p) => (
                            <Box key={p.key} gap={2} paddingLeft={2}>
                                <Text color="cyan">+</Text>
                                <Text>{p.key}</Text>
                                <Text dimColor>{p.value || "(empty)"}</Text>
                            </Box>
                        ))}
                    </Box>
                )}
                {propCheckboxes.length === 0 && customProps.length === 0 && (
                    <Text dimColor>No properties defined — add custom ones below or continue.</Text>
                )}
                <SelectInput
                    items={actionItems}
                    onSelect={(item) => {
                        if (item.value === "__add__") startAddCustomProp()
                        else if (item.value === "__done__") {
                            const selectedKeys = propCheckboxes.filter((c) => c.checked).map((c) => c.value)
                            const fromTaxonomy: PropertyEntry[] = selectedKeys.map((key) => {
                                const p = taxonomyProps.find((tp) => tp.event_property === key)
                                return { key, value: "", fromTaxonomy: true, hint: p ? buildPropHint(p) : undefined }
                            })
                            setProperties([...fromTaxonomy, ...customProps])
                            setPhase("enter-user-id")
                        } else {
                            setPhase("select-event")
                        }
                    }}
                />
            </Box>
        )
    }

    if (phase === "add-prop-name") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle={`Track Event › Step 2 — Add Property  [${selectedEvent}]`} />
                <FieldInput
                    label="Property name"
                    hint="e.g. referral_code"
                    onSubmit={commitCustomPropKey}
                    onBack={() => setPhase("select-properties")}
                />
            </Box>
        )
    }

    if (phase === "add-prop-value") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle={`Track Event › Step 2 — Add Property  [${selectedEvent}]`} />
                <Box gap={2} marginBottom={1}>
                    <Text dimColor>Property</Text><Text bold>{pendingPropKey}</Text>
                </Box>
                <FieldInput
                    label="Value"
                    hint="Leave empty to skip this property"
                    onSubmit={commitCustomPropValue}
                    onBack={() => setPhase("add-prop-name")}
                />
            </Box>
        )
    }

    // ── Step 3: User ID ───────────────────────────────────────────────────────

    if (phase === "enter-user-id") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle={`Track Event › Step 3 — User ID  [${selectedEvent}]`} />
                <FieldInput
                    label="Mock user_id"
                    hint="Min 5 chars — identifies the simulated user in Amplitude"
                    placeholder={userId}
                    onSubmit={(val) => { setUserId(val || userId); setPhase("review") }}
                    onBack={() => setPhase("select-properties")}
                />
            </Box>
        )
    }

    // ── Step 4: Review ────────────────────────────────────────────────────────

    if (phase === "review") {
        const filledProps = properties.filter(({ value }) => value)
        const reviewItems = [
            { label: "Send event →", value: "send" },
            { label: "Edit properties", value: "props" },
            { label: "Edit user_id", value: "user" },
            { label: "← Start over", value: "reset" },
        ]
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Track Event › Step 4 — Review" />
                <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
                    <Box gap={2}><Text dimColor>event_type        </Text><Text bold color="cyan">{selectedEvent}</Text></Box>
                    <Box gap={2}><Text dimColor>user_id           </Text><Text>{userId}</Text></Box>
                    <Box gap={2}><Text dimColor>time              </Text><Text dimColor>set on send</Text></Box>
                    {filledProps.length > 0 ? (
                        <Box flexDirection="column" marginTop={1}>
                            <Text dimColor>event_properties:</Text>
                            {filledProps.map(({ key, value, hint }) => (
                                <Box key={key} gap={2} paddingLeft={2}>
                                    <Text color="cyan">{key}</Text>
                                    <Text>= {value}</Text>
                                    {hint && <Text dimColor>({hint})</Text>}
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Box marginTop={1}><Text dimColor>event_properties: {"{}"}</Text></Box>
                    )}
                </Box>
                <Box marginTop={1}>
                    <SelectInput
                        items={reviewItems}
                        onSelect={(item) => {
                            if (item.value === "send") void sendEvent()
                            else if (item.value === "props") setPhase("select-properties")
                            else if (item.value === "user") setPhase("enter-user-id")
                            else reset()
                        }}
                    />
                </Box>
            </Box>
        )
    }

    // ── Sending ───────────────────────────────────────────────────────────────

    if (phase === "sending") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Track Event" />
                <Box gap={1}>
                    <Text color="cyan"><Spinner type="dots" /></Text>
                    <Text>Sending <Text bold>{selectedEvent}</Text>…</Text>
                </Box>
            </Box>
        )
    }

    // ── Error ─────────────────────────────────────────────────────────────────

    if (phase === "error") {
        return (
            <Box flexDirection="column" gap={1}>
                <Header subtitle="Track Event" />
                <Text color="red">✗ {errorMessage}</Text>
                <Box marginTop={1}>
                    <SelectInput
                        items={[
                            { label: "Try again", value: "retry" },
                            { label: "← Back to menu", value: "back" },
                        ]}
                        onSelect={(item) => {
                            if (item.value === "retry") reset()
                            else onBack()
                        }}
                    />
                </Box>
            </Box>
        )
    }

    // ── Done ──────────────────────────────────────────────────────────────────

    const filledProps = properties.filter(({ value }) => value)
    return (
        <Box flexDirection="column" gap={1}>
            <Header subtitle="Track Event › Done" />
            <Text color="green">✓ Event sent successfully!</Text>
            <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} marginTop={1}>
                <Box gap={2}><Text dimColor>event_type</Text><Text bold>{selectedEvent}</Text></Box>
                <Box gap={2}><Text dimColor>user_id   </Text><Text>{userId}</Text></Box>
                {filledProps.map(({ key, value }) => (
                    <Box key={key} gap={2}>
                        <Text dimColor>{key.padEnd(10)}</Text>
                        <Text>{value}</Text>
                    </Box>
                ))}
            </Box>
            <Box marginTop={1}><Text dimColor>The event should appear in Amplitude within a few minutes.</Text></Box>
            <Box marginTop={1}>
                <SelectInput
                    items={[
                        { label: "Track another event", value: "again" },
                        { label: "← Back to menu", value: "back" },
                    ]}
                    onSelect={(item) => {
                        if (item.value === "again") reset()
                        else onBack()
                    }}
                />
            </Box>
        </Box>
    )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildPropHint(p: AmplitudeEventProperty): string {
    return [
        p.type !== "any" && p.type,
        p.enum_values?.length && `options: ${p.enum_values.join(", ")}`,
        p.is_required && "required",
        p.description,
    ].filter(Boolean).join("  ·  ")
}
