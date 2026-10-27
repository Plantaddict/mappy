# Mappy: Product Requirements Document

| | |
|---|---|
| **Status** | Draft v0.1, for review |
| **Owner** | Product |
| **Last updated** | 2026-10-27 |
| **Scope of this doc** | Product definition only. Technical design comes after this is agreed. |

---

## 1. Summary

Mappy is a website that turns any place on Earth into a print-ready map poster. You search for a city, neighbourhood or address, frame the area, choose a style, add a title, and download a high-resolution file you can print at home, at a print shop, or through an online print service.

All map data comes from **OpenStreetMap (OSM)**, so we pay no data licensing fees and the maps cover the whole world. The value we add is **design**: good typography, a curated set of colour themes, sensible defaults, and output that holds up at A2 size on a wall.

**One-liner:** *"Your place, as art, in under a minute."*

---

## 2. Problem & opportunity

**The problem:** people want a meaningful, personal picture of a place (home town, the city where they met, where they ran their first marathon). The current options all have a catch:

- **Commercial map-poster shops** look good, but they lock you into buying their print (often €40–€90 including shipping), offer limited customisation, and don't give you the file.
- **GIS tools and DIY scripts** (QGIS, Python scripts, Figma plugins) can produce great results, but they take hours and technical skill.
- **Screenshots of Google Maps / Apple Maps** look cluttered, come out at low resolution, and can't legally be printed or sold.

**The opportunity:** OSM data is free, detailed, and licensed for commercial use as long as it is attributed. Modern browsers can render vector maps at print resolution. A tool that combines both behind a simple UI can deliver gallery-quality output with no design or GIS skills needed.

**Why now:**
- Free, keyless vector tile hosting built on OSM is now available and mature (e.g. OpenFreeMap, Protomaps).
- In-browser rendering (WebGL) is fast enough to show a live preview as the user edits.
- Print-on-demand APIs make physical fulfilment possible later without us holding stock.

---

## 3. Goals & non-goals

### Goals (v1)
1. A first-time visitor can produce a poster they are happy with **in under 60 seconds**.
2. The exported file is **print-quality**: sharp at A3 at 300 DPI, acceptable up to A2.
3. Every theme looks **good by default**, so there is no "ugly" combination to fall into.
4. **No account and no payment** are needed to get a file in v1. We are optimising for adoption and learning.
5. We are **fully compliant** with OSM licence and service usage policies.

### Non-goals (v1)
- Selling or shipping physical prints.
- User accounts, saved projects, galleries.
- Free-form graphic design (layers, arbitrary text boxes, image uploads).
- Star maps, GPX/route overlays, multiple pins. These are strong candidates for v2 (see §10).
- A native mobile app.

---

## 4. Target users

| Persona | Who | Job to be done | What they care about |
|---|---|---|---|
| **The Gift Giver** (primary) | 25–45, buying for a partner, a friend's housewarming or a wedding | "Give a personal gift that shows I thought about it" | Speed, looks, an emotional title ("Where it all began") |
| **The Nostalgic** (primary) | Expats, students, people who just moved house | "Keep a piece of my place on my wall" | Recognisable layout, accuracy, nice framing |
| **The Hobby Designer** (secondary) | Designers, map nerds, Reddit r/MapPorn crowd | "Make something striking and share it" | Control over colours and layers, high resolution, SVG |
| **The Small Business** (later) | Airbnb hosts, cafés, real-estate agents | "Decorate my space or brand with my location" | Commercial-use clarity, consistent branding |

**Primary persona for v1: The Gift Giver.** When we have to make a trade-off, we pick simplicity and good defaults over control.

---

## 5. User journey (happy path)

```
 Landing ──► Search place ──► Frame area ──► Pick style ──► Personalise text ──► Export
   │              │                │              │                │                 │
 "Make your    "Kraków"        drag/zoom      6 theme          title/subtitle/   size + format
  city into    autocomplete    live preview   thumbnails       coordinates       → download
  art"                                                         (auto-filled)
```

