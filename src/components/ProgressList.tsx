import React from "react"
import { Box, Text } from "ink"

export type ProgressItem = {
    label: string
    status: "pending" | "running" | "done" | "skipped" | "error"
    detail?: string
}

type Props = {
    items: ProgressItem[]
}

const STATUS_ICON: Record<ProgressItem["status"], string> = {
    pending: "○",
    running: "◌",
    done: "✓",
    skipped: "⊘",
    error: "✗",
}

const STATUS_COLOR: Record<ProgressItem["status"], string> = {
    pending: "gray",
    running: "cyan",
    done: "green",
    skipped: "yellow",
    error: "red",
}

export function ProgressList({ items }: Props): React.ReactElement {
    return (
        <Box flexDirection="column">
            {items.map((item, i) => (
                <Box key={i} gap={1}>
                    <Text color={STATUS_COLOR[item.status]}>{STATUS_ICON[item.status]}</Text>
                    <Text>{item.label}</Text>
                    {item.detail && <Text dimColor>— {item.detail}</Text>}
                </Box>
            ))}
        </Box>
    )
}
