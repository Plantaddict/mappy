import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { quotaFor } from "@/lib/seller";
import { planFor } from "@/lib/plans";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const seller = await requireSeller();
  const quota = await quotaFor(seller);
  const plan = planFor(seller.plan);
  const links = [
    ["/dashboard", "Designs"],
    ["/dashboard/packs", "Map packs"],
    ["/dashboard/settings", "Brand & products"],
    ["/dashboard/api", "Webhooks & API"],
    ["/dashboard/plan", "Plan"],
  ];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-neutral-200 bg-white p-4 lg:border-r lg:border-b-0">
        <Link href="/" className="serif text-2xl font-semibold">mappy</Link>
        <div className="mt-4 rounded-lg bg-neutral-50 p-3 text-xs">
          <div className="font-semibold">{seller.name}</div>
          <a className="text-neutral-500 underline" href={`/s/${seller.slug}`} target="_blank" rel="noreferrer">/s/{seller.slug}</a>
          <div className="mt-2 text-neutral-600">
            {plan.name} · {quota.used}{quota.limit !== null ? ` / ${quota.limit}` : ""} approvals this month
          </div>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto lg:flex-col">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-neutral-700 hover:bg-neutral-100">{label}</Link>
          ))}
          <Link href="/studio" className="rounded-md px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100">Open studio</Link>
          <LogoutButton />
        </nav>
      </aside>
      <main className="p-6 lg:p-10">{children}</main>
    </div>
  );
}
