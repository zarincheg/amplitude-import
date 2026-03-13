import React, { useState } from "react"
import { Box, Text, useInput } from "ink"

export type CheckboxItem<T> = {
    value: T
    label: string
    sublabel?: string
    checked: boolean
}

type Props<T> = {
    items: CheckboxItem<T>[]
    onChange: (items: CheckboxItem<T>[]) => void
    onConfirm: (selected: T[]) => void
    onBack: () => void
}

export function CheckboxList<T>({ items, onChange, onConfirm, onBack }: Props<T>): React.ReactElement {
    const [cursor, setCursor] = useState(0)

    useInput((input, key) => {
        if (key.upArrow) {
            setCursor((c) => Math.max(0, c - 1))
        } else if (key.downArrow) {
            setCursor((c) => Math.min(items.length - 1, c + 1))
        } else if (input === " ") {
            onChange(items.map((item, i) => i === cursor ? { ...item, checked: !item.checked } : item))
        } else if (input === "a" || input === "A") {
            const allChecked = items.every((i) => i.checked)
            onChange(items.map((item) => ({ ...item, checked: !allChecked })))
        } else if (key.return) {
            const selected = items.filter((i) => i.checked).map((i) => i.value)
            if (selected.length > 0) onConfirm(selected)
        } else if (key.escape) {
            onBack()
        }
    })

    const checkedCount = items.filter((i) => i.checked).length

    return (
        <Box flexDirection="column" gap={1}>
            <Box flexDirection="column">
                {items.map((item, i) => {
                    const isFocused = i === cursor
                    return (
                        <Box key={i} gap={1}>
                            <Text color={isFocused ? "cyan" : undefined}>{isFocused ? "›" : " "}</Text>
                            <Text color={item.checked ? "cyan" : "gray"}>
                                {item.checked ? "[✓]" : "[ ]"}
                            </Text>
                            <Box flexDirection="column">
                                <Text bold={isFocused}>{item.label}</Text>
                                {item.sublabel && <Text dimColor>    {item.sublabel}</Text>}
                            </Box>
                        </Box>
                    )
                })}
            </Box>
            <Text dimColor>{"─".repeat(40)}</Text>
            <Box gap={3}>
                <Text dimColor>{checkedCount}/{items.length} selected</Text>
                <Text dimColor>Space toggle · A toggle all · Enter confirm · Esc back</Text>
            </Box>
        </Box>
    )
}
