"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getProduct, layoutFor } from "@/lib/products";
import { type DesignSpec } from "@/lib/spec";
import { ATTRIBUTION, hexWithAlpha, measureTextLines, paletteFor } from "@/lib/render";
import MapPreview from "./MapPreview";

type Props = {
  spec: DesignSpec;
  onViewChange: (v: { center: [number, number]; zoom: number; bearing: number }) => void;
  placingMarker: boolean;
  onPlaceMarker: (lngLat: [number, number]) => void;
};

/** WYSIWYG poster: the page in mm scaled to fit, live map in the map box, HTML text block. */
export default function PosterPreview({ spec, onViewChange, placingMarker, onPlaceMarker }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState({ w: 600, h: 700 });
  const [fontsReady, setFontsReady] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!wrap.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setAvail({ w: r.width, h: r.height });
    });
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || !("fonts" in document)) return;
    document.fonts.ready.then(() => setFontsReady((n) => n + 1));
  }, [spec.font, spec.themeId]);

  const product = getProduct(spec.productId);
  const layout = layoutFor(product, spec.orientation, spec.shape, spec.layoutStyle);
  const pal = paletteFor(spec);

  const pad = 24;
  const scale = Math.min((avail.w - pad) / layout.W, (avail.h - pad) / layout.H);
  const pxPerMm = Math.max(0.5, scale);
  const W = layout.W * pxPerMm;
  const H = layout.H * pxPerMm;

  const textBox = layout.text ?? {
    x: layout.margin,
    y: layout.H - layout.margin - layout.H * 0.22,
    w: layout.W - 2 * layout.margin,
    h: layout.H * 0.22,
  };

  const lines = useMemo(() => {
    if (!mounted) return [];
    return measureTextLines(spec, layout, pxPerMm, textBox.w * pxPerMm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, spec.text, spec.font, spec.themeId, spec.center, pxPerMm, layout.W, layout.H, layout.map.w, spec.shape, spec.layoutStyle, fontsReady]);

  const total = lines.reduce((a, l) => a + l.size + l.gapAfter, 0);
  const boxH = textBox.h * pxPerMm;
  const offsetY = layout.overlay || layout.textAlign === "left" ? (boxH - total) / 2 : Math.max(0, Math.min((boxH - total) / 2, boxH * 0.12));

  return (
    <div ref={wrap} className="flex h-full w-full items-center justify-center">
      <div
        className="relative shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]"
        style={{ width: W, height: H, background: pal.bg, overflow: "hidden" }}
      >
        <MapPreview
          spec={spec}
          mapWidthMm={layout.map.w}
          onViewChange={onViewChange}
          placingMarker={placingMarker}
          onPlaceMarker={onPlaceMarker}
          className="absolute"
          style={{ left: layout.map.x * pxPerMm, top: layout.map.y * pxPerMm, width: layout.map.w * pxPerMm, height: layout.map.h * pxPerMm }}
        />
        {layout.overlay && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: layout.map.x * pxPerMm,
              width: layout.map.w * pxPerMm,
              top: (layout.map.y + layout.map.h * 0.55) * pxPerMm,
              height: layout.map.h * 0.45 * pxPerMm,
              background: `linear-gradient(${hexWithAlpha(pal.bg, 0)}, ${hexWithAlpha(pal.bg, 0.92)})`,
            }}
          />
        )}
        {spec.shape !== "rect" && (
          <ShapeOutline shape={spec.shape} x={layout.map.x * pxPerMm} y={layout.map.y * pxPerMm} w={layout.map.w * pxPerMm} h={layout.map.h * pxPerMm} color={hexWithAlpha(pal.text, 0.12)} />
        )}
        <div
          className="pointer-events-none absolute"
          style={{ left: textBox.x * pxPerMm, top: textBox.y * pxPerMm, width: textBox.w * pxPerMm, height: boxH, color: pal.text }}
        >
          <div style={{ paddingTop: offsetY, textAlign: layout.textAlign }}>
            {lines.map((l, i) => (
              <div
                key={i}
                style={{
                  fontFamily: l.family,
                  fontWeight: l.weight,
                  fontStyle: l.italic ? "italic" : "normal",
                  fontSize: l.size,
                  lineHeight: 1,
                  letterSpacing: `${l.size * l.spacing}px`,
                  marginBottom: l.gapAfter,
                  opacity: l.opacity ?? 1,
                  whiteSpace: "nowrap",
                  // letter-spacing adds trailing space; compensate for centred text
                  paddingLeft: layout.textAlign === "center" ? l.size * l.spacing : 0,
                }}
              >
                {l.text}
              </div>
            ))}
          </div>
        </div>
        <div
          className="pointer-events-none absolute"
          style={{
            right: layout.margin * 0.5 * pxPerMm,
            bottom: layout.margin * 0.35 * pxPerMm - layout.attributionMm * pxPerMm * 0.2,
            fontSize: Math.max(4, layout.attributionMm * pxPerMm),
            color: pal.text,
            opacity: 0.55,
            fontFamily: "Montserrat, sans-serif",
            lineHeight: 1,
          }}
        >
          {ATTRIBUTION}
        </div>
      </div>
    </div>
  );
}

function ShapeOutline({ shape, x, y, w, h, color }: { shape: string; x: number; y: number; w: number; h: number; color: string }) {
  if (shape === "circle") {
    return <div className="pointer-events-none absolute rounded-full" style={{ left: x, top: y, width: w, height: h, boxShadow: `inset 0 0 0 1px ${color}` }} />;
  }
  return null;
}
