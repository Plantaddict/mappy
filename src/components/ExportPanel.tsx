"use client";

import { useState } from "react";
import { getProduct, layoutFor, pixelSize } from "@/lib/products";
import { encodeSpec, type DesignSpec } from "@/lib/spec";
import { canvasToBlob, canvasToPdfBlob, downloadBlob, posterFilename, queueRender, renderMockup, renderPoster } from "@/lib/render";

type Format = "png" | "jpeg" | "pdf";

export default function ExportPanel({ spec }: { spec: DesignSpec }) {
  const [format, setFormat] = useState<Format>("png");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const product = getProduct(spec.productId);
  const px = pixelSize(product, spec.orientation);
  const layout = layoutFor(product, spec.orientation, spec.shape, spec.layoutStyle);

  async function run(label: string, fn: () => Promise<void>) {
    setError("");
    setBusy(label);
    try {
      await queueRender(fn);
    } catch (e) {
      setError((e as Error).message || "Export failed. Try a smaller size.");
    } finally {
      setBusy(null);
    }
  }

  const download = () =>
    run(`Rendering ${px.width}×${px.height} px…`, async () => {
      const canvas = await renderPoster(spec);
      if (format === "pdf") downloadBlob(await canvasToPdfBlob(canvas, layout.W, layout.H), posterFilename(spec, "pdf"));
      else if (format === "jpeg") downloadBlob(await canvasToBlob(canvas, "image/jpeg", 0.95), posterFilename(spec, "jpg"));
      else downloadBlob(await canvasToBlob(canvas, "image/png"), posterFilename(spec, "png"));
    });

  const mockup = () =>
    run("Rendering mockup…", async () => {
      const poster = await renderPoster(spec, { maxSide: 2000 });
      downloadBlob(await canvasToBlob(renderMockup(poster), "image/jpeg", 0.92), posterFilename(spec, "mockup.jpg"));
    });

  const share = async () => {
    const url = `${window.location.origin}/studio#${encodeSpec(spec)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Format</label>
        <div className="flex gap-1 rounded-md bg-neutral-100 p-1">
          {(["png", "jpeg", "pdf"] as Format[]).map((f) => (
            <button key={f} onClick={() => setFormat(f)} className={`flex-1 rounded px-2 py-1.5 text-xs font-medium uppercase ${format === f ? "bg-white shadow-sm" : "text-neutral-600"}`}>
              {f}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          {product.name} · {px.width}×{px.height} px · {product.dpi} DPI. {format === "pdf" ? "PDF at exact physical size, ready for a print shop." : "Rendered in your browser; nothing is uploaded."}
        </p>
      </div>

      <button className="btn-primary w-full" disabled={!!busy} onClick={download}>
        {busy ?? `Download ${format.toUpperCase()}`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-secondary" disabled={!!busy} onClick={mockup}>Framed mockup</button>
        <button className="btn-secondary" onClick={share}>{copied ? "Link copied" : "Copy share link"}</button>
      </div>

      <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
        <p className="font-semibold text-neutral-800">Print tips</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>Matte paper 200 gsm or more. Ask for “no scaling / 100%”.</li>
          <li>Large exports (A2, 50×70) can take 20–40 s and need a desktop browser.</li>
          <li>The OpenStreetMap credit must stay on the print (it is part of the licence).</li>
        </ul>
      </div>

      <div className="rounded-lg border border-dashed border-neutral-300 p-3 text-xs text-neutral-600">
        <p className="font-semibold text-neutral-800">Sell posters like this?</p>
        <p className="mt-1">Get your own branded designer page, approved designs delivered as print files, and ready-made city packs.</p>
        <a href="/pricing" className="mt-2 inline-block font-semibold underline">See seller plans →</a>
      </div>
    </div>
  );
}
