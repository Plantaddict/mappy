import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { PLANS } from "@/lib/plans";

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.3em] text-neutral-500 uppercase">For sellers</p>
          <h1 className="serif mt-3 text-5xl font-semibold">A map designer under your brand.</h1>
          <p className="mt-4 text-lg text-neutral-600">
            Your customers design on your page and approve. You get the print-ready file: in the dashboard, by webhook, or pushed to your print-on-demand partner. You pay per approved design, never per preview. Payment stays in your own shop.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {(Object.entries(PLANS) as [string, (typeof PLANS)[keyof typeof PLANS]][]).map(([id, p]) => (
            <div key={id} className={`card flex flex-col p-6 ${id === "pro" ? "ring-2 ring-neutral-900" : ""}`}>
              <h2 className="text-lg font-bold">{p.name}</h2>
              <p className="mt-2 text-4xl font-semibold">${p.priceMonthly}<span className="text-base font-normal text-neutral-500">/mo</span></p>
              <p className="text-xs text-neutral-500">{p.approvalsPerMonth === null ? "Unlimited approvals" : `${p.approvalsPerMonth} approved designs / month, then $0.25 each`}</p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-neutral-700">
                {p.features.map((f) => <li key={f} className="flex gap-2"><span>✓</span>{f}</li>)}
              </ul>
              <Link href="/signup" className={`mt-6 ${id === "pro" ? "btn-primary" : "btn-secondary"}`}>Start with {p.name}</Link>
            </div>
          ))}
        </div>

        <section className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="card p-6">
            <h3 className="serif text-2xl font-semibold">How the flow works</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-700">
              <li>You get a branded page at <code>/s/your-shop</code>: your logo, colours, the themes and products you choose, your prices shown.</li>
              <li>A customer designs, then clicks <strong>Approve</strong>. We render the 300 DPI file and give them a short code like <code>MP-7K3Q9D</code>.</li>
              <li>They paste the code into the personalisation box at checkout on Etsy, Shopify, WooCommerce, or send it to you by message.</li>
              <li>You see the design in your dashboard with the code, download the file, or let the webhook send it to Printify / Printful / Gelato.</li>
            </ol>
          </div>
          <div className="card p-6">
            <h3 className="serif text-2xl font-semibold">Map packs</h3>
            <p className="mt-3 text-sm text-neutral-700">
              Need a catalogue, not personalisation? Generate 24 European capitals, 20 US cities or 16 Polish cities in any theme and size with one click, as a ZIP of print files plus mockups and a CSV of listing titles and tags. Included in every plan from the dashboard.
            </p>
            <h3 className="serif mt-6 text-2xl font-semibold">Licensing</h3>
            <p className="mt-3 text-sm text-neutral-700">
              Map data is © OpenStreetMap contributors under the ODbL. Posters are “produced works”: you can sell them, and the attribution printed on every file is what the licence requires. Your plan includes a commercial licence for mappy’s themes and renders.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
