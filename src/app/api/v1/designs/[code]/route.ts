import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sellerForApiKey } from "@/lib/auth";
import { designPayload } from "@/lib/webhook";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const seller = await sellerForApiKey(req);
  if (!seller) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  const { code } = await params;
  const design = await prisma.design.findUnique({ where: { code } });
  if (!design || design.sellerId !== seller.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(designPayload(design));
}
