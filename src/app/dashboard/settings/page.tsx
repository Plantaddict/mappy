import { requireSeller } from "@/lib/auth";
import { toPublic } from "@/lib/seller";
import SettingsForm from "@/components/SettingsForm";

export default async function SettingsPage() {
  const seller = await requireSeller();
  return (
    <div>
      <h1 className="serif text-3xl font-semibold">Brand &amp; products</h1>
      <p className="mt-1 text-sm text-neutral-600">What your customers see on <code>/s/{seller.slug}</code>.</p>
      <SettingsForm initial={toPublic(seller)} />
    </div>
  );
}
