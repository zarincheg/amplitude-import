import { defineConfig } from "tsup"

export default defineConfig({
    entry: { index: "src/index.tsx", debug: "scripts/debug-api.ts" },
    format: "esm",
    target: "node18",
    outDir: "dist",
    bundle: true,
    clean: true,
    banner: { js: "#!/usr/bin/env node" },
    // Keep production deps external — they are installed alongside the package.
    // Only bundle our own source.
    external: [
        "react",
        "ink",
        "ink-select-input",
        "ink-spinner",
        "ink-text-input",
        "react-devtools-core",
    ],
    esbuildOptions(options) {
        options.jsx = "automatic"
        options.define = {
            ...options.define,
            "process.env.NODE_ENV": '"production"',
        }
    },
})
