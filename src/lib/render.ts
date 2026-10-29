"use client";

import type { Map as MLMap } from "maplibre-gl";
import { buildStyle, getTheme, FONT_PAIRS, type Palette } from "./themes";
import { getProduct, layoutFor, pixelSize, type Box, type Layout } from "./products";
import { CSS_PER_MM, formatCoords, type DesignSpec, type MarkerKind, type Shape } from "./spec";

export const ATTRIBUTION = "© OpenStreetMap contributors";

/* ---------- shapes ---------- */

const HEART = "M0.5,0.95 C0.5,0.95 0.03,0.65 0.03,0.33 C0.03,0.15 0.17,0.05 0.3,0.05 C0.4,0.05 0.47,0.1 0.5,0.18 C0.53,0.1 0.6,0.05 0.7,0.05 C0.83,0.05 0.97,0.15 0.97,0.33 C0.97,0.65 0.5,0.95 0.5,0.95 Z";
const HEXAGON = "M0.5,0 L0.933,0.25 L0.933,0.75 L0.5,1 L0.067,0.75 L0.067,0.25 Z";

/** Normalised (0..1) SVG path for a shape, used both for CSS clip-path and canvas clipping. */
export function shapeSvgPath(shape: Shape): string | null {
  if (shape === "heart") return HEART;
  if (shape === "hexagon") return HEXAGON;
  return null;
}

export function shapePath2D(shape: Shape, box: Box): Path2D {
  const p = new Path2D();
  if (shape === "circle") {
    p.arc(box.x + box.w / 2, box.y + box.h / 2, Math.min(box.w, box.h) / 2, 0, Math.PI * 2);
    return p;
  }
  const svg = shapeSvgPath(shape);
  if (svg) {
    const m = new DOMMatrix().translate(box.x, box.y).scale(box.w, box.h);
    p.addPath(new Path2D(svg), m);
    return p;
  }
  p.rect(box.x, box.y, box.w, box.h);
  return p;
}

/* ---------- fonts ---------- */

export function fontsFor(spec: DesignSpec) {
  const theme = getTheme(spec.themeId);
  const pairId = spec.font === "theme" ? theme.font : spec.font;
  return FONT_PAIRS[pairId];
}

export async function ensureFonts(spec: DesignSpec) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const f = fontsFor(spec);
  const loads = [
    document.fonts.load(`${f.titleWeight} 40px "${f.title}"`),
    document.fonts.load(`400 40px "${f.body}"`),
    document.fonts.load(`600 40px "${f.body}"`),
  ];
  try {
    await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 3000))]);
  } catch {
    /* fall back to system fonts */
  }
}

export function paletteFor(spec: DesignSpec): Palette {
  const theme = getTheme(spec.themeId);
  const o = Object.fromEntries(Object.entries(spec.colors).filter(([, v]) => !!v));
  return { ...theme.palette, ...o } as Palette;
}

/* ---------- offscreen map ---------- */

export type MapRender = {
  canvas: HTMLCanvasElement;
  project: (lngLat: [number, number]) => { x: number; y: number }; // in canvas px
};

/**
 * Renders the map area of a spec at an exact pixel size using a temporary
 * MapLibre instance. The CSS size is the canonical size (map mm × CSS_PER_MM),
 * and pixelRatio scales it to the requested pixels, so output matches the preview.
 */
