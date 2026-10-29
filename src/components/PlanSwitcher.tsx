"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PLANS } from "@/lib/plans";

export default function PlanSwitcher({ current, plans }: { current: string; plans: typeof PLANS }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  async function choose(id: string) {
    setBusy(id);
    await fetch("/api/seller", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ plan: id }) });
    setBusy("");
    router.refresh();
  }
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {Object.entries(plans).map(([id, p]) => (
        <div key={id} className={`card p-5 ${current === id ? "ring-2 ring-neutral-900" : ""}`}>
          <div className="font-semibold">{p.name}</div>
          <div className="text-2xl font-semibold">${p.priceMonthly}<span className="text-sm font-normal text-neutral-500">/mo</span></div>
          <div className="text-xs text-neutral-500">{p.approvalsPerMonth === null ? "Unlimited approvals" : `${p.approvalsPerMonth} approvals / month`}</div>
          <button className={`mt-4 w-full ${current === id ? "btn-secondary" : "btn-primary"}`} disabled={current === id || !!busy} onClick={() => choose(id)}>
            {current === id ? "Current plan" : busy === id ? "…" : `Switch to ${p.name}`}
          </button>
        </div>
      ))}
    </div>
  );
}
