import React, { useState } from "react"
import { MainMenu, type Screen } from "./screens/MainMenu.js"
import { SettingsScreen } from "./screens/SettingsScreen.js"
import { ImportScreen } from "./screens/ImportScreen.js"
import { TrackScreen } from "./screens/TrackScreen.js"
import { type Config, configExists, readConfig } from "./lib/config.js"

function loadInitialConfig(): Config | null {
    if (!configExists()) return null
    try {
        return readConfig()
    } catch {
        return null
    }
}

export function App(): React.ReactElement {
    const [screen, setScreen] = useState<Screen>("menu")
    const [config, setConfig] = useState<Config | null>(loadInitialConfig)

    if (screen === "settings") {
        return (
            <SettingsScreen
                onBack={(updated) => {
                    if (updated) setConfig(updated)
                    setScreen("menu")
                }}
            />
        )
    }

    if (screen === "import") {
        return (
            <ImportScreen
                config={config}
                onBack={() => setScreen("menu")}
            />
        )
    }

    if (screen === "track") {
        return (
            <TrackScreen
                config={config}
                onBack={() => setScreen("menu")}
            />
        )
    }

    return (
        <MainMenu
            config={config}
            onSelect={setScreen}
        />
    )
}
