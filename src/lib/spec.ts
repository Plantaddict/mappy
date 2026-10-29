import { z } from "zod";
import { DEFAULT_LAYERS } from "./themes";

/**
 * CSS pixels per millimetre in the "canonical" design space.
 * Map zoom in a spec is always relative to a map container of
 * (map box width in mm × CSS_PER_MM) CSS pixels, so the same spec
 * renders identically in the preview and in the print export.
 */
export const CSS_PER_MM = 2;

export const SHAPES = ["rect", "circle", "heart", "hexagon"] as const;
export type Shape = (typeof SHAPES)[number];

export const MARKERS = ["pin", "heart", "star", "house", "ring"] as const;
export type MarkerKind = (typeof MARKERS)[number];

export const DesignSpecSchema = z.object({
  v: z.literal(1),
  place: z.object({ name: z.string().max(120), country: z.string().max(120) }),
  center: z.tuple([z.number().min(-180).max(180), z.number().min(-85).max(85)]),
  zoom: z.number().min(3).max(18),
  bearing: z.number().min(-180).max(180),
  themeId: z.string().max(40),
  productId: z.string().max(40),
  orientation: z.enum(["portrait", "landscape"]),
  shape: z.enum(SHAPES),
  layoutStyle: z.enum(["classic", "full"]),
  layers: z.object({
    buildings: z.boolean(),
    rail: z.boolean(),
    parks: z.boolean(),
    water: z.boolean(),
    labels: z.boolean(),
  }),
  text: z.object({
    title: z.string().max(80),
    subtitle: z.string().max(120),
    tagline: z.string().max(160),
    showTitle: z.boolean(),
    showSubtitle: z.boolean(),
    showCoords: z.boolean(),
    showTagline: z.boolean(),
    uppercase: z.boolean(),
  }),
  font: z.enum(["classic", "modern", "elegant", "mono", "theme"]),
  marker: z.object({
    enabled: z.boolean(),
    kind: z.enum(MARKERS),
    lngLat: z.tuple([z.number(), z.number()]).nullable(),
  }),
  colors: z.object({
    bg: z.string().max(9).optional(),
    water: z.string().max(9).optional(),
    parks: z.string().max(9).optional(),
    road1: z.string().max(9).optional(),
    road2: z.string().max(9).optional(),
    road3: z.string().max(9).optional(),
    text: z.string().max(9).optional(),
  }),
});

export type DesignSpec = z.infer<typeof DesignSpecSchema>;

export const DEFAULT_SPEC: DesignSpec = {
  v: 1,
  place: { name: "Kraków", country: "Poland" },
  center: [19.9372, 50.0614],
  zoom: 12.3,
  bearing: 0,
  themeId: "minimal-light",
  productId: "a3",
  orientation: "portrait",
  shape: "rect",
  layoutStyle: "classic",
  layers: { ...DEFAULT_LAYERS },
  text: {
    title: "Kraków",
    subtitle: "Poland",
    tagline: "",
    showTitle: true,
    showSubtitle: true,
    showCoords: true,
    showTagline: false,
    uppercase: true,
  },
  font: "theme",
  marker: { enabled: false, kind: "heart", lngLat: null },
  colors: {},
};

export function formatCoords([lng, lat]: [number, number]) {
  const f = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(4)}° ${v >= 0 ? pos : neg}`;
  return `${f(lat, "N", "S")}  ·  ${f(lng, "E", "W")}`;
}

/** Compact share encoding for URLs. */
export function encodeSpec(spec: DesignSpec): string {
  const json = JSON.stringify(spec);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSpec(s: string): DesignSpec | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    const res = DesignSpecSchema.safeParse(parsed);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

/** Default zoom for a geocoder result type, in canonical zoom units. */
export function zoomForPlaceType(type: string | undefined): number {
  switch (type) {
    case "country":
      return 5.5;
    case "state":
    case "region":
      return 7.5;
    case "county":
      return 9.5;
    case "city":
      return 12.2;
    case "town":
    case "district":
    case "borough":
      return 13.2;
    case "village":
    case "suburb":
    case "neighbourhood":
    case "locality":
      return 14.2;
    case "street":
    case "house":
      return 15.6;
    default:
      return 12.5;
  }
}