export async function renderMapImage(spec: DesignSpec, mapBoxMm: Box, targetW: number, targetH: number): Promise<MapRender> {
  const maplibregl = (await import("maplibre-gl")).default;
  const cssW = Math.max(50, Math.round(mapBoxMm.w * CSS_PER_MM));
  const cssH = Math.max(50, Math.round(mapBoxMm.h * CSS_PER_MM));
  const pixelRatio = targetW / cssW;

  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-20000px;top:0;width:${cssW}px;height:${cssH}px;visibility:hidden;pointer-events:none;`;
  document.body.appendChild(holder);

  const theme = getTheme(spec.themeId);
  const style = buildStyle(theme, spec.layers, 1, spec.colors);

  const map: MLMap = new maplibregl.Map({
    container: holder,
    style,
    center: spec.center,
    zoom: spec.zoom,
    bearing: spec.bearing,
    pixelRatio,
    interactive: false,
    attributionControl: false,
    fadeDuration: 0,
    canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
    maxCanvasSize: [16384, 16384],
    renderWorldCopies: false,
  });

  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    map.once("idle", finish);
    map.on("error", () => {
      /* missing tiles should not block the export */
    });
    setTimeout(finish, 60000);
  });

  // Some drivers finish 'idle' a frame before the last draw; force one more frame.
  map.triggerRepaint();
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  const src = map.getCanvas();
  const out = document.createElement("canvas");
  out.width = targetW;
  out.height = targetH;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, targetW, targetH);

  const scaleX = targetW / cssW;
  const scaleY = targetH / cssH;
  const project = (lngLat: [number, number]) => {
    const p = map.project(lngLat);
    return { x: p.x * scaleX, y: p.y * scaleY };
  };

  // Keep `project` usable until the caller is done, then dispose.
  const result: MapRender = { canvas: out, project };
  queueMicrotask(() => {
    /* dispose on next macrotask so the caller can project markers synchronously */
    setTimeout(() => {
      try {
        map.remove();
      } catch {
        /* ignore */
      }
      holder.remove();
    }, 0);
  });
  return result;
}

/* ---------- text ---------- */

function drawSpaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacingPx: number, align: "center" | "left") {
  const chars = Array.from(text);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacingPx * Math.max(0, chars.length - 1);
  let cx = align === "center" ? x - total / 2 : x;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacingPx;
  });
  return total;
}

function measureSpaced(ctx: CanvasRenderingContext2D, text: string, spacingPx: number) {
  const chars = Array.from(text);
  return chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + spacingPx * Math.max(0, chars.length - 1);
}

/** Shrinks font size until the spaced text fits `maxWidth`. Returns the final px size. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, family: string, weight: number, sizePx: number, spacingEm: number, maxWidth: number, minPx: number) {
  let size = sizePx;
  for (let i = 0; i < 40; i++) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (measureSpaced(ctx, text, size * spacingEm) <= maxWidth || size <= minPx) break;
    size *= 0.94;
  }
  return size;
}

type TextLine = { text: string; family: string; weight: number; size: number; spacing: number; gapAfter: number; italic?: boolean; opacity?: number };

function textLines(ctx: CanvasRenderingContext2D, spec: DesignSpec, layout: Layout, pxPerMm: number, maxWidth: number): TextLine[] {
  const f = fontsFor(spec);
  const titleFam = `"${f.title}", Georgia, serif`;
  const bodyFam = `"${f.body}", Helvetica, Arial, sans-serif`;
  const t = spec.text;
  const up = (s: string) => (t.uppercase ? s.toUpperCase() : s);
  const lines: TextLine[] = [];
  if (t.showTitle && t.title.trim()) {
    const txt = up(t.title.trim());
    const size = fitFont(ctx, txt, titleFam, f.titleWeight, layout.titleMm * pxPerMm, 0.14, maxWidth, layout.titleMm * pxPerMm * 0.35);
    lines.push({ text: txt, family: titleFam, weight: f.titleWeight, size, spacing: 0.14, gapAfter: size * 0.35 });
  }
  if (t.showSubtitle && t.subtitle.trim()) {
    const txt = up(t.subtitle.trim());
    const size = fitFont(ctx, txt, bodyFam, 500, layout.subtitleMm * pxPerMm, 0.36, maxWidth, layout.subtitleMm * pxPerMm * 0.5);
    lines.push({ text: txt, family: bodyFam, weight: 500, size, spacing: 0.36, gapAfter: size * 0.9 });
  }
  if (t.showCoords) {
    const txt = formatCoords(spec.center);
    const size = fitFont(ctx, txt, bodyFam, 400, layout.coordsMm * pxPerMm, 0.12, maxWidth, layout.coordsMm * pxPerMm * 0.5);
    lines.push({ text: txt, family: bodyFam, weight: 400, size, spacing: 0.12, gapAfter: size * 0.9, opacity: 0.8 });
  }
  if (t.showTagline && t.tagline.trim()) {
    const txt = t.tagline.trim();
    const size = fitFont(ctx, txt, titleFam, 400, layout.subtitleMm * pxPerMm * 1.1, 0.02, maxWidth, layout.subtitleMm * pxPerMm * 0.5);
    lines.push({ text: txt, family: titleFam, weight: 400, size, spacing: 0.02, gapAfter: 0, italic: true, opacity: 0.9 });
  }
  if (lines.length) lines[lines.length - 1].gapAfter = 0;
  return lines;
}

/** Text lines with fitted pixel sizes, for the HTML preview (same algorithm as the export). */
export function measureTextLines(spec: DesignSpec, layout: Layout, pxPerMm: number, maxWidthPx: number) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d")!;
  return textLines(ctx, spec, layout, pxPerMm, maxWidthPx);
}

/** Serialises renders so we never hold many WebGL contexts at once. */
let chain: Promise<unknown> = Promise.resolve();
export function queueRender<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.catch(() => {});
  return next;
}

function drawTextBlock(ctx: CanvasRenderingContext2D, spec: DesignSpec, layout: Layout, pxPerMm: number, box: Box, color: string) {
  const lines = textLines(ctx, spec, layout, pxPerMm, box.w);
  if (!lines.length) return;
  const total = lines.reduce((a, l) => a + l.size + l.gapAfter, 0);
  const align = layout.textAlign;
  // classic: start near the top of the block; overlay/mug: centre vertically
  let y = layout.overlay || layout.textAlign === "left" ? box.y + (box.h - total) / 2 : box.y + Math.max(0, Math.min((box.h - total) / 2, box.h * 0.12));
  const x = align === "center" ? box.x + box.w / 2 : box.x;
  ctx.textBaseline = "alphabetic";
  for (const l of lines) {
    ctx.font = `${l.italic ? "italic " : ""}${l.weight} ${l.size}px ${l.family}`;
    ctx.globalAlpha = l.opacity ?? 1;
    ctx.fillStyle = color;
    drawSpaced(ctx, l.text, x, y + l.size * 0.8, l.size * l.spacing, align);
    ctx.globalAlpha = 1;
    y += l.size + l.gapAfter;
  }
}

/* ---------- marker ---------- */

export function drawMarker(ctx: CanvasRenderingContext2D, kind: MarkerKind, x: number, y: number, size: number, fill: string, stroke: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = Math.max(1, size * 0.08);
  ctx.strokeStyle = stroke;
  ctx.fillStyle = fill;
  ctx.lineJoin = "round";
  const p = new Path2D();
  const s = size;
  switch (kind) {
    case "pin": {
      // teardrop with the tip at (0,0)
      p.moveTo(0, 0);
      p.bezierCurveTo(-s * 0.55, -s * 0.6, -s * 0.5, -s * 1.25, 0, -s * 1.25);
      p.bezierCurveTo(s * 0.5, -s * 1.25, s * 0.55, -s * 0.6, 0, 0);
      p.closePath();
      ctx.fill(p);
      ctx.stroke(p);
      ctx.beginPath();
      ctx.arc(0, -s * 0.85, s * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = stroke;
      ctx.fill();
      break;
    }
    case "heart": {
      const m = new DOMMatrix().translate(-s / 2, -s / 2).scale(s, s);
      p.addPath(new Path2D(HEART), m);
      ctx.fill(p);
      ctx.stroke(p);
      break;
    }
    case "star": {
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? s / 2 : s / 4.6;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) p.moveTo(px, py);
        else p.lineTo(px, py);
      }
      p.closePath();
      ctx.fill(p);
      ctx.stroke(p);
      break;
    }
    case "house": {
      p.moveTo(-s / 2, 0);
      p.lineTo(0, -s / 2);
      p.lineTo(s / 2, 0);
      p.lineTo(s * 0.35, 0);
      p.lineTo(s * 0.35, s * 0.45);
      p.lineTo(-s * 0.35, s * 0.45);
      p.lineTo(-s * 0.35, 0);
      p.closePath();
      ctx.translate(0, -s * 0.1);
      ctx.fill(p);
      ctx.stroke(p);
      break;
    }
    case "ring": {
      ctx.beginPath();
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      ctx.lineWidth = s * 0.16;
      ctx.strokeStyle = fill;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

/* ---------- poster ---------- */

export type RenderOptions = {
  /** Override pixels-per-mm (for previews/thumbnails). Default: product DPI. */
  pxPerMm?: number;
  /** Cap the longer side in pixels (thumbnails). */
  maxSide?: number;
  watermark?: string;
};

export async function renderPoster(spec: DesignSpec, opts: RenderOptions = {}): Promise<HTMLCanvasElement> {
  const product = getProduct(spec.productId);
  const layout = layoutFor(product, spec.orientation, spec.shape, spec.layoutStyle);
  const full = pixelSize(product, spec.orientation);
  let pxPerMm = opts.pxPerMm ?? full.pxPerMm;
  if (opts.maxSide) {
    const longest = Math.max(layout.W, layout.H) * pxPerMm;
    if (longest > opts.maxSide) pxPerMm *= opts.maxSide / longest;
  }
  const W = Math.round(layout.W * pxPerMm);
  const H = Math.round(layout.H * pxPerMm);
  const pal = paletteFor(spec);

  await ensureFonts(spec);

  const mapPx: Box = {
    x: Math.round(layout.map.x * pxPerMm),
    y: Math.round(layout.map.y * pxPerMm),
    w: Math.round(layout.map.w * pxPerMm),
    h: Math.round(layout.map.h * pxPerMm),
  };
  const mapImg = await renderMapImage(spec, layout.map, mapPx.w, mapPx.h);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);

  // map, clipped to the shape
  ctx.save();
  ctx.clip(shapePath2D(spec.shape, mapPx));
  ctx.drawImage(mapImg.canvas, mapPx.x, mapPx.y, mapPx.w, mapPx.h);
  // marker
  if (spec.marker.enabled && spec.marker.lngLat) {
    const p = mapImg.project(spec.marker.lngLat);
    const size = Math.min(layout.W, layout.H) * 0.045 * pxPerMm;
    drawMarker(ctx, spec.marker.kind, mapPx.x + p.x, mapPx.y + p.y, size, pal.road1, pal.bg);
  }
  // overlay gradient for full-bleed layouts
  if (layout.overlay) {
    const g = ctx.createLinearGradient(0, mapPx.y + mapPx.h * 0.55, 0, mapPx.y + mapPx.h);
    g.addColorStop(0, hexWithAlpha(pal.bg, 0));
    g.addColorStop(1, hexWithAlpha(pal.bg, 0.92));
    ctx.fillStyle = g;
    ctx.fillRect(mapPx.x, mapPx.y, mapPx.w, mapPx.h);
  }
  ctx.restore();

  // subtle outline for shaped maps on light themes
  if (spec.shape !== "rect") {
    ctx.save();
    ctx.strokeStyle = hexWithAlpha(pal.text, 0.12);
    ctx.lineWidth = Math.max(1, pxPerMm * 0.3);
    ctx.stroke(shapePath2D(spec.shape, mapPx));
    ctx.restore();
  }

  // text
  const textBox: Box = layout.text ?? {
    x: layout.margin * pxPerMm / pxPerMm,
    y: layout.H - layout.margin - layout.H * 0.22,
    w: layout.W - 2 * layout.margin,
    h: layout.H * 0.22,
  };
  const textPx: Box = { x: textBox.x * pxPerMm, y: textBox.y * pxPerMm, w: textBox.w * pxPerMm, h: textBox.h * pxPerMm };
  drawTextBlock(ctx, spec, layout, pxPerMm, textPx, pal.text);

  // attribution (always on)
  const f = fontsFor(spec);
  ctx.save();
  ctx.font = `400 ${layout.attributionMm * pxPerMm}px "${f.body}", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = pal.text;
  ctx.globalAlpha = 0.55;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(ATTRIBUTION, W - layout.margin * 0.5 * pxPerMm, H - layout.margin * 0.35 * pxPerMm);
  ctx.restore();

  if (opts.watermark) {
    ctx.save();
    ctx.font = `600 ${Math.max(10, W * 0.025)}px Montserrat, Helvetica, Arial, sans-serif`;
    ctx.fillStyle = pal.text;
    ctx.globalAlpha = 0.18;
    ctx.textAlign = "center";
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 7);
    ctx.fillText(opts.watermark, 0, 0);
    ctx.restore();
  }

  return canvas;
}

