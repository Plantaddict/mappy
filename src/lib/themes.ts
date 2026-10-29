import type { StyleSpecification, LayerSpecification, ExpressionSpecification } from "maplibre-gl";

export type FontPairId = "classic" | "modern" | "elegant" | "mono";

export type Palette = {
  bg: string;
  water: string;
  parks: string;
  buildings: string;
  road1: string; // motorway / trunk
  road2: string; // primary / secondary
  road3: string; // tertiary / minor
  path: string;
  rail: string;
  text: string;
};

export type Theme = {
  id: string;
  name: string;
  description: string;
  palette: Palette;
  font: FontPairId;
  dark: boolean;
};

export const THEMES: Theme[] = [
  {
    id: "minimal-light",
    name: "Minimal Light",
    description: "Warm paper, charcoal streets",
    dark: false,
    font: "classic",
    palette: {
      bg: "#F8F6F1", water: "#BFD3DB", parks: "#E3E9DA", buildings: "#E8E3DA",
      road1: "#1F1F1F", road2: "#3A3A3A", road3: "#6B6B6B", path: "#A3A3A3", rail: "#8A8A8A", text: "#1A1A1A",
    },
  },
  {
    id: "noir",
    name: "Noir",
    description: "Black on black, white arteries",
    dark: true,
    font: "modern",
    palette: {
      bg: "#0E0E10", water: "#1C1F26", parks: "#141A16", buildings: "#1A1A1D",
      road1: "#FFFFFF", road2: "#D9D9D9", road3: "#9A9A9A", path: "#5A5A5A", rail: "#6E6E6E", text: "#F2F2F2",
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Architect's cyanotype",
    dark: true,
    font: "mono",
    palette: {
      bg: "#0B3D91", water: "#0A2F70", parks: "#0D45A3", buildings: "#1050B5",
      road1: "#FFFFFF", road2: "#E6EEFF", road3: "#B9CCF2", path: "#7E9BD6", rail: "#A7B9E6", text: "#FFFFFF",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    description: "Sun-baked clay and sand",
    dark: false,
    font: "elegant",
    palette: {
      bg: "#F1E3D3", water: "#B9CBC9", parks: "#DCCFB4", buildings: "#E8D6C2",
      road1: "#7A2E1F", road2: "#9A4A33", road3: "#B9846E", path: "#D2B3A6", rail: "#8F6B5C", text: "#5A2A1E",
    },
  },
  {
    id: "forest",
    name: "Forest",
    description: "Deep green, bone-white roads",
    dark: true,
    font: "classic",
    palette: {
      bg: "#0F2A22", water: "#0B3C4A", parks: "#15382C", buildings: "#14302A",
      road1: "#E8E2C8", road2: "#CFC7A8", road3: "#8E9A7E", path: "#5F6F5F", rail: "#6B7A6B", text: "#EFE9D3",
    },
  },
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    description: "Navy night, gilded streets",
    dark: true,
    font: "elegant",
    palette: {
      bg: "#0B1020", water: "#0F1A3A", parks: "#10172A", buildings: "#121A30",
      road1: "#D4AF37", road2: "#B8962E", road3: "#7A6530", path: "#463E1F", rail: "#5C4F2A", text: "#E9D7A1",
    },
  },
  {
    id: "rose",
    name: "Rose",
    description: "Blush paper, wine-red lines",
    dark: false,
    font: "elegant",
    palette: {
      bg: "#FBEFF1", water: "#D9CDD6", parks: "#F0D9DD", buildings: "#F4E4E7",
      road1: "#7A1E3A", road2: "#A0435C", road3: "#C98A9A", path: "#E0BEC7", rail: "#B07A8A", text: "#5B1B30",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Cool grey land, deep blue water",
    dark: false,
    font: "modern",
    palette: {
      bg: "#EAF2F5", water: "#2E6F8E", parks: "#D5E5DF", buildings: "#DCE6EA",
      road1: "#123B4F", road2: "#2B5A70", road3: "#6E93A5", path: "#A9C0CB", rail: "#5E7F8F", text: "#0F2F40",
    },
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export type LayerToggles = {
  buildings: boolean;
  rail: boolean;
  parks: boolean;
  water: boolean;
  labels: boolean;
};

export const DEFAULT_LAYERS: LayerToggles = {
  buildings: true,
  rail: true,
  parks: true,
  water: true,
  labels: false,
};

export const TILES_URL =
  process.env.NEXT_PUBLIC_TILES_URL ?? "https://tiles.openfreemap.org/planet";

/** Zoom-dependent width stops, scaled so preview and export line weights match. */
function width(stops: [number, number][], scale: number): ExpressionSpecification {
  const out: unknown[] = ["interpolate", ["exponential", 1.5], ["zoom"]];
  for (const [z, w] of stops) out.push(z, w * scale);
  return out as unknown as ExpressionSpecification;
}

/**
 * Builds a complete MapLibre style for a theme.
 * `widthScale` lets the live preview (which is smaller than the export canvas)
 * show the same relative line weights as the final print.
 */
export function buildStyle(
  theme: Theme,
  layers: LayerToggles,
  widthScale = 1,
  overrides: Partial<Palette> = {},
): StyleSpecification {
  const p: Palette = { ...theme.palette, ...overrides };
  const s = Math.max(0.15, widthScale);
  const L: LayerSpecification[] = [];

  L.push({ id: "bg", type: "background", paint: { "background-color": p.bg } });

  if (layers.parks) {
    L.push({
      id: "landcover",
      type: "fill",
      source: "omt",
      "source-layer": "landcover",
      filter: ["in", ["get", "class"], ["literal", ["wood", "grass", "farmland", "wetland"]]],
      paint: { "fill-color": p.parks, "fill-opacity": 0.7 },
    });
    L.push({
      id: "park",
      type: "fill",
      source: "omt",
      "source-layer": "park",
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: { "fill-color": p.parks },
    });
    L.push({
      id: "landuse-green",
      type: "fill",
      source: "omt",
      "source-layer": "landuse",
      filter: ["in", ["get", "class"], ["literal", ["cemetery", "pitch", "playground", "garden", "stadium"]]],
      paint: { "fill-color": p.parks, "fill-opacity": 0.6 },
    });
  }

  if (layers.water) {
    L.push({
      id: "water",
      type: "fill",
      source: "omt",
      "source-layer": "water",
      filter: ["!=", ["get", "brunnel"], "tunnel"],
      paint: { "fill-color": p.water },
    });
    L.push({
      id: "waterway",
      type: "line",
      source: "omt",
      "source-layer": "waterway",
      filter: ["!=", ["get", "brunnel"], "tunnel"],
      paint: {
        "line-color": p.water,
        "line-width": width([[8, 0.4], [12, 1.2], [14, 2.2], [17, 6]], s),
      },
      layout: { "line-cap": "round", "line-join": "round" },
    });
  }

  if (layers.buildings) {
    L.push({
      id: "buildings",
      type: "fill",
      source: "omt",
      "source-layer": "building",
      minzoom: 12,
      paint: {
        "fill-color": p.buildings,
        "fill-opacity": ["interpolate", ["linear"], ["zoom"], 12, 0, 13.5, 1],
      },
    });
  }

  L.push({
    id: "aeroway",
    type: "line",
    source: "omt",
    "source-layer": "aeroway",
    filter: ["in", ["get", "class"], ["literal", ["runway", "taxiway"]]],
    paint: { "line-color": p.road3, "line-width": width([[10, 0.6], [14, 3], [17, 10]], s), "line-opacity": 0.8 },
  });

  const roadLayout = { "line-cap": "round" as const, "line-join": "round" as const };
  const notTunnel = ["!=", ["get", "brunnel"], "tunnel"] as unknown[];
  const tunnelOpacity = ["case", ["==", ["get", "brunnel"], "tunnel"], 0.35, 1] as unknown[];

  L.push({
    id: "road-path",
    type: "line",
    source: "omt",
    "source-layer": "transportation",
    minzoom: 13,
    filter: ["all", ["in", ["get", "class"], ["literal", ["path", "track"]]], notTunnel as never],
    paint: {
      "line-color": p.path,
      "line-width": width([[13, 0.25], [15, 0.6], [17, 1.4]], s),
      "line-opacity": 0.9,
    },
    layout: roadLayout,
  });
  L.push({
    id: "road-minor",
    type: "line",
    source: "omt",
    "source-layer": "transportation",
    minzoom: 11,
    filter: ["in", ["get", "class"], ["literal", ["minor", "service", "living_street", "pedestrian", "raceway", "busway"]]],
    paint: {
      "line-color": p.road3,
      "line-width": width([[11, 0.15], [13, 0.5], [15, 1.3], [17, 4]], s),
      "line-opacity": tunnelOpacity as never,
    },
    layout: roadLayout,
  });
  L.push({
    id: "road-tertiary",
    type: "line",
    source: "omt",
    "source-layer": "transportation",
    filter: ["==", ["get", "class"], "tertiary"],
    paint: {
      "line-color": p.road3,
      "line-width": width([[9, 0.2], [12, 0.6], [14, 1.4], [17, 5.5]], s),
      "line-opacity": tunnelOpacity as never,
    },
    layout: roadLayout,
  });
  L.push({
    id: "road-secondary",
    type: "line",
    source: "omt",
    "source-layer": "transportation",
    filter: ["==", ["get", "class"], "secondary"],
    paint: {
      "line-color": p.road2,
      "line-width": width([[8, 0.3], [12, 0.9], [14, 1.9], [17, 6.5]], s),
      "line-opacity": tunnelOpacity as never,
    },
    layout: roadLayout,
  });
  L.push({
    id: "road-primary",
    type: "line",
    source: "omt",
    "source-layer": "transportation",
    filter: ["==", ["get", "class"], "primary"],
    paint: {
      "line-color": p.road2,
      "line-width": width([[7, 0.4], [12, 1.2], [14, 2.6], [17, 8]], s),
      "line-opacity": tunnelOpacity as never,
    },
    layout: roadLayout,
  });
  L.push({
    id: "road-motorway",
    type: "line",
    source: "omt",
    "source-layer": "transportation",
    filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]],
    paint: {
      "line-color": p.road1,
      "line-width": width([[6, 0.5], [10, 1.3], [14, 3.6], [17, 11]], s),
      "line-opacity": tunnelOpacity as never,
    },
    layout: roadLayout,
  });

  if (layers.rail) {
    L.push({
      id: "rail",
      type: "line",
      source: "omt",
      "source-layer": "transportation",
      minzoom: 10,
      filter: ["all", ["in", ["get", "class"], ["literal", ["rail", "transit"]]], notTunnel as never],
      paint: {
        "line-color": p.rail,
        "line-width": width([[10, 0.3], [14, 0.9], [17, 2.2]], s),
        "line-dasharray": [3, 2],
        "line-opacity": 0.8,
      },
    });
  }

  if (layers.labels) {
    L.push({
      id: "street-labels",
      type: "symbol",
      source: "omt",
      "source-layer": "transportation_name",
      minzoom: 13,
      filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "minor"]]],
      layout: {
        "symbol-placement": "line",
        "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
        "text-font": ["Noto Sans Regular"],
        "text-size": 9 * s,
        "text-letter-spacing": 0.05,
      },
      paint: { "text-color": p.text, "text-opacity": 0.75, "text-halo-color": p.bg, "text-halo-width": 1 * s },
    });
    L.push({
      id: "place-labels",
      type: "symbol",
      source: "omt",
      "source-layer": "place",
      filter: ["in", ["get", "class"], ["literal", ["city", "town", "village", "suburb", "neighbourhood"]]],
      layout: {
        "text-field": ["coalesce", ["get", "name:latin"], ["get", "name"]],
        "text-font": ["Noto Sans Bold"],
        "text-size": ["match", ["get", "class"], "city", 14 * s, "town", 12 * s, 10 * s],
        "text-letter-spacing": 0.1,
        "text-transform": "uppercase",
      },
      paint: { "text-color": p.text, "text-opacity": 0.85, "text-halo-color": p.bg, "text-halo-width": 1.2 * s },
    });
  }

  return {
    version: 8,
    name: theme.name,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { omt: { type: "vector", url: TILES_URL } },
    layers: L,
  };
}

export const FONT_PAIRS: Record<FontPairId, { name: string; title: string; body: string; titleWeight: number; css: string }> = {
  classic: { name: "Classic serif", title: "Cormorant Garamond", body: "Montserrat", titleWeight: 600, css: "'Cormorant Garamond', Georgia, serif" },
  modern: { name: "Modern sans", title: "Montserrat", body: "Montserrat", titleWeight: 700, css: "Montserrat, Helvetica, Arial, sans-serif" },
  elegant: { name: "Elegant", title: "Playfair Display", body: "Montserrat", titleWeight: 600, css: "'Playfair Display', Georgia, serif" },
  mono: { name: "Mono", title: "Space Mono", body: "Space Mono", titleWeight: 700, css: "'Space Mono', Menlo, monospace" },
};
