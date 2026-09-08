"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/jobs", label: "Inzeráty" },
  { href: "/knowledge-base", label: "Znalostní báze" },
  { href: "/job-descriptions", label: "Popisy pozic" },
];

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full items-stretch gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center px-3 text-sm font-medium transition ${
              active ? "text-accent" : "text-text-muted hover:text-text-primary"
            }`}
          >
            {item.label}
            <span
              className={`absolute inset-x-3 -bottom-px h-0.5 rounded-full transition ${
                active ? "bg-accent" : "bg-transparent"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
