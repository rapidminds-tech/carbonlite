# Chrome Web Store Listing — Carbonlite

> Copy-paste these fields into the Chrome Web Store Developer Console.

---

## Extension Name
```
Carbonlite — Website Carbon Footprint
```

## Short Description (132 chars max)
```
Measure the carbon footprint of any website in real time. Get a grade (A+ to F) and actionable tips to reduce emissions.
```

## Detailed Description (16,000 chars max)
```
Carbonlite measures the real-time carbon footprint of every website you visit and gives developers actionable recommendations to build a cleaner web.

🌿 HOW IT WORKS
Carbonlite uses the Sustainable Web Design Model (SWDM v4) to calculate CO2 emissions based on:
• Data transferred (images, scripts, CSS, fonts)
• Hosting type (green vs standard data center)
• Network and device energy consumption
• Embodied carbon from hardware manufacturing

📊 FEATURES
• Real-time carbon grade (A+ to F) for every page
• Resource breakdown by type (images, JS, CSS, fonts)
• Industry benchmark comparison (e-commerce, blog, SaaS, news)
• Actionable fix recommendations with estimated savings
• 7-day trend tracking per domain
• Carbon budget alerts
• Green hosting detection via Green Web Foundation (opt-in)
• Dark mode support
• Export history as JSON

🔒 PRIVACY-FIRST
• All data stored locally on your device — never sent to our servers
• Green hosting check is opt-in and sends only hostnames (not full URLs)
• No tracking, analytics, or telemetry
• No personal data collected
• Incognito mode fully respected — zero data persisted in private windows

🎯 BUILT FOR DEVELOPERS
Carbonlite is designed for web developers who want to understand and reduce the environmental impact of their websites. Unlike consumer carbon trackers, Carbonlite provides:
• Per-resource breakdown with file-level detail
• Copy-paste optimization checklists
• Format-specific image compression suggestions
• Third-party script impact analysis
• New vs returning visitor comparison

📐 METHODOLOGY
Based on the Sustainable Web Design Model v4 (sustainablewebdesign.org):
• Energy model: Data center (0.055 kWh/GB) + Network (0.059) + Device (0.080)
• Grid intensity: 480 gCO2e/kWh global average (Ember 2023), with 11 regional options
• Embodied carbon: +16% for hardware manufacturing
• Green hosting: 50 gCO2e/kWh for renewable-powered data centers

🔧 PERMISSIONS EXPLAINED
• sidePanel: Display the carbon analysis UI
• storage: Save settings and history locally on your device
• tabs: Identify Chrome internal pages and respect Incognito privacy
• webNavigation: Detect page loads for automatic analysis
• Content script: Collect resource sizes via Performance API (no page content is read)
• thegreenwebfoundation.org: Green hosting check (opt-in only, disabled by default)

Questions? Report issues at github.com/rapidminds-tech/carbonlite
```

## Category
```
Developer Tools
```

## Language
```
English
```

---

## Privacy Practices (Developer Console form)

### Single Purpose Description
```
Carbonlite measures website carbon footprint using the Sustainable Web Design Model and provides optimization recommendations for developers.
```

### Permission Justifications

| Permission | Justification |
|------------|---------------|
| `sidePanel` | Core UI — the extension displays analysis results in a persistent side panel |
| `storage` | Required to persist user settings, carbon history, and cached hosting lookups locally on the user's device |
| `tabs` | Required to identify Chrome internal pages (which cannot be analyzed) and to respect Incognito mode privacy |
| `webNavigation` | Required to detect page load events and trigger carbon analysis automatically |
| `content_scripts (all URLs)` | Injects a lightweight script that reads resource transfer sizes via the browser Performance API. No page content, form data, or user input is read |
| `host_permissions (thegreenwebfoundation.org)` | Required to check if a website's hosting provider uses renewable energy. This feature is opt-in and disabled by default. Only the hostname is sent — no paths or query parameters |

### Data Usage Disclosure

| Data Type | Collected? | Usage |
|-----------|------------|-------|
| Personally identifiable information | No | — |
| Health information | No | — |
| Financial information | No | — |
| Authentication information | No | — |
| Personal communications | No | — |
| Location | No | — |
| Web history | Yes | Hostnames stored locally for 7-day carbon trend tracking. Auto-deleted after 30 days. When green hosting check is enabled (opt-in), hostnames are sent to Green Web Foundation API and cached locally for 24 hours. |
| User activity | No | — |
| Website content | No | — |

### Privacy Policy URL
```
[Host privacy.html on GitHub Pages or similar, then paste the URL here]
```

---

## Screenshots Needed (Chrome Web Store requires 1-5)

Create screenshots at **1280x800** or **640x400** resolution:

1. **Score view** — Side panel showing a grade (e.g., A or B) with the gauge, CO2 value, and percentile bar
2. **Breakdown view** — Resource treemap + third-party scripts analysis
3. **Fixes view** — Recommendations with savings estimates expanded
4. **Options page** — Settings showing region, budget, and domain configuration
5. **Dark mode** — Any view in dark theme

---

## Submission Steps

### 1. Host your privacy policy
Your `privacy.html` needs a public URL. Options:
- **GitHub Pages**: Push to a `gh-pages` branch → `https://yourusername.github.io/carbonlite/privacy.html`
- **Netlify/Vercel**: Deploy the single file
- **Any static host**: Upload `privacy.html` anywhere publicly accessible

### 2. Build the ZIP
```bash
bash store/build-zip.sh
# Creates: store/carbonlite-v1.0.0.zip
```

### 3. Upload to Developer Console
1. Go to https://chrome.google.com/webstore/devconsole
2. Click **"New Item"**
3. Upload `store/carbonlite-v1.0.0.zip`
4. Fill in all fields from this document
5. Upload 1-5 screenshots (1280x800)
6. Set category to **"Developer Tools"**
7. Paste your hosted privacy policy URL
8. Fill in the **Privacy Practices** tab using the table above
9. Set distribution to **"Public"**
10. Click **"Submit for Review"**

### 4. Review timeline
- Initial review: typically **1-3 business days**
- If rejected: you'll get an email with specific issues to fix
- Common rejection reasons:
  - Missing/unclear privacy policy
  - Excessive permissions not justified
  - Missing screenshots
  - Description doesn't match functionality

### 5. Post-publication
- Extension gets a unique Chrome Web Store URL
- Updates: bump `version` in manifest.json → rebuild ZIP → upload new version
- Reviews for updates are usually faster (same day)

---

## Store Assets Checklist

- [x] `store/carbonlite-v1.0.0.zip` — Extension package
- [x] `privacy.html` — Privacy policy (needs public hosting)
- [x] Store listing text (above)
- [x] Permission justifications (above)
- [x] Privacy disclosure (above)
- [x] `$5 developer fee` — Paid
- [ ] **Screenshots** (1-5 at 1280x800) — YOU NEED TO CREATE THESE
- [ ] **Privacy policy URL** — YOU NEED TO HOST privacy.html