1. **Landing.** A hero section showing 3–4 example posters and one search box: *"Search a city, address or place"*.
2. **Search.** Typing gives place suggestions. Picking one opens the editor centred on that place, with a default zoom that suits the place type (city > district > street).
3. **Editor.** A live poster preview takes up most of the screen and a control panel sits beside it (below it on mobile):
   - **Location:** pan/zoom inside the poster frame; re-search.
   - **Style:** theme thumbnails (one click changes everything).
   - **Text:** title (pre-filled with the city name), subtitle (pre-filled with the country), coordinates line (auto, can be hidden).
   - **Layout:** size, orientation, frame shape (full bleed / circle / heart, where heart is P2).
4. **Export.** Pick size and format, then download. Show a small "Print tips" panel (paper, frames, print services).
5. **After export.** A soft prompt to share the image or make another poster.

---

## 6. Functional requirements

Priority: **P0** = must have for launch · **P1** = should have, launch if ready · **P2** = later.

### 6.1 Place search
| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| S-1 | Search places worldwide by name or address | P0 | "Paris", "Kraków", "221B Baker Street" each return the right result in the top 3 |
| S-2 | Type-ahead suggestions | P0 | Suggestions appear within 500 ms of the user pausing typing. **Must not use the public Nominatim server for autocomplete** (forbidden by its usage policy, see §9) |
| S-3 | Results show place type + country for disambiguation | P0 | "Paris, France" and "Paris, Texas, USA" are clearly distinct |
| S-4 | Start from "my current location" | P2 | Uses browser geolocation, only after explicit permission |

### 6.2 Map framing
| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| M-1 | Live preview that matches the final export exactly (WYSIWYG) | P0 | Visual diff between preview and export at the same aspect ratio is limited to resolution |
| M-2 | Pan and zoom inside the poster frame | P0 | Works with mouse, trackpad and touch |
| M-3 | Rotation | P2 | Rotate the map in 1° steps (e.g. to align the city grid) |
| M-4 | Sensible zoom limits | P0 | Can't zoom out past a level where roads stop rendering meaningfully (roughly a large metro area) |
| M-5 | Location marker (pin/heart) | P1 | One optional marker at a chosen point, styled to match the theme |

### 6.3 Styles (themes)
A theme is a complete curated design: background, water, parks, road hierarchy, buildings, rail, plus font pairing and text colours.

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| T-1 | At least **6 launch themes** | P0 | e.g. *Minimal Light*, *Noir*, *Blueprint*, *Terracotta*, *Forest*, *Midnight Gold*. Each is approved by design on 5 reference cities (dense European, grid US, coastal, river city, small town) |
| T-2 | Road hierarchy is visible | P0 | Motorways > primary > secondary > residential are distinguishable by line weight |
| T-3 | Water and parks are always shown | P0 | Rivers, lakes, coastlines and green areas render in every theme |
| T-4 | Layer toggles (buildings, rail, labels-off) | P1 | Turning off a layer updates the preview in under 1 s |
| T-5 | Custom colour override | P2 | Colour pickers for background / roads / water / text |

**Design principle:** no street names or POI labels on the map by default. The poster is about shape and texture. The text block carries the meaning.

### 6.4 Text & typography
| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| X-1 | Title, subtitle and coordinates line | P0 | Auto-filled from the selected place. All three are editable. Coordinates follow the framed centre (e.g. `50.0614° N, 19.9366° E`) |
| X-2 | Unicode & non-Latin scripts | P0 | Polish diacritics, German, Cyrillic, Greek and Japanese titles render correctly (font fallback) |
| X-3 | Text auto-fits | P0 | A long title shrinks or letter-spaces to fit; it never overflows or gets clipped |
| X-4 | Hide any text line | P0 | Each line can be toggled off; a map-only poster is valid |
| X-5 | Font choice (3–4 curated pairs) | P2 | |

