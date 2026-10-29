import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSeller } from "@/lib/auth";
import { newApiKey } from "@/lib/files";

export async function POST() {
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const apiKey = newApiKey();
  await prisma.seller.update({ where: { id: seller.id }, data: { apiKey } });
  return NextResponse.json({ ok: true, apiKey });
}
