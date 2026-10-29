"use client";

import { useState } from "react";
import { CITY_PACKS, type City } from "@/lib/cities";
import { THEMES } from "@/lib/themes";
import { PRODUCTS, getProduct } from "@/lib/products";
import { DEFAULT_SPEC, type DesignSpec } from "@/lib/spec";
import { canvasToBlob, downloadBlob, queueRender, renderMockup, renderPoster, slugify } from "@/lib/render";

type Progress = { done: number; total: number; current: string };

export default function PackBuilder() {
  const [packId, setPackId] = useState(CITY_PACKS[0].id);
  const [customList, setCustomList] = useState("");
  const [themeIds, setThemeIds] = useState<string[]>(["minimal-light"]);
  const [productId, setProductId] = useState("a3");
  const [shape, setShape] = useState<DesignSpec["shape"]>("rect");
  const [mockups, setMockups] = useState(true);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const [cancel, setCancel] = useState(false);

  const pack = CITY_PACKS.find((p) => p.id === packId)!;
  const cities: City[] = packId === "custom" ? parseCustom(customList) : pack.cities;
  const total = cities.length * themeIds.length;
  const product = getProduct(productId);

  async function build() {
    if (!total) return;
    setError("");
    setCancel(false);
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const csv: string[] = ["filename,title,subtitle,theme,product,width_px,height_px,tags,description"];
    let done = 0;
    try {
      for (const city of cities) {
        for (const themeId of themeIds) {
          if (cancel) throw new Error("Cancelled");
          const theme = THEMES.find((t) => t.id === themeId)!;
          setProgress({ done, total, current: `${city.name} · ${theme.name}` });
          const spec: DesignSpec = {
            ...DEFAULT_SPEC,
            themeId,
            productId,
            shape,
            place: { name: city.name, country: city.country },
            center: [city.lng, city.lat],
            zoom: city.zoom ?? 12.3,
            text: { ...DEFAULT_SPEC.text, title: city.name, subtitle: city.country },
          };
          const canvas = await queueRender(() => renderPoster(spec));
          const base = `${slugify(city.name)}-${themeId}-${productId}`;
          zip.file(`prints/${base}.png`, await canvasToBlob(canvas, "image/png"));
          if (mockups) zip.file(`mockups/${base}-mockup.jpg`, await canvasToBlob(renderMockup(canvas, { width: 1600 }), "image/jpeg", 0.9));
          const tags = ["map poster", `${city.name} map`, `${city.name} print`, `${city.country} wall art`, "city map", "minimalist map", theme.name.toLowerCase(), "housewarming gift", "travel gift", "street map art"].slice(0, 13);
          const desc = `${city.name}, ${city.country} as a ${theme.name} map poster. Every street, park and waterway drawn from OpenStreetMap data. Printed at ${product.dpi} DPI on ${product.name}. Map data © OpenStreetMap contributors.`;
          csv.push([`${base}.png`, city.name, city.country, theme.name, product.name, canvas.width, canvas.height, tags.join("|"), desc].map(csvCell).join(","));
          done++;
          setProgress({ done, total, current: `${city.name} · ${theme.name}` });
        }
      }
      zip.file("listings.csv", csv.join("\n"));
      zip.file("README.txt", `Mappy map pack\n\nPack: ${packId === "custom" ? "custom list" : pack.name}\nThemes: ${themeIds.join(", ")}\nProduct: ${product.name} (${product.dpi} DPI)\n\nprints/   print-ready PNG files\nmockups/  framed wall mockups for listings\nlistings.csv  titles, tags and descriptions per file\n\nMap data © OpenStreetMap contributors (ODbL). The attribution printed on each file must remain on the product.\n`);
      setProgress({ done, total, current: "Zipping…" });
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      downloadBlob(blob, `mappy-pack-${packId}-${productId}.zip`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="mt-6 grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <section className="card p-5">
          <label className="label">Cities</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {CITY_PACKS.map((p) => (
              <label key={p.id} className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${packId === p.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"}`}>
                <input type="radio" className="mr-2" checked={packId === p.id} onChange={() => setPackId(p.id)} />
                <span className="font-medium">{p.name}</span>
                <span className="block text-xs text-neutral-500">{p.description}</span>
              </label>
            ))}
            <label className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${packId === "custom" ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"}`}>
              <input type="radio" className="mr-2" checked={packId === "custom"} onChange={() => setPackId("custom")} />
              <span className="font-medium">Custom list</span>
              <span className="block text-xs text-neutral-500">name, country, lng, lat per line</span>
            </label>
          </div>
          {packId === "custom" && (
            <textarea className="input mt-3 font-mono text-xs" rows={6} value={customList} onChange={(e) => setCustomList(e.target.value)} placeholder={"Kraków, Poland, 19.9372, 50.0614\nPorto, Portugal, -8.6291, 41.1579, 13"} />
          )}
        </section>

        <section className="card p-5">
          <label className="label">Themes</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {THEMES.map((t) => (
              <label key={t.id} className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-2 text-xs ${themeIds.includes(t.id) ? "border-neutral-900 bg-neutral-50" : "border-neutral-200"}`}>
                <input type="checkbox" checked={themeIds.includes(t.id)} onChange={() => setThemeIds((l) => (l.includes(t.id) ? l.filter((x) => x !== t.id) : [...l, t.id]))} />
                <span className="h-4 w-4 rounded-full border" style={{ background: t.palette.bg, borderColor: t.palette.road1 }} />
                {t.name}
              </label>
            ))}
          </div>
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-3">
          <div>
            <label className="label">Product</label>
            <select className="input" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {PRODUCTS.filter((p) => p.kind === "poster" || p.kind === "square").map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Map shape</label>
            <select className="input" value={shape} onChange={(e) => setShape(e.target.value as DesignSpec["shape"])}>
              <option value="rect">Rectangle</option><option value="circle">Circle</option><option value="heart">Heart</option><option value="hexagon">Hexagon</option>
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={mockups} onChange={(e) => setMockups(e.target.checked)} />Include mockups</label>
        </section>
      </div>

      <aside className="card h-fit space-y-4 p-5">
        <div>
          <p className="text-sm text-neutral-600">You will get</p>
          <p className="text-3xl font-semibold">{total} <span className="text-base font-normal text-neutral-500">posters</span></p>
          <p className="text-xs text-neutral-500">{cities.length} places × {themeIds.length} themes · {product.name}</p>
        </div>
        {progress ? (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full bg-neutral-900 transition-all" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} /></div>
            <p className="mt-2 text-xs text-neutral-600">{progress.done}/{progress.total} · {progress.current}</p>
            <button className="btn-secondary mt-3 w-full" onClick={() => setCancel(true)}>Cancel</button>
          </div>
        ) : (
          <button className="btn-primary w-full" disabled={!total} onClick={build}>Generate pack</button>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="text-[11px] text-neutral-500">Roughly 5–15 s per A3 poster depending on your machine. A 24-city pack in one theme takes a few minutes.</p>
      </aside>
    </div>
  );
}

function parseCustom(text: string): City[] {
  return text
    .split("\n")
    .map((l) => l.split(",").map((s) => s.trim()))
    .filter((p) => p.length >= 4 && !isNaN(Number(p[2])) && !isNaN(Number(p[3])))
    .map((p) => ({ name: p[0], country: p[1], lng: Number(p[2]), lat: Number(p[3]), zoom: p[4] ? Number(p[4]) : undefined }));
}

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
