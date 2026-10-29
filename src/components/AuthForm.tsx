"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/render";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mode === "login" ? { email, password } : { email, password, shopName, slug }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-12 w-full max-w-md space-y-4 p-6">
      <h1 className="serif text-3xl font-semibold">{mode === "login" ? "Log in" : "Start selling"}</h1>
      {mode === "signup" && (
        <>
          <div>
            <label className="label">Shop name</label>
            <input
              className="input"
              value={shopName}
              onChange={(e) => {
                setShopName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value).slice(0, 32));
              }}
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="label">Your designer page</label>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-neutral-500">/s/</span>
              <input className="input" value={slug} onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugTouched(true); }} required pattern="[a-z0-9][a-z0-9\-]{1,30}[a-z0-9]" />
            </div>
          </div>
        </>
      )}
      <div>
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div>
        <label className="label">Password</label>
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "…" : mode === "login" ? "Log in" : "Create my seller account"}</button>
      <p className="text-center text-xs text-neutral-500">
        {mode === "login" ? (
          <>No account? <a className="underline" href="/signup">Start selling</a></>
        ) : (
          <>Already selling? <a className="underline" href="/login">Log in</a></>
        )}
      </p>
    </form>
  );
}