### 6.5 Sizes & export
| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| E-1 | Standard sizes | P0 | A4, A3, A2, 30×40 cm, 50×70 cm, 8×10″, 12×16″, 18×24″. Portrait and landscape |
| E-2 | PNG export at 300 DPI | P0 | A3 (3508×4961 px) exports in under 15 s on a mid-range laptop |
| E-3 | PDF export, print-ready | P1 | Correct physical page size, with optional 3 mm bleed |
| E-4 | SVG export | P2 | For the Hobby Designer persona |
| E-5 | Social preview export | P1 | A 1080×1350 image for Instagram/sharing |
| E-6 | Progress + failure feedback | P0 | Shows a progress state. If the export fails (e.g. device memory), suggest a smaller size and don't crash silently |
| E-7 | OSM attribution on every export | P0 | "© OpenStreetMap contributors" is printed small and legibly on the poster. **Non-removable.** |

### 6.6 Sharing & state
| ID | Requirement | Priority | Acceptance criteria |
|---|---|---|---|
| U-1 | Shareable URL | P1 | The full poster state (place, view, theme, text, size) is encoded in the URL. Opening the link reproduces the poster |
| U-2 | Local autosave | P1 | Refreshing the page restores the last poster (browser storage, no account) |

---

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| **Performance** | Landing page interactive in under 2 s on 4G. Editor preview first render under 3 s after picking a place. Theme switch under 500 ms |
| **Devices** | Full editing on desktop (Chrome, Safari, Firefox, Edge, last 2 versions). Mobile editing supported; on mobile, exports above A3 may be limited by device memory, and the UI says so |
| **Accessibility** | WCAG 2.2 AA for the UI (keyboard navigation, contrast, labels). Theme thumbnails have text names |
| **Privacy** | No account needed. Analytics without cookies (no consent banner needed). Searched places are not stored server-side with any user identifier |
| **Cost** | Serving a poster should cost roughly €0. Map data and tiles come from free/self-hosted OSM-based sources, and rendering happens in the browser |
| **Localisation** | v1 UI in English. Architecture should be ready for PL/DE/FR (P1) |

---

## 8. Success metrics

**North Star:** *Posters exported per week.*

| Funnel stage | Metric | v1 target (first 8 weeks) |
|---|---|---|
| Acquisition | Weekly unique visitors | baseline, no target yet |
| Activation | % of visitors who select a place | ≥ 60% |
| Engagement | % of editor sessions that change theme or text | ≥ 50% |
| Conversion | % of editor sessions that export | ≥ 30% |
| Speed | Median time from landing to first export | ≤ 90 s |
| Quality | Export failure rate | ≤ 2% |
| Virality | % of exports followed by share-link copy | ≥ 10% |

**Guardrail:** user-reported "map is wrong/empty" issues are under 1% of exports. This catches gaps in data or rendering in less-mapped regions.

**Qualitative:** 10 user interviews with Gift Givers in the first month. Question: *"Would you hang this on your wall / give it as a gift?"*

---

## 9. Data, licensing & compliance (OpenStreetMap)

Legal or ops problems here can kill the product, so this section is P0.

| Topic | What it means for us |
|---|---|
| **ODbL licence** | OSM data is under the Open Database License. A poster is a *Produced Work*: we can use it commercially, including selling it, as long as it carries **attribution** ("© OpenStreetMap contributors"). Share-alike applies to derived *databases*, not to the poster images. **Action:** legal review before any paid tier. |
| **Tile usage policy** | The public `tile.openstreetmap.org` servers **must not** be used for this. Print-resolution exports pull many tiles, which counts as heavy use. **Requirement:** use a free or self-hosted vector tile source built for this (e.g. OpenFreeMap, or self-hosted Protomaps/PMTiles). |
| **Geocoding policy** | The public Nominatim server allows at most 1 request/second and **forbids autocomplete**. **Requirement:** use an autocomplete-friendly geocoder (e.g. Photon), a commercial geocoder with a free tier, or self-hosting. Engineering to recommend. |
| **Overpass API** | Fine for prototypes. Not for production traffic at scale (fair-use limits). Avoid as the main data path. |
| **Data quality** | OSM coverage is excellent in Europe and North America and patchier elsewhere. The preview shows exactly what you'll get, so users self-select. Track the "map looks empty" guardrail. |

