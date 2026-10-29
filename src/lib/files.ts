import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export function filesDir() {
  const d = process.env.FILES_DIR || "./data/files";
  return path.isAbsolute(d) ? d : path.join(process.cwd(), d);
}

export async function saveFile(relPath: string, data: Buffer) {
  const abs = path.join(filesDir(), relPath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, data);
  return relPath;
}

export async function readFile(relPath: string) {
  const abs = path.join(filesDir(), relPath);
  if (!abs.startsWith(filesDir())) throw new Error("bad path");
  return fs.readFile(abs);
}

export async function deleteFile(relPath: string) {
  try {
    await fs.unlink(path.join(filesDir(), relPath));
  } catch {
    /* ignore */
  }
}

/** Short, unambiguous design code like MP-7K3Q9D. */
export function newDesignCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[bytes[i] % alphabet.length];
  return `MP-${s}`;
}

export function newApiKey() {
  return "mk_live_" + crypto.randomBytes(24).toString("base64url");
}

/** Signed, expiring token for public download links (used in webhooks / API). */
export function signDownload(code: string, expiresAt: number) {
  const h = crypto.createHmac("sha256", process.env.AUTH_SECRET || "dev").update(`${code}.${expiresAt}`).digest("base64url");
  return `${expiresAt}.${h}`;
}

export function verifyDownload(code: string, token: string | null) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  const expiresAt = Number(exp);
  if (!expiresAt || Date.now() > expiresAt) return false;
  const expected = signDownload(code, expiresAt).split(".")[1];
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function signedFileUrl(code: string, days = 30) {
  const exp = Date.now() + days * 86400000;
  return `${appUrl()}/api/designs/${code}/file?token=${signDownload(code, exp)}`;
}
