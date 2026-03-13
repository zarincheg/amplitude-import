# amplitude-import

Interactive CLI tool for Amplitude analytics setup:

- **Import** events and properties in bulk from a CSV file
- **Track** test events interactively to validate your taxonomy

## Install

```bash
npm install -g github:YOUR_USERNAME/amplitude-import
```

Requires Node.js 18+. The build runs automatically during install.

## Usage

```bash
amplitude-import
```

Launches the interactive TUI. Navigate with arrow keys, Enter to select.

### Screens

| Screen | Description |
|---|---|
| **Settings** | Configure API key, secret, and region (US / EU) |
| **Import from CSV** | Bulk-create events and properties from a CSV file |
| **Track Test Event** | Send a test event via the HTTP API to validate taxonomy |

## CSV Format

One row per property. Event metadata is repeated across rows for the same event. Rows with no `property_name` create an event with no properties.

```csv
event_type,display_name,description,category,property_name,property_type,prop_description,is_required,enum_values
user_signed_up,User Signed Up,Fired on registration,Authentication,method,enum,Sign-up method,true,email|google|apple
user_signed_up,,,,,referral_code,string,Referral code,false,
page_viewed,Page Viewed,Fired on page view,Navigation,,,,,
```

**Columns:**

| Column | Required | Description |
|---|---|---|
| `event_type` | ✓ | Technical event name (e.g. `user_signed_up`) |
| `display_name` | | Human-readable name shown in Amplitude UI |
| `description` | | Event description |
| `category` | | Event category |
| `property_name` | | Property key — leave empty for events with no properties |
| `property_type` | | `string` / `number` / `boolean` / `enum` / `any` |
| `prop_description` | | Property description |
| `is_required` | | `true` or `false` |
| `enum_values` | | Pipe-separated values for enum type: `email\|google\|apple` |

## Regions

| Region | Taxonomy API | HTTP Tracking API |
|---|---|---|
| US | `https://amplitude.com` | `https://api2.amplitude.com` |
| EU | `https://analytics.eu.amplitude.com` | `https://api.eu.amplitude.com` |

Select your region in **Settings → Set Region** — both URLs are configured automatically.

## Debug

```bash
amplitude-import-debug
amplitude-import-debug --raw   # full response bodies
```

Probes all API endpoints and shows status codes and response types. Useful for diagnosing connection issues.

## Development

```bash
git clone https://github.com/YOUR_USERNAME/amplitude-import
cd amplitude-import
yarn install
yarn dev          # run from source
yarn build        # compile to dist/
yarn debug        # run API debug probe
```
