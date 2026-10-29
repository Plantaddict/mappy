"use client";

import { useState } from "react";

export default function ApiPanel({ apiKey, webhookUrl, baseUrl }: { apiKey: string; webhookUrl: string; baseUrl: string }) {
  const [key, setKey] = useState(apiKey);
  const [url, setUrl] = useState(webhookUrl);
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);

  async function saveWebhook() {
    const res = await fetch("/api/seller", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ webhookUrl: url }) });
    const d = await res.json().catch(() => ({}));
    setMsg(res.ok ? "Webhook saved." : d.error || "Could not save.");
  }

  async function rotate() {
    if (!confirm("Rotate the API key? Existing integrations will stop working until updated.")) return;
    const res = await fetch("/api/seller/rotate-key", { method: "POST" });
    const d = await res.json();
    if (res.ok) setKey(d.apiKey);
  }

  const masked = key.slice(0, 12) + "•".repeat(12);

  return (
    <div className="mt-6 space-y-6">
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Webhook</h2>
        <p className="text-sm text-neutral-600">We POST JSON to this URL every time a customer approves a design. Use it with Zapier/Make, your own server, or a Printify/Printful order script.</p>
        <div className="flex gap-2">
          <input className="input" placeholder="https://hooks.zapier.com/…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button className="btn-primary" onClick={saveWebhook}>Save</button>
        </div>
        {msg && <p className="text-xs text-neutral-600">{msg}</p>}
        <details className="text-xs text-neutral-600">
          <summary className="cursor-pointer font-medium">Payload example and signature</summary>
          <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-[11px] text-neutral-100">{`POST <your url>
x-mappy-event: design.approved
x-mappy-signature: hex(HMAC-SHA256(body, your API key))

{
  "event": "design.approved",
  "code": "MP-7K3Q9D",
  "product": "a3",
  "theme": "noir",
  "title": "KRAKÓW",
  "width": 3508, "height": 4961,
  "customer": { "name": "…", "email": "…", "note": "…" },
  "files": {
    "print": "${baseUrl}/api/designs/MP-7K3Q9D/file?token=…",   // signed, valid 30 days
    "preview": "${baseUrl}/api/designs/MP-7K3Q9D/preview"
  },
  "page": "${baseUrl}/d/MP-7K3Q9D",
  "spec": { … full design spec … }
}`}</pre>
        </details>
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">API key</h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-neutral-100 px-3 py-2 text-sm">{show ? key : masked}</code>
          <button className="btn-secondary" onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"}</button>
          <button className="btn-secondary" onClick={rotate}>Rotate</button>
        </div>
        <pre className="overflow-x-auto rounded bg-neutral-900 p-3 text-[11px] text-neutral-100">{`# list approved designs (newest first)
curl -H "Authorization: Bearer ${show ? key : "mk_live_…"}" ${baseUrl}/api/v1/designs?limit=50

# one design, with a signed print-file URL
curl -H "Authorization: Bearer ${show ? key : "mk_live_…"}" ${baseUrl}/api/v1/designs/MP-7K3Q9D

# download the print file directly with your key
curl -L -H "Authorization: Bearer ${show ? key : "mk_live_…"}" -o MP-7K3Q9D.png ${baseUrl}/api/designs/MP-7K3Q9D/file`}</pre>
        <p className="text-xs text-neutral-500">Rendering via API (POST a spec, get a file) is on the roadmap; rendering currently happens in the customer’s browser at approval time.</p>
      </section>

      <section className="card space-y-2 p-5 text-sm text-neutral-700">
        <h2 className="font-semibold">Etsy and Shopify without any integration</h2>
        <p>Add a required personalisation field to your listing: <em>“Paste your design code from {baseUrl}/s/your-shop”</em>. When the order arrives, search the code in your dashboard and download the file. That is the whole flow; no API approval needed.</p>
      </section>
    </div>
  );
}
