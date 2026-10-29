import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getProduct } from "@/lib/products";
import { getTheme } from "@/lib/themes";
import { getCurrentSeller } from "@/lib/auth";

/** Public design page: preview + code. The print file is only for the seller. */
export default async function DesignPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const design = await prisma.design.findUnique({ where: { code }, include: { seller: true } });
  if (!design) notFound();
  const me = await getCurrentSeller();
  const isOwner = !!me && design.sellerId === me.id;
  const product = getProduct(design.productId);
  const theme = getTheme(design.themeId);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden bg-neutral-100 p-6">
          {design.previewPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/designs/${design.code}/preview`} alt={design.title} className="mx-auto max-h-[70vh] shadow-xl" />
          ) : (
            <p className="text-sm text-neutral-500">No preview.</p>
          )}
        </div>
        <aside className="space-y-4">
          <div>
            <p className="label">Design code</p>
            <code className="block rounded-md bg-neutral-900 px-3 py-2 text-lg font-bold tracking-wider text-white">{design.code}</code>
          </div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-neutral-500">Title</dt><dd className="font-medium">{design.title || "—"}</dd></div>
            <div><dt className="text-neutral-500">Product</dt><dd className="font-medium">{product.name}</dd></div>
            <div><dt className="text-neutral-500">Theme</dt><dd className="font-medium">{theme.name}</dd></div>
            <div><dt className="text-neutral-500">File</dt><dd className="font-medium">{design.width}×{design.height} px PNG</dd></div>
            <div><dt className="text-neutral-500">Created</dt><dd className="font-medium">{design.createdAt.toUTCString()}</dd></div>
            {design.seller && <div><dt className="text-neutral-500">Shop</dt><dd className="font-medium">{design.seller.name}</dd></div>}
          </dl>
          {design.seller && !isOwner && (
            <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
              Paste the code into the personalisation box when you order from {design.seller.name}. The shop receives the print file automatically.
            </p>
          )}
          {isOwner && (
            <a href={`/api/designs/${design.code}/file`} className="btn-primary w-full">Download print file</a>
          )}
          {design.seller && <Link href={`/s/${design.seller.slug}`} className="btn-secondary w-full">Design another</Link>}
        </aside>
      </div>
    </main>
  );
}
