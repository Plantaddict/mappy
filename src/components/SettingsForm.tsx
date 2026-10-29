"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SellerPublic } from "@/lib/seller";
import { THEMES } from "@/lib/themes";
import { PRODUCTS } from "@/lib/products";

export default function SettingsForm({ initial }: { initial: SellerPublic }) {
  const router = useRouter();
  const [s, setS] = useState<SellerPublic>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/seller", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        logoUrl: s.logoUrl,
        primaryColor: s.primaryColor,
        accentColor: s.accentColor,
        allowedThemes: s.allowedThemes,
        allowedProducts: s.allowedProducts,
        showPrices: s.showPrices,
        prices: s.prices,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    setMsg(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: data.error || "Could not save." });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={save} className="mt-6 grid max-w-4xl gap-6 lg:grid-cols-2">
      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Brand</h2>
        <div><label className="label">Shop name</label><input className="input" value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} required /></div>
        <div>
          <label className="label">Page slug</label>
          <div className="flex items-center gap-1"><span className="text-sm text-neutral-500">/s/</span><input className="input" value={s.slug} onChange={(e) => setS({ ...s, slug: e.target.value.toLowerCase() })} required /></div>
        </div>
        <div><label className="label">Tagline</label><input className="input" value={s.tagline} onChange={(e) => setS({ ...s, tagline: e.target.value })} placeholder="Hand-finished map prints from Kraków" /></div>
        <div><label className="label">Logo URL</label><input className="input" value={s.logoUrl} onChange={(e) => setS({ ...s, logoUrl: e.target.value })} placeholder="https://…/logo.png" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Primary colour</label><div className="flex items-center gap-2"><input type="color" className="swatch" value={s.primaryColor} onChange={(e) => setS({ ...s, primaryColor: e.target.value })} /><code className="text-xs">{s.primaryColor}</code></div></div>
          <div><label className="label">Accent colour</label><div className="flex items-center gap-2"><input type="color" className="swatch" value={s.accentColor} onChange={(e) => setS({ ...s, accentColor: e.target.value })} /><code className="text-xs">{s.accentColor}</code></div></div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Themes offered</h2>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => (
            <label key={t.id} className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm">
              <input type="checkbox" checked={s.allowedThemes.includes(t.id)} onChange={() => setS({ ...s, allowedThemes: toggle(s.allowedThemes, t.id) })} />
              <span className="h-4 w-4 rounded-full border" style={{ background: t.palette.bg, borderColor: t.palette.road1 }} />
              {t.name}
            </label>
          ))}
        </div>
        <p className="text-xs text-neutral-500">Untick everything to offer all themes.</p>
      </section>

      <section className="card space-y-4 p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Products offered &amp; prices</h2>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.showPrices} onChange={(e) => setS({ ...s, showPrices: e.target.checked })} />Show prices on my page</label>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm">
              <input type="checkbox" checked={s.allowedProducts.includes(p.id)} onChange={() => setS({ ...s, allowedProducts: toggle(s.allowedProducts, p.id) })} />
              <span className="flex-1">{p.name}<span className="block text-xs text-neutral-500">{p.description}</span></span>
              <input className="input w-28" placeholder="€39" value={s.prices[p.id] ?? ""} onChange={(e) => setS({ ...s, prices: { ...s.prices, [p.id]: e.target.value } })} />
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-500">Prices are informational: customers pay in your own shop. Untick everything to offer all products.</p>
      </section>

      <div className="flex items-center gap-3 lg:col-span-2">
        <button className="btn-primary" disabled={saving}>{saving ? "Saving…" : "Save settings"}</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</span>}
        <a className="btn-secondary ml-auto" href={`/s/${s.slug}`} target="_blank" rel="noreferrer">Preview my page ↗</a>
      </div>
    </form>
  );
}
