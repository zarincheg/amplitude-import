import React from "react"
import { Box, Text } from "ink"

type Props = {
    subtitle?: string
}

export function Header({ subtitle }: Props): React.ReactElement {
    return (
        <Box flexDirection="column" marginBottom={1}>
            <Box gap={1}>
                <Text bold color="cyan">Amplitude Import</Text>
                {subtitle && <Text dimColor>/ {subtitle}</Text>}
            </Box>
            <Text dimColor>{"─".repeat(40)}</Text>
        </Box>
    )
}
