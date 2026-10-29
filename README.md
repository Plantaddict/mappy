# Mappy

Turn any place on Earth into a print-ready map poster, and give sellers a white-label designer their customers can use. Built on OpenStreetMap data, rendered in the browser with MapLibre.

**What's in the box**

| Area | Status |
|---|---|
| **Studio** (`/studio`): search a place, frame it, 8 themes, colour overrides, fonts, layers, text with auto-fit and any script, rect / circle / heart / hexagon crops, classic or full-bleed layout, marker, rotation, 12 products (A-series, cm, inch posters, square, social, phone case, mug), PNG / JPEG / PDF export at print DPI, framed mockup, share link, autosave | Working |
| **White-label designer** (`/s/<slug>`): the seller's brand, only their themes/products, optional prices, customer approves → 300 DPI file rendered and uploaded → short design code to paste at checkout | Working |
| **Seller dashboard** (`/dashboard`): approved designs with preview, code, customer details, download, delete; brand & product settings; webhooks (HMAC-signed) and a Bearer-key API; plan & monthly approval quota | Working |
| **Map packs** (`/dashboard/packs`): city lists × themes × size → ZIP of print files, framed mockups and a listings CSV, rendered in the browser | Working |
| **Billing** (Stripe), **email delivery**, **Printify/Printful/Gelato order creation**, **server-side render API** | Not built; see *Before launch* |

Product docs: [docs/PRD.md](docs/PRD.md), [docs/seller-platform-exploration.md](docs/seller-platform-exploration.md), [docs/white-label-platform.md](docs/white-label-platform.md).

## Run it

```bash
cp .env.example .env          # set AUTH_SECRET to a long random string
npm install                   # also runs prisma generate
npx prisma db push            # creates prisma/dev.db (SQLite)
npm run dev                   # http://localhost:3000
```

Try the full loop: open `/studio` and download a poster → `/signup` to create a shop → open `/s/<your-slug>`, design and **Approve** → the design appears in `/dashboard` with its code and a download button.

`npm run build && npm start` for production. `npm run typecheck` for TypeScript.

### Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection. SQLite by default; switch the provider in `prisma/schema.prisma` to `postgresql` for production. |
| `AUTH_SECRET` | Signs session cookies and download links. |
| `NEXT_PUBLIC_APP_URL` | Public URL, used in webhook payloads and signed download links. |
| `FILES_DIR` | Where print files are stored (local disk; swap `src/lib/files.ts` for S3/R2 in production). |
| `NEXT_PUBLIC_TILES_URL` | Vector tile TileJSON. Default is OpenFreeMap (keyless, free). Self-host Protomaps/OpenMapTiles for scale. |
| `GEOCODER_URL` | Photon endpoint. The public instance is for development; self-host or use a provider in production. |

## How it works

- **Rendering is client-side.** `src/lib/render.ts` creates a temporary MapLibre map at the exact pixel size needed (`pixelRatio` scales a canonical CSS size), composes the map, shape clip, marker, text block and OSM attribution onto a 2D canvas, and exports PNG/JPEG/PDF. The live preview (`MapPreview`/`PosterPreview`) uses the same geometry, so what you see is what you get.
- **Themes are generated styles.** `src/lib/themes.ts` turns a palette into a full MapLibre style over the OpenMapTiles schema; line widths scale with the preview size so weights match the print.
- **A design is a small JSON spec** (`src/lib/spec.ts`, zod-validated). Share links encode it in the URL; approved designs store it alongside the file so they can be re-rendered.
- **Approval flow.** `POST /api/designs` (multipart) checks the seller's allowed themes/products and monthly quota, stores the file and preview, creates a `MP-XXXXXX` code, and fires the seller's webhook with a signed 30-day download URL. Payment never touches Mappy: the buyer pastes the code into the seller's own checkout.
- **Auth** is email + password (bcrypt) with a JWT session cookie (`jose`). API access uses a per-seller Bearer key.

## Licensing

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL. Posters are *produced works*: selling them is allowed, and the attribution printed on every export is what the licence requires, so it cannot be turned off. Tiles from [OpenFreeMap](https://openfreemap.org); fonts from Google Fonts (OFL).

## Before launch

1. **Billing**: Stripe Checkout + customer portal; gate `PATCH /api/seller { plan }` behind it (today plan switching is self-service for testing) and charge overage per approval.
2. **Email**: send the seller (and optionally the customer) the design code and link on approval.
3. **Fulfilment push**: Printify/Printful/Gelato order creation from the webhook payload, or native integrations.
4. **Storage and DB**: object storage for files, Postgres, and a periodic cleanup of unclaimed consumer uploads.
5. **Tiles and geocoding**: self-hosted or paid tiers; the public endpoints have fair-use limits.
6. **Server-side render API** (headless Chromium or maplibre-native) for the Business tier and for very large sizes on weak devices.
7. **Abuse limits** on `/api/designs` and `/api/geocode` (rate limiting, upload size already capped at 60 MB).
8. **Legal**: terms for sellers, privacy policy, and the commercial licence text.
