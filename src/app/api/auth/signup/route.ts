import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";
import { newApiKey } from "@/lib/files";
import { validSlug } from "@/lib/seller";

const Body = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  shopName: z.string().min(2).max(60),
  slug: z.string().min(3).max(32),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your details: valid email, password of 8+ characters, shop name and a URL slug." }, { status: 400 });
  const { email, password, shopName } = parsed.data;
  const slug = parsed.data.slug.toLowerCase();
  if (!validSlug(slug)) return NextResponse.json({ error: "Slug must be 3–32 lowercase letters, digits or dashes." }, { status: 400 });

  const [emailTaken, slugTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email: email.toLowerCase() } }),
    prisma.seller.findUnique({ where: { slug } }),
  ]);
  if (emailTaken) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  if (slugTaken) return NextResponse.json({ error: "That slug is taken. Try another." }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      seller: { create: { slug, name: shopName, apiKey: newApiKey() } },
    },
  });
  await createSession(user.id);
  return NextResponse.json({ ok: true, slug });
}
