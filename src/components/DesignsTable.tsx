"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProduct } from "@/lib/products";
import { getTheme } from "@/lib/themes";

export type DesignRow = {
  code: string;
  title: string;
  productId: string;
  themeId: string;
  width: number;
  height: number;
  customerName: string;
  customerEmail: string;
  customerNote: string;
  webhookStatus: string;
  hasPreview: boolean;
  createdAt: string;
};

export default function DesignsTable({ designs }: { designs: DesignRow[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const rows = designs.filter((d) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [d.code, d.title, d.customerName, d.customerEmail].some((v) => v.toLowerCase().includes(s));
  });

  async function remove(code: string) {
    if (!confirm(`Delete design ${code}? The print file is removed too.`)) return;
    setBusy(code);
    await fetch(`/api/designs/${code}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="mt-6">
      <input className="input max-w-sm" placeholder="Find by code, title or customer…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-xs tracking-wide text-neutral-500 uppercase">
            <tr>
              <th className="p-3">Preview</th>
              <th className="p-3">Code</th>
              <th className="p-3">Design</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Delivery</th>
              <th className="p-3">Created</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.code} className="border-t border-neutral-100 align-top">
                <td className="p-3">
                  {d.hasPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/designs/${d.code}/preview`} alt="" className="h-20 w-auto rounded shadow" />
                  ) : (
                    <div className="h-20 w-14 rounded bg-neutral-100" />
                  )}
                </td>
                <td className="p-3 font-mono font-semibold whitespace-nowrap">{d.code}</td>
                <td className="p-3">
                  <div className="font-medium">{d.title || "Untitled"}</div>
                  <div className="text-xs text-neutral-500">{getProduct(d.productId).name} · {getTheme(d.themeId).name}</div>
                  <div className="text-xs text-neutral-500">{d.width}×{d.height} px</div>
                </td>
                <td className="p-3 text-xs">
                  <div>{d.customerName || <span className="text-neutral-400">—</span>}</div>
                  <div className="text-neutral-500">{d.customerEmail}</div>
                  {d.customerNote && <div className="mt-1 max-w-[220px] rounded bg-amber-50 p-1 text-amber-900">{d.customerNote}</div>}
                </td>
                <td className="p-3 text-xs">
                  {d.webhookStatus ? (
                    <span className={`rounded px-1.5 py-0.5 ${d.webhookStatus.startsWith("ok") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>webhook {d.webhookStatus}</span>
                  ) : (
                    <span className="text-neutral-400">dashboard</span>
                  )}
                </td>
                <td className="p-3 text-xs whitespace-nowrap text-neutral-500">{new Date(d.createdAt).toLocaleString()}</td>
                <td className="p-3 whitespace-nowrap">
                  <a className="btn-primary px-3 py-1.5 text-xs" href={`/api/designs/${d.code}/file`}>Download</a>
                  <a className="btn-ghost px-2 py-1.5 text-xs" href={`/d/${d.code}`} target="_blank" rel="noreferrer">Page</a>
                  <button className="btn-ghost px-2 py-1.5 text-xs text-red-700" disabled={busy === d.code} onClick={() => remove(d.code)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
