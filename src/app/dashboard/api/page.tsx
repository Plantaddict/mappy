import { requireSeller } from "@/lib/auth";
import { appUrl } from "@/lib/files";
import ApiPanel from "@/components/ApiPanel";

export default async function ApiPage() {
  const seller = await requireSeller();
  return (
    <div className="max-w-3xl">
      <h1 className="serif text-3xl font-semibold">Webhooks &amp; API</h1>
      <p className="mt-1 text-sm text-neutral-600">Get approved designs into your fulfilment flow automatically.</p>
      <ApiPanel apiKey={seller.apiKey} webhookUrl={seller.webhookUrl} baseUrl={appUrl()} />
    </div>
  );
}
