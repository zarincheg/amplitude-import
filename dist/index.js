#!/usr/bin/env node
import {
  REGION_PRESETS,
  configExists,
  readConfig,
  writeConfig
} from "./chunk-PK5MXZU5.js";

// src/index.tsx
import { render } from "ink";

// src/App.tsx
import { useState as useState5 } from "react";

// src/screens/MainMenu.tsx
import { Box as Box2, Text as Text2 } from "ink";
import SelectInput from "ink-select-input";

// src/components/Header.tsx
import { Box, Text } from "ink";
import { jsx, jsxs } from "react/jsx-runtime";
function Header({ subtitle }) {
  return /* @__PURE__ */ jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [
    /* @__PURE__ */ jsxs(Box, { gap: 1, children: [
      /* @__PURE__ */ jsx(Text, { bold: true, color: "cyan", children: "Amplitude Import" }),
      subtitle && /* @__PURE__ */ jsxs(Text, { dimColor: true, children: [
        "/ ",
        subtitle
      ] })
    ] }),
    /* @__PURE__ */ jsx(Text, { dimColor: true, children: "\u2500".repeat(40) })
  ] });
}

// src/screens/MainMenu.tsx
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var STATUS_ICON = {
  ok: "\u2713",
  error: "\u2717",
  untested: "\u25CB"
};
var STATUS_COLOR = {
  ok: "green",
  error: "red",
  untested: "yellow"
};
var items = [
  { label: "Import from CSV", value: "import" },
  { label: "Track Test Event", value: "track" },
  { label: "Settings", value: "settings" }
];
function MainMenu({ config, onSelect }) {
  const status = config?.connectionStatus ?? "untested";
  return /* @__PURE__ */ jsxs2(Box2, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx2(Header, {}),
    /* @__PURE__ */ jsx2(Box2, { flexDirection: "column", marginBottom: 1, children: config ? /* @__PURE__ */ jsxs2(Fragment, { children: [
      /* @__PURE__ */ jsxs2(Box2, { gap: 2, children: [
        /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "Project " }),
        /* @__PURE__ */ jsx2(Text2, { children: config.projectName ?? /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "(not set)" }) })
      ] }),
      /* @__PURE__ */ jsxs2(Box2, { gap: 2, children: [
        /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "API Key " }),
        /* @__PURE__ */ jsxs2(Text2, { children: [
          config.apiKey.slice(0, 6),
          "*".repeat(Math.max(0, config.apiKey.length - 6))
        ] })
      ] }),
      /* @__PURE__ */ jsxs2(Box2, { gap: 2, children: [
        /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "Base URL" }),
        /* @__PURE__ */ jsx2(Text2, { children: config.baseUrl })
      ] }),
      /* @__PURE__ */ jsxs2(Box2, { gap: 2, children: [
        /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "Connection" }),
        /* @__PURE__ */ jsxs2(Text2, { color: STATUS_COLOR[status], children: [
          STATUS_ICON[status],
          " ",
          status === "ok" && "Connected",
          status === "error" && `Failed \u2014 ${config.connectionError ?? "unknown error"}`,
          status === "untested" && "Not tested yet"
        ] })
      ] }),
      config.connectionTestedAt && /* @__PURE__ */ jsxs2(Box2, { gap: 2, children: [
        /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "Last tested" }),
        /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: new Date(config.connectionTestedAt).toLocaleString() })
      ] })
    ] }) : /* @__PURE__ */ jsx2(Text2, { color: "yellow", children: "\u26A0 No credentials configured \u2014 go to Settings first." }) }),
    /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "\u2500".repeat(40) }),
    /* @__PURE__ */ jsx2(Box2, { marginTop: 1, children: /* @__PURE__ */ jsx2(
      SelectInput,
      {
        items,
        onSelect: (item) => onSelect(item.value)
      }
    ) }),
    /* @__PURE__ */ jsx2(Text2, { dimColor: true, children: "\u2191\u2193 navigate \xB7 Enter select \xB7 Ctrl+C quit" })
  ] });
}

// src/screens/SettingsScreen.tsx
import { useState } from "react";
import { Box as Box3, Text as Text3, useInput } from "ink";
import SelectInput2 from "ink-select-input";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";

