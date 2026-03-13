import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"

export type CsvRow = {
    event_type: string
    display_name?: string
    description?: string
    category?: string
    property_name?: string
    property_type?: "string" | "number" | "boolean" | "enum" | "any"
    prop_description?: string
    is_required?: boolean
    enum_values?: string[]
}

export type ParsedEvent = {
    event_type: string
    display_name?: string
    description?: string
    category?: string
    properties: ParsedProperty[]
}

export type ParsedProperty = {
    property_name: string
    property_type: "string" | "number" | "boolean" | "enum" | "any"
    description?: string
    is_required: boolean
    enum_values?: string[]
}

export type ValidationError = {
    row: number
    message: string
}

const VALID_PROPERTY_TYPES = new Set(["string", "number", "boolean", "enum", "any"])

const REQUIRED_COLUMNS = ["event_type"]

export type ParseResult = {
    events: ParsedEvent[]
    errors: ValidationError[]
}

function parseCsvLine(line: string): string[] {
    const fields: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === "," && !inQuotes) {
            fields.push(current.trim())
            current = ""
        } else {
            current += char
        }
    }
    fields.push(current.trim())
    return fields
}

export async function parseCsv(filePath: string): Promise<ParseResult> {
    const errors: ValidationError[] = []
    const rawRows: Array<{ lineNum: number; data: Record<string, string> }> = []

    let headers: string[] = []
    let lineNum = 0

    await new Promise<void>((resolve, reject) => {
        const rl = createInterface({
            input: createReadStream(filePath),
            crlfDelay: Infinity,
        })

        rl.on("line", (line) => {
            lineNum++
            if (!line.trim()) return

            if (lineNum === 1) {
                headers = parseCsvLine(line).map((h) => h.toLowerCase())
                return
            }

            const values = parseCsvLine(line)
            const row: Record<string, string> = {}
            headers.forEach((header, i) => {
                row[header] = values[i] ?? ""
            })
            rawRows.push({ lineNum, data: row })
        })

        rl.on("close", resolve)
        rl.on("error", reject)
    })

    // Validate headers
    for (const col of REQUIRED_COLUMNS) {
        if (!headers.includes(col)) {
            errors.push({ row: 1, message: `Missing required column: "${col}"` })
        }
    }

    if (errors.length > 0) {
        return { events: [], errors }
    }

    // Parse and validate rows
    const eventMap = new Map<string, ParsedEvent>()

    for (const { lineNum: rowNum, data } of rawRows) {
        const eventType = data["event_type"]?.trim()
        if (!eventType) {
            errors.push({ row: rowNum, message: `Row ${rowNum}: "event_type" is required` })
            continue
        }

        // Upsert event entry
        if (!eventMap.has(eventType)) {
            eventMap.set(eventType, {
                event_type: eventType,
                display_name: data["display_name"] || undefined,
                description: data["description"] || undefined,
                category: data["category"] || undefined,
                properties: [],
            })
        }

        const event = eventMap.get(eventType)!

        // Process property if property_name is present
        const propertyName = data["property_name"]?.trim()
        if (!propertyName) continue

        const rawType = data["property_type"]?.trim().toLowerCase()
        if (!rawType) {
            errors.push({ row: rowNum, message: `Row ${rowNum}: "property_type" is required when "property_name" is set` })
            continue
        }

        if (!VALID_PROPERTY_TYPES.has(rawType)) {
            errors.push({
                row: rowNum,
                message: `Row ${rowNum}: invalid property_type "${rawType}" — must be one of: string, number, boolean, enum, any`,
            })
            continue
        }

        const propertyType = rawType as "string" | "number" | "boolean" | "enum" | "any"
        const enumValuesRaw = data["enum_values"]?.trim()

        if (propertyType === "enum" && !enumValuesRaw) {
            errors.push({ row: rowNum, message: `Row ${rowNum}: "enum_values" is required when property_type is "enum"` })
            continue
        }

        const enumValues = enumValuesRaw ? enumValuesRaw.split("|").map((v) => v.trim()).filter(Boolean) : undefined

        event.properties.push({
            property_name: propertyName,
            property_type: propertyType,
            description: data["prop_description"] || undefined,
            is_required: data["is_required"]?.toLowerCase() === "true",
            enum_values: enumValues,
        })
    }

    return { events: Array.from(eventMap.values()), errors }
}
