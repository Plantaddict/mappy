import { requireSeller } from "@/lib/auth";
import { quotaFor } from "@/lib/seller";
import { PLANS } from "@/lib/plans";
import PlanSwitcher from "@/components/PlanSwitcher";

export default async function PlanPage() {
  const seller = await requireSeller();
  const q = await quotaFor(seller);
  return (
    <div className="max-w-3xl">
      <h1 className="serif text-3xl font-semibold">Plan &amp; usage</h1>
      <div className="card mt-6 p-5">
        <p className="text-sm text-neutral-600">This month</p>
        <p className="mt-1 text-3xl font-semibold">{q.used}{q.limit !== null && <span className="text-base font-normal text-neutral-500"> / {q.limit} approvals</span>}</p>
        {q.limit !== null && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full bg-neutral-900" style={{ width: `${Math.min(100, (q.used / q.limit) * 100)}%` }} />
          </div>
        )}
      </div>
      <PlanSwitcher current={seller.plan} plans={PLANS} />
      <p className="mt-4 text-xs text-neutral-500">Billing is not connected in this build: plan changes apply immediately without payment. Wire Stripe Checkout to <code>PATCH /api/seller</code> before launch.</p>
    </div>
  );
}
