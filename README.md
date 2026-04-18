# Carbonlite — Website Carbon Footprint

Measure the real-time carbon footprint of any website. Get a grade (A+ to F) and actionable recommendations to reduce emissions.

A Chrome extension built for developers who want to understand and reduce the environmental impact of their websites.

## Features

- **Real-time carbon grade** (A+ to F) for every page
- **Resource breakdown** by type (images, JS, CSS, fonts)
- **Industry benchmark comparison** (e-commerce, blog, SaaS, news)
- **Actionable fix recommendations** with estimated CO2 savings
- **7-day trend tracking** per domain
- **Carbon budget alerts** when pages exceed your threshold
- **Green hosting detection** via Green Web Foundation (opt-in)
- **Dark mode** support
- **Export history** as JSON

## How It Works

Carbonlite uses the [Sustainable Web Design Model (SWDM v4)](https://sustainablewebdesign.org/estimating-digital-emissions/) to calculate CO2 emissions based on:

| Factor | Value |
|--------|-------|
| Data center energy | 0.055 kWh/GB |
| Network energy | 0.059 kWh/GB |
| Device energy | 0.080 kWh/GB |
| Grid intensity | 480 gCO2e/kWh (global avg) |
| Embodied carbon | +16% for hardware manufacturing |
| Green hosting | 50 gCO2e/kWh for renewable data centers |

11 regional grid intensity options available (US, EU, UK, India, China, Australia, Brazil, Japan, Germany, France).

## Installation

### From Chrome Web Store
*Coming soon*

### From Source
1. Clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the project root
5. Click the Carbonlite icon in the toolbar to open the side panel

## Privacy

- All data stored **locally on your device** — never sent to our servers
- Green hosting check is **opt-in** and sends only hostnames (not full URLs)
- **No tracking**, analytics, or telemetry
- **No personal data** collected
- **Incognito mode** fully respected — zero data persisted in private windows

See [privacy.html](privacy.html) for the full privacy policy.

## Project Structure

```
manifest.json          # Chrome Extension Manifest V3
background.js          # Service worker: resource tracking, CO2 calculation
content.js             # Content script: Performance API data collection
sidepanel/             # Side panel UI (score, breakdown, fixes tabs)
options/               # Settings page
onboarding/            # First-run welcome page
libs/
  co2.js               # SWDM v4 calculation engine
  constants.js         # Grade thresholds, grid intensities, badge colors
  classifier.js        # Resource type classification
  recommendations.js   # Optimization recommendations engine
  grading.js           # Letter grade calculation
  benchmarks.js        # Industry benchmark data
tests/                 # 247 tests (Vitest)
specs/                 # SDD specifications and phase tracking
```

## Development

```bash
# Install test dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint
```

## Permissions

| Permission | Why |
|------------|-----|
| `sidePanel` | Display the carbon analysis UI |
| `storage` | Save settings and history locally |
| `tabs` | Identify Chrome internal pages and respect Incognito privacy |
| `webNavigation` | Detect page loads for automatic analysis |
| Content script | Collect resource sizes via Performance API (no page content is read) |
| `thegreenwebfoundation.org` | Green hosting check (opt-in, disabled by default) |

## License

MIT

## Contributing

Issues and pull requests welcome at [github.com/rapidminds-tech/carbonlite](https://github.com/rapidminds-tech/carbonlite).
