import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { toPublic } from "@/lib/seller";
import Designer from "@/components/Designer";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seller = await prisma.seller.findUnique({ where: { slug } });
  return { title: seller ? `${seller.name} — design your map` : "Not found" };
}

/** White-label designer page: the seller's brand, their themes/products, approval instead of download. */
export default async function SellerPage({ params }: Props) {
  const { slug } = await params;
  const seller = await prisma.seller.findUnique({ where: { slug } });
  if (!seller) notFound();
  const pub = toPublic(seller);

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur" style={{ borderColor: `${pub.primaryColor}22` }}>
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-3 px-4">
          {pub.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pub.logoUrl} alt="" className="h-8 w-auto" />
          ) : (
            <span className="h-8 w-8 rounded-full" style={{ background: pub.primaryColor }} />
          )}
          <div>
            <div className="text-sm font-bold" style={{ color: pub.primaryColor }}>{pub.name}</div>
            {pub.tagline && <div className="text-[11px] text-neutral-500">{pub.tagline}</div>}
          </div>
          <div className="ml-auto text-xs text-neutral-500">Design → Approve → paste your code at checkout</div>
        </div>
      </header>
      <Designer mode="whitelabel" seller={pub} />
    </>
  );
}
