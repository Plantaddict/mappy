import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSeller, sellerForApiKey } from "@/lib/auth";
import { readFile, verifyDownload } from "@/lib/files";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const design = await prisma.design.findUnique({ where: { code } });
  if (!design || !design.filePath) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = new URL(req.url).searchParams.get("token");
  let allowed = verifyDownload(code, token);
  if (!allowed) {
    const seller = (await getCurrentSeller()) ?? (await sellerForApiKey(req));
    allowed = !!seller && (design.sellerId === seller.id || design.sellerId === null);
  }
  if (!allowed) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const data = await readFile(design.filePath);
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="${code}-${design.productId}.png"`,
      "cache-control": "private, max-age=0",
    },
  });
}
