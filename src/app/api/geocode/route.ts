import { NextResponse } from "next/server";

export type GeocodeResult = {
  name: string;
  country: string;
  region: string;
  type: string;
  lng: number;
  lat: number;
  label: string;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const lang = (searchParams.get("lang") ?? "en").slice(0, 2);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const base = process.env.GEOCODER_URL || "https://photon.komoot.io/api/";
  const url = `${base}?q=${encodeURIComponent(q)}&limit=6&lang=${lang}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": "mappy/0.1 (map poster designer)" }, next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ results: [], error: `geocoder ${res.status}` }, { status: 502 });
    const data = (await res.json()) as { features: PhotonFeature[] };
    const results: GeocodeResult[] = data.features.map((f) => {
      const p = f.properties;
      const name = p.name ?? p.street ?? p.city ?? q;
      const region = [p.city && p.city !== name ? p.city : null, p.state && p.state !== name ? p.state : null].filter(Boolean).join(", ");
      const country = p.country ?? "";
      const type = p.type ?? p.osm_value ?? "";
      const label = [name, region, country].filter(Boolean).join(", ");
      return { name, country, region, type, lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], label };
    });
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ results: [], error: (e as Error).message }, { status: 502 });
  }
}
