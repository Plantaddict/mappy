import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sellerForApiKey } from "@/lib/auth";
import { designPayload } from "@/lib/webhook";

/** GET /api/v1/designs?limit=50&before=<ISO date> — Bearer API key. */
export async function GET(req: Request) {
  const seller = await sellerForApiKey(req);
  if (!seller) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const before = searchParams.get("before");
  const designs = await prisma.design.findMany({
    where: { sellerId: seller.id, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return NextResponse.json({ designs: designs.map(designPayload) });
}
