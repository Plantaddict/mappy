"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { THEMES, FONT_PAIRS, type Theme } from "@/lib/themes";
import { PRODUCTS, getProduct, layoutFor, pixelSize } from "@/lib/products";
import { DEFAULT_SPEC, SHAPES, MARKERS, decodeSpec, encodeSpec, zoomForPlaceType, type DesignSpec } from "@/lib/spec";
import type { SellerPublic } from "@/lib/seller";
import PosterPreview from "./PosterPreview";
import PlaceSearch from "./PlaceSearch";
import ExportPanel from "./ExportPanel";
import ApprovePanel from "./ApprovePanel";

type Tab = "place" | "style" | "text" | "layout" | "finish";

type Props = {
  mode: "consumer" | "whitelabel";
  seller?: SellerPublic;
  initialSpec?: DesignSpec;
};

export default function Designer({ mode, seller, initialSpec }: Props) {
  const allowedThemes = useMemo(() => THEMES.filter((t) => !seller || seller.allowedThemes.includes(t.id)), [seller]);
  const allowedProducts = useMemo(() => PRODUCTS.filter((p) => !seller || seller.allowedProducts.includes(p.id)), [seller]);

  const [spec, setSpec] = useState<DesignSpec>(() => {
    const base = initialSpec ?? DEFAULT_SPEC;
    const themeId = allowedThemes.some((t) => t.id === base.themeId) ? base.themeId : allowedThemes[0]?.id ?? base.themeId;
    const productId = allowedProducts.some((p) => p.id === base.productId) ? base.productId : allowedProducts[0]?.id ?? base.productId;
    return { ...base, themeId, productId };
  });
  const [tab, setTab] = useState<Tab>("place");
  const [placingMarker, setPlacingMarker] = useState(false);

  // restore from URL hash or local autosave (consumer mode only)
  useEffect(() => {
    if (initialSpec) return;
    const hash = window.location.hash.replace(/^#/, "");
    const fromHash = hash ? decodeSpec(hash) : null;
    if (fromHash) {
      setSpec(fromHash);
      return;
    }
    if (mode === "consumer") {
      try {
        const saved = localStorage.getItem("mappy:draft");
        const parsed = saved ? decodeSpec(saved) : null;
        if (parsed) setSpec(parsed);
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mode !== "consumer") return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem("mappy:draft", encodeSpec(spec));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [spec, mode]);

  const patch = useCallback((p: Partial<DesignSpec>) => setSpec((s) => ({ ...s, ...p })), []);

  /** Product, orientation, shape or layout changes keep the same geographic extent, not the same per-pixel zoom. */
  const patchGeometry = useCallback((p: Partial<Pick<DesignSpec, "productId" | "orientation" | "shape" | "layoutStyle">>) => {
    setSpec((s) => {
      const before = layoutFor(getProduct(s.productId), s.orientation, s.shape, s.layoutStyle).map.w;
      const next = { ...s, ...p };
      const after = layoutFor(getProduct(next.productId), next.orientation, next.shape, next.layoutStyle).map.w;
      const zoom = Math.min(18, Math.max(3, s.zoom + Math.log2(after / before)));
      return { ...next, zoom };
    });
  }, []);
  const patchText = (p: Partial<DesignSpec["text"]>) => setSpec((s) => ({ ...s, text: { ...s.text, ...p } }));
  const patchLayers = (p: Partial<DesignSpec["layers"]>) => setSpec((s) => ({ ...s, layers: { ...s.layers, ...p } }));
  const patchMarker = (p: Partial<DesignSpec["marker"]>) => setSpec((s) => ({ ...s, marker: { ...s.marker, ...p } }));
  const patchColors = (p: Partial<DesignSpec["colors"]>) => setSpec((s) => ({ ...s, colors: { ...s.colors, ...p } }));

  const onViewChange = useCallback((v: { center: [number, number]; zoom: number; bearing: number }) => {
    setSpec((s) => ({ ...s, center: v.center, zoom: v.zoom, bearing: v.bearing }));
  }, []);

  const product = getProduct(spec.productId);
  const px = pixelSize(product, spec.orientation);
  const brand = seller ? { primary: seller.primaryColor, accent: seller.accentColor } : { primary: "#16151a", accent: "#c9a227" };

  const tabs: { id: Tab; label: string }[] = [
    { id: "place", label: "Place" },
    { id: "style", label: "Style" },
    { id: "text", label: "Text" },
    { id: "layout", label: "Layout" },
    { id: "finish", label: mode === "consumer" ? "Download" : "Approve" },
  ];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] min-h-[560px] flex-col lg:flex-row">
      <section className="relative flex-1 bg-neutral-200/70 p-3 lg:p-6">
        <PosterPreview spec={spec} onViewChange={onViewChange} placingMarker={placingMarker} onPlaceMarker={(ll) => { patchMarker({ enabled: true, lngLat: ll }); setPlacingMarker(false); }} />
        {placingMarker && (
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white shadow">
            Click on the map to place the marker
          </div>
        )}
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/80 px-3 py-1 text-[11px] text-neutral-600 shadow-sm backdrop-blur">
          {product.name} · {px.width}×{px.height} px · drag to pan, scroll to zoom
        </div>
      </section>

      <aside className="flex w-full flex-col border-t border-neutral-200 bg-white lg:w-[400px] lg:border-t-0 lg:border-l">
        <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 p-2">
          {tabs.map((t) => (
            <button key={t.id} className={`tab ${tab === t.id ? "tab-active" : ""}`} onClick={() => setTab(t.id)} style={tab === t.id ? { background: brand.primary } : undefined}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "place" && (
            <div className="space-y-5">
              <div>
                <label className="label">Place</label>
                <PlaceSearch
                  autoFocus
                  onPick={(r) => {
                    const subtitle = r.country && r.region ? `${r.region}, ${r.country}` : r.country || r.region;
                    setSpec((s) => ({
                      ...s,
                      place: { name: r.name, country: r.country },
                      center: [r.lng, r.lat],
                      zoom: zoomForPlaceType(r.type),
                      bearing: 0,
                      text: { ...s.text, title: r.name, subtitle: subtitle || s.text.subtitle },
                      marker: { ...s.marker, lngLat: s.marker.enabled ? [r.lng, r.lat] : s.marker.lngLat },
                    }));
                  }}
                />
                <p className="mt-2 text-xs text-neutral-500">Then drag and zoom the map to frame it. The title and subtitle update automatically; edit them in the Text tab.</p>
              </div>

              <div>
                <label className="label">Zoom</label>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary" onClick={() => patch({ zoom: Math.max(3, spec.zoom - 0.5) })}>−</button>
                  <input type="range" min={3} max={17} step={0.05} value={spec.zoom} onChange={(e) => patch({ zoom: Number(e.target.value) })} className="flex-1" />
                  <button className="btn-secondary" onClick={() => patch({ zoom: Math.min(18, spec.zoom + 0.5) })}>+</button>
                </div>
              </div>

              <div>
                <label className="label">Rotation</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={-180} max={180} step={1} value={spec.bearing} onChange={(e) => patch({ bearing: Number(e.target.value) })} className="flex-1" />
                  <span className="w-12 text-right text-xs tabular-nums text-neutral-500">{Math.round(spec.bearing)}°</span>
                  <button className="btn-ghost text-xs" onClick={() => patch({ bearing: 0 })}>Reset</button>
                </div>
              </div>

              <div className="rounded-lg border border-neutral-200 p-3">
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Marker</label>
                  <Toggle checked={spec.marker.enabled} onChange={(v) => patchMarker({ enabled: v, lngLat: spec.marker.lngLat ?? spec.center })} />
                </div>
                {spec.marker.enabled && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {MARKERS.map((m) => (
                        <button key={m} className={`rounded-md border px-2.5 py-1 text-xs capitalize ${spec.marker.kind === m ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`} onClick={() => patchMarker({ kind: m })}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-secondary text-xs" onClick={() => patchMarker({ lngLat: spec.center })}>Put at centre</button>
                      <button className={`${placingMarker ? "btn-primary" : "btn-secondary"} text-xs`} onClick={() => setPlacingMarker((v) => !v)}>
                        {placingMarker ? "Click the map…" : "Pick on map"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "style" && (
            <div className="space-y-5">
              <div>
                <label className="label">Theme</label>
                <div className="grid grid-cols-2 gap-2">
                  {allowedThemes.map((t) => (
                    <ThemeCard key={t.id} theme={t} active={spec.themeId === t.id} onClick={() => patch({ themeId: t.id, colors: {} })} />
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Font</label>
                <select className="input" value={spec.font} onChange={(e) => patch({ font: e.target.value as DesignSpec["font"] })}>
                  <option value="theme">Theme default</option>
                  {Object.entries(FONT_PAIRS).map(([id, f]) => (
                    <option key={id} value={id}>{f.name} — {f.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Layers</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {(["buildings", "parks", "water", "rail", "labels"] as const).map((k) => (
                    <label key={k} className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 capitalize">
                      {k === "labels" ? "Street names" : k}
                      <Toggle checked={spec.layers[k]} onChange={(v) => patchLayers({ [k]: v })} />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Colours</label>
                  {Object.keys(spec.colors).length > 0 && <button className="btn-ghost text-xs" onClick={() => patch({ colors: {} })}>Reset to theme</button>}
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([
                    ["bg", "Background"], ["road1", "Main roads"], ["road2", "Roads"], ["road3", "Streets"], ["water", "Water"], ["parks", "Parks"], ["text", "Text"],
                  ] as const).map(([k, label]) => {
                    const theme = THEMES.find((t) => t.id === spec.themeId) ?? THEMES[0];
                    const val = spec.colors[k] ?? theme.palette[k];
                    return (
                      <label key={k} className="flex flex-col items-center gap-1 text-[11px] text-neutral-600">
                        <input type="color" className="swatch" value={val} onChange={(e) => patchColors({ [k]: e.target.value })} />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "text" && (
            <div className="space-y-4">
              <Field label="Title" value={spec.text.title} onChange={(v) => patchText({ title: v })} checked={spec.text.showTitle} onToggle={(v) => patchText({ showTitle: v })} />
              <Field label="Subtitle" value={spec.text.subtitle} onChange={(v) => patchText({ subtitle: v })} checked={spec.text.showSubtitle} onToggle={(v) => patchText({ showSubtitle: v })} />
              <div className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm">
                Coordinates line
                <Toggle checked={spec.text.showCoords} onChange={(v) => patchText({ showCoords: v })} />
              </div>
              <Field label="Dedication / tagline" placeholder="Where it all began" value={spec.text.tagline} onChange={(v) => patchText({ tagline: v, showTagline: true })} checked={spec.text.showTagline} onToggle={(v) => patchText({ showTagline: v })} />
              <div className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm">
                Uppercase
                <Toggle checked={spec.text.uppercase} onChange={(v) => patchText({ uppercase: v })} />
              </div>
              <p className="text-xs text-neutral-500">Any script works: Kraków, Київ, Αθήνα, 東京. Long titles shrink automatically to fit.</p>
            </div>
          )}

          {tab === "layout" && (
            <div className="space-y-5">
              <div>
                <label className="label">Product &amp; size</label>
                <select className="input" value={spec.productId} onChange={(e) => patchGeometry({ productId: e.target.value })}>
                  {Array.from(new Set(allowedProducts.map((p) => p.group))).map((g) => (
                    <optgroup key={g} label={g}>
                      {allowedProducts.filter((p) => p.group === g).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}{seller?.showPrices && seller.prices[p.id] ? ` — ${seller.prices[p.id]}` : ""}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="mt-1 text-xs text-neutral-500">{product.description}. Export: {px.width}×{px.height} px at {product.dpi} DPI.</p>
              </div>

              {!product.fixedOrientation && (
                <div>
                  <label className="label">Orientation</label>
                  <Segmented value={spec.orientation} options={[["portrait", "Portrait"], ["landscape", "Landscape"]]} onChange={(v) => patchGeometry({ orientation: v as DesignSpec["orientation"] })} />
                </div>
              )}

              <div>
                <label className="label">Map shape</label>
                <Segmented value={spec.shape} options={SHAPES.map((s) => [s, s[0].toUpperCase() + s.slice(1)])} onChange={(v) => patchGeometry({ shape: v as DesignSpec["shape"] })} />
              </div>

              {product.kind !== "case" && product.kind !== "mug" && (
                <div>
                  <label className="label">Layout</label>
                  <Segmented value={spec.layoutStyle} options={[["classic", "Classic (text below)"], ["full", "Full bleed (text over map)"]]} onChange={(v) => patchGeometry({ layoutStyle: v as DesignSpec["layoutStyle"] })} />
                </div>
              )}
            </div>
          )}

          {tab === "finish" && (mode === "consumer" ? <ExportPanel spec={spec} /> : <ApprovePanel spec={spec} seller={seller!} />)}
        </div>

        {mode === "whitelabel" && seller && (
          <div className="border-t border-neutral-200 px-4 py-2 text-[11px] text-neutral-500">
            {seller.name} · designer powered by mappy
          </div>
        )}
      </aside>
    </div>
  );
}

/* ---------- small controls ---------- */

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-neutral-900" : "bg-neutral-300"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? "left-4.5" : "left-0.5"}`} style={{ left: checked ? 18 : 2 }} />
    </button>
  );
}

function Field({ label, value, onChange, checked, onToggle, placeholder }: { label: string; value: string; onChange: (v: string) => void; checked: boolean; onToggle: (v: boolean) => void; placeholder?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="label mb-0">{label}</label>
        <Toggle checked={checked} onChange={onToggle} />
      </div>
      <input className="input mt-1" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} maxLength={120} />
    </div>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md bg-neutral-100 p-1">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)} className={`flex-1 rounded px-2 py-1.5 text-xs font-medium ${value === v ? "bg-white shadow-sm" : "text-neutral-600"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}

function ThemeCard({ theme, active, onClick }: { theme: Theme; active: boolean; onClick: () => void }) {
  const p = theme.palette;
  return (
    <button onClick={onClick} className={`overflow-hidden rounded-lg border text-left transition ${active ? "border-neutral-900 ring-2 ring-neutral-900/20" : "border-neutral-200 hover:border-neutral-400"}`}>
      <div className="relative h-16" style={{ background: p.bg }}>
        <svg viewBox="0 0 100 40" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <rect x="0" y="26" width="100" height="14" fill={p.water} />
          <rect x="62" y="4" width="22" height="14" fill={p.parks} />
          <path d="M0 20 L100 14" stroke={p.road1} strokeWidth="2.2" />
          <path d="M20 0 L28 40 M55 0 L50 40 M0 8 L100 10 M0 30 L100 24" stroke={p.road2} strokeWidth="1" />
          <path d="M10 0 L14 40 M38 0 L40 40 M70 0 L72 40 M85 0 L90 40 M0 3 L100 1 M0 15 L100 20" stroke={p.road3} strokeWidth="0.5" />
        </svg>
      </div>
      <div className="px-2 py-1.5">
        <div className="text-xs font-semibold">{theme.name}</div>
        <div className="text-[10px] text-neutral-500">{theme.description}</div>
      </div>
    </button>
  );
}
