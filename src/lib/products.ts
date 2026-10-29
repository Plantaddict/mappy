export type LayoutKind = "poster" | "square" | "case" | "mug" | "social";

export type Product = {
  id: string;
  name: string;
  group: "Posters (A)" | "Posters (cm)" | "Posters (in)" | "Square" | "Social" | "Phone case" | "Mug";
  widthMm: number; // portrait orientation
  heightMm: number;
  dpi: number;
  kind: LayoutKind;
  fixedOrientation?: "portrait" | "landscape";
  description: string;
};

export const PRODUCTS: Product[] = [
  { id: "a4", name: "A4 · 21×29.7 cm", group: "Posters (A)", widthMm: 210, heightMm: 297, dpi: 300, kind: "poster", description: "Desk or shelf size" },
  { id: "a3", name: "A3 · 29.7×42 cm", group: "Posters (A)", widthMm: 297, heightMm: 420, dpi: 300, kind: "poster", description: "The classic gift size" },
  { id: "a2", name: "A2 · 42×59.4 cm", group: "Posters (A)", widthMm: 420, heightMm: 594, dpi: 300, kind: "poster", description: "Statement wall piece" },
  { id: "30x40", name: "30×40 cm", group: "Posters (cm)", widthMm: 300, heightMm: 400, dpi: 300, kind: "poster", description: "Fits IKEA frames" },
  { id: "50x70", name: "50×70 cm", group: "Posters (cm)", widthMm: 500, heightMm: 700, dpi: 240, kind: "poster", description: "Large format" },
  { id: "8x10", name: "8×10 in", group: "Posters (in)", widthMm: 203.2, heightMm: 254, dpi: 300, kind: "poster", description: "US small frame" },
  { id: "12x16", name: "12×16 in", group: "Posters (in)", widthMm: 304.8, heightMm: 406.4, dpi: 300, kind: "poster", description: "US medium" },
  { id: "18x24", name: "18×24 in", group: "Posters (in)", widthMm: 457.2, heightMm: 609.6, dpi: 250, kind: "poster", description: "US large; Printful/Printify standard" },
  { id: "sq30", name: "Square 30×30 cm", group: "Square", widthMm: 300, heightMm: 300, dpi: 300, kind: "square", fixedOrientation: "portrait", description: "Circle and heart shapes shine here" },
  { id: "social", name: "Social 1080×1350", group: "Social", widthMm: 91.44, heightMm: 114.3, dpi: 300, kind: "social", fixedOrientation: "portrait", description: "Instagram portrait, for sharing" },
  { id: "phone", name: "Phone case", group: "Phone case", widthMm: 75, heightMm: 155, dpi: 300, kind: "case", fixedOrientation: "portrait", description: "Full-bleed map with a small caption" },
  { id: "mug", name: "Mug wrap 20×9 cm", group: "Mug", widthMm: 200, heightMm: 90, dpi: 300, kind: "mug", fixedOrientation: "landscape", description: "Map on the left, text on the right" },
];

export const PRODUCT_IDS = PRODUCTS.map((p) => p.id);

export function getProduct(id: string): Product {
  return PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[1];
}

export type Orientation = "portrait" | "landscape";

export type Box = { x: number; y: number; w: number; h: number };

export type Layout = {
  W: number; // mm
  H: number; // mm
  map: Box; // mm
  text: Box | null; // mm; null = text overlaid on the map (full-bleed layouts)
  overlay: boolean; // text drawn over the map with a gradient
  margin: number;
  titleMm: number; // base title size in mm
  subtitleMm: number;
  coordsMm: number;
  attributionMm: number;
  textAlign: "center" | "left";
};

/** Where things go on the page, in millimetres. Shapes other than rect get a square map box. */
export function layoutFor(product: Product, orientation: Orientation, shape: string, layoutStyle: "classic" | "full"): Layout {
  const o = product.fixedOrientation ?? orientation;
  const W = o === "portrait" ? product.widthMm : product.heightMm;
  const H = o === "portrait" ? product.heightMm : product.widthMm;
  const unit = Math.min(W, H);
  const margin = unit * 0.07;
  const titleMm = unit * 0.075;
  const subtitleMm = unit * 0.026;
  const coordsMm = unit * 0.02;
  const attributionMm = Math.max(1.6, unit * 0.009);

  const square = (box: Box): Box => {
    const s = Math.min(box.w, box.h);
    return { x: box.x + (box.w - s) / 2, y: box.y + (box.h - s) / 2, w: s, h: s };
  };

  if (product.kind === "mug") {
    const inner = { x: margin, y: margin, w: W - 2 * margin, h: H - 2 * margin };
    const map: Box = { x: inner.x, y: inner.y, w: inner.h, h: inner.h };
    const text: Box = { x: map.x + map.w + margin, y: inner.y, w: inner.w - map.w - margin, h: inner.h };
    return { W, H, map: shape === "rect" ? map : square(map), text, overlay: false, margin, titleMm: unit * 0.14, subtitleMm: unit * 0.05, coordsMm: unit * 0.04, attributionMm, textAlign: "left" };
  }

  if (product.kind === "case" || layoutStyle === "full") {
    const map: Box = { x: 0, y: 0, w: W, h: H };
    return {
      W, H, map: shape === "rect" ? map : square({ x: margin, y: margin, w: W - 2 * margin, h: H - 2 * margin }),
      text: null, overlay: true, margin, titleMm: titleMm * 0.9, subtitleMm, coordsMm, attributionMm, textAlign: "center",
    };
  }

  // classic poster / square / social: map on top, text block below
  const mapShare = product.kind === "square" ? 0.68 : o === "portrait" ? 0.72 : 0.66;
  const mapBox: Box = { x: margin, y: margin, w: W - 2 * margin, h: H * mapShare - margin };
  const map = shape === "rect" ? mapBox : square(mapBox);
  const textTop = mapBox.y + mapBox.h + margin * 0.6;
  const text: Box = { x: margin, y: textTop, w: W - 2 * margin, h: H - margin - textTop };
  return { W, H, map, text, overlay: false, margin, titleMm, subtitleMm, coordsMm, attributionMm, textAlign: "center" };
}

/** Pixel dimensions of the export for a product. */
export function pixelSize(product: Product, orientation: Orientation) {
  const o = product.fixedOrientation ?? orientation;
  const W = o === "portrait" ? product.widthMm : product.heightMm;
  const H = o === "portrait" ? product.heightMm : product.widthMm;
  const pxPerMm = product.dpi / 25.4;
  return { width: Math.round(W * pxPerMm), height: Math.round(H * pxPerMm), pxPerMm };
}
