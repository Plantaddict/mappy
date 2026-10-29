import crypto from "crypto";
import type { Design, Seller } from "@prisma/client";
import { prisma } from "./db";
import { appUrl, signedFileUrl } from "./files";

export function designPayload(design: Design) {
  return {
    event: "design.approved",
    code: design.code,
    createdAt: design.createdAt.toISOString(),
    product: design.productId,
    theme: design.themeId,
    title: design.title,
    width: design.width,
    height: design.height,
    customer: { name: design.customerName, email: design.customerEmail, note: design.customerNote },
    files: {
      print: design.filePath ? signedFileUrl(design.code) : null,
      preview: `${appUrl()}/api/designs/${design.code}/preview`,
    },
    page: `${appUrl()}/d/${design.code}`,
    spec: JSON.parse(design.spec),
  };
}

/** Fire-and-forget delivery to the seller's webhook; records the result on the design. */
export async function deliverWebhook(seller: Seller, design: Design) {
  if (!seller.webhookUrl) return;
  const body = JSON.stringify(designPayload(design));
  const sig = crypto.createHmac("sha256", seller.apiKey).update(body).digest("hex");
  let status = "";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(seller.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-mappy-signature": sig, "x-mappy-event": "design.approved" },
      body,
      signal: ctrl.signal,
    });
    clearTimeout(t);
    status = res.ok ? `ok ${res.status}` : `failed ${res.status}`;
  } catch (e) {
    status = `error ${(e as Error).message}`.slice(0, 120);
  }
  await prisma.design.update({ where: { id: design.id }, data: { webhookStatus: status } }).catch(() => {});
}
