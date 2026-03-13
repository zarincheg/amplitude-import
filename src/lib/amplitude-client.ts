type FetchFn = typeof fetch

export type AmplitudeClientOptions = {
    apiKey: string
    apiSecret: string
    /** Taxonomy API base URL */
    baseUrl?: string
    /** HTTP Tracking API base URL */
    httpBaseUrl?: string
    fetchFn?: FetchFn
}

export type AmplitudeEventInput = {
    event_type: string
    category?: string
    description?: string
}

export type AmplitudeEventPropertyInput = {
    event_type: string
    event_property: string
    type: "string" | "number" | "boolean" | "enum" | "any"
    description?: string
    is_required?: boolean
    enum_values?: string[]
}

export type AmplitudeEvent = {
    event_type: string
    display_name?: string
}

export type AmplitudeEventProperty = {
    event_property: string
    type: "string" | "number" | "boolean" | "enum" | "any"
    description?: string
    is_required?: boolean
    enum_values?: string[]
}

export type TrackEventInput = {
    event_type: string
    user_id: string
    event_properties?: Record<string, string>
}

type AmplitudeEventsResponse = {
    data: Array<{ event_type: string; display_name?: string }>
}

type AmplitudeEventPropertiesResponse = {
    data: Array<{
        event_property: string
        type: string
        description?: string
        is_required?: boolean
        enum_values?: string[]
    }>
}

export type AmplitudeClient = {
    testConnection: () => Promise<void>
    listEvents: () => Promise<AmplitudeEvent[]>
    listEventProperties: (event_type: string) => Promise<AmplitudeEventProperty[]>
    createEvent: (input: AmplitudeEventInput) => Promise<void>
    createEventProperty: (input: AmplitudeEventPropertyInput) => Promise<void>
    trackEvent: (input: TrackEventInput) => Promise<void>
}


/** Safe JSON parser — throws a readable error if the body is not JSON (e.g. an HTML error page) */
async function parseJson<T>(response: Response): Promise<T> {
    const text = await response.text()
    try {
        return JSON.parse(text) as T
    } catch {
        const preview = text.slice(0, 120).replace(/\s+/g, " ")
        throw new Error(`Expected JSON but got: ${preview}`)
    }
}

export function createAmplitudeClient(options: AmplitudeClientOptions): AmplitudeClient {
    const fetchFn: FetchFn = options.fetchFn ?? fetch
    const baseUrl: string = (options.baseUrl ?? "https://amplitude.com").replace(/\/+$/, "")
    const httpBaseUrl: string = (options.httpBaseUrl ?? "https://api2.amplitude.com").replace(/\/+$/, "")

    function getAuthHeader(): string {
        const authValue = `${options.apiKey}:${options.apiSecret}`
        return `Basic ${Buffer.from(authValue).toString("base64")}`
    }

    function toFormBody(data: Record<string, string | boolean | string[] | undefined>): string {
        const params = new URLSearchParams()
        for (const [key, value] of Object.entries(data)) {
            if (value === undefined || value === "") continue
            if (Array.isArray(value)) {
                value.forEach((v) => params.append(key, v))
            } else {
                params.append(key, String(value))
            }
        }
        return params.toString()
    }

    /** Test credentials — fetches taxonomy events and validates the JSON response */
    async function testConnection(): Promise<void> {
        const response = await fetchFn(`${baseUrl}/api/2/taxonomy/event`, {
            headers: { Authorization: getAuthHeader() },
        })
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`)
        }
        // Validate we actually got JSON (catches misconfigured base URLs that return HTML with 200)
        await parseJson(response)
    }

    async function listEvents(): Promise<AmplitudeEvent[]> {
        const response = await fetchFn(`${baseUrl}/api/2/taxonomy/event`, {
            headers: { Authorization: getAuthHeader() },
        })
        if (!response.ok) {
            throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`)
        }
        const data: AmplitudeEventsResponse = await parseJson(response)
        return data.data.map((e) => ({ event_type: e.event_type, display_name: e.display_name }))
    }

    async function createEvent(input: AmplitudeEventInput): Promise<void> {
        const response = await fetchFn(`${baseUrl}/api/2/taxonomy/event`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: toFormBody({
                event_type: input.event_type,
                category: input.category,
                description: input.description,
            }),
        })
        if (!response.ok) {
            const body = await response.text()
            throw new Error(`Failed to create event "${input.event_type}": ${response.status} ${body}`)
        }
    }

    async function createEventProperty(input: AmplitudeEventPropertyInput): Promise<void> {
        const response = await fetchFn(`${baseUrl}/api/2/taxonomy/event-property`, {
            method: "POST",
            headers: {
                Authorization: getAuthHeader(),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: toFormBody({
                event_type: input.event_type,
                event_property: input.event_property,
                type: input.type,
                description: input.description,
                is_required: input.is_required,
                enum_values: input.enum_values,
            }),
        })
        if (!response.ok) {
            const body = await response.text()
            throw new Error(
                `Failed to create property "${input.event_property}" on "${input.event_type}": ${response.status} ${body}`
            )
        }
    }

    async function listEventProperties(event_type: string): Promise<AmplitudeEventProperty[]> {
        const url = `${baseUrl}/api/2/taxonomy/event-property?event_type=${encodeURIComponent(event_type)}`
        const response = await fetchFn(url, { headers: { Authorization: getAuthHeader() } })
        if (!response.ok) {
            throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`)
        }
        const data: AmplitudeEventPropertiesResponse = await parseJson(response)
        return data.data.map((p) => ({
            event_property: p.event_property,
            type: (p.type ?? "any") as AmplitudeEventProperty["type"],
            description: p.description,
            is_required: p.is_required,
            enum_values: p.enum_values,
        }))
    }

    async function trackEvent(input: TrackEventInput): Promise<void> {
        const response = await fetchFn(`${httpBaseUrl}/2/httpapi`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: options.apiKey,
                events: [
                    {
                        user_id: input.user_id,
                        event_type: input.event_type,
                        time: Date.now(),
                        event_properties: input.event_properties ?? {},
                        insert_id: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                    },
                ],
            }),
        })
        const body = await response.text()
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`)
        }
        // Amplitude returns {"code":200,...} — check app-level error codes too
        try {
            const json = JSON.parse(body) as { code: number; error?: string }
            if (json.code !== 200) {
                throw new Error(`Amplitude error ${json.code}: ${json.error ?? "unknown"}`)
            }
        } catch (err) {
            if (err instanceof SyntaxError) {
                throw new Error(`Unexpected response: ${body.slice(0, 120)}`)
            }
            throw err
        }
    }

    return { testConnection, listEvents, listEventProperties, createEvent, createEventProperty, trackEvent }
}
