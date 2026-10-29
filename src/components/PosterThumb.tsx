"use client";

import { useEffect, useState } from "react";
import type { DesignSpec } from "@/lib/spec";
import { queueRender, renderPoster } from "@/lib/render";

/** Renders a real poster thumbnail in the browser (used on the landing page and in packs). */
export default function PosterThumb({ spec, maxSide = 520, className }: { spec: DesignSpec; maxSide?: number; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    queueRender(async () => {
      const c = await renderPoster(spec, { maxSide });
      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.9));
      if (!alive || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => {});
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(spec), maxSide]);

  return (
    <div className={`relative overflow-hidden bg-neutral-200 ${className ?? ""}`} style={{ aspectRatio: "297 / 420" }}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${spec.text.title} map poster`} className="h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-neutral-300" />
      )}
    </div>
  );
}
