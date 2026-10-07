"use client";

import { FormEvent, useState } from "react";
import { login } from "@/app/admin/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await login(new FormData(event.currentTarget));

    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center px-6">
      <div className="mx-auto w-full max-w-sm">
        <p className="font-serif text-4xl tracking-[0.12em]">GLOBAL ATELIER</p>
        <h1 className="mt-4 text-[11px] uppercase tracking-[0.22em] text-neutral-500">Admin</h1>
        {!configured ? (
          <p className="mt-8 text-sm leading-relaxed text-neutral-600">
            Supabase ist noch nicht konfiguriert. Trage die Werte aus `.env.example` in `.env.local` ein.
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="mt-12 space-y-8">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">E-Mail</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              className="mt-2 w-full border-b border-neutral-300 bg-transparent py-3 text-base outline-none focus:border-black"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Passwort</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full border-b border-neutral-300 bg-transparent py-3 text-base outline-none focus:border-black"
            />
          </label>
          {error ? <p className="text-sm text-neutral-700">{error}</p> : null}
          <button
            type="submit"
            disabled={pending || !configured}
            className="inline-flex h-12 w-full items-center justify-center bg-black text-[11px] font-medium uppercase tracking-[0.2em] text-white disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {pending ? "Anmeldung…" : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}
