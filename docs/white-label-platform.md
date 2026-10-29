# Mappy White-Label Platform: competition, model, product hooks

| | |
|---|---|
| **Status** | Draft v0.1, 2026-10-29 |
| **Builds on** | [PRD.md](PRD.md) (consumer tool), [seller-platform-exploration.md](seller-platform-exploration.md) (why B2B) |
| **The model in one line** | Start small with a free "make and download a map" tool. Sell sellers a **white-label designer**: their customers design on the seller's branded page, approve the design, and the seller receives the print file. Add **map packs** and a growing set of **product types and customisations** as hooks. |

---

## 1. Competition for the white-label / "customer designs, seller gets the file" model

Three groups, from closest to farthest.

### 1a. Personalisation apps with a map element (closest to the flow)

| | Map support | Flow | Price | Gaps vs our model |
|---|---|---|---|---|
| **Customily** | Street + star maps (Mapbox styles) | Buyer designs in the store (Shopify) or via a post-purchase email link (Etsy); print file generated | ~$49/mo + $0.10–1.00/item | Generic designs; seller must supply Mapbox styles; map is one of 20 element types; no packs; no hosted branded page for non-Shopify sellers |
| **Teeinblue** | Street + star maps (seller's own Mapbox + optional Google Places account) | Live preview on Shopify storefront; auto-generated print files; 22+ print partners | $19–549/mo + per item | Setup burden (Mapbox account, Studio styling); Shopify-first; Etsy on separate plans |
| **Customix** | "Coordinates → printable city map" | Hosted page; buyer gets a code and pastes it into Etsy's personalisation field; 300 DPI files; webhooks/CSV to 30+ fulfilment partners | $19.99/mo + $1.00→$0.10/item | Maps are a minor feature; design quality unknown; no packs |
| **Starmap: Star Map Customizer** (Shopify) | Star maps only | Buyer picks date/time/place; order dashboard with design data | $49/mo + 2% of order value (cap $1,000/mo) | Single product; shows sellers accept rev-share pricing |
| **Printerlo Star Map Editor** (Shopify) | Star maps | Editor + prints via Gelato | From $49.99/mo | Single product |

### 1b. Map render APIs and editors (closest to the engine)

| | What it is | B2B offer | Gaps |
|---|---|---|---|
| **MapPoster.xyz** | Consumer poster tool: 50+ themes, route drawing, $6.99 premium download (7200 px, SVG), Gelato prints from $24.99, **Render API** with Starter/Pro/Business plans and a commercial licence | API only; no white-label designer, no packs | The most direct "engine" competitor. Their API is file-out only; the seller still needs a customer-facing designer |
| **CartoArt** | Poster editor + Developer API (TypeScript SDK, GPU rendering, "500+ developers", free start) | API | No white-label designer, no pricing published, no seller workflow |
| **Maptoolkit Printmaps API / Editor** | 300 DPI static maps API, batch personalised mailings; Editor "can be integrated white-label" | White-label editor + API, pay-per-request via RapidAPI, enterprise licence | Utilitarian maps (mailings, photo books), not poster design; no themes/typography for wall art; no seller flow |
| **Print Map Studio** (printmaps.yasoob.me) | **Free everything**: 12 styles, A2–A6, routes incl. GPX/KML, elevation profile, contours, 3D terrain, QR codes, PNG/PDF/SVG/PSD, iframe embed | None | Shows how much is now free for consumers; raises the bar for our free tool. No seller workflow, no packs, no approval/file delivery |
| **Terraink**, **MapToPoster**, **Prettymapp** | Open source, free | None | Same: consumer free tier is commoditised |

### 1c. Generic white-label design SDKs

**Design Huddle**, **IMG.LY (CE.SDK)**, **printQ**: embeddable editors with headless APIs for print files. They are what a large brand would buy to build its own map designer; they have no map data, themes or map logic. Not competitors for sellers; possible build-vs-buy input for our editor UI.

### What nobody offers (the gap)

A **map-specialised, white-label designer for sellers** that bundles: hosted branded page or embed → customer designs across **many map product types** → approval → print file to the seller (dashboard, email, webhook, POD push) → plus **ready-made map packs** for catalogue listings. The pieces exist in separate products; nobody has assembled them for the map niche, and the closest (Customily/Teeinblue) make the seller do the design work in Mapbox.

**Threats:** MapPoster.xyz adding a white-label layer on top of its API (they already have themes, routes, prints and an API); Customily shipping good map templates. Both are plausible within months of our launch. Our defence is breadth of hooks (§4), pack catalogue, and seller workflow depth.

---

## 2. The model

```
                 ┌──────────────────────────────┐
  Public, free   │  mappy.app                   │  ← consumer tool: design + download
                 │  (demo, SEO, funnel)          │     (watermark-free low-res; paid hi-res)
                 └──────────────┬───────────────┘
                                │ "Sell these? Get your own designer"
                                ▼
                 ┌──────────────────────────────┐
  Seller pays    │  White-label designer         │  seller's brand, domain, themes, products, prices shown
  monthly        │  shop.sellername.com or embed │
                 └──────────────┬───────────────┘
                                │ customer designs → previews → APPROVES
                                ▼
                 ┌──────────────────────────────┐
                 │  Design record + print file   │  → seller dashboard, email, webhook,
                 │  (300 DPI PNG/PDF/SVG,        │    Printify / Printful / Gelato push,
                 │   mockups, design code)       │    code the buyer pastes into Etsy
                 └──────────────────────────────┘

  Plus:  Map packs (pre-rendered catalogues, licensed)   ·   Hooks: new product types & customisations
```

**Design principles for the white-label flow**
- **We never take the buyer's money in v1.** The seller's own store (Etsy, Shopify, WooCommerce, Instagram DMs) handles payment. The approved design produces a short **design code**; the buyer enters it at checkout or in Etsy's personalisation field. This avoids marketplace status, payment compliance and Etsy's "off-platform sales" rules, and it works for every seller regardless of platform.
- **Approval is the billing event.** Sellers pay per *approved* design (plus a base fee), not per preview, so window-shopping on their page costs them nothing.
- **Seller controls the design space.** They choose which themes, products, sizes, fonts and options their customers see, and can lock any of them (e.g. brand palette only).
- **Files are the deliverable.** Print-ready with bleed, colour profile, size presets matched to Printify/Printful/Gelato SKUs, and OSM attribution baked in (ODbL compliance handled for the seller).

### Revenue lines

| Line | Price hypothesis | Notes |
|---|---|---|
| **White-label subscription** | **Starter $29/mo**: branded hosted page, 3 product types, 50 approved designs/mo. **Pro $79/mo**: custom domain, all products, 300 approvals, webhooks, POD push, mockups. **Business $199/mo**: unlimited approvals, embed SDK, API, team seats, all packs included | Overage $0.25/approval. Anchors: Starmap $49 + 2% of order; Customily $49 + per item; Printerlo $49.99. We are cheaper at entry and broader |
| **Map packs** | $29–99 per pack (e.g. "European capitals × Noir", "US national parks", "Polish cities"); seasonal and themed packs; included in Business | One-off purchases with a licence to sell; also a lead magnet for the subscription |
| **Consumer hi-res download** | $6.99 one-off (matches MapPoster.xyz) | Keeps the public tool self-funding; proves quality to sellers |
| **API / embed usage** | Business tier + per-render over quota | For brands, print shops, other SaaS |
| **Later: print fulfilment margin** | Optional "we print it" via Gelato for sellers who don't want to manage POD | Only after the core is stable |

---

## 3. Phasing ("start small")

| Phase | Ships | Why first |
|---|---|---|
| **1. Free tool** | Consumer designer: city/place poster, 6–10 themes, text block, sizes, download. Paid hi-res. | Engine + UI needed by everything after. Public, looks like one more poster tool (stealth for the B2B layer). |
| **2. White-label v1** | Seller account → branded hosted page (subdomain) → customer designs → approve → file + design code in seller dashboard + email. Printify/Printful/Gelato push via webhook. Stripe billing. | The core promise. Invite-only beta (see exploration doc §7 Phase B). |
| **3. Map packs** | Pack builder (internal) → store for sellers → licence + ZIP + mockups + listing CSV | Cheap to produce once the engine exists; sells to sellers who don't personalise at all |
| **4. Hooks** | New product types and customisations from §4, prioritised by seller pull | Each hook is a reason to upgrade and a new Etsy category to be present in |
| **5. Embed + API** | JS embed for Shopify/WooCommerce themes; REST API | For larger sellers and brands |

---

## 4. Product hooks: types, products and customisations

The point of this list is breadth: each line is a reason for a seller to sign up or upgrade, and most are cheap once the engine exists. Grouped by what the customer brings (a place, a route, a date, a sky) and by what we add. **Bold** = recommended for the first wave, based on existing demand.

### 4.1 Place-based designs
- **Classic city / town poster** (the base product)
- **Neighbourhood / street-level** ("our first home", zoomed to a few blocks)
- **Coordinates poster** (minimal: lat/long, place, date; little or no map)
- **Multi-location "our story"** (2–4 panels: where we met, first date, wedding, home)
- **Split / dual city** (two places side by side or diagonally split: long-distance couples, expats)
- **Pin / heart marker** at an exact address (closing gifts, "born here", "proposed here")
- Country / state / region **outline** with the city marked
- **Island, lake or coastline** silhouettes (holiday places)
- **Transit-style schematic** map of a city (metro-map aesthetic of its streets or rail)
- **Figure-ground** (buildings only, black on white: architects, design lovers)
- **"Every street named X"** / hydrography-only (rivers and lakes only) / parks-only art maps
- **Topographic contours** and **shaded relief** (hiking areas, mountains; needs elevation data)
- **Bathymetric lake / harbour depth maps** (lake houses, sailors; where open data exists)
- **Vintage-style** rendition of today's OSM data (sepia, hatching, old-map typography)
- **Campus / venue / festival** maps for institutions (B2B-ish)

### 4.2 Route-based designs
- **GPX / FIT / TCX / Strava run, ride, hike or swim** poster with stats block (distance, time, elevation gain, pace)
- **Race finisher poster** (marathon, half, triathlon; official route + finisher time + bib number)
- **Elevation profile** strip under the map
- **Road trip / "our journey"** multi-stop route with numbered stops
- **Flight path** (great-circle arc between cities: "the flight that changed everything", pilots)
- **Pilgrimage / long trail** (Camino, Appalachian Trail, Via Francigena) segmented by day
- **Commute** poster (minimal, humorous)
- **Sailing / rowing / paddling** logs
- Year-in-review heatmap of all activities (season ticket for repeat buyers)

### 4.3 Event-based designs
- **Wedding venue map** for invitations: church → venue → hotel, illustrated-style theme, numbered points
- **Save-the-date** and **invitation inserts** (print and digital formats, including Instagram/WhatsApp sizes)
- **Welcome sign** / seating-area map poster for the day itself
- **Birth announcement** ("born here", hospital pin, date, weight)
- **Anniversary** ("10 years since…" with the original place)
- **Memorial / remembrance** maps (favourite place, tasteful themes)
- **Graduation** (campus map + year)
- **New home / housewarming** card and poster
- **Christmas / Valentine's / Mother's Day** themed variants of any of the above

### 4.4 Sky-based designs (complementary, not OSM)
- **Star map** for a date, time and place (every incumbent bundles this; large Etsy category)
- **Moon phase** for a date
- **Combined star map + street map** ("the night we met": sky above, streets below)
- Sunrise/sunset or daylight-hours posters for a place

### 4.5 Physical products the file is prepared for
Posters and framed prints, canvas, metal and acrylic prints, **phone cases**, **mugs** and enamel mugs, puzzles, cushions, tote bags, T-shirts and sweatshirts (small chest print or full back), **coasters** and placemats, mouse pads, blankets, **calendars** (12 places), notebook / journal covers, greeting cards and postcards, wrapping paper and gift tags, **ornaments** and keychains, **laser-cut / engraved** files (SVG line-art for wood or acrylic maps), wall murals (tiled large format), desk mats, stickers.

Each product = size preset + safe area + bleed + colour profile matched to the main POD catalogues; one click re-targets an approved design to another product.

### 4.6 Customisation options (what the customer or seller can change)
**Map**: theme, background/water/park/road colours (full pickers or seller-locked palette), road hierarchy weights, buildings on/off, rail on/off, parks on/off, labels on/off, street names on/off, zoom, rotation, pan, hand-drawn/sketch filters, paper texture, halftone, duotone, gradient skies.

**Frame / shape**: full bleed, circle, heart, star, hexagon, arch, oval, diamond, pennant, multi-panel (triptych), split-diagonal, torn-paper edge, polaroid.

**Text**: title, subtitle, coordinates (formats: decimal, DMS, what3words-style disabled by licence), date, dedication line, quote, names with "&", curved text around circular maps, vertical text, letter-spacing, 3–6 curated font pairs, **any script** (Latin with diacritics, Cyrillic, Greek, Hebrew, Arabic, CJK, Devanagari), seller-uploadable brand font (Pro+).

**Marks**: pins (heart, star, house, ring, baby, paw, plane, flag), numbered stops, custom icon upload, photo inset (circle or square), initials monogram, QR code (to a message, playlist, video or the seller's shop), compass rose, scale bar, north arrow, grid.

**Route-specific**: line style (solid, dashed, glow), start/finish markers, km/mile markers, stats block fields, elevation strip, speed/heart-rate colouring, activity icon.

**Sky-specific**: constellation lines, names, Milky Way, grid, horizon ring, planets on/off.

**Layout**: all A and US sizes, square sizes, social formats (1080×1350, 1080×1920, 1200×630), custom mm sizes, portrait/landscape, margin presets, bleed on/off, border styles.

**Output**: PNG, PDF (print-ready, CMYK option), SVG (vector), layered PSD (later), mockup set (framed on wall, flat lay, lifestyle), file naming template, auto-attribution placement.

**Language**: UI and default text in EN/PL/DE/FR/ES/IT/NL/PT (buyers of the seller's page see the seller's language).

### 4.7 Seller-side features (the reasons to pay monthly)
- Brand kit: logo, colours, fonts, favicon, custom domain, "powered by" removal
- Product catalogue: which products/themes/options are exposed; per-product price display (informational; payment stays in the seller's store)
- Approval flow: customer approves → design code + files; seller can require manual review per product
- Delivery: dashboard, email, **webhooks**, Printify/Printful/Gelato order creation, Zapier/Make
- Etsy-friendly: design code format that fits the personalisation field; order matching by code
- Bulk tools: map packs, CSV batch render, "re-render my whole catalogue in the new theme"
- Mockup generator per product
- Analytics: starts, approvals, conversion per product and theme
- Team seats, multi-store, API keys (Business)
- Licence certificate for commercial use and OSM attribution guidance

---

## 5. Which hooks first (recommendation)

| Wave | Hooks | Evidence |
|---|---|---|
| **1 (launch)** | City poster, neighbourhood, coordinates, pin marker, dual city, shapes (circle/heart), full text/colour customisation, poster + framed + canvas presets, mockups | Core of every incumbent; cheapest to build |
| **2** | **Star map** and star+street combo; **GPX route poster** with stats and elevation; phone case / mug / puzzle presets | Star maps are bundled by every personaliser and are a large Etsy category; route posters have repeat buyers (one per race) and a growing free-tool scene that proves demand |
| **3** | **Wedding venue map + invitation/save-the-date formats**; multi-location "our story"; road trip | Illustrated wedding maps sell at $118–360 hand-made; an instant, good-looking version at seller prices is a clear hook |
| **4** | Topographic/shaded relief, bathymetry, transit-style, figure-ground, laser-cut SVG, calendars | Higher price points and fewer free tools; more rendering work |

---

## 6. Open questions

1. **Design code vs direct checkout.** Start with codes (platform-agnostic). Add a Shopify app with cart integration when enough Pro sellers are on Shopify.
2. **Star maps and elevation** need non-OSM data (star catalogues such as HYG/Hipparcos; Copernicus DEM). Licensing is permissive but must be checked like OSM's.
3. **Build vs buy for the editor UI**: own canvas editor vs IMG.LY-style SDK. Own editor keeps costs and control; SDK speeds up Phase 1. Engineering to assess.
4. **Rev-share pricing** (Starmap's $49 + 2%) vs per-approval. Per-approval is simpler and doesn't require knowing the seller's prices; keep it.
5. **Etsy listing analysis (A1)** could not be run from this environment (Etsy blocks automated access). Options: a paid Etsy analytics tool (eRank, Alura, EverBee) for an afternoon, or a manual sample of 100 listings.

---

## Sources
- Personalisers: [Customily maps](https://customily.com/post/how-to-sell-personalized-products-with-maps), [Customily Shopify listing](https://apps.shopify.com/customily-product-personalizer), [Teeinblue maps](https://support.teeinblue.com/en/article/12xvhzm/), [Customix for Etsy](https://customix.io/etsy), [Starmap app](https://apps.shopify.com/new-starmap-app), [Printerlo](https://discover.commoninja.com/shopify/app/personalized-posters), [Gelato Personalization Studio](https://www.gelato.com/au/personalization-studio) (text/date/image only; no maps found)
- Engines/APIs: [MapPoster.xyz](https://mapposter.xyz/), [CartoArt developer](https://www.cartoart.net/developer), [Maptoolkit Printmaps API](https://www.maptoolkit.com/api/printmaps-api/), [Print Map Studio](https://printmaps.yasoob.me/), [MapToPoster JS](https://github.com/dimartarmizi/map-to-poster)
- White-label design SDKs: [Design Huddle](https://www.designhuddle.com/), [IMG.LY poster designer](https://img.ly/use-cases/poster/), [printQ / cloudlab](https://www.cloudlab-solutions.com/blog/white-label-multi-client-portals-b2b-web-to-print-storefront-solutions)
- Pricing comparisons: [Shopify personalisation apps 2026](https://bogos.io/shopify-personalized-products-apps/)

Prices and features are from vendor pages and third-party listings as of October 2026; none are audited.
