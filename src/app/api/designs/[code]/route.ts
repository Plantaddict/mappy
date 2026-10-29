import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentSeller } from "@/lib/auth";
import { deleteFile } from "@/lib/files";

export async function DELETE(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const seller = await getCurrentSeller();
  if (!seller) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const design = await prisma.design.findUnique({ where: { code } });
  if (!design || design.sellerId !== seller.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await Promise.all([deleteFile(design.filePath), design.previewPath ? deleteFile(design.previewPath) : null]);
  await prisma.design.delete({ where: { id: design.id } });
  return NextResponse.json({ ok: true });
}
