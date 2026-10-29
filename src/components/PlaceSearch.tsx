"use client";

import { useEffect, useRef, useState } from "react";
import type { GeocodeResult } from "@/app/api/geocode/route";

export default function PlaceSearch({ onPick, autoFocus }: { onPick: (r: GeocodeResult) => void; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<number | null>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = window.setTimeout(async () => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setLoading(true);
      setError("");
      try {
        const lang = navigator.language?.slice(0, 2) || "en";
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q.trim())}&lang=${lang}`, { signal: ctrl.signal });
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
        if (data.error) setError("Search is temporarily unavailable.");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Search failed.");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  return (
    <div className="relative">
      <input
        className="input"
        placeholder="Search a city, address or place…"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) {
            onPick(results[0]);
            setOpen(false);
            setQ(results[0].name);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        aria-label="Search place"
      />
      {loading && <span className="absolute top-2.5 right-3 text-xs text-neutral-400">…</span>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-neutral-100"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(r);
                  setOpen(false);
                  setQ(r.name);
                }}
              >
                <span className="text-sm font-medium">{r.name}</span>
                <span className="text-xs text-neutral-500">
                  {[r.region, r.country].filter(Boolean).join(", ")} {r.type && <span className="ml-1 rounded bg-neutral-100 px-1 text-[10px] uppercase">{r.type}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
