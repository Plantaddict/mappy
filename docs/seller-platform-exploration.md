# Exploration: Mappy for Sellers (B2B map-art engine)

| | |
|---|---|
| **Status** | Exploration v0.1, 2026-10-29 |
| **Question** | Is "sell the map-rendering engine to Etsy / print-on-demand sellers" a better business than the consumer poster site in [PRD.md](PRD.md)? |
| **Short answer** | Better, but narrower than first thought. Generic personalisation apps already offer street-map elements. The open gaps are **bulk catalogue generation**, **design quality without Mapbox setup**, and **price**. Viable as a niche SaaS; needs validation before building. |

---

## 1. The customer

**Who:** Etsy and Shopify sellers who sell map-based wall art, mostly fulfilled by print-on-demand (Printify, Printful, Gelato) or as digital downloads.

**Two distinct jobs:**

| Job | What the seller does today | Pain |
|---|---|---|
| **A. Catalogue** (non-personalised). "I want 300 listings: 50 cities × 6 styles, as digital downloads or POD posters." | Renders each city by hand in Illustrator/Canva/Figma plugin or a Python script, makes mockups, writes listings. | Days of repetitive work per batch. Quality drifts. Hard to refresh styles across the catalogue. |
| **B. Personalised orders.** "Buyer gives me an address and a title; I must produce a print file for every order." | Reads the Etsy personalisation note, renders the map manually, uploads to Printify/Printful "Action required" queue, or uses a personaliser app (Customily/Teeinblue/Customix) built on Mapbox. | Per-order manual work, or a $20–50/mo app plus per-item fees that still requires setting up Mapbox/Google accounts and designing map styles in Mapbox Studio. |

**Evidence of scale (approximate, from cached Etsy pages and SEO tools):**
- ~120,000 Etsy listings for "city map poster"; ~460,000 for "map print".
- Typical map-focused shops: 1,700–2,800 lifetime sales over 3–7 years (MapPosterPrints 1,668 since 2023; GeoDigitalMaps 2,190 since 2023; LoveMapStore 2,512 since 2021; Printvent 2,753 since 2019). That is **1–3 sales/day**: small businesses, price-sensitive, time-poor.
- Digital-download map listings sell at $3–8; POD posters at $15–30 on Etsy.

No public count of *active* map-selling shops exists. Working assumption: **low thousands** worldwide. This must be validated (see §7).

---

## 2. Competitive landscape (correction to the earlier assessment)

The earlier claim that "nobody sells a map engine to sellers" was wrong. Three generic product personalisers already include a street-map element:

| Tool | Map support | Price | How maps are rendered | Weak spots for map sellers |
|---|---|---|---|---|
| **Customily** | Street & star maps; buyer types address, live map; seller can paste a Mapbox style URL | ~$49/mo + $0.10–1.00 per item | Mapbox | Generic styles unless the seller designs their own in Mapbox Studio; priced for Shopify brands; Etsy flow is a post-purchase email link |
| **Teeinblue** | Street & star maps; location search; default zoom/style per product | $19–549/mo by volume + per-item fee | Mapbox (seller must create a Mapbox account and optionally Google Places, link it to Teeinblue, design styles there) | Setup burden on the seller; Shopify-first; Etsy on separate plans |
| **Customix** | Street map "from coordinates, any zoom or style" | $19.99/mo + $1.00→$0.10 per item | Unclear | Maps are one option among many; Etsy flow via pasted customisation ID |
| **Printify Personalization Hub** | Text and image layers only; no map element found | Free with Printify | — | Would be the most dangerous entrant if Printify added maps natively |
| **Open-source** (MapToPoster, Prettymapp, Terraink) | Full posters, free | Free | OSM via OSMnx / tiles | Needs a developer; no bulk UI, no mockups, no order integration |

