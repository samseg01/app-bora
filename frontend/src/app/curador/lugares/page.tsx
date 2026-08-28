"use client";

import { useEffect, useState } from "react";
import { Desktop, Mobile } from "@/components/viewport";
import { Porta } from "@/components/ui/porta";
import { DesktopShell } from "@/views/desktop/shell";
import { MobileShell } from "@/views/mobile/shell";
import { api, ApiError } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import { bairroDoCookie, BAIRROS } from "@/lib/bairros";
import type { LugarPublic } from "@/lib/types";

/**
 * Cadastrar lugar — o passo que vem antes de tudo no fluxo de campo: um rolê acontece
 * **em** um lugar, então sem esta tela o painel só publica sobre o que o seed criou.
 *
 * As coordenadas são coladas do Google Maps (botão direito no ponto, copia). Um seletor
 * no mapa seria melhor e não é difícil; fica para quando o gargalo for esse, e não a
 * curadoria em si.
 */
const CAMPO =
  "w-full rounded-2xl border border-white/10 bg-sunken px-3.5 py-3 text-[13.5px] text-text outline-none placeholder:text-muted-3 focus:border-white/25";

export default function CuradorLugaresPage() {
  return (
    <Porta
      titulo="Painel do curador"
      descricao="Cadastrar lugar é de quem valida em campo. Precisa entrar como curador."
      curador
    >
      <Conteudo />
    </Porta>
  );
}

function Conteudo() {
  const corpo = <Lugares />;
  return (
    <>
      <Mobile>
        <MobileShell nav={false}>{corpo}</MobileShell>
      </Mobile>
      <Desktop>
        <DesktopShell curador>{corpo}</DesktopShell>
      </Desktop>
    </>
  );
}

function Lugares() {
  const sessao = useSessao();
  const token = sessao?.token;
  const bairro = bairroDoCookie() ?? BAIRROS[0].nome;

  const [lista, setLista] = useState<LugarPublic[] | null>(null);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("bar");
  const [coords, setCoords] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    void api
      .curadorLugares(token, bairro)
      .then((l) => {
        if (vivo) setLista(l);
      })
      .catch(() => {
        if (vivo) setLista([]);
      });
    return () => {
      vivo = false;
    };
  }, [token, bairro]);

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    // "-23.5441, -46.6396" — o formato que o Google Maps entrega ao copiar.
    const [lat, lng] = coords.split(",").map((n) => Number(n.trim()));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErro("Cole as coordenadas do Google Maps, no formato -23.5441, -46.6396");
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const novo = await api.criarLugar(token, {
        nome: nome.trim(),
        categoria: categoria.trim(),
        lat,
        lng,
        bairro,
      });
      setLista((l) => [...(l ?? []), novo]);
      setNome("");
      setCoords("");
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 403
          ? "Sua conta não é de curador."
          : "Não deu pra cadastrar. Confere os campos.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="min-w-0 flex-1 px-6 py-8 lg:px-8">
      <h1 className="font-display text-[38px] leading-none uppercase lg:text-[42px]">Lugares</h1>
      <p className="mt-2 text-[13px] text-muted-2">
        O que existe em {bairro}. Um rolê acontece em um lugar — o lugar vem primeiro.
      </p>

      <div className="mt-7 flex flex-col gap-7 lg:flex-row lg:gap-10">
        <form
          onSubmit={cadastrar}
          className="flex w-full flex-col gap-3.5 rounded-[22px] border border-white/7 bg-card-alt p-5.5 lg:max-w-sm"
        >
          <h2 className="font-display text-[24px] leading-none uppercase">Cadastrar lugar</h2>

          <label className="flex flex-col gap-1.5">
            <span className="rotulo text-muted-3">nome</span>
            <input
              className={CAMPO}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Bar do China"
              required
              maxLength={160}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="rotulo text-muted-3">categoria</span>
            <input
              className={CAMPO}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="bar, boteco, sarau…"
              required
              maxLength={60}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between">
              <span className="rotulo text-muted-3">coordenadas</span>
              <span className="text-[11px] text-muted-3">botão direito no Google Maps</span>
            </span>
            <input
              className={`${CAMPO} font-mono`}
              value={coords}
              onChange={(e) => setCoords(e.target.value)}
              placeholder="-23.5441, -46.6396"
              required
            />
          </label>

          <button
            type="submit"
            disabled={enviando}
            className="mt-1 rounded-2xl bg-magenta py-3.5 text-[14.5px] font-bold text-white disabled:opacity-60"
          >
            {enviando ? "Cadastrando…" : `Cadastrar em ${bairro}`}
          </button>
          <p className="text-center text-[11.5px] leading-snug text-muted-3">
            {erro ?? "Só entra o que você visitou. É isso que faz o app valer."}
          </p>
        </form>

        <div className="min-w-0 flex-1">
          <div className="rotulo text-muted-3">
            {lista === null ? "carregando" : `${lista.length} no total`}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {lista?.length === 0 && (
              <p className="text-[13.5px] leading-relaxed text-muted">
                Nenhum ainda. O primeiro é o que tira o bairro do zero.
              </p>
            )}
            {lista?.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3.5 rounded-[18px] border border-white/7 bg-card p-3.5"
              >
                <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-violet to-plum" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-bold">{l.nome}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-2">
                    {l.categoria} · {l.bairro}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-muted-3">
                  {l.lat.toFixed(4)}, {l.lng.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
