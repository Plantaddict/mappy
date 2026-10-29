import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DesignSpecSchema } from "@/lib/spec";
import { newDesignCode, saveFile } from "@/lib/files";
import { quotaFor, toPublic } from "@/lib/seller";
import { deliverWebhook } from "@/lib/webhook";

const MAX_FILE = 60 * 1024 * 1024;

/**
 * Approve a design. Multipart form:
 *  - spec: JSON string (DesignSpec)
 *  - seller: seller slug (white-label page) — optional for consumer saves
 *  - file: print-ready PNG, preview: JPEG/PNG thumbnail
 *  - customerName / customerEmail / customerNote
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });

  let spec;
  try {
    spec = DesignSpecSchema.parse(JSON.parse(String(form.get("spec") ?? "")));
  } catch {
    return NextResponse.json({ error: "Invalid design." }, { status: 400 });
  }

  const slug = String(form.get("seller") ?? "").trim();
  const seller = slug ? await prisma.seller.findUnique({ where: { slug } }) : null;
  if (slug && !seller) return NextResponse.json({ error: "Unknown seller." }, { status: 404 });

  if (seller) {
    const pub = toPublic(seller);
    if (!pub.allowedThemes.includes(spec.themeId) || !pub.allowedProducts.includes(spec.productId)) {
      return NextResponse.json({ error: "This option is not offered by the seller." }, { status: 400 });
    }
    const q = await quotaFor(seller);
    if (q.remaining !== null && q.remaining <= 0) {
      return NextResponse.json({ error: "This shop has reached its monthly design limit. Please contact the seller." }, { status: 429 });
    }
  }

  const file = form.get("file");
  const preview = form.get("preview");
  const width = Number(form.get("width") ?? 0);
  const height = Number(form.get("height") ?? 0);
  if (!(file instanceof Blob) || file.size === 0 || file.size > MAX_FILE) {
    return NextResponse.json({ error: "Print file missing or too large." }, { status: 400 });
  }

  const code = newDesignCode();
  const dir = seller ? seller.id : "public";
  const filePath = await saveFile(`${dir}/${code}.png`, Buffer.from(await file.arrayBuffer()));
  const previewPath = preview instanceof Blob && preview.size > 0 ? await saveFile(`${dir}/${code}.preview.jpg`, Buffer.from(await preview.arrayBuffer())) : "";

  const design = await prisma.design.create({
    data: {
      code,
      sellerId: seller?.id ?? null,
      spec: JSON.stringify(spec),
      productId: spec.productId,
      themeId: spec.themeId,
      title: spec.text.title,
      width: Math.round(width),
      height: Math.round(height),
      filePath,
      previewPath,
      customerName: String(form.get("customerName") ?? "").slice(0, 120),
      customerEmail: String(form.get("customerEmail") ?? "").slice(0, 200),
      customerNote: String(form.get("customerNote") ?? "").slice(0, 1000),
    },
  });

  if (seller) void deliverWebhook(seller, design);

  return NextResponse.json({ ok: true, code, page: `/d/${code}` });
}
