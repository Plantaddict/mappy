import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/auth";
import DesignsTable from "@/components/DesignsTable";

export default async function DesignsPage() {
  const seller = await requireSeller();
  const designs = await prisma.design.findMany({ where: { sellerId: seller.id }, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-3xl font-semibold">Approved designs</h1>
          <p className="mt-1 text-sm text-neutral-600">Each row is a customer-approved design with its code. Match the code from your order’s personalisation field, download the file, print.</p>
        </div>
        <a href={`/s/${seller.slug}`} target="_blank" rel="noreferrer" className="btn-secondary">Open my designer page ↗</a>
      </div>
      {designs.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <p className="serif text-2xl">No designs yet</p>
          <p className="mt-2 text-sm text-neutral-600">
            Share <code className="rounded bg-neutral-100 px-1">/s/{seller.slug}</code> with customers, or try it yourself: design, approve, and the result appears here.
          </p>
        </div>
      ) : (
        <DesignsTable
          designs={designs.map((d) => ({
            code: d.code,
            title: d.title,
            productId: d.productId,
            themeId: d.themeId,
            width: d.width,
            height: d.height,
            customerName: d.customerName,
            customerEmail: d.customerEmail,
            customerNote: d.customerNote,
            webhookStatus: d.webhookStatus,
            hasPreview: !!d.previewPath,
            createdAt: d.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  );
}
