import React from "react"
import { Box, Text } from "ink"

type Props = {
    eventsCreated: number
    propertiesCreated: number
    eventsSkipped: number
    eventsFailed: number
    propertiesFailed: number
}

export function SummaryTable({
    eventsCreated,
    propertiesCreated,
    eventsSkipped,
    eventsFailed,
    propertiesFailed,
}: Props): React.ReactElement {
    const hasFailures = eventsFailed > 0 || propertiesFailed > 0

    return (
        <Box flexDirection="column" gap={1} marginTop={1}>
            <Text bold>Summary</Text>
            <Box flexDirection="column">
                <Box gap={2}>
                    <Text color="green">✓ Events created:</Text>
                    <Text bold>{eventsCreated}</Text>
                </Box>
                <Box gap={2}>
                    <Text color="green">✓ Properties created:</Text>
                    <Text bold>{propertiesCreated}</Text>
                </Box>
                {eventsSkipped > 0 && (
                    <Box gap={2}>
                        <Text color="yellow">⊘ Events skipped (already exist):</Text>
                        <Text bold>{eventsSkipped}</Text>
                    </Box>
                )}
                {eventsFailed > 0 && (
                    <Box gap={2}>
                        <Text color="red">✗ Events failed:</Text>
                        <Text bold>{eventsFailed}</Text>
                    </Box>
                )}
                {propertiesFailed > 0 && (
                    <Box gap={2}>
                        <Text color="red">✗ Properties failed:</Text>
                        <Text bold>{propertiesFailed}</Text>
                    </Box>
                )}
            </Box>
            {hasFailures ? (
                <Text color="red">Completed with errors.</Text>
            ) : (
                <Text color="green">All done!</Text>
            )}
        </Box>
    )
}
