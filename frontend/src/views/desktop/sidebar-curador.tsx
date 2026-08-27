"use client";

import Link from "next/link";

/**
 * Nav do painel do curador. Deliberadamente diferente da do app público: aqui não se
 * descobre nada, se publica. Quem entra aqui já sabe o que veio fazer.
 */

const ITENS = [
  {
    href: "/curador",
    label: "A noite de hoje",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    href: "/curador/lugares",
    label: "Lugares",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    href: "/curador/roles",
    label: "Rolês",
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 11h18" />
      </svg>
    ),
  },
];

export function SidebarCurador() {
  return (
    <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-8 border-r border-white/7 bg-nav px-5 py-7">
      <div className="px-3.5">
        <Link href="/curador" className="font-display text-3xl leading-none uppercase">
          Bora<span className="text-amber">?</span>
        </Link>
        <div className="rotulo mt-2 text-amber">painel do curador</div>
      </div>

      <nav className="flex flex-col gap-1">
        {ITENS.map(({ href, label, icone }, i) => (
          <Link
            key={href}
            href={href}
            aria-current={i === 0 ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-colors ${
              i === 0
                ? "bg-magenta/15 font-semibold text-magenta"
                : "font-medium text-muted-2 hover:bg-white/4 hover:text-text"
            }`}
          >
            {icone}
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex items-center gap-2.5 rounded-[18px] border border-white/6 bg-card-alt p-4">
          <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-violet to-cyan" />
          <div>
            <div className="text-[13px] font-semibold">Léo</div>
            <div className="mt-0.5 text-[11px] text-muted-3">curador · Vila Madalena</div>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-3.5 text-[12.5px] font-semibold text-muted-2 hover:text-text"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Ver o app público
        </Link>
      </div>
    </aside>
  );
}