// src/lib/amplitude-client.ts
async function parseJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    const preview = text.slice(0, 120).replace(/\s+/g, " ");
    throw new Error(`Expected JSON but got: ${preview}`);
  }
}
function createAmplitudeClient(options) {
  const fetchFn = options.fetchFn ?? fetch;
  const baseUrl = (options.baseUrl ?? "https://amplitude.com").replace(/\/+$/, "");
  const httpBaseUrl = (options.httpBaseUrl ?? "https://api2.amplitude.com").replace(/\/+$/, "");
  function getAuthHeader() {
    const authValue = `${options.apiKey}:${options.apiSecret}`;
    return `Basic ${Buffer.from(authValue).toString("base64")}`;
  }
  function toFormBody(data) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (value === void 0 || value === "") continue;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.append(key, String(value));
      }
    }
    return params.toString();
  }
  async function testConnection() {
    const response = await fetchFn(`${baseUrl}/api/2/taxonomy/event`, {
      headers: { Authorization: getAuthHeader() }
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    await parseJson(response);
  }
  async function listEvents() {
    const response = await fetchFn(`${baseUrl}/api/2/taxonomy/event`, {
      headers: { Authorization: getAuthHeader() }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status} ${response.statusText}`);
    }
    const data = await parseJson(response);
    return data.data.map((e) => ({ event_type: e.event_type, display_name: e.display_name }));
  }
  async function createEvent(input) {
    const response = await fetchFn(`${baseUrl}/api/2/taxonomy/event`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: toFormBody({
        event_type: input.event_type,
        category: input.category,
        description: input.description
      })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to create event "${input.event_type}": ${response.status} ${body}`);
    }
  }
  async function createEventProperty(input) {
    const response = await fetchFn(`${baseUrl}/api/2/taxonomy/event-property`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: toFormBody({
        event_type: input.event_type,
        event_property: input.event_property,
        type: input.type,
        description: input.description,
        is_required: input.is_required,
        enum_values: input.enum_values
      })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Failed to create property "${input.event_property}" on "${input.event_type}": ${response.status} ${body}`
      );
    }
  }
  async function listEventProperties(event_type) {
    const url = `${baseUrl}/api/2/taxonomy/event-property?event_type=${encodeURIComponent(event_type)}`;
    const response = await fetchFn(url, { headers: { Authorization: getAuthHeader() } });
    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`);
    }
    const data = await parseJson(response);
    return data.data.map((p) => ({
      event_property: p.event_property,
      type: p.type ?? "any",
      description: p.description,
      is_required: p.is_required,
      enum_values: p.enum_values
    }));
  }
  async function trackEvent(input) {
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
            insert_id: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`
          }
        ]
      })
    });
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
    }
    try {
      const json = JSON.parse(body);
      if (json.code !== 200) {
        throw new Error(`Amplitude error ${json.code}: ${json.error ?? "unknown"}`);
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(`Unexpected response: ${body.slice(0, 120)}`);
      }
      throw err;
    }
  }
  return { testConnection, listEvents, listEventProperties, createEvent, createEventProperty, trackEvent };
}

// src/screens/SettingsScreen.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var STATUS_ICON2 = { ok: "\u2713", error: "\u2717", untested: "\u25CB" };
var STATUS_COLOR2 = { ok: "green", error: "red", untested: "yellow" };
function emptyConfig() {
  return {
    apiKey: "",
    apiSecret: "",
    baseUrl: REGION_PRESETS.US.baseUrl,
    httpBaseUrl: REGION_PRESETS.US.httpBaseUrl,
    connectionStatus: "untested"
  };
}
function loadConfig() {
  if (configExists()) {
    try {
      return readConfig();
    } catch {
    }
  }
  return emptyConfig();
}
function EditField({ label, current, mask, hint, onSave, onBack }) {
  const [value, setValue] = useState(current);
  useInput((_, key) => {
    if (key.escape) onBack();
  });
  return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", gap: 1, children: [
    /* @__PURE__ */ jsx3(Header, { subtitle: `Settings \u203A ${label}` }),
    /* @__PURE__ */ jsxs3(Box3, { gap: 1, children: [
      /* @__PURE__ */ jsxs3(Text3, { bold: true, children: [
        label,
        ": "
      ] }),
      /* @__PURE__ */ jsx3(TextInput, { value, onChange: setValue, mask, onSubmit: (v) => {
        if (v.trim()) onSave(v.trim());
        else onBack();
      } })
    ] }),
    hint && /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: hint }),
    /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "Enter to save \xB7 Esc or empty to cancel" })
  ] });
}
function SettingsScreen({ onBack }) {
  const [config, setConfig] = useState(loadConfig);
  const [view, setView] = useState("menu");
  function save(updated) {
    writeConfig(updated);
    setConfig(updated);
  }
  function resetConnectionStatus(partial) {
    return { ...config, ...partial, connectionStatus: "untested", connectionTestedAt: void 0, connectionError: void 0 };
  }
  async function runTest() {
    setView("testing");
    try {
      const client = createAmplitudeClient(config);
      await client.testConnection();
      save({ ...config, connectionStatus: "ok", connectionTestedAt: (/* @__PURE__ */ new Date()).toISOString(), connectionError: void 0 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      save({ ...config, connectionStatus: "error", connectionTestedAt: (/* @__PURE__ */ new Date()).toISOString(), connectionError: msg });
    }
    setView("menu");
  }
  if (view === "pick-region") {
    const regionItems = [
      { label: REGION_PRESETS.US.label, value: "US" },
      { label: REGION_PRESETS.EU.label, value: "EU" },
      { label: "\u2190 Back", value: "back" }
    ];
    return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx3(Header, { subtitle: "Settings \u203A Region" }),
      /* @__PURE__ */ jsx3(
        SelectInput2,
        {
          items: regionItems,
          onSelect: (item) => {
            if (item.value === "back") {
              setView("menu");
              return;
            }
            const preset = REGION_PRESETS[item.value];
            save(resetConnectionStatus({ baseUrl: preset.baseUrl, httpBaseUrl: preset.httpBaseUrl }));
            setView("menu");
          }
        }
      ),
      /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "\u2191\u2193 navigate \xB7 Enter select" })
    ] });
  }
  if (view === "edit-projectName") {
    return /* @__PURE__ */ jsx3(
      EditField,
      {
        label: "Project Name",
        current: config.projectName ?? "",
        hint: "A label to identify which Amplitude project these credentials belong to",
        onSave: (v) => {
          save({ ...config, projectName: v });
          setView("menu");
        },
        onBack: () => setView("menu")
      }
    );
  }
  if (view === "edit-apiKey") {
    return /* @__PURE__ */ jsx3(EditField, { label: "API Key", current: config.apiKey, onSave: (v) => {
      save(resetConnectionStatus({ apiKey: v }));
      setView("menu");
    }, onBack: () => setView("menu") });
  }
  if (view === "edit-apiSecret") {
    return /* @__PURE__ */ jsx3(EditField, { label: "API Secret", current: config.apiSecret, mask: "*", onSave: (v) => {
      save(resetConnectionStatus({ apiSecret: v }));
      setView("menu");
    }, onBack: () => setView("menu") });
  }
  if (view === "edit-baseUrl") {
    return /* @__PURE__ */ jsx3(
      EditField,
      {
        label: "Taxonomy Base URL",
        current: config.baseUrl,
        hint: "Used for taxonomy API calls  e.g. https://amplitude.com or https://analytics.eu.amplitude.com",
        onSave: (v) => {
          save(resetConnectionStatus({ baseUrl: v }));
          setView("menu");
        },
        onBack: () => setView("menu")
      }
    );
  }
  if (view === "edit-httpBaseUrl") {
    return /* @__PURE__ */ jsx3(
      EditField,
      {
        label: "HTTP Tracking Base URL",
        current: config.httpBaseUrl,
        hint: "Used for tracking events  e.g. https://api2.amplitude.com or https://api.eu.amplitude.com",
        onSave: (v) => {
          save(resetConnectionStatus({ httpBaseUrl: v }));
          setView("menu");
        },
        onBack: () => setView("menu")
      }
    );
  }
  if (view === "testing") {
    return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx3(Header, { subtitle: "Settings" }),
      /* @__PURE__ */ jsxs3(Box3, { gap: 1, children: [
        /* @__PURE__ */ jsx3(Text3, { color: "cyan", children: /* @__PURE__ */ jsx3(Spinner, { type: "dots" }) }),
        /* @__PURE__ */ jsxs3(Text3, { children: [
          "Testing connection to ",
          config.baseUrl,
          "\u2026"
        ] })
      ] })
    ] });
  }
  const status = config.connectionStatus;
  const menuItems = [
    { label: `Edit Project Name    ${config.projectName ?? "(not set)"}`, value: "edit-projectName" },
    { label: `Edit API Key         ${config.apiKey ? config.apiKey.slice(0, 6) + "\u2026" : "(not set)"}`, value: "edit-apiKey" },
    { label: `Edit API Secret      ${config.apiSecret ? "\u2022".repeat(8) : "(not set)"}`, value: "edit-apiSecret" },
    { label: "Set Region           (sets both URLs)", value: "pick-region" },
    { label: `Edit Taxonomy URL    ${config.baseUrl}`, value: "edit-baseUrl" },
    { label: `Edit HTTP Track URL  ${config.httpBaseUrl}`, value: "edit-httpBaseUrl" },
    { label: "Test Connection", value: "test" },
    { label: "\u2190 Back", value: "back" }
  ];
  return /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", children: [
    /* @__PURE__ */ jsx3(Header, { subtitle: "Settings" }),
    /* @__PURE__ */ jsxs3(Box3, { flexDirection: "column", marginBottom: 1, children: [
      /* @__PURE__ */ jsxs3(Box3, { gap: 2, children: [
        /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "Project     " }),
        /* @__PURE__ */ jsx3(Text3, { children: config.projectName ?? /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "(not set)" }) })
      ] }),
      /* @__PURE__ */ jsxs3(Box3, { gap: 2, children: [
        /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "Connection  " }),
        /* @__PURE__ */ jsxs3(Text3, { color: STATUS_COLOR2[status], children: [
          STATUS_ICON2[status],
          " ",
          status === "ok" && "OK",
          status === "error" && (config.connectionError ?? "Error"),
          status === "untested" && "Not tested"
        ] })
      ] }),
      config.connectionTestedAt && /* @__PURE__ */ jsxs3(Box3, { gap: 2, children: [
        /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "Tested at   " }),
        /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: new Date(config.connectionTestedAt).toLocaleString() })
      ] }),
      /* @__PURE__ */ jsxs3(Box3, { gap: 2, children: [
        /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "Taxonomy    " }),
        /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: config.baseUrl })
      ] }),
      /* @__PURE__ */ jsxs3(Box3, { gap: 2, children: [
        /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "HTTP Track  " }),
        /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: config.httpBaseUrl })
      ] })
    ] }),
    /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "\u2500".repeat(40) }),
    /* @__PURE__ */ jsx3(Box3, { marginTop: 1, children: /* @__PURE__ */ jsx3(
      SelectInput2,
      {
        items: menuItems,
        onSelect: (item) => {
          if (item.value === "back") onBack(config);
          else if (item.value === "test") void runTest();
          else setView(item.value);
        }
      }
    ) }),
    /* @__PURE__ */ jsx3(Text3, { dimColor: true, children: "\u2191\u2193 navigate \xB7 Enter select" })
  ] });
}

// src/screens/ImportScreen.tsx
import { useState as useState3, useEffect } from "react";
import { Box as Box8, Text as Text8, useInput as useInput3 } from "ink";
import TextInput2 from "ink-text-input";
import SelectInput3 from "ink-select-input";
import Spinner3 from "ink-spinner";

// src/components/ValidationReport.tsx
import { Box as Box4, Text as Text4 } from "ink";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
function ValidationReport({ errors }) {
  return /* @__PURE__ */ jsxs4(Box4, { flexDirection: "column", gap: 1, children: [
    /* @__PURE__ */ jsxs4(Text4, { color: "red", bold: true, children: [
      "CSV validation failed \u2014 ",
      errors.length,
      " error",
      errors.length !== 1 ? "s" : "",
      " found:"
    ] }),
    /* @__PURE__ */ jsx4(Box4, { flexDirection: "column", children: errors.map((err, i) => /* @__PURE__ */ jsxs4(Text4, { color: "red", children: [
      "  \u2717 ",
      err.message
    ] }, i)) }),
    /* @__PURE__ */ jsx4(Text4, { dimColor: true, children: "Fix the errors above and try again." })
  ] });
}

// src/components/SummaryTable.tsx
import { Box as Box5, Text as Text5 } from "ink";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function SummaryTable({
  eventsCreated,
  propertiesCreated,
  eventsSkipped,
  eventsFailed,
  propertiesFailed
}) {
  const hasFailures = eventsFailed > 0 || propertiesFailed > 0;
  return /* @__PURE__ */ jsxs5(Box5, { flexDirection: "column", gap: 1, marginTop: 1, children: [
    /* @__PURE__ */ jsx5(Text5, { bold: true, children: "Summary" }),
    /* @__PURE__ */ jsxs5(Box5, { flexDirection: "column", children: [
      /* @__PURE__ */ jsxs5(Box5, { gap: 2, children: [
        /* @__PURE__ */ jsx5(Text5, { color: "green", children: "\u2713 Events created:" }),
        /* @__PURE__ */ jsx5(Text5, { bold: true, children: eventsCreated })
      ] }),
      /* @__PURE__ */ jsxs5(Box5, { gap: 2, children: [
        /* @__PURE__ */ jsx5(Text5, { color: "green", children: "\u2713 Properties created:" }),
        /* @__PURE__ */ jsx5(Text5, { bold: true, children: propertiesCreated })
      ] }),
      eventsSkipped > 0 && /* @__PURE__ */ jsxs5(Box5, { gap: 2, children: [
        /* @__PURE__ */ jsx5(Text5, { color: "yellow", children: "\u2298 Events skipped (already exist):" }),
        /* @__PURE__ */ jsx5(Text5, { bold: true, children: eventsSkipped })
      ] }),
      eventsFailed > 0 && /* @__PURE__ */ jsxs5(Box5, { gap: 2, children: [
        /* @__PURE__ */ jsx5(Text5, { color: "red", children: "\u2717 Events failed:" }),
        /* @__PURE__ */ jsx5(Text5, { bold: true, children: eventsFailed })
      ] }),
      propertiesFailed > 0 && /* @__PURE__ */ jsxs5(Box5, { gap: 2, children: [
        /* @__PURE__ */ jsx5(Text5, { color: "red", children: "\u2717 Properties failed:" }),
        /* @__PURE__ */ jsx5(Text5, { bold: true, children: propertiesFailed })
      ] })
    ] }),
    hasFailures ? /* @__PURE__ */ jsx5(Text5, { color: "red", children: "Completed with errors." }) : /* @__PURE__ */ jsx5(Text5, { color: "green", children: "All done!" })
  ] });
}

// src/components/CheckboxList.tsx
import { useState as useState2 } from "react";
import { Box as Box6, Text as Text6, useInput as useInput2 } from "ink";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function CheckboxList({ items: items2, onChange, onConfirm, onBack }) {
  const [cursor, setCursor] = useState2(0);
  useInput2((input, key) => {
    if (key.upArrow) {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.downArrow) {
      setCursor((c) => Math.min(items2.length - 1, c + 1));
    } else if (input === " ") {
      onChange(items2.map((item, i) => i === cursor ? { ...item, checked: !item.checked } : item));
    } else if (input === "a" || input === "A") {
      const allChecked = items2.every((i) => i.checked);
      onChange(items2.map((item) => ({ ...item, checked: !allChecked })));
    } else if (key.return) {
      const selected = items2.filter((i) => i.checked).map((i) => i.value);
      if (selected.length > 0) onConfirm(selected);
    } else if (key.escape) {
      onBack();
    }
  });
  const checkedCount = items2.filter((i) => i.checked).length;
  return /* @__PURE__ */ jsxs6(Box6, { flexDirection: "column", gap: 1, children: [
    /* @__PURE__ */ jsx6(Box6, { flexDirection: "column", children: items2.map((item, i) => {
      const isFocused = i === cursor;
      return /* @__PURE__ */ jsxs6(Box6, { gap: 1, children: [
        /* @__PURE__ */ jsx6(Text6, { color: isFocused ? "cyan" : void 0, children: isFocused ? "\u203A" : " " }),
        /* @__PURE__ */ jsx6(Text6, { color: item.checked ? "cyan" : "gray", children: item.checked ? "[\u2713]" : "[ ]" }),
        /* @__PURE__ */ jsxs6(Box6, { flexDirection: "column", children: [
          /* @__PURE__ */ jsx6(Text6, { bold: isFocused, children: item.label }),
          item.sublabel && /* @__PURE__ */ jsxs6(Text6, { dimColor: true, children: [
            "    ",
            item.sublabel
          ] })
        ] })
      ] }, i);
    }) }),
    /* @__PURE__ */ jsx6(Text6, { dimColor: true, children: "\u2500".repeat(40) }),
    /* @__PURE__ */ jsxs6(Box6, { gap: 3, children: [
      /* @__PURE__ */ jsxs6(Text6, { dimColor: true, children: [
        checkedCount,
        "/",
        items2.length,
        " selected"
      ] }),
      /* @__PURE__ */ jsx6(Text6, { dimColor: true, children: "Space toggle \xB7 A toggle all \xB7 Enter confirm \xB7 Esc back" })
    ] })
  ] });
}

// src/components/EventTable.tsx
import { Box as Box7, Text as Text7 } from "ink";
import Spinner2 from "ink-spinner";
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var COL_EVENT = 28;
var COL_PROPS = 7;
var COL_CATEGORY = 12;
function pad(str, width) {
  return str.length >= width ? str.slice(0, width - 1) + "\u2026" : str.padEnd(width);
}
function StatusCell({ row }) {
  if (row.status === "running") {
    return /* @__PURE__ */ jsx7(Text7, { color: "cyan", children: /* @__PURE__ */ jsx7(Spinner2, { type: "dots" }) });
  }
  const icons = {
    pending: "\u25CB",
    running: "\u25CC",
    done: "\u2713",
    skipped: "\u2298",
    error: "\u2717"
  };
  const colors = {
    pending: "gray",
    running: "cyan",
    done: "green",
    skipped: "yellow",
    error: "red"
  };
  return /* @__PURE__ */ jsx7(Text7, { color: colors[row.status], children: icons[row.status] });
}
function PropsCell({ row }) {
  if (row.propertiesTotal === 0) return /* @__PURE__ */ jsx7(Text7, { dimColor: true, children: "\u2014".padEnd(COL_PROPS) });
  const label = `${row.propertiesDone}/${row.propertiesTotal}`;
  const color = row.propertiesDone === row.propertiesTotal && row.status === "done" ? "green" : "white";
  return /* @__PURE__ */ jsx7(Text7, { color, children: pad(label, COL_PROPS) });
}
function EventTable({ rows }) {
  return /* @__PURE__ */ jsxs7(Box7, { flexDirection: "column", children: [
    /* @__PURE__ */ jsxs7(Box7, { gap: 1, children: [
      /* @__PURE__ */ jsx7(Text7, { dimColor: true, children: "  " }),
      /* @__PURE__ */ jsx7(Text7, { dimColor: true, bold: true, children: pad("Event", COL_EVENT) }),
      /* @__PURE__ */ jsx7(Text7, { dimColor: true, bold: true, children: pad("Props", COL_PROPS) }),
      /* @__PURE__ */ jsx7(Text7, { dimColor: true, bold: true, children: pad("Category", COL_CATEGORY) }),
      /* @__PURE__ */ jsx7(Text7, { dimColor: true, bold: true, children: "Detail" })
    ] }),
    /* @__PURE__ */ jsx7(Text7, { dimColor: true, children: "\u2500".repeat(40 + COL_EVENT + COL_PROPS) }),
    rows.map((row) => /* @__PURE__ */ jsxs7(Box7, { gap: 1, children: [
      /* @__PURE__ */ jsx7(StatusCell, { row }),
      /* @__PURE__ */ jsx7(
        Text7,
        {
          color: row.status === "done" ? "green" : row.status === "error" ? "red" : row.status === "skipped" ? "yellow" : void 0,
          children: pad(row.event_type, COL_EVENT)
        }
      ),
      /* @__PURE__ */ jsx7(PropsCell, { row }),
      /* @__PURE__ */ jsx7(Text7, { dimColor: true, children: pad(row.category ?? "\u2014", COL_CATEGORY) }),
      row.detail && /* @__PURE__ */ jsx7(Text7, { dimColor: true, children: row.detail })
    ] }, row.event_type))
  ] });
}

// src/lib/csv-parser.ts
import { createReadStream } from "fs";
import { createInterface } from "readline";
var VALID_PROPERTY_TYPES = /* @__PURE__ */ new Set(["string", "number", "boolean", "enum", "any"]);
var REQUIRED_COLUMNS = ["event_type"];
function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}
async function parseCsv(filePath) {
  const errors = [];
  const rawRows = [];
  let headers = [];
  let lineNum = 0;
  await new Promise((resolve, reject) => {
    const rl = createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity
    });
    rl.on("line", (line) => {
      lineNum++;
      if (!line.trim()) return;
      if (lineNum === 1) {
        headers = parseCsvLine(line).map((h) => h.toLowerCase());
        return;
      }
      const values = parseCsvLine(line);
      const row = {};
      headers.forEach((header, i) => {
        row[header] = values[i] ?? "";
      });
      rawRows.push({ lineNum, data: row });
    });
    rl.on("close", resolve);
    rl.on("error", reject);
  });
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      errors.push({ row: 1, message: `Missing required column: "${col}"` });
    }
  }
  if (errors.length > 0) {
    return { events: [], errors };
  }
  const eventMap = /* @__PURE__ */ new Map();
  for (const { lineNum: rowNum, data } of rawRows) {
    const eventType = data["event_type"]?.trim();
    if (!eventType) {
      errors.push({ row: rowNum, message: `Row ${rowNum}: "event_type" is required` });
      continue;
    }
    if (!eventMap.has(eventType)) {
      eventMap.set(eventType, {
        event_type: eventType,
        display_name: data["display_name"] || void 0,
        description: data["description"] || void 0,
        category: data["category"] || void 0,
        properties: []
      });
    }
    const event = eventMap.get(eventType);
    const propertyName = data["property_name"]?.trim();
    if (!propertyName) continue;
    const rawType = data["property_type"]?.trim().toLowerCase();
    if (!rawType) {
      errors.push({ row: rowNum, message: `Row ${rowNum}: "property_type" is required when "property_name" is set` });
      continue;
    }
    if (!VALID_PROPERTY_TYPES.has(rawType)) {
      errors.push({
        row: rowNum,
        message: `Row ${rowNum}: invalid property_type "${rawType}" \u2014 must be one of: string, number, boolean, enum, any`
      });
      continue;
    }
    const propertyType = rawType;
    const enumValuesRaw = data["enum_values"]?.trim();
    if (propertyType === "enum" && !enumValuesRaw) {
      errors.push({ row: rowNum, message: `Row ${rowNum}: "enum_values" is required when property_type is "enum"` });
      continue;
    }
    const enumValues = enumValuesRaw ? enumValuesRaw.split("|").map((v) => v.trim()).filter(Boolean) : void 0;
    event.properties.push({
      property_name: propertyName,
      property_type: propertyType,
      description: data["prop_description"] || void 0,
      is_required: data["is_required"]?.toLowerCase() === "true",
      enum_values: enumValues
    });
  }
  return { events: Array.from(eventMap.values()), errors };
}

// src/screens/ImportScreen.tsx
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
function FileInput({ value, onChange, onSubmit, onBack }) {
  useInput3((_, key) => {
    if (key.escape) onBack();
  });
  return /* @__PURE__ */ jsxs8(Box8, { flexDirection: "column", gap: 1, children: [
    /* @__PURE__ */ jsx8(Header, { subtitle: "Import" }),
    /* @__PURE__ */ jsxs8(Box8, { gap: 1, children: [
      /* @__PURE__ */ jsx8(Text8, { children: "CSV file path: " }),
      /* @__PURE__ */ jsx8(
        TextInput2,
        {
          value,
          onChange,
          onSubmit: (val) => {
            const p = val.trim();
            if (p) onSubmit(p);
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsx8(Text8, { dimColor: true, children: "Enter to confirm \xB7 Esc to go back" }),
    /* @__PURE__ */ jsx8(Text8, { dimColor: true, children: "e.g. ./events.csv or /Users/me/events.csv" })
  ] });
}
function ImportScreen({ config, onBack }) {
  const [phase, setPhase] = useState3(config ? "file-input" : "no-config");
  const [filePath, setFilePath] = useState3("");
  const [fileInput, setFileInput] = useState3("");
  const [errorMessage, setErrorMessage] = useState3("");
  const [validationErrors, setValidationErrors] = useState3([]);
  const [allEvents, setAllEvents] = useState3([]);
  const [checkboxItems, setCheckboxItems] = useState3([]);
  const [selectedEvents, setSelectedEvents] = useState3([]);
  const [rows, setRows] = useState3([]);
  const [summary, setSummary] = useState3({ eventsCreated: 0, propertiesCreated: 0, eventsSkipped: 0, eventsFailed: 0, propertiesFailed: 0 });
  async function validate(path) {
    setPhase("validating");
    try {
      const parsed = await parseCsv(path);
      if (parsed.errors.length > 0) {
        setValidationErrors(parsed.errors);
        setPhase("validation-error");
        return;
      }
      setAllEvents(parsed.events);
      setCheckboxItems(parsed.events.map((e) => ({
        value: e.event_type,
        label: e.event_type,
        sublabel: [
          e.properties.length ? `${e.properties.length} prop${e.properties.length !== 1 ? "s" : ""}` : "no properties",
          e.category,
          e.description
        ].filter(Boolean).join("  \xB7  "),
        checked: true
      })));
      setPhase("select");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setPhase("file-error");
    }
  }
  function startImport(chosenTypes) {
    const chosen = allEvents.filter((e) => chosenTypes.includes(e.event_type));
    setSelectedEvents(chosen);
    setRows(chosen.map((e) => ({
      event_type: e.event_type,
      category: e.category,
      propertiesTotal: e.properties.length,
      propertiesDone: 0,
      status: "pending"
    })));
    setPhase("importing");
  }
  useEffect(() => {
    if (phase === "importing" && config) void doImport();
  }, [phase]);
  function updateRow(event_type, update) {
    setRows((prev) => prev.map((r) => r.event_type === event_type ? { ...r, ...update } : r));
  }
  async function doImport() {
    if (!config) return;
    const client = createAmplitudeClient(config);
    let existingTypes = /* @__PURE__ */ new Set();
    try {
      const existing = await client.listEvents();
      existingTypes = new Set(existing.map((e) => e.event_type));
    } catch {
    }
    const stats = { eventsCreated: 0, propertiesCreated: 0, eventsSkipped: 0, eventsFailed: 0, propertiesFailed: 0 };
    for (const event of selectedEvents) {
      if (existingTypes.has(event.event_type)) {
        updateRow(event.event_type, { status: "skipped", detail: "already exists" });
        stats.eventsSkipped++;
      } else {
        updateRow(event.event_type, { status: "running" });
        try {
          await client.createEvent({ event_type: event.event_type, description: event.description, category: event.category });
          updateRow(event.event_type, { status: "done" });
          stats.eventsCreated++;
        } catch (err) {
          updateRow(event.event_type, { status: "error", detail: err instanceof Error ? err.message : String(err) });
          stats.eventsFailed++;
          continue;
        }
      }
      let propsDone = 0;
      for (const prop of event.properties) {
        try {
          await client.createEventProperty({ event_type: event.event_type, event_property: prop.property_name, type: prop.property_type, description: prop.description, is_required: prop.is_required, enum_values: prop.enum_values });
          propsDone++;
          updateRow(event.event_type, { propertiesDone: propsDone });
          stats.propertiesCreated++;
        } catch (err) {
          propsDone++;
          updateRow(event.event_type, { propertiesDone: propsDone, detail: `prop error: ${err instanceof Error ? err.message : String(err)}` });
          stats.propertiesFailed++;
        }
      }
    }
    setSummary(stats);
    setPhase("done");
  }
  const errorItems = [
    { label: "Try another file", value: "retry" },
    { label: "\u2190 Back to menu", value: "back" }
  ];
  if (phase === "no-config") {
    return /* @__PURE__ */ jsxs8(Box8, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx8(Header, { subtitle: "Import" }),
      /* @__PURE__ */ jsx8(Text8, { color: "yellow", children: "\u26A0 No credentials configured \u2014 go to Settings first." }),
      /* @__PURE__ */ jsx8(Box8, { marginTop: 1, children: /* @__PURE__ */ jsx8(SelectInput3, { items: [{ label: "\u2190 Back", value: "back" }], onSelect: onBack }) })
    ] });
  }
  if (phase === "file-input") {
    return /* @__PURE__ */ jsx8(
      FileInput,
      {
        value: fileInput,
        onChange: setFileInput,
        onSubmit: (val) => {
          setFilePath(val);
          void validate(val);
        },
        onBack
      }
    );
  }
  if (phase === "validating") {
    return /* @__PURE__ */ jsxs8(Box8, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx8(Header, { subtitle: "Import" }),
      /* @__PURE__ */ jsxs8(Box8, { gap: 1, children: [
        /* @__PURE__ */ jsx8(Text8, { color: "cyan", children: /* @__PURE__ */ jsx8(Spinner3, { type: "dots" }) }),
        /* @__PURE__ */ jsxs8(Text8, { children: [
          "Validating ",
          filePath,
          "\u2026"
        ] })
      ] })
    ] });
  }
  if (phase === "file-error") {
    return /* @__PURE__ */ jsxs8(Box8, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx8(Header, { subtitle: "Import" }),
      /* @__PURE__ */ jsxs8(Text8, { color: "red", children: [
        "\u2717 Could not read file: ",
        errorMessage
      ] }),
      /* @__PURE__ */ jsx8(Box8, { marginTop: 1, children: /* @__PURE__ */ jsx8(SelectInput3, { items: errorItems, onSelect: (item) => {
        if (item.value === "retry") {
          setPhase("file-input");
          setFileInput("");
        } else onBack();
      } }) })
    ] });
  }
  if (phase === "validation-error") {
    return /* @__PURE__ */ jsxs8(Box8, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx8(Header, { subtitle: "Import" }),
      /* @__PURE__ */ jsx8(ValidationReport, { errors: validationErrors }),
      /* @__PURE__ */ jsx8(Box8, { marginTop: 1, children: /* @__PURE__ */ jsx8(SelectInput3, { items: errorItems, onSelect: (item) => {
        if (item.value === "retry") {
          setPhase("file-input");
          setFileInput("");
        } else onBack();
      } }) })
    ] });
  }
  if (phase === "select") {
    return /* @__PURE__ */ jsxs8(Box8, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx8(Header, { subtitle: "Import \u203A Select Events" }),
      /* @__PURE__ */ jsxs8(Box8, { gap: 3, marginBottom: 1, children: [
        /* @__PURE__ */ jsxs8(Box8, { gap: 1, children: [
          /* @__PURE__ */ jsx8(Text8, { dimColor: true, children: "File" }),
          /* @__PURE__ */ jsx8(Text8, { children: filePath })
        ] }),
        /* @__PURE__ */ jsxs8(Box8, { gap: 1, children: [
          /* @__PURE__ */ jsx8(Text8, { dimColor: true, children: "Total" }),
          /* @__PURE__ */ jsxs8(Text8, { children: [
            allEvents.length,
            " events"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx8(
        CheckboxList,
        {
          items: checkboxItems,
          onChange: setCheckboxItems,
          onConfirm: startImport,
          onBack: () => {
            setPhase("file-input");
            setFileInput("");
          }
        }
      )
    ] });
  }
  if (phase === "importing") {
    const done = rows.filter((r) => r.status === "done" || r.status === "skipped" || r.status === "error").length;
    return /* @__PURE__ */ jsxs8(Box8, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx8(Header, { subtitle: "Import \u203A Running" }),
      /* @__PURE__ */ jsxs8(Box8, { gap: 1, marginBottom: 1, children: [
        /* @__PURE__ */ jsx8(Text8, { color: "cyan", children: /* @__PURE__ */ jsx8(Spinner3, { type: "dots" }) }),
        /* @__PURE__ */ jsxs8(Text8, { dimColor: true, children: [
          done,
          "/",
          rows.length,
          " events processed"
        ] })
      ] }),
      /* @__PURE__ */ jsx8(EventTable, { rows })
    ] });
  }
  const doneItems = [
    { label: "Import another file", value: "again" },
    { label: "\u2190 Back to menu", value: "back" }
  ];
  return /* @__PURE__ */ jsxs8(Box8, { flexDirection: "column", gap: 1, children: [
    /* @__PURE__ */ jsx8(Header, { subtitle: "Import \u203A Done" }),
    /* @__PURE__ */ jsx8(EventTable, { rows }),
    /* @__PURE__ */ jsx8(SummaryTable, { ...summary }),
    /* @__PURE__ */ jsx8(Box8, { marginTop: 1, children: /* @__PURE__ */ jsx8(SelectInput3, { items: doneItems, onSelect: (item) => {
      if (item.value === "again") {
        setPhase("file-input");
        setFileInput("");
        setRows([]);
      } else onBack();
    } }) })
  ] });
}

// src/screens/TrackScreen.tsx
import { useState as useState4, useEffect as useEffect2 } from "react";
import { Box as Box9, Text as Text9, useInput as useInput4 } from "ink";
import SelectInput4 from "ink-select-input";
import TextInput3 from "ink-text-input";
import Spinner4 from "ink-spinner";
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
function FieldInput({ label, hint, placeholder, onSubmit, onBack }) {
  const [value, setValue] = useState4(placeholder ?? "");
  useInput4((_, key) => {
    if (key.escape) onBack();
  });
  return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
    /* @__PURE__ */ jsxs9(Box9, { gap: 1, children: [
      /* @__PURE__ */ jsxs9(Text9, { bold: true, children: [
        label,
        ": "
      ] }),
      /* @__PURE__ */ jsx9(TextInput3, { value, onChange: setValue, onSubmit: (v) => onSubmit(v.trim()) })
    ] }),
    hint && /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: hint }),
    /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "Enter to confirm \xB7 Esc to go back" })
  ] });
}
function TrackScreen({ config, onBack }) {
  const [phase, setPhase] = useState4(config ? "loading-events" : "no-config");
  const [taxonomyEvents, setTaxonomyEvents] = useState4([]);
  const [selectedEvent, setSelectedEvent] = useState4("");
  const [taxonomyProps, setTaxonomyProps] = useState4([]);
  const [propCheckboxes, setPropCheckboxes] = useState4([]);
  const [properties, setProperties] = useState4([]);
  const [pendingPropKey, setPendingPropKey] = useState4("");
  const [userId, setUserId] = useState4("test-user-001");
  const [errorMessage, setErrorMessage] = useState4("");
  const client = config ? createAmplitudeClient(config) : null;
  useEffect2(() => {
    if (phase !== "loading-events" || !client) return;
    client.listEvents().then((list) => {
      setTaxonomyEvents(list);
      setPhase("select-event");
    }).catch((err) => {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setPhase("error");
    });
  }, [phase]);
  function handleTaxonomyEventSelected(event_type) {
    setSelectedEvent(event_type);
    setPhase("loading-props");
    client.listEventProperties(event_type).then((props) => {
      setTaxonomyProps(props);
      setPropCheckboxes(props.map((p) => ({
        value: p.event_property,
        label: p.event_property,
        sublabel: buildPropHint(p),
        checked: true
      })));
      setPhase("select-properties");
    }).catch(() => {
      setTaxonomyProps([]);
      setPropCheckboxes([]);
      setPhase("select-properties");
    });
  }
  function handleManualEventName(name) {
    if (!name) return;
    setSelectedEvent(name);
    setTaxonomyProps([]);
    setPropCheckboxes([]);
    setPhase("select-properties");
  }
  function confirmPropertySelection(selectedKeys) {
    const fromTaxonomy = selectedKeys.map((key) => {
      const p = taxonomyProps.find((tp) => tp.event_property === key);
      return { key, value: "", fromTaxonomy: true, hint: p ? buildPropHint(p) : void 0 };
    });
    setProperties(fromTaxonomy);
    setPhase("enter-user-id");
  }
  function skipAllProperties() {
    setProperties([]);
    setPhase("enter-user-id");
  }
  function startAddCustomProp() {
    const selectedKeys = propCheckboxes.filter((c) => c.checked).map((c) => c.value);
    const fromTaxonomy = selectedKeys.map((key) => {
      const p = taxonomyProps.find((tp) => tp.event_property === key);
      return { key, value: "", fromTaxonomy: true, hint: p ? buildPropHint(p) : void 0 };
    });
    setProperties(fromTaxonomy);
    setPendingPropKey("");
    setPhase("add-prop-name");
  }
  function commitCustomPropKey(key) {
    if (key) {
      setPendingPropKey(key);
      setPhase("add-prop-value");
    } else setPhase("select-properties");
  }
  function commitCustomPropValue(value) {
    setProperties((prev) => [...prev, { key: pendingPropKey, value, fromTaxonomy: false }]);
    setPhase("select-properties");
  }
  async function sendEvent() {
    setPhase("sending");
    try {
      const event_properties = {};
      for (const { key, value } of properties) {
        if (value) event_properties[key] = value;
      }
      await client.trackEvent({ event_type: selectedEvent, user_id: userId, event_properties });
      setPhase("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }
  function reset() {
    setSelectedEvent("");
    setTaxonomyProps([]);
    setPropCheckboxes([]);
    setProperties([]);
    setUserId("test-user-001");
    setPhase("loading-events");
  }
  if (phase === "no-config") {
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: "Track Event" }),
      /* @__PURE__ */ jsx9(Text9, { color: "yellow", children: "\u26A0 No credentials configured \u2014 go to Settings first." }),
      /* @__PURE__ */ jsx9(Box9, { marginTop: 1, children: /* @__PURE__ */ jsx9(SelectInput4, { items: [{ label: "\u2190 Back", value: "back" }], onSelect: onBack }) })
    ] });
  }
  if (phase === "loading-events" || phase === "loading-props") {
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: "Track Event" }),
      /* @__PURE__ */ jsxs9(Box9, { gap: 1, children: [
        /* @__PURE__ */ jsx9(Text9, { color: "cyan", children: /* @__PURE__ */ jsx9(Spinner4, { type: "dots" }) }),
        /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: phase === "loading-events" ? "Loading taxonomy events\u2026" : `Loading properties for ${selectedEvent}\u2026` })
      ] })
    ] });
  }
  if (phase === "select-event") {
    const items2 = [
      ...taxonomyEvents.map((e) => ({
        label: e.display_name ? `${e.event_type}  (${e.display_name})` : e.event_type,
        value: e.event_type
      })),
      { label: "\u270E  Type event name manually\u2026", value: "__manual__" },
      { label: "\u2190 Back", value: "__back__" }
    ];
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: "Track Event \u203A Step 1 \u2014 Event" }),
      /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: taxonomyEvents.length > 0 ? `${taxonomyEvents.length} events in taxonomy \u2014 pick one or enter manually:` : "No events in taxonomy \u2014 enter name manually:" }),
      /* @__PURE__ */ jsx9(
        SelectInput4,
        {
          items: items2,
          onSelect: (item) => {
            if (item.value === "__back__") onBack();
            else if (item.value === "__manual__") setPhase("enter-event-name");
            else handleTaxonomyEventSelected(item.value);
          }
        }
      ),
      /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "\u2191\u2193 navigate \xB7 Enter select" })
    ] });
  }
  if (phase === "enter-event-name") {
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: "Track Event \u203A Step 1 \u2014 Event" }),
      /* @__PURE__ */ jsx9(
        FieldInput,
        {
          label: "Event name",
          hint: "Exact event_type string (e.g. user_signed_up)",
          onSubmit: handleManualEventName,
          onBack: () => setPhase("select-event")
        }
      )
    ] });
  }
  if (phase === "select-properties") {
    const customProps = properties.filter((p) => !p.fromTaxonomy);
    const actionItems = [
      { label: "\u270E  Add custom property\u2026", value: "__add__" },
      { label: "\u2192  Continue (no more properties)", value: "__done__" },
      { label: "\u2190 Back", value: "__back__" }
    ];
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: `Track Event \u203A Step 2 \u2014 Properties  [${selectedEvent}]` }),
      propCheckboxes.length > 0 && /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", marginBottom: 1, children: [
        /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "Taxonomy properties \u2014 toggle to include:" }),
        /* @__PURE__ */ jsx9(
          CheckboxList,
          {
            items: propCheckboxes,
            onChange: setPropCheckboxes,
            onConfirm: confirmPropertySelection,
            onBack: () => setPhase("select-event")
          }
        )
      ] }),
      customProps.length > 0 && /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", marginBottom: 1, children: [
        /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "Custom properties added:" }),
        customProps.map((p) => /* @__PURE__ */ jsxs9(Box9, { gap: 2, paddingLeft: 2, children: [
          /* @__PURE__ */ jsx9(Text9, { color: "cyan", children: "+" }),
          /* @__PURE__ */ jsx9(Text9, { children: p.key }),
          /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: p.value || "(empty)" })
        ] }, p.key))
      ] }),
      propCheckboxes.length === 0 && customProps.length === 0 && /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "No properties defined \u2014 add custom ones below or continue." }),
      /* @__PURE__ */ jsx9(
        SelectInput4,
        {
          items: actionItems,
          onSelect: (item) => {
            if (item.value === "__add__") startAddCustomProp();
            else if (item.value === "__done__") {
              const selectedKeys = propCheckboxes.filter((c) => c.checked).map((c) => c.value);
              const fromTaxonomy = selectedKeys.map((key) => {
                const p = taxonomyProps.find((tp) => tp.event_property === key);
                return { key, value: "", fromTaxonomy: true, hint: p ? buildPropHint(p) : void 0 };
              });
              setProperties([...fromTaxonomy, ...customProps]);
              setPhase("enter-user-id");
            } else {
              setPhase("select-event");
            }
          }
        }
      )
    ] });
  }
  if (phase === "add-prop-name") {
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: `Track Event \u203A Step 2 \u2014 Add Property  [${selectedEvent}]` }),
      /* @__PURE__ */ jsx9(
        FieldInput,
        {
          label: "Property name",
          hint: "e.g. referral_code",
          onSubmit: commitCustomPropKey,
          onBack: () => setPhase("select-properties")
        }
      )
    ] });
  }
  if (phase === "add-prop-value") {
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: `Track Event \u203A Step 2 \u2014 Add Property  [${selectedEvent}]` }),
      /* @__PURE__ */ jsxs9(Box9, { gap: 2, marginBottom: 1, children: [
        /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "Property" }),
        /* @__PURE__ */ jsx9(Text9, { bold: true, children: pendingPropKey })
      ] }),
      /* @__PURE__ */ jsx9(
        FieldInput,
        {
          label: "Value",
          hint: "Leave empty to skip this property",
          onSubmit: commitCustomPropValue,
          onBack: () => setPhase("add-prop-name")
        }
      )
    ] });
  }
  if (phase === "enter-user-id") {
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: `Track Event \u203A Step 3 \u2014 User ID  [${selectedEvent}]` }),
      /* @__PURE__ */ jsx9(
        FieldInput,
        {
          label: "Mock user_id",
          hint: "Min 5 chars \u2014 identifies the simulated user in Amplitude",
          placeholder: userId,
          onSubmit: (val) => {
            setUserId(val || userId);
            setPhase("review");
          },
          onBack: () => setPhase("select-properties")
        }
      )
    ] });
  }
  if (phase === "review") {
    const filledProps2 = properties.filter(({ value }) => value);
    const reviewItems = [
      { label: "Send event \u2192", value: "send" },
      { label: "Edit properties", value: "props" },
      { label: "Edit user_id", value: "user" },
      { label: "\u2190 Start over", value: "reset" }
    ];
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: "Track Event \u203A Step 4 \u2014 Review" }),
      /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", borderStyle: "round", borderColor: "cyan", paddingX: 1, children: [
        /* @__PURE__ */ jsxs9(Box9, { gap: 2, children: [
          /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "event_type        " }),
          /* @__PURE__ */ jsx9(Text9, { bold: true, color: "cyan", children: selectedEvent })
        ] }),
        /* @__PURE__ */ jsxs9(Box9, { gap: 2, children: [
          /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "user_id           " }),
          /* @__PURE__ */ jsx9(Text9, { children: userId })
        ] }),
        /* @__PURE__ */ jsxs9(Box9, { gap: 2, children: [
          /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "time              " }),
          /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "set on send" })
        ] }),
        filledProps2.length > 0 ? /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", marginTop: 1, children: [
          /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "event_properties:" }),
          filledProps2.map(({ key, value, hint }) => /* @__PURE__ */ jsxs9(Box9, { gap: 2, paddingLeft: 2, children: [
            /* @__PURE__ */ jsx9(Text9, { color: "cyan", children: key }),
            /* @__PURE__ */ jsxs9(Text9, { children: [
              "= ",
              value
            ] }),
            hint && /* @__PURE__ */ jsxs9(Text9, { dimColor: true, children: [
              "(",
              hint,
              ")"
            ] })
          ] }, key))
        ] }) : /* @__PURE__ */ jsx9(Box9, { marginTop: 1, children: /* @__PURE__ */ jsxs9(Text9, { dimColor: true, children: [
          "event_properties: ",
          "{}"
        ] }) })
      ] }),
      /* @__PURE__ */ jsx9(Box9, { marginTop: 1, children: /* @__PURE__ */ jsx9(
        SelectInput4,
        {
          items: reviewItems,
          onSelect: (item) => {
            if (item.value === "send") void sendEvent();
            else if (item.value === "props") setPhase("select-properties");
            else if (item.value === "user") setPhase("enter-user-id");
            else reset();
          }
        }
      ) })
    ] });
  }
  if (phase === "sending") {
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: "Track Event" }),
      /* @__PURE__ */ jsxs9(Box9, { gap: 1, children: [
        /* @__PURE__ */ jsx9(Text9, { color: "cyan", children: /* @__PURE__ */ jsx9(Spinner4, { type: "dots" }) }),
        /* @__PURE__ */ jsxs9(Text9, { children: [
          "Sending ",
          /* @__PURE__ */ jsx9(Text9, { bold: true, children: selectedEvent }),
          "\u2026"
        ] })
      ] })
    ] });
  }
  if (phase === "error") {
    return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
      /* @__PURE__ */ jsx9(Header, { subtitle: "Track Event" }),
      /* @__PURE__ */ jsxs9(Text9, { color: "red", children: [
        "\u2717 ",
        errorMessage
      ] }),
      /* @__PURE__ */ jsx9(Box9, { marginTop: 1, children: /* @__PURE__ */ jsx9(
        SelectInput4,
        {
          items: [
            { label: "Try again", value: "retry" },
            { label: "\u2190 Back to menu", value: "back" }
          ],
          onSelect: (item) => {
            if (item.value === "retry") reset();
            else onBack();
          }
        }
      ) })
    ] });
  }
  const filledProps = properties.filter(({ value }) => value);
  return /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", gap: 1, children: [
    /* @__PURE__ */ jsx9(Header, { subtitle: "Track Event \u203A Done" }),
    /* @__PURE__ */ jsx9(Text9, { color: "green", children: "\u2713 Event sent successfully!" }),
    /* @__PURE__ */ jsxs9(Box9, { flexDirection: "column", borderStyle: "round", borderColor: "green", paddingX: 1, marginTop: 1, children: [
      /* @__PURE__ */ jsxs9(Box9, { gap: 2, children: [
        /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "event_type" }),
        /* @__PURE__ */ jsx9(Text9, { bold: true, children: selectedEvent })
      ] }),
      /* @__PURE__ */ jsxs9(Box9, { gap: 2, children: [
        /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "user_id   " }),
        /* @__PURE__ */ jsx9(Text9, { children: userId })
      ] }),
      filledProps.map(({ key, value }) => /* @__PURE__ */ jsxs9(Box9, { gap: 2, children: [
        /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: key.padEnd(10) }),
        /* @__PURE__ */ jsx9(Text9, { children: value })
      ] }, key))
    ] }),
    /* @__PURE__ */ jsx9(Box9, { marginTop: 1, children: /* @__PURE__ */ jsx9(Text9, { dimColor: true, children: "The event should appear in Amplitude within a few minutes." }) }),
    /* @__PURE__ */ jsx9(Box9, { marginTop: 1, children: /* @__PURE__ */ jsx9(
      SelectInput4,
      {
        items: [
          { label: "Track another event", value: "again" },
          { label: "\u2190 Back to menu", value: "back" }
        ],
        onSelect: (item) => {
          if (item.value === "again") reset();
          else onBack();
        }
      }
    ) })
  ] });
}
function buildPropHint(p) {
  return [
    p.type !== "any" && p.type,
    p.enum_values?.length && `options: ${p.enum_values.join(", ")}`,
    p.is_required && "required",
    p.description
  ].filter(Boolean).join("  \xB7  ");
}

// src/App.tsx
import { jsx as jsx10 } from "react/jsx-runtime";
function loadInitialConfig() {
  if (!configExists()) return null;
  try {
    return readConfig();
  } catch {
    return null;
  }
}
function App() {
  const [screen, setScreen] = useState5("menu");
  const [config, setConfig] = useState5(loadInitialConfig);
  if (screen === "settings") {
    return /* @__PURE__ */ jsx10(
      SettingsScreen,
      {
        onBack: (updated) => {
          if (updated) setConfig(updated);
          setScreen("menu");
        }
      }
    );
  }
  if (screen === "import") {
    return /* @__PURE__ */ jsx10(
      ImportScreen,
      {
        config,
        onBack: () => setScreen("menu")
      }
    );
  }
  if (screen === "track") {
    return /* @__PURE__ */ jsx10(
      TrackScreen,
      {
        config,
        onBack: () => setScreen("menu")
      }
    );
  }
  return /* @__PURE__ */ jsx10(
    MainMenu,
    {
      config,
      onSelect: setScreen
    }
  );
}

// src/index.tsx
import { jsx as jsx11 } from "react/jsx-runtime";
render(/* @__PURE__ */ jsx11(App, {}));
