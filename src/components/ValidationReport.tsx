import React from "react"
import { Box, Text } from "ink"
import type { ValidationError } from "../lib/csv-parser.js"

type Props = {
    errors: ValidationError[]
}

export function ValidationReport({ errors }: Props): React.ReactElement {
    return (
        <Box flexDirection="column" gap={1}>
            <Text color="red" bold>
                CSV validation failed — {errors.length} error{errors.length !== 1 ? "s" : ""} found:
            </Text>
            <Box flexDirection="column">
                {errors.map((err, i) => (
                    <Text key={i} color="red">
                        {"  ✗ "}
                        {err.message}
                    </Text>
                ))}
            </Box>
            <Text dimColor>Fix the errors above and try again.</Text>
        </Box>
    )
}