export function hexWithAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ---------- mockup ---------- */

export function renderMockup(poster: HTMLCanvasElement, opts: { width?: number; wall?: string; frame?: string } = {}): HTMLCanvasElement {
  const Wd = opts.width ?? 1600;
  const Hd = Math.round(Wd * 0.75);
  const c = document.createElement("canvas");
  c.width = Wd;
  c.height = Hd;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, Hd);
  g.addColorStop(0, opts.wall ?? "#efece6");
  g.addColorStop(1, "#d9d4cb");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, Wd, Hd);
  // floor line
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.fillRect(0, Hd * 0.86, Wd, Hd * 0.14);

  const ratio = poster.width / poster.height;
  const ph = Hd * 0.62;
  const pw = ph * ratio;
  const px = (Wd - pw) / 2;
  const py = Hd * 0.12;
  const frame = Math.max(6, Wd * 0.012);
  const mat = frame * 2.2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = Wd * 0.03;
  ctx.shadowOffsetY = Wd * 0.012;
  ctx.fillStyle = opts.frame ?? "#1a1a1a";
  ctx.fillRect(px - frame - mat, py - frame - mat, pw + 2 * (frame + mat), ph + 2 * (frame + mat));
  ctx.restore();
  ctx.fillStyle = "#faf9f6";
  ctx.fillRect(px - mat, py - mat, pw + 2 * mat, ph + 2 * mat);
  ctx.drawImage(poster, px, py, pw, ph);
  // glass sheen
  const sheen = ctx.createLinearGradient(px, py, px + pw, py + ph);
  sheen.addColorStop(0, "rgba(255,255,255,0.10)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(px - mat, py - mat, pw + 2 * mat, ph + 2 * mat);
  return c;
}

/* ---------- export helpers ---------- */

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg" = "image/png", quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed. Try a smaller size."))), type, quality);
  });
}

export async function canvasToPdfBlob(canvas: HTMLCanvasElement, widthMm: number, heightMm: number): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: [widthMm, heightMm], orientation: widthMm > heightMm ? "landscape" : "portrait", compress: true });
  const data = canvas.toDataURL("image/jpeg", 0.94);
  pdf.addImage(data, "JPEG", 0, 0, widthMm, heightMm, undefined, "FAST");
  return pdf.output("blob");
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "map";
}

export function posterFilename(spec: DesignSpec, ext: string) {
  const product = getProduct(spec.productId);
  return `${slugify(spec.text.title || spec.place.name)}-${spec.themeId}-${product.id}.${ext}`;
}