**What none of them do:**
1. **Bulk catalogue generation** (Job A): a city list in, hundreds of finished posters + mockups + listing copy out.
2. **Curated, print-grade design** out of the box: typography, letter-spacing, text auto-fit, coordinates line, frame shapes, paper sizes with bleed. Personalisers render a map tile into a rectangle; the seller supplies the design.
3. **Zero third-party setup.** Our rendering is OSM-based and self-hosted, so the seller never touches Mapbox, Google Cloud or API keys. (Mapbox's Static Images API caps at 1,280 px, and Studio print exports are limited to 100 per account before "contact sales". How the personalisers reach 300 DPI at A2 is unverified; this is a hypothesis to test by buying a sample.)

**Risks from the landscape:** Customily/Teeinblue could ship better map templates in a sprint; Printify could add a native map layer; open-source tools keep improving. The defensible parts are design taste, bulk tooling, and integration depth, not the renderer itself.

---

## 3. Product shape

Three layers, shipped in this order. Layer 1 needs no platform API approval and is the uncontested gap, so it goes first.

### Layer 1: Studio (bulk catalogue)
- Curated themes (reuse the consumer PRD's 6+ themes), poster layouts, text auto-fit, Unicode.
- **Batch mode:** paste a list of places (or pick from a curated "top 500 cities" list) × selected themes × sizes → ZIP of 300 DPI PNG/PDF, plus **mockups** (framed, on wall, flat lay) and a **CSV of titles, tags and descriptions** per listing.
- Style refresh: re-render the whole catalogue when a theme is updated.
- Commercial licence included; OSM attribution baked into files (ODbL compliance for the seller).

### Layer 2: Order automation (personalised orders)
- Connect Etsy shop (needs Etsy **Commercial API access**: manual review, ~30 days, reported as hard to get; apply on day 1) and Shopify.
- Map the listing's personalisation fields (address, title, subtitle, date) to a template. Auto-render on order. Push the file to Printify / Printful / Gelato, or hold for one-click approval.
- Fallback that needs no Etsy API: a hosted personalisation page (same model as Customix: buyer previews, gets a code, pastes it into Etsy's field).

### Layer 3: API and embed
- REST API: `POST /render` with place, theme, text, size → file URL. For Shopify brands, gift companies, print shops, and other SaaS (e.g. realtor-gift vendors).
- White-label embeddable designer for brands that want a live preview on their own site.

---

## 4. Pricing hypothesis

Anchor below the generic personalisers' entry price and avoid per-item fees at the low end, since map sellers do 1–3 orders a day.

| Tier | Price | Includes | Target |
|---|---|---|---|
| **Starter** | $19/mo | 200 renders/mo, 6 themes, mockups, CSV export | Digital-download sellers |
| **Pro** | $49/mo | 1,500 renders/mo, all themes, Etsy/Shopify order automation, Printify/Printful push | Active POD sellers |
| **Business / API** | $149/mo + usage | API, white-label embed, custom themes | Brands, agencies, other SaaS |

Per-render cost on self-hosted OSM tiles is estimated well under €0.05, so gross margin on all tiers should exceed 85%. Treat as a hypothesis until a render benchmark exists.

---

## 5. Business case (honest version)

| | Consumer poster site | Seller platform |
|---|---|---|
| Buyer | Gift buyer, once | Seller, monthly |
| Revenue per customer | €10–45 once | $19–49/mo × 12–24 months = **$230–1,200** |
| Acquisition | Fight incumbents + free tools for every €45 sale | Reach sellers where they gather (r/EtsySellers, r/printondemand, POD YouTube, Printify/Printful communities, Etsy seller Facebook groups); each customer is worth 10–30× a poster sale |
| Fulfilment | POD per order | None |
| Platform risk | Low | **High**: Etsy API approval, Printify adding maps, Shopify app review |

**Sizing:** if ~3,000 shops actively sell map art and we convert 3–5% over 18 months → 90–150 paying sellers → **$3–7k MRR**. Reaching $20k+ MRR requires expansion beyond city posters: star maps, route/GPX posters, wedding venue maps, "where we met" multi-pin, plus API customers. The engine supports all of these; the personalisers already bundle star maps, so expansion is expected rather than optional.

**Verdict:** a credible niche SaaS with recurring revenue and almost no fulfilment or COGS, but a modest ceiling and real platform risk. Better than the consumer site. Not a venture-scale business on its own; a sound bootstrapped one if validation passes.

---

## 6. Key risks

| Risk | Mitigation |
|---|---|
| Etsy Commercial API access refused or slow | Ship Layer 1 (no API) first; hosted personalisation page as fallback for Layer 2; Shopify app in parallel |
| Incumbent personalisers add good map templates | Compete on bulk tooling + design + price; move fast on themes; build API moat with integrations |
| Printify adds native map personalisation | Position as the design/catalogue layer above fulfilment, and integrate with Printify rather than against it |
| Sellers are too price-sensitive | Starter tier at $19; usage-based upsell; prove hours saved in onboarding |
| OSM data gaps make posters empty in some regions | Preview before render; "coverage score" warning in batch mode |
| ODbL / attribution compliance for sellers | Attribution baked in; licence explainer; legal review before launch |

---

## 7. Validation plan (stealth mode)

**Decision (2026-10-29):** no customer interviews and no public landing-page test before the product exists, to avoid signalling the bulk-catalogue wedge to competitors. Trade-off accepted: the first real demand signal arrives after the Studio MVP is built (roughly 6–10 weeks later than with interviews), so the pre-build phase leans on research that asks nobody anything.

Note for the record: the parties able to copy this (Customily, Teeinblue, Printify) will see the product at launch regardless; sellers are customers, not competitors. The protection stealth buys is a head start on execution, not secrecy of the idea. Design quality and speed of iteration are the moat.

### Phase A: silent research (2–3 weeks, in parallel with engine work)

| # | Test | Method | What it decides |
|---|---|---|---|
| A1 | Job A vs Job B | Pull the top ~200 map-poster listings (Etsy search + a seller analytics tool). Classify: per-city catalogue vs personalised; digital vs POD; price band; review velocity as a sales proxy | Which job the MVP serves first; expected price points |
| A2 | Pain is real | Mine existing threads in r/EtsySellers, r/printondemand, Etsy community forums and POD Facebook groups for: map poster workflow, personalisation workload, Customily/Teeinblue/Printify complaints. Read only; post nothing | Whether sellers already describe the pain we assume, in their own words |
| A3 | Manual work exists | Order a personalised map from 4 shops. Record turnaround time (days of delay = manual rendering), file/print quality, how personalisation was collected | Confirms per-order manual work and its quality ceiling |
| A4 | Competitor quality | Buy a map print produced through Customily and one through Teeinblue; measure real resolution, design quality, and seller setup burden (trial accounts) | Confirms or kills the "generic design, weak at print size" hypothesis |
| A5 | Platform feasibility | Apply for Etsy Personal then Commercial API access (describe the app neutrally as a "listing and order design tool"); confirm Printify / Printful / Gelato order-file APIs; read Shopify app review rules | Whether Layer 2 has a viable route; longest lead item |
| A6 | Unit cost | Render benchmark: A2 @ 300 DPI from self-hosted OSM tiles; seconds and € per render | < €0.05 and < 30 s per render on commodity hardware |

**Proceed to build if:** A1 shows a substantial catalogue segment (≥ 30% of top listings are per-city, non-personalised) *or* A3 shows manual per-order work in ≥ 3 of 4 shops; and A6 passes.

### Phase B: validate with the product (after Studio MVP)

| # | Test | Method | Pass criterion |
|---|---|---|---|
| B1 | Closed beta | Invite 5–10 map-art sellers (found in A1) to "early access" under a short NDA. Give free Pro for 2 months. Watch usage, not opinions | ≥ 5 generate a real batch; ≥ 3 publish listings made with it |
| B2 | Willingness to pay | At the end of the beta, convert to paid Starter/Pro | ≥ 40% convert |
| B3 | Public soft launch | The consumer poster site launches publicly as an ordinary poster tool. The Studio stays invite-only until B1/B2 pass | Consumer site provides SEO/demo traffic; the wedge stays quiet |

**Kill criteria:** Phase A shows neither a catalogue segment nor manual per-order work, or B1 fails with fewer than 3 sellers publishing anything.

---

## 8. Build plan under stealth

Because validation moves after the build, the build is sequenced so that the first shippable piece is the one needed under every scenario.

1. **Engine** (needed for every direction, including the consumer site): OSM tile source, themes, typography and layout, 300 DPI PNG/PDF export, render benchmark (A6).
2. **Consumer site** (public, looks like one more poster tool): reuses the consumer PRD; serves as demo, SEO funnel and a stress test of the engine.
3. **Studio MVP** (invite-only): batch rendering from a place list × themes × sizes → ZIP + mockups + listing CSV; accounts; Stripe; render quota.
4. **Closed beta** (B1/B2), then decide on Layer 2 (order automation) based on A5 and what beta sellers actually do.

Out of scope until after the beta: order automation, API, star/route maps.

---

## 9. Decision requested

1. ~~Approve the 4-week validation plan.~~ Decided: stealth mode; interviews and the public landing-page test are dropped in favour of §7 Phase A/B.
2. Agree that the consumer PRD is re-scoped to "public demo + funnel" rather than the business.
3. Apply for Etsy API access immediately, since it is the longest lead item.

---

## Sources

- Competitor comparisons: [OwnHomeMap (Feb 2026)](https://ownhomemap.com/en/blog/best-city-map-websites-compared), [MapArtPrint](https://mapartprint.com/best-map-poster-makers)
- Personalisation apps: [Customily maps](https://customily.com/post/how-to-sell-personalized-products-with-maps), [Customily map element docs](https://help.customily.com/articles/6700103646-map), [Teeinblue maps feature](https://support.teeinblue.com/en/article/12xvhzm/), [Teeinblue custom map prints](https://teeinblue.com/blogs/en/product-customizer-for-custom-map-prints), [Customix for Etsy](https://customix.io/etsy), [App pricing comparison](https://bogos.io/shopify-personalized-products-apps/)
- Printify: [Personalization Hub for Etsy](https://help.printify.com/hc/en-us/articles/47145436478609-What-is-Personalization-Hub-for-Etsy-and-how-does-it-work), [Printify personalization](https://printify.com/personalization/)
- Etsy API: [What is Etsy's API](https://help.etsy.com/hc/en-in/articles/360025870013-What-is-Etsy-s-API), [API terms](https://www.etsy.com/mx/legal/api), [Developer discussion on commercial access](https://github.com/etsy/open-api/discussions/1185)
- Mapbox limits: [Static maps guide](https://docs.mapbox.com/help/dive-deeper/static-maps/), [High-resolution printing in Studio](https://blog.mapbox.com/high-resolution-printing-arrives-in-mapbox-studio-cc0fafdba898)
- Etsy shops (sales counts): [MapPosterPrints](https://www.etsy.com/shop/MapPosterPrints), [GeoDigitalMaps](https://www.etsy.com/shop/GeoDigitalMaps), [LoveMapStore](https://etsy.com/shop/LoveMapStore), [Printvent](https://www.etsy.com/pl/shop/Printvent)
- Keyword volumes and listing counts: [RankHero "city map poster"](https://www.rankhero.com/keywords/city-map-poster), [RankHero "map print"](https://www.rankhero.com/keywords/map-print)
- Open-source tools: [MapToPoster](https://pypi.org/project/maptoposter/0.3.0/), [Prettymapp](https://wiki.openstreetmap.org/wiki/Prettymapp), [Terraink](https://webiano.digital/terraink-turns-any-place-into-printable-map-art/)

All prices and counts come from vendor pages, comparison blogs run by competitors, and cached listings; none are audited figures.
