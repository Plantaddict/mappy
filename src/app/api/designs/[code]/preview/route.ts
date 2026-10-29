import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readFile } from "@/lib/files";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const design = await prisma.design.findUnique({ where: { code }, select: { previewPath: true } });
  if (!design?.previewPath) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = await readFile(design.previewPath);
  return new NextResponse(new Uint8Array(data), { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400" } });
}
