import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PosterThumb from "@/components/PosterThumb";
import { DEFAULT_SPEC, type DesignSpec } from "@/lib/spec";

const EXAMPLES: DesignSpec[] = [
  { ...DEFAULT_SPEC, themeId: "minimal-light", place: { name: "Paris", country: "France" }, center: [2.3522, 48.8566], zoom: 12.1, text: { ...DEFAULT_SPEC.text, title: "Paris", subtitle: "France" } },
  { ...DEFAULT_SPEC, themeId: "noir", place: { name: "Manhattan", country: "New York" }, center: [-73.9712, 40.7831], zoom: 12.4, text: { ...DEFAULT_SPEC.text, title: "Manhattan", subtitle: "New York" } },
  { ...DEFAULT_SPEC, themeId: "terracotta", shape: "circle", productId: "sq30", place: { name: "Barcelona", country: "Spain" }, center: [2.1734, 41.3851], zoom: 12.3, text: { ...DEFAULT_SPEC.text, title: "Barcelona", subtitle: "Spain" } },
  { ...DEFAULT_SPEC, themeId: "midnight-gold", place: { name: "Amsterdam", country: "Netherlands" }, center: [4.8952, 52.3702], zoom: 13.0, text: { ...DEFAULT_SPEC.text, title: "Amsterdam", subtitle: "Netherlands" } },
];

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4">
        <section className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-neutral-500 uppercase">Map posters · built on OpenStreetMap</p>
            <h1 className="serif mt-4 text-5xl leading-[1.05] font-semibold lg:text-6xl">Your place, as art, in under a minute.</h1>
            <p className="mt-5 max-w-lg text-lg text-neutral-600">
              Search any city, street or coordinate. Frame it, pick a style, add a title, and download a print-ready poster. No account, no design skills.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/studio" className="btn-primary px-6 py-3 text-base">Make a poster</Link>
              <Link href="/pricing" className="btn-secondary px-6 py-3 text-base">I sell posters</Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-sm text-neutral-600">
              <li>8 curated themes</li>
              <li>A4 to 50×70, phone cases, mugs</li>
              <li>Circle, heart and hexagon crops</li>
              <li>300 DPI PNG, JPEG and PDF</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {EXAMPLES.map((s, i) => (
              <Link key={i} href="/studio" className={`block overflow-hidden rounded-lg shadow-xl transition hover:-translate-y-1 ${i % 2 === 1 ? "mt-8" : ""}`}>
                <PosterThumb spec={s} maxSide={560} />
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-8 border-t border-neutral-200 py-16 md:grid-cols-3">
          {[
            ["Search", "Type a city, neighbourhood or address. Results come from OpenStreetMap, so it works everywhere."],
            ["Frame & style", "Drag and zoom inside the poster. Switch themes with one click, tweak colours, toggle buildings, parks, rail and street names."],
            ["Download", "Print-ready file at the exact physical size, with a framed mockup if you want to share it first."],
          ].map(([h, p]) => (
            <div key={h}>
              <h3 className="serif text-2xl font-semibold">{h}</h3>
              <p className="mt-2 text-neutral-600">{p}</p>
            </div>
          ))}
        </section>

        <section className="card my-8 grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-neutral-500 uppercase">For sellers</p>
            <h2 className="serif mt-3 text-4xl font-semibold">Your customers design. You get the file.</h2>
            <p className="mt-4 text-neutral-600">
              A branded designer page under your name. Customers approve a design and get a code to paste at checkout on Etsy, Shopify or anywhere. You receive the print-ready file in your dashboard, by email, or straight into Printify, Printful or Gelato via webhook. Plus ready-made city packs for your catalogue.
            </p>
            <Link href="/pricing" className="btn-primary mt-6">See plans</Link>
          </div>
          <ul className="space-y-3 text-sm text-neutral-700">
            {["No Mapbox or API keys to set up", "Lock themes, products and prices to your brand", "Approval is the only billable event", "Map packs: 24 European capitals in one click", "OpenStreetMap attribution handled for you"].map((t) => (
              <li key={t} className="flex gap-2"><span className="text-[var(--accent)]">●</span>{t}</li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
