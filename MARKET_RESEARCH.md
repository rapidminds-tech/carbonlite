# Green Engineering Chrome Extension - Market Research Report

**Date:** April 15, 2026
**Prepared for:** Product Strategy & Development Planning

---

## Table of Contents

1. [Existing Competitors & Landscape](#1-existing-competitors--landscape)
2. [Market Size & Demand](#2-market-size--demand)
3. [Target Audience Segments](#3-target-audience-segments)
4. [Monetization Models](#4-monetization-models)
5. [Key Features to Differentiate](#5-key-features-to-differentiate)
6. [Technical Feasibility](#6-technical-feasibility)
7. [Strategic Recommendations](#7-strategic-recommendations)

---

## 1. Existing Competitors & Landscape

### 1.1 Chrome Extensions (Direct Competitors)

| Extension | Type | Key Capability | Limitations |
|-----------|------|---------------|-------------|
| **Pebble** (Antarctica Global) | Browsing session tracker | Tracks CO2e per browsing session; factors in data centers, networks, device. All local processing. | Consumer-focused, no developer/team features |
| **Carbon-Calculator** | Per-page calculator | Instant CO2 calculation per webpage based on data usage | Simple display only, no historical tracking or recommendations |
| **Carbon Footprint Tracker** | Browsing tracker | Tracks cumulative browsing carbon footprint | Basic, no website optimization guidance |
| **Website Footprint** | Per-page scanner | Shows carbon footprint of visited websites | Limited methodology, no actionable insights |
| **WebCarbon** (open-source) | Real-time audit | Real-time CO2e tracking of daily browsing | GitHub project, not widely adopted, consumer-focused |
| **The Sustainarian Tracker** | Lightweight tracker | Estimates digital carbon emissions with actionable insights; privacy-friendly, local storage | Consumer-oriented, limited developer tooling |

**Key observation:** All existing Chrome extensions are **consumer-focused browsing trackers**. None target developers or sustainability teams with actionable optimization recommendations, CI/CD integration, or team dashboards. This is the primary gap.

### 1.2 Web-Based Tools (Indirect Competitors)

| Tool | Model | Strengths | Weaknesses |
|------|-------|-----------|------------|
| **[Website Carbon Calculator](https://www.websitecarbon.com/)** (Wholegrain Digital) | Free one-time scan | Most widely recognized; established methodology; simple API (now limited) | One-time scan only; site endpoint deprecated July 2025; no monitoring |
| **[Ecograder](https://ecograder.com/)** (Mightybytes) | Free one-time scan | Scores out of 100; covers performance, UX, accessibility; actionable recommendations | One-time scan; no continuous monitoring; no API |
| **[Digital Beacon](https://digitalbeacon.co/)** | Free one-time scan | Detailed breakdown (new vs. returning visits); caching impact analysis | One-time scan only |
| **[Carbon Badge](https://carbon-badge.com/)** | Freemium (Pro from EUR 9/mo) | Multi-page scans; embeddable badge; automatic monitoring | EcoPing alternative (EcoPing stopped accepting new users) |
| **[GreenFrame](https://greenframe.io/)** (Marmelab) | Open-core / SaaS | CI/CD integration; custom user scenarios; emission budgets that fail builds; dashboard | Developer-focused but CLI-only; no browser extension; complex setup |
| **[Green Web Check](https://www.thegreenwebfoundation.org/green-web-check/)** (Green Web Foundation) | Free | Checks if hosting uses green energy | Single-dimension check only |

### 1.3 Developer Libraries & Infrastructure

| Tool | Type | Notes |
|------|------|-------|
| **[CO2.js](https://developers.thegreenwebfoundation.org/co2js/overview/)** (Green Web Foundation) | JavaScript library | De facto standard for digital carbon calculations; supports Sustainable Web Design Model and OneByte Model; used by Website Carbon, Beacon, Ecograder |
| **[lighthouse-plugin-greenhouse](https://github.com/thegreenwebfoundation/lighthouse-plugin-greenhouse)** | Lighthouse plugin | Checks domains against Green Web Foundation API for renewable power; niche adoption |
| **[Eco CI](https://www.green-coding.io/products/eco-ci/)** (Green Coding) | CI/CD plugin | Measures energy consumption in GitHub Actions / GitLab Pipelines |
| **[CarbonRunner](https://carbonrunner.io/)** | CI/CD tool | Routes builds to regions with cleanest energy; supports Jenkins, GitHub Actions, CircleCI |
| **[GreenMetrics](https://wordpress.org/plugins/greenmetrics/)** | WordPress plugin | Carbon footprint and performance metrics for WordPress sites |

### 1.4 Enterprise Carbon Accounting Platforms (Adjacent Market)

These are not direct competitors but represent the ecosystem Green Engineering could integrate with:

- **Climatiq** -- Carbon calculation engine with extensive emission factor database
- **Greenly** -- All-in-one GHG disclosure, product carbon footprint, ESG compliance
- **Persefoni** -- Scope 1, 2, 3 carbon accounting
- **CO2 AI** -- AI-powered product carbon footprinting

### 1.5 Competitive Gap Analysis

```
                        Consumer          Developer         Enterprise
                        Browsing          Optimization      Reporting
                        ────────          ────────────      ──────────
Chrome Extensions:      [CROWDED]         [EMPTY]           [EMPTY]
Web Scanners:           [MODERATE]        [LIGHT]           [EMPTY]
CLI/CI Tools:           [NONE]            [LIGHT]           [NONE]
Full Platforms:         [NONE]            [NONE]            [MODERATE]
```

**The developer-focused Chrome extension space is virtually unoccupied.** No existing extension combines real-time page analysis with actionable developer recommendations, team features, or CI/CD integration hooks.

---

## 2. Market Size & Demand

### 2.1 ESG Software Market

| Metric | Value | Source |
|--------|-------|--------|
| Global ESG software market (2025) | USD 1.24 billion | Grand View Research |
| Projected market size (2033) | USD 5.19 billion | Grand View Research |
| CAGR (2026-2033) | 20.1% | Grand View Research |
| ESG reporting software (2026) | USD 1.6 billion | Fortune Business Insights |
| Projected reporting software (2034) | USD 7.36 billion | Fortune Business Insights |
| North America market share | 35.7% | Grand View Research |
| Europe market share | ~30% | Multiple sources |

### 2.2 Regulatory Drivers

**EU Corporate Sustainability Reporting Directive (CSRD):**
- First wave of companies began reporting in 2025 (for FY2024)
- Scope narrowed by Omnibus I Package (Dec 2025): now applies to companies with 1,000+ employees and EUR 450M+ net turnover
- Mandatory datapoints reduced by 61% (from ~1,100 to ~430), but digital sustainability still relevant
- Machine-readable ESEF format required, creating demand for automated measurement tools
- ~49,000 organizations across Europe still in scope

**Other regulatory signals:**
- SEC climate disclosure rules in the US driving ESG adoption
- 70% of tech procurement leaders expected to have environmental sustainability performance objectives by 2026
- 75% of companies expected to favor IT suppliers with clear sustainability goals

### 2.3 Developer & Industry Interest Indicators

- **Green coding** is cited as a top web development trend for 2026 across multiple industry publications (Elementor, DesignModo, ImplerVista, TheeDigital)
- **62%** of consumers say they would choose a brand with a greener website over one without (Green Web Foundation study)
- Accenture showed clients saved **6% in IT operating expenses** by optimizing apps and reducing energy through cloud right-sizing
- The Lowwwcarbon redesign went viral in 2025 for emitting less carbon than a single Google search per visit
- Google's Core Web Vitals already reward performance (which correlates with lower carbon) with higher search rankings
- Web sustainability is evolving "beyond basic optimization" into a holistic design discipline in 2026

### 2.4 Search Interest Signals

While exact search volume data requires Google Trends direct access, the following indicators demonstrate growing interest:
- "Website carbon footprint" returns dozens of tools, articles, and guides from 2024-2026
- Multiple new Chrome extensions launched in 2024-2025 targeting this space
- Major publications (Fast Company, Microsoft DevBlogs, IEEE Computer Society) covering green coding
- New academic research on CI/CD pipeline carbon emissions published in 2025-2026

---

## 3. Target Audience Segments

### 3.1 Primary Segments

| Segment | Size | Pain Point | Willingness to Pay | Priority |
|---------|------|-----------|-------------------|----------|
| **Web Developers / Front-end Engineers** | Large | Want to build efficient sites; no easy in-browser tool for carbon measurement during development | Medium (team/company budget) | HIGH |
| **Web Agencies / Freelancers** | Medium | Need to demonstrate sustainability credentials to clients; differentiate services | High (client-billable) | HIGH |
| **DevOps / Platform Engineers** | Medium | Need to integrate sustainability metrics into CI/CD and monitoring | Medium-High | MEDIUM |
| **Corporate Sustainability / ESG Teams** | Small-Medium | Need digital sustainability data for CSRD/ESG reporting | High (compliance budget) | HIGH |
| **Digital Marketing Teams** | Medium | Page performance affects SEO; carbon badges as marketing differentiators | Medium | MEDIUM |

### 3.2 Secondary Segments

| Segment | Notes |
|---------|-------|
| **Educational institutions** | Teaching sustainable web design (Green Web Foundation actively publishes pedagogy materials) |
| **Government / Public sector** | Digital sustainability mandates emerging in EU member states |
| **Non-profits / NGOs** | Mission-aligned; budget-constrained but high advocacy value |
| **Eco-conscious consumers** | Already served by existing extensions; low monetization potential |

### 3.3 Buyer Personas

**Persona 1: "Dev Lead Dana"**
- Role: Senior front-end developer / tech lead at a mid-size company
- Need: Wants to make performance and sustainability part of the team's development workflow
- Behavior: Uses Chrome DevTools daily; would use an extension that works like Lighthouse but for carbon
- Budget: Can advocate for team tool purchases up to $50/month

**Persona 2: "Agency Owner Alex"**
- Role: Runs a 10-50 person digital agency
- Need: Wants to offer "sustainable web design" as a service differentiator; needs client-facing reports
- Behavior: Pitches sustainability in proposals; needs embeddable badges and PDF reports
- Budget: $100-500/month for team tooling

**Persona 3: "ESG Manager Emiko"**
- Role: Sustainability reporting lead at a large enterprise
- Need: Digital carbon data for Scope 3 reporting under CSRD; needs audit-ready data
- Behavior: Works with IT teams to collect data; needs dashboards and exports
- Budget: Enterprise contracts $1,000+/month

---

## 4. Monetization Models

### 4.1 Competitor Pricing Analysis

| Competitor | Free Tier | Paid Tier | Model |
|-----------|-----------|-----------|-------|
| Website Carbon Calculator | Unlimited single-page scans | N/A (API endpoint deprecated) | Free / donation |
| Ecograder | Unlimited single-page scans | N/A | Free |
| Carbon Badge | Basic scan | Pro from EUR 9/mo (multi-page, badge, monitoring) | Freemium |
| GreenFrame | 1-month free trial (all features) | Paid SaaS (pricing not public) | Open-core |
| EcoPing | Was freemium | Stopped accepting new users | Defunct for new users |
| Pebble (extension) | Free | N/A | Free |

**Key insight:** Most tools are free or have very basic monetization. This is both an opportunity (no one has built a compelling paid product) and a risk (users expect free tools in this space).

### 4.2 Recommended Monetization Strategy

**Freemium Model with Team/Enterprise Upsell:**

| Tier | Price | Features |
|------|-------|----------|
| **Free (Individual)** | $0 | Real-time page carbon score; basic recommendations; single-user; data stored locally; limited history (30 days) |
| **Pro (Developer)** | $9-15/mo | Unlimited history; detailed breakdowns (by script, image, font); export reports; green hosting recommendations; priority support |
| **Team** | $29-49/mo per seat | Team dashboard; shared projects; benchmarking across team sites; CI/CD webhook integration; PDF/CSV exports for clients |
| **Enterprise** | Custom (est. $500-2,000/mo) | SSO/SAML; audit-ready reporting for CSRD; API access; carbon offset integration; custom SLAs; dedicated support; on-prem option |

**Additional revenue streams:**
- **Affiliate/referral fees** from green hosting providers (GreenGeeks, 20i, OVHcloud)
- **Carbon offset marketplace commission** via ClimateTrade or Carbonmark API integration
- **White-label licensing** for agencies wanting branded sustainability reports
- **Consulting/implementation** for enterprise CSRD digital carbon reporting

---

## 5. Key Features to Differentiate

### 5.1 Feature Gap Analysis

| Feature | Existing Tools | Green Engineering Opportunity |
|---------|---------------|-------------------------------|
| Real-time per-page carbon score | Basic (consumer extensions) | Advanced: breakdown by resource type, third-party scripts, with DevTools-like detail |
| Continuous monitoring | Carbon Badge (basic) | Deep: track carbon over time per project, set budgets, get alerts |
| Actionable recommendations | Ecograder (one-time) | In-context: show specific optimizations while browsing during development |
| CI/CD integration | GreenFrame, Eco CI (CLI only) | Webhook/API from extension to CI pipelines; carbon budgets as quality gates |
| Team dashboards | GreenFrame (limited) | Full: team-wide carbon tracking, leaderboards, project comparisons |
| Green hosting check | Green Web Foundation (standalone) | Integrated: automatic check with recommendations for greener alternatives |
| Third-party script analysis | None | Unique: identify high-carbon third-party scripts (analytics, ads, widgets) with alternatives |
| Carbon offset integration | None in web tools | Novel: calculate, then offer one-click offset via API partners |
| Client reporting | None | High-value: agency-ready PDF reports with branding |
| Historical trends | Limited (Carbon Badge) | Rich: track improvements over sprints, releases, time periods |

### 5.2 Proposed Feature Roadmap

**Phase 1 - MVP (Month 1-3):**
- Real-time carbon score per page (using CO2.js / Sustainable Web Design Model)
- Page weight breakdown (images, scripts, fonts, CSS, HTML)
- Green hosting detection (Green Web Foundation API)
- Basic recommendations (image optimization, script reduction, caching)
- Local data storage (privacy-first)
- Simple badge/score display in toolbar

**Phase 2 - Pro Features (Month 4-6):**
- Third-party script carbon analysis with alternatives
- Historical tracking dashboard (in extension popup or dedicated tab)
- Detailed per-resource carbon attribution
- Export to PDF/CSV
- Green hosting provider recommendations with comparison
- Browser notifications for high-carbon pages

**Phase 3 - Team & Integration (Month 7-12):**
- Cloud-synced team dashboards
- Project/domain grouping
- CI/CD webhook integration (send carbon data to GitHub Actions, GitLab CI)
- Carbon budget thresholds (with alerts)
- API for external integrations
- Embeddable carbon badge for websites

**Phase 4 - Enterprise (Month 12+):**
- SSO/SAML authentication
- CSRD-compatible reporting templates
- Carbon offset integration (ClimateTrade, Carbonmark APIs)
- Custom carbon intensity factors by region
- Audit trail and compliance features
- On-prem/self-hosted option

---

## 6. Technical Feasibility

### 6.1 What Can Be Measured from a Chrome Extension

| Data Point | Source | Feasibility | Accuracy |
|-----------|--------|-------------|----------|
| **Page weight (bytes transferred)** | `chrome.webRequest` API / Performance API | HIGH | HIGH |
| **Number of HTTP requests** | `chrome.webRequest` API | HIGH | HIGH |
| **Resource breakdown** (images, scripts, CSS, fonts) | Performance Resource Timing API | HIGH | HIGH |
| **Third-party vs first-party scripts** | Domain analysis of resource URLs | HIGH | HIGH |
| **Green hosting status** | Green Web Foundation API (free, rate-limited) | HIGH | MEDIUM (depends on GWF database coverage) |
| **Data center location** | IP geolocation | MEDIUM | MEDIUM |
| **Grid carbon intensity by location** | Electricity Maps API / Ember data | MEDIUM | MEDIUM (regional averages) |
| **Caching effectiveness** | Service Worker / Cache API analysis | MEDIUM | MEDIUM |
| **DOM complexity** | `document.querySelectorAll('*').length` | HIGH | HIGH (proxy for rendering energy) |
| **CPU/energy during render** | Performance Observer (Long Tasks API) | MEDIUM | LOW (proxy only) |
| **Video/media streaming impact** | Network request analysis | MEDIUM | MEDIUM |

### 6.2 Carbon Calculation Methodology

The standard approach (used by all major tools) is the **Sustainable Web Design Model (SWDM)**:

```
Operational Emissions = Data Transfer (GB)
                        x Energy Intensity (kWh/GB)
                        x Grid Carbon Intensity (gCO2e/kWh)
```

Key constants and data sources:
- **Energy intensity:** ~0.81 kWh/GB (SWDM default, covers data center, network, device)
- **Global average grid intensity:** 494 g/kWh (Ember annual electricity review)
- **Green hosting adjustment:** 50 g/kWh for verified green hosts
- **Returning visitor factor:** Accounts for browser caching reducing data transfer

**Recommended approach for Green Engineering:**
- Use CO2.js as the calculation engine (MIT licensed, well-maintained, industry standard)
- Enhance with real Performance API data (actual bytes, not estimated)
- Add device-specific energy modeling where possible
- Support custom grid intensity based on user's actual location (via Electricity Maps API)

### 6.3 Chrome Extension Architecture

```
┌─────────────────────────────────────────┐
│           Chrome Extension              │
├─────────────┬───────────────────────────┤
│ Background  │  - webRequest listener    │
│ Service     │  - Resource aggregation   │
│ Worker      │  - CO2.js calculations    │
│             │  - Green Web Check API    │
│             │  - Local storage mgmt     │
├─────────────┼───────────────────────────┤
│ Content     │  - DOM analysis           │
│ Script      │  - Performance Observer   │
│             │  - Page metrics collection│
├─────────────┼───────────────────────────┤
│ Popup UI    │  - Real-time score display│
│             │  - Resource breakdown     │
│             │  - Recommendations        │
│             │  - Historical charts      │
├─────────────┼───────────────────────────┤
│ Dashboard   │  - Full-page analytics    │
│ (New Tab /  │  - Team features          │
│  Side Panel)│  - Project management     │
│             │  - Export/reporting        │
└─────────────┴───────────────────────────┘

External APIs:
  - Green Web Foundation API (hosting check)
  - Electricity Maps API (grid carbon intensity)
  - CO2.js (bundled, for calculations)
  - ClimateTrade / Carbonmark (offsets, Phase 4)
  - Custom backend (team sync, Phase 3+)
```

### 6.4 Key Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Chrome Manifest V3 limitations on webRequest | Could limit real-time interception | Use `declarativeNetRequest` + Performance API as alternative data sources |
| Green Web Foundation API rate limits | Could throttle green hosting checks | Cache results locally; batch requests; maintain local lookup table |
| Accuracy of carbon estimates (inherent limitation of all tools) | Credibility concerns | Be transparent about methodology; show confidence ranges; cite sources |
| Performance impact of extension itself | Ironic if a "green" tool slows browsing | Lightweight architecture; lazy loading; minimal DOM interaction; measure own footprint |
| Privacy concerns (tracking browsing) | User trust | All processing local by default; explicit opt-in for cloud features; no data collection in free tier |

---

## 7. Strategic Recommendations

### 7.1 Positioning

**"The Lighthouse for Carbon"** -- Position Green Engineering as the developer-grade sustainability tool that lives where developers already work (the browser), not as another consumer browsing tracker.

Key differentiators:
1. **Developer-first:** Actionable, resource-level insights (not just a total gCO2e number)
2. **Continuous, not one-time:** Real-time monitoring vs. point-in-time scans
3. **Team-enabled:** Collaboration features no competitor offers in-browser
4. **Workflow-integrated:** Connects to CI/CD, not a standalone silo

### 7.2 Go-to-Market Strategy

**Phase 1: Community & Developer Adoption**
- Launch free tier targeting individual developers
- Open-source the core calculation engine (builds trust, follows GreenFrame model)
- Publish on Chrome Web Store with strong SEO ("website carbon", "green web", "sustainable web design")
- Write technical blog posts; submit to Hacker News, Dev.to, CSS-Tricks
- Partner with Green Web Foundation for credibility and cross-promotion

**Phase 2: Agency & Team Growth**
- Target web agencies with client reporting features
- Offer agency partnership program (white-label reports)
- Sponsor sustainable web design conferences and meetups
- Create case studies showing measurable carbon reduction

**Phase 3: Enterprise & Compliance**
- Target CSRD-affected companies through sustainability consulting channels
- Build integrations with ESG reporting platforms (Persefoni, Greenly)
- Pursue SOC 2 compliance for enterprise trust
- Develop partnerships with green hosting providers for referral revenue

### 7.3 Key Metrics to Track

- Chrome Web Store installs & active users (weekly)
- Free-to-paid conversion rate (target: 3-5%)
- Pages analyzed per user per week
- Team account adoption rate
- NPS score among developer users
- Revenue per seat (Pro/Team/Enterprise)

### 7.4 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Market too niche / limited demand | Low-Medium | High | Leverage regulatory tailwinds (CSRD); emphasize performance co-benefits |
| Users expect everything for free | Medium | Medium | Strong free tier for adoption; clear value in team/reporting features |
| Methodology criticized as inaccurate | Medium | Medium | Use established SWDM; be transparent; contribute to methodology improvement |
| Big player enters (Google adding carbon to Lighthouse) | Low-Medium | High | Move fast; build team/enterprise features Google won't; community moat |
| CSRD scope reduction reduces enterprise demand | Medium | Medium | Diversify beyond compliance; emphasize performance and cost savings |

---

## Sources

### Competitors & Tools
- [Website Carbon Calculator](https://www.websitecarbon.com/)
- [Ecograder](https://ecograder.com/how-it-works)
- [Green Web Foundation Tools](https://www.thegreenwebfoundation.org/tools/)
- [GreenFrame](https://greenframe.io/)
- [Carbon Badge](https://carbon-badge.com/en/)
- [Pebble Chrome Extension](https://chromewebstore.google.com/detail/pebble-digital-carbon-emi/oeamjgnkoelgkegbphiminanlbegaaga)
- [WebCarbon GitHub](https://github.com/abhishek-x/web-carbon)
- [Eco CI](https://www.green-coding.io/products/eco-ci/)
- [CarbonRunner](https://carbonrunner.io/features/ci-cd-workflows)
- [lighthouse-plugin-greenhouse](https://github.com/thegreenwebfoundation/lighthouse-plugin-greenhouse)

### Methodology & Technical
- [CO2.js Methodologies](https://developers.thegreenwebfoundation.org/co2js/explainer/methodologies-for-calculating-website-carbon/)
- [Sustainable Web Design Model](https://sustainablewebdesign.org/estimating-digital-emissions/)
- [Website Carbon API](https://api.websitecarbon.com/)
- [Microsoft - Measuring Carbon Impact of Web Browsing](https://devblogs.microsoft.com/sustainable-software/measuring-the-carbon-impact-of-web-browsing/)

### Market Data
- [Grand View Research - ESG Software Market](https://www.grandviewresearch.com/industry-analysis/esg-software-market-report)
- [MarketsandMarkets - ESG Reporting Software Market](https://www.marketsandmarkets.com/Market-Reports/esg-reporting-software-market-173110129.html)
- [Fortune Business Insights - ESG Reporting Software](https://www.fortunebusinessinsights.com/esg-reporting-software-market-109329)

### Regulatory
- [EU CSRD - European Commission](https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en)
- [CSRD Omnibus Proposal - Deloitte](https://dart.deloitte.com/USDART/home/publications/deloitte/heads-up/2025/eu-commission-omnibus-proposal-sustainability-reporting-reduction-csrd)
- [CSRD Timeline - IntegrityNext](https://www.integritynext.com/csrd-timeline)

### Industry Trends
- [Low-Carbon Web Design 2026 Guide](https://www.acscreative.com/insights/what-low-carbon-web-design-means-for-sustainable-businesses-in-2026/)
- [Green Coding - IEEE Computer Society](https://www.computer.org/publications/tech-news/trends/green-coding)
- [Green Coding for Agencies - DesignRush](https://www.designrush.com/agency/web-development-companies/trends/green-coding)
- [Chrome Extensions for Sustainable Web Design - Medium](https://medium.com/@zhiva.tech/chrome-extensions-to-level-up-your-sustainable-web-design-game-39c32b89b0c1)
- [Tools for Calculating Website CO2 - Root Web Design](https://rootwebdesign.studio/articles/tools-for-calculating-your-websites-co2-emissions/)
- [Website Carbon Audit Tool Review - .eco](https://go.eco/news/website-carbon-audit-tool-review/)

### Carbon Offset Integration
- [ClimateTrade API](https://climatetrade.com/api/)
- [Carbonmark API](https://docs.carbonmark.com/)
- [AlliedOffsets - VCM Data API](https://alliedoffsets.com/)
