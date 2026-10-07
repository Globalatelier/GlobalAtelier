"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/actions";

const links = [
  { href: "/admin/products", label: "Produkte" },
  { href: "/admin/settings", label: "Einstellungen" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/admin/products" className="font-serif text-lg tracking-[0.16em]">
          GLOBAL ATELIER
        </Link>
        <form action={logout}>
          <button type="submit" className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
            Abmelden
          </button>
        </form>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-6 px-4 pb-4 md:px-6">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`border-b pb-1 text-[11px] uppercase tracking-[0.16em] ${
                active ? "border-black text-black" : "border-transparent text-neutral-400"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
