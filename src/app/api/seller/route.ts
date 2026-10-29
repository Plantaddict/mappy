import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentSeller } from "@/lib/auth";
import { THEME_IDS } from "@/lib/themes";
import { PRODUCT_IDS } from "@/lib/products";
import { validSlug } from "@/lib/seller";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const Body = z.object({
  name: z.string().min(2).max(60).optional(),
  slug: z.string().min(3).max(32).optional(),
  tagline: z.string().max(160).optional(),
  logoUrl: z.string().max(500).optional(),
  primaryColor: color.optional(),
  accentColor: color.optional(),
  allowedThemes: z.array(z.enum(THEME_IDS as [string, ...string[]])).optional(),
  allowedProducts: z.array(z.enum(PRODUCT_IDS as [string, ...string[]])).optional(),
  showPrices: z.boolean().optional(),
  prices: z.record(z.string(), z.string().max(40)).optional(),
  webhookUrl: z.union([z.literal(""), z.string().url().max(500)]).optional(),
  customDomain: z.string().max(120).optional(),
  plan: z.enum(["starter", "pro", "business"]).optional(),
});

export async function PATCH(req: Request) {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid settings: " + parsed.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ") }, { status: 400 });
  const d = parsed.data;

  if (d.slug !== undefined) {
    d.slug = d.slug.toLowerCase();
    if (!validSlug(d.slug)) return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
    const taken = await prisma.seller.findUnique({ where: { slug: d.slug } });
    if (taken && taken.id !== seller.id) return NextResponse.json({ error: "Slug is taken." }, { status: 409 });
  }
  if (d.logoUrl && !/^(https?:\/\/|data:image\/)/.test(d.logoUrl)) return NextResponse.json({ error: "Logo must be an https URL." }, { status: 400 });

  const updated = await prisma.seller.update({
    where: { id: seller.id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.slug !== undefined && { slug: d.slug }),
      ...(d.tagline !== undefined && { tagline: d.tagline }),
      ...(d.logoUrl !== undefined && { logoUrl: d.logoUrl }),
      ...(d.primaryColor !== undefined && { primaryColor: d.primaryColor }),
      ...(d.accentColor !== undefined && { accentColor: d.accentColor }),
      ...(d.allowedThemes !== undefined && { allowedThemes: JSON.stringify(d.allowedThemes) }),
      ...(d.allowedProducts !== undefined && { allowedProducts: JSON.stringify(d.allowedProducts) }),
      ...(d.showPrices !== undefined && { showPrices: d.showPrices }),
      ...(d.prices !== undefined && { prices: JSON.stringify(d.prices) }),
      ...(d.webhookUrl !== undefined && { webhookUrl: d.webhookUrl }),
      ...(d.customDomain !== undefined && { customDomain: d.customDomain }),
      // Plan switching is self-service until billing is wired up (see README).
      ...(d.plan !== undefined && { plan: d.plan }),
    },
  });
  return NextResponse.json({ ok: true, slug: updated.slug });
}
