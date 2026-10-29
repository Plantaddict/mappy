import type { Seller } from "@prisma/client";
import { THEME_IDS } from "./themes";
import { PRODUCT_IDS } from "./products";
import { planFor } from "./plans";
import { prisma } from "./db";

/** The seller fields that the public designer page needs. */
export type SellerPublic = {
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  allowedThemes: string[];
  allowedProducts: string[];
  showPrices: boolean;
  prices: Record<string, string>;
};

function parseList(json: string, all: string[]) {
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) {
      const ok = arr.filter((x) => typeof x === "string" && all.includes(x));
      if (ok.length) return ok;
    }
  } catch {
    /* fall through */
  }
  return all;
}

export function toPublic(s: Seller): SellerPublic {
  let prices: Record<string, string> = {};
  try {
    const p = JSON.parse(s.prices);
    if (p && typeof p === "object") prices = p;
  } catch {
    /* ignore */
  }
  return {
    slug: s.slug,
    name: s.name,
    tagline: s.tagline,
    logoUrl: s.logoUrl,
    primaryColor: s.primaryColor,
    accentColor: s.accentColor,
    allowedThemes: parseList(s.allowedThemes, THEME_IDS),
    allowedProducts: parseList(s.allowedProducts, PRODUCT_IDS),
    showPrices: s.showPrices,
    prices,
  };
}

export async function approvalsThisMonth(sellerId: string) {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return prisma.design.count({ where: { sellerId, createdAt: { gte: start } } });
}

export async function quotaFor(seller: Seller) {
  const used = await approvalsThisMonth(seller.id);
  const plan = planFor(seller.plan);
  return { used, limit: plan.approvalsPerMonth, remaining: plan.approvalsPerMonth === null ? null : Math.max(0, plan.approvalsPerMonth - used) };
}

export const RESERVED_SLUGS = new Set(["api", "s", "d", "studio", "dashboard", "login", "signup", "pricing", "admin", "www", "app", "docs", "about"]);

export function validSlug(slug: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(slug) && !RESERVED_SLUGS.has(slug);
}
