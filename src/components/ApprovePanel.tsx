"use client";

import { useState } from "react";
import { getProduct, pixelSize } from "@/lib/products";
import type { DesignSpec } from "@/lib/spec";
import type { SellerPublic } from "@/lib/seller";
import { canvasToBlob, queueRender, renderPoster } from "@/lib/render";

export default function ApprovePanel({ spec, seller }: { spec: DesignSpec; seller: SellerPublic }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; page: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const product = getProduct(spec.productId);
  const px = pixelSize(product, spec.orientation);
  const price = seller.showPrices ? seller.prices[product.id] : undefined;

  async function approve() {
    setError("");
    setBusy("Preparing your print file…");
    try {
      await queueRender(async () => {
        const full = await renderPoster(spec);
        setBusy("Uploading…");
        const [file, preview] = await Promise.all([
          canvasToBlob(full, "image/png"),
          (async () => {
            const c = document.createElement("canvas");
            const s = 900 / Math.max(full.width, full.height);
            c.width = Math.round(full.width * s);
            c.height = Math.round(full.height * s);
            c.getContext("2d")!.drawImage(full, 0, 0, c.width, c.height);
            return canvasToBlob(c, "image/jpeg", 0.85);
          })(),
        ]);
        const fd = new FormData();
        fd.set("spec", JSON.stringify(spec));
        fd.set("seller", seller.slug);
        fd.set("file", file, "design.png");
        fd.set("preview", preview, "preview.jpg");
        fd.set("width", String(full.width));
        fd.set("height", String(full.height));
        fd.set("customerName", name);
        fd.set("customerEmail", email);
        fd.set("customerNote", note);
        const res = await fetch("/api/designs", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not save the design.");
        setResult({ code: data.code, page: data.page });
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Design approved</p>
          <p className="mt-1 text-xs text-emerald-800">Your design code:</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-md bg-white px-3 py-2 text-lg font-bold tracking-wider">{result.code}</code>
            <button
              className="btn-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(result.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* ignore */
                }
              }}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
          <li>Go back to the {seller.name} shop and add <strong>{product.name}</strong> to your cart.</li>
          <li>Paste the code <strong>{result.code}</strong> into the personalisation box at checkout.</li>
          <li>{seller.name} receives your print-ready file as soon as you order.</li>
        </ol>
        <a href={result.page} target="_blank" rel="noreferrer" className="btn-secondary w-full">View my design page</a>
        <button className="btn-ghost w-full" onClick={() => setResult(null)}>Make another</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-neutral-50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{product.name}</span>
          {price && <span className="font-semibold" style={{ color: seller.accentColor }}>{price}</span>}
        </div>
        <p className="mt-1 text-xs text-neutral-500">{px.width}×{px.height} px print file at {product.dpi} DPI, delivered to {seller.name}.</p>
      </div>

      <div>
        <label className="label">Your name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional, helps the seller match your order" />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
      </div>
      <div>
        <label className="label">Note to the seller</label>
        <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Gift wrap, frame colour…" />
      </div>

      <button className="btn-primary w-full" style={{ background: seller.primaryColor }} disabled={!!busy} onClick={approve}>
        {busy ?? "Approve design & get my code"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <p className="text-[11px] text-neutral-500">
        By approving you confirm the preview is what you want printed. The map credit “© OpenStreetMap contributors” stays on the print.
      </p>
    </div>
  );
}
