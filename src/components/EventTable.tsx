import React from "react"
import { Box, Text } from "ink"
import Spinner from "ink-spinner"

export type EventRow = {
    event_type: string
    category?: string
    propertiesTotal: number
    propertiesDone: number
    status: "pending" | "running" | "done" | "skipped" | "error"
    detail?: string
}

type Props = {
    rows: EventRow[]
}

const COL_EVENT = 28
const COL_PROPS = 7
const COL_CATEGORY = 12

function pad(str: string, width: number): string {
    return str.length >= width ? str.slice(0, width - 1) + "…" : str.padEnd(width)
}

function StatusCell({ row }: { row: EventRow }): React.ReactElement {
    if (row.status === "running") {
        return <Text color="cyan"><Spinner type="dots" /></Text>
    }
    const icons: Record<EventRow["status"], string> = {
        pending: "○",
        running: "◌",
        done: "✓",
        skipped: "⊘",
        error: "✗",
    }
    const colors: Record<EventRow["status"], string> = {
        pending: "gray",
        running: "cyan",
        done: "green",
        skipped: "yellow",
        error: "red",
    }
    return <Text color={colors[row.status]}>{icons[row.status]}</Text>
}

function PropsCell({ row }: { row: EventRow }): React.ReactElement {
    if (row.propertiesTotal === 0) return <Text dimColor>{"—".padEnd(COL_PROPS)}</Text>
    const label = `${row.propertiesDone}/${row.propertiesTotal}`
    const color = row.propertiesDone === row.propertiesTotal && row.status === "done" ? "green" : "white"
    return <Text color={color}>{pad(label, COL_PROPS)}</Text>
}

export function EventTable({ rows }: Props): React.ReactElement {
    return (
        <Box flexDirection="column">
            {/* Header */}
            <Box gap={1}>
                <Text dimColor>{"  "}</Text>
                <Text dimColor bold>{pad("Event", COL_EVENT)}</Text>
                <Text dimColor bold>{pad("Props", COL_PROPS)}</Text>
                <Text dimColor bold>{pad("Category", COL_CATEGORY)}</Text>
                <Text dimColor bold>Detail</Text>
            </Box>
            <Text dimColor>{"─".repeat(40 + COL_EVENT + COL_PROPS)}</Text>
            {/* Rows */}
            {rows.map((row) => (
                <Box key={row.event_type} gap={1}>
                    <StatusCell row={row} />
                    <Text
                        color={row.status === "done" ? "green" : row.status === "error" ? "red" : row.status === "skipped" ? "yellow" : undefined}
                    >
                        {pad(row.event_type, COL_EVENT)}
                    </Text>
                    <PropsCell row={row} />
                    <Text dimColor>{pad(row.category ?? "—", COL_CATEGORY)}</Text>
                    {row.detail && <Text dimColor>{row.detail}</Text>}
                </Box>
            ))}
        </Box>
    )
}
