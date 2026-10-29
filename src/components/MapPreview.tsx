"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map as MLMap, Marker } from "maplibre-gl";
import { buildStyle, getTheme } from "@/lib/themes";
import { CSS_PER_MM, type DesignSpec } from "@/lib/spec";
import { drawMarker, paletteFor, shapeSvgPath } from "@/lib/render";

type Props = {
  spec: DesignSpec;
  mapWidthMm: number; // canonical map box width in mm
  onViewChange: (v: { center: [number, number]; zoom: number; bearing: number }) => void;
  placingMarker: boolean;
  onPlaceMarker: (lngLat: [number, number]) => void;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Live, interactive map for the poster's map box. Zoom is stored in canonical
 * units (relative to mapWidthMm × CSS_PER_MM px), so the export matches exactly.
 */
export default function MapPreview({ spec, mapWidthMm, onViewChange, placingMarker, onPlaceMarker, className, style }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const specRef = useRef(spec);
  specRef.current = spec;
  const cbRef = useRef({ onViewChange, onPlaceMarker });
  cbRef.current = { onViewChange, onPlaceMarker };
  const placingRef = useRef(placingMarker);
  placingRef.current = placingMarker;
  const styleKeyRef = useRef("");
  const widthScaleRef = useRef(1);
  // read through a ref so the map's event handlers never see a stale width
  const mapWidthRef = useRef(mapWidthMm);
  mapWidthRef.current = mapWidthMm;

  const canonicalCssW = () => mapWidthRef.current * CSS_PER_MM;
  const zoomOffset = () => {
    const w = holder.current?.clientWidth || canonicalCssW();
    return Math.log2(w / canonicalCssW());
  };

  // create map once
  useEffect(() => {
    if (!holder.current || mapRef.current) return;
    const s = specRef.current;
    const map = new maplibregl.Map({
      container: holder.current,
      style: buildStyle(getTheme(s.themeId), s.layers, 1, s.colors),
      center: s.center,
      zoom: s.zoom + zoomOffset(),
      bearing: s.bearing,
      attributionControl: false,
      maxCanvasSize: [8192, 8192],
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxPitch: 0,
      minZoom: 2,
      maxZoom: 18,
    });
    map.touchZoomRotate.disableRotation();
    map.on("moveend", () => {
      const c = map.getCenter();
      const z = map.getZoom() - zoomOffset();
      const b = map.getBearing();
      const cur = specRef.current;
      if (Math.abs(c.lng - cur.center[0]) > 1e-7 || Math.abs(c.lat - cur.center[1]) > 1e-7 || Math.abs(z - cur.zoom) > 1e-4 || Math.abs(b - cur.bearing) > 1e-3) {
        cbRef.current.onViewChange({ center: [c.lng, c.lat], zoom: z, bearing: b });
      }
    });
    map.on("click", (e) => {
      if (placingRef.current) cbRef.current.onPlaceMarker([e.lngLat.lng, e.lngLat.lat]);
    });
    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      map.resize();
      // keep the same canonical zoom when the preview box changes size
      map.jumpTo({ zoom: specRef.current.zoom + zoomOffset() });
      const ws = (holder.current?.clientWidth || canonicalCssW()) / canonicalCssW();
      if (Math.abs(ws - widthScaleRef.current) > 0.02) {
        widthScaleRef.current = ws;
        styleKeyRef.current = ""; // force style rebuild with new line scale
        applyStyle();
      }
    });
    ro.observe(holder.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyStyle() {
    const map = mapRef.current;
    if (!map) return;
    const s = specRef.current;
    const key = JSON.stringify([s.themeId, s.layers, s.colors, Math.round(widthScaleRef.current * 50)]);
    if (key === styleKeyRef.current) return;
    styleKeyRef.current = key;
    map.setStyle(buildStyle(getTheme(s.themeId), s.layers, widthScaleRef.current, s.colors), { diff: true });
  }

  // style changes
  useEffect(() => {
    applyStyle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.themeId, spec.layers, spec.colors]);

  // external view changes (search result, rotation slider, zoom buttons)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const c = map.getCenter();
    const z = map.getZoom() - zoomOffset();
    const b = map.getBearing();
    if (Math.abs(c.lng - spec.center[0]) > 1e-7 || Math.abs(c.lat - spec.center[1]) > 1e-7 || Math.abs(z - spec.zoom) > 1e-4 || Math.abs(b - spec.bearing) > 1e-3) {
      map.jumpTo({ center: spec.center, zoom: spec.zoom + zoomOffset(), bearing: spec.bearing });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.center[0], spec.center[1], spec.zoom, spec.bearing, mapWidthMm]);

  // marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.remove();
    markerRef.current = null;
    if (!spec.marker.enabled || !spec.marker.lngLat) return;
    const pal = paletteFor(spec);
    const size = Math.max(18, (holder.current?.clientWidth || 300) * 0.07);
    const c = document.createElement("canvas");
    c.width = size * 2;
    c.height = size * 2;
    c.style.width = `${size}px`;
    c.style.height = `${size}px`;
    const ctx = c.getContext("2d")!;
    ctx.scale(2, 2);
    drawMarker(ctx, spec.marker.kind, size / 2, spec.marker.kind === "pin" ? size * 0.95 : size / 2, size * 0.7, pal.road1, pal.bg);
    const el = document.createElement("div");
    el.appendChild(c);
    el.style.pointerEvents = "none";
    markerRef.current = new Marker({ element: el, anchor: spec.marker.kind === "pin" ? "bottom" : "center" }).setLngLat(spec.marker.lngLat).addTo(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.marker.enabled, spec.marker.kind, spec.marker.lngLat?.[0], spec.marker.lngLat?.[1], spec.themeId, spec.colors]);

  const svgPath = shapeSvgPath(spec.shape);
  const clipId = `clip-${spec.shape}`;
  const clipStyle: React.CSSProperties =
    spec.shape === "circle" ? { clipPath: "circle(50% at 50% 50%)" } : svgPath ? { clipPath: `url(#${clipId})` } : {};

  return (
    <div className={className} style={{ position: "relative", ...style, ...clipStyle }}>
      {svgPath && (
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={svgPath} />
            </clipPath>
          </defs>
        </svg>
      )}
      <div ref={holder} style={{ position: "absolute", inset: 0, cursor: placingMarker ? "crosshair" : "grab" }} />
    </div>
  );
}
