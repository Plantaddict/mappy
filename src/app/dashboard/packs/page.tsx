import { requireSeller } from "@/lib/auth";
import PackBuilder from "@/components/PackBuilder";

export default async function PacksPage() {
  await requireSeller();
  return (
    <div>
      <h1 className="serif text-3xl font-semibold">Map packs</h1>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        Generate a whole catalogue in one go: pick a city pack, themes and a size, and download a ZIP with print-ready files, framed mockups and a CSV of listing titles, tags and descriptions. Rendering happens in your browser; keep this tab open.
      </p>
      <PackBuilder />
    </div>
  );
}
