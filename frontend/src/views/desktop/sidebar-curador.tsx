"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useSessao } from "@/lib/auth";

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
];

export function SidebarCurador() {
  const caminho = usePathname();
  const sessao = useSessao();
  const [nome, setNome] = useState<string | null>(null);
  const token = sessao?.token;

  // Quem está logado, de verdade. Antes havia um nome fixo aqui, que era invenção.
  useEffect(() => {
    if (!token) return;
    let vivo = true;
    void api
      .eu(token)
      .then((u) => {
        if (vivo) setNome(u.nome);
      })
      .catch(() => {
        /* sem nome é melhor que nome errado */
      });
    return () => {
      vivo = false;
    };
  }, [token]);

  return (
    <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-8 border-r border-white/7 bg-nav px-5 py-7">
      <div className="px-3.5">
        <Link href="/curador" className="font-display text-3xl leading-none uppercase">
          Bora<span className="text-amber">?</span>
        </Link>
        <div className="rotulo mt-2 text-amber">painel do curador</div>
      </div>

      <nav className="flex flex-col gap-1">
        {ITENS.map(({ href, label, icone }) => {
          // Antes era `i === 0` fixo: em /curador/lugares a coluna destacava
          // "A noite de hoje", dizendo que se estava numa tela em que não se estava.
          const ativo = caminho === href;
          return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm transition-colors ${
              ativo
                ? "bg-magenta/15 font-semibold text-magenta"
                : "font-medium text-muted-2 hover:bg-white/4 hover:text-text"
            }`}
          >
            {icone}
            {label}
          </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        {nome && (
          <div className="flex items-center gap-2.5 rounded-[18px] border border-white/6 bg-card-alt p-4">
            <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-violet to-cyan" />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{nome}</div>
              <div className="mt-0.5 text-[11px] text-muted-3">curador</div>
            </div>
          </div>
        )}
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