---

## 10. Release plan & roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Discovery** (now) | This PRD; competitor teardown; 5 user interviews; theme moodboards; engineering spike on export resolution limits in the browser | PRD signed off; spike confirms A3@300 DPI is feasible client-side |
| **1. MVP** | All P0: search, framing, 6 themes, text, PNG export, attribution | Internal dogfood: 20 posters across 5 reference cities pass design review |
| **2. Public beta** | P1: PDF, layer toggles, marker, share URL, autosave, social export | Hit the activation and conversion targets in §8 |
| **3. Grow** | P2 picks driven by data: custom colours, SVG, rotation, font pairs, **GPX route overlay** (runners/cyclists), **multi-pin** (couples' "our places") | |
| **4. Monetise** | Choose based on beta learnings (see open question Q1) | |

---

## 11. Monetisation hypotheses (not in v1, but shapes decisions now)

1. **Print fulfilment.** "Order this printed and framed" via a print-on-demand partner. Highest revenue per user, and it fits the Gift Giver best.
2. **Freemium resolution.** Free up to A3, paid for A2+/SVG/commercial licence. Fits the Hobby Designer.
3. **Premium themes.** One-off theme packs.

v1 stays fully free so we can measure real demand. We record the **export size distribution** now, because that is the input we need to decide on option 2.

---

## 12. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Browser can't render large exports (memory/WebGL canvas limits) | Medium | High | Engineering spike in Phase 0. Tiled rendering. Fallback to server-side rendering for A2+ |
| Tile/geocoder provider throttles or shuts us off | Medium | High | Self-hostable architecture from day one. No hard dependency on a single free service |
| Posters look "samey" vs competitors | Medium | Medium | Invest in themes and typography; design is the product. Benchmark against top-selling Etsy map posters |
| Sparse data in some regions makes ugly posters | Medium | Low | WYSIWYG preview + guardrail metric |
| Licence misunderstanding when monetising | Low | High | Legal review is a gate for Phase 4 |

---

## 13. Open questions

| # | Question | Owner | Needed by |
|---|---|---|---|
| Q1 | Which monetisation path do we validate first: print fulfilment or freemium resolution? | Product | Phase 2 |
| Q2 | Do we need server-side rendering at launch, or is client-side enough for P0 sizes? | Engineering (spike) | End of Phase 0 |
| Q3 | Which geocoder: self-hosted Photon or a hosted provider? Cost vs ops trade-off | Engineering | Phase 1 start |
| Q4 | Brand and name: is "Mappy" final? Check domain/trademark | Product/Marketing | Phase 2 |
| Q5 | Which 6 themes ship? Final palette + font licences (prefer OFL fonts) | Design | Phase 1 mid |

---

## Appendix A: Poster anatomy (default layout, portrait)

```
┌──────────────────────────────┐
│                              │
│                              │
│          MAP AREA            │  ~78% of height
│   (roads, water, parks,      │
│    buildings optional)       │
│                              │
│                              │
├──────────────────────────────┤
│           K R A K Ó W        │  Title: large, letter-spaced caps
│             POLAND           │  Subtitle: small caps
│   50.0614° N · 19.9366° E    │  Coordinates: small, tabular figures
│                              │
│ © OpenStreetMap contributors │  Attribution: tiny, bottom corner
└──────────────────────────────┘
```

## Appendix B: Reference cities for design QA
1. **Kraków.** Dense medieval core + river (European density).
2. **Manhattan.** Strict grid + water on all sides.
3. **Barcelona.** Grid + coastline.
4. **Amsterdam.** Canals (stress test for the water layer).
5. **A small town (< 10k pop.).** Sparse data, the "does it still look good?" check.
