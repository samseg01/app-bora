"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Desktop, Mobile } from "@/components/viewport";
import { CorrigirLugar } from "@/components/ui/corrigir-lugar";
import { PassosCurador } from "@/components/ui/passos-curador";
import { Porta } from "@/components/ui/porta";
import { DesktopShell } from "@/views/desktop/shell";
import { MobileShell } from "@/views/mobile/shell";
import { api, ApiError } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import { bairroDoCookie, BAIRROS } from "@/lib/bairros";
import { CATEGORIAS_LUGAR } from "@/lib/categorias";
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
      exige="curador"
    >
      <Conteudo />
    </Porta>
  );
}

function Conteudo() {
  // A contagem sobe da lista para as etapas: quem está aqui é justamente quem precisa
  // ver "0 cadastrados" virar "1 cadastrado" sem trocar de tela.
  const [quantos, setQuantos] = useState<number | null>(null);
  const corpo = <Lugares aoContar={setQuantos} />;
  return (
    <>
      <Mobile>
        <MobileShell nav={false}>
          <div className="flex items-center justify-between px-6 pt-9">
            <div className="rotulo text-amber">painel do curador</div>
            <Link href="/" className="text-xs font-semibold text-muted-2">
              ver o app
            </Link>
          </div>
          <div className="mt-3 px-6">
            <PassosCurador bairro={bairroDoCookie() ?? BAIRROS[0].nome} lugares={quantos} />
          </div>
          {corpo}
        </MobileShell>
      </Mobile>
      <Desktop>
        <DesktopShell curador>
          <div className="min-w-0 flex-1">
            <div className="px-8 pt-8">
              <PassosCurador bairro={bairroDoCookie() ?? BAIRROS[0].nome} lugares={quantos} />
            </div>
            {corpo}
          </div>
        </DesktopShell>
      </Desktop>
    </>
  );
}

function Lugares({ aoContar }: { aoContar: (n: number | null) => void }) {
  const sessao = useSessao();
  const token = sessao?.token;
  const bairro = bairroDoCookie() ?? BAIRROS[0].nome;

  const [lista, setLista] = useState<LugarPublic[] | null>(null);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_LUGAR[0]);
  const [endereco, setEndereco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [instagram, setInstagram] = useState("");
  const [horario, setHorario] = useState("");
  const [programacao, setProgramacao] = useState("");
  const [preco, setPreco] = useState("");
  const [coords, setCoords] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    void api
      .curadorLugares(token, bairro)
      .then((l) => {
        if (!vivo) return;
        setLista(l);
        aoContar(l.length);
      })
      .catch(() => {
        if (!vivo) return;
        setLista([]);
        aoContar(0);
      });
    return () => {
      vivo = false;
    };
  }, [token, bairro, aoContar]);

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
        endereco: endereco.trim() || null,
        descricao: descricao.trim() || null,
        // Guarda só o identificador: a pessoa cola @nome ou a URL inteira, e a tela
        // monta o link. Normalizar aqui evita três formatos no banco.
        instagram: instagram.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "") || null,
        horario_funcionamento: horario.trim() || null,
        programacao: programacao.trim() || null,
        preco_longneck: preco.trim() ? Number(preco.replace(",", ".")) : null,
      });
      // Fora do updater de propósito: a função passada ao setState precisa ser pura,
      // e avisar o pai lá dentro é efeito colateral.
      const atualizada = [...(lista ?? []), novo];
      setLista(atualizada);
      aoContar(atualizada.length);
      setNome("");
      setCoords("");
      setEndereco("");
      setDescricao("");
      setInstagram("");
      setHorario("");
      setProgramacao("");
      setPreco("");
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
    <section className="min-w-0 flex-1 px-6 pt-5 pb-8 lg:px-8 lg:pt-8">
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
            <span className="flex items-baseline justify-between">
              <span className="rotulo text-muted-3">categoria</span>
              <span className="text-[11px] text-muted-3">o que o lugar é</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS_LUGAR.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoria(c)}
                  aria-pressed={categoria === c}
                  className={`rounded-full px-3.5 py-2 text-[12.5px] transition-colors ${
                    categoria === c
                      ? "border-[1.5px] border-magenta bg-magenta/16 font-semibold"
                      : "border border-white/8 bg-sunken font-medium text-text-faint"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between">
              <span className="rotulo text-muted-3">endereço</span>
              <span className="text-[11px] text-muted-3">opcional</span>
            </span>
            <input
              className={CAMPO}
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua Aspicuelta, 340"
              maxLength={255}
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

          {/* A ficha da casa. Tudo opcional: o curador anota na calçada o que conseguiu,
              e exigir campo cheio transforma anotação rápida em formulário. */}
          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between">
              <span className="rotulo text-muted-3">o que é a casa</span>
              <span className="text-[11px] text-muted-3">opcional</span>
            </span>
            <textarea
              rows={3}
              className={`${CAMPO} resize-none leading-relaxed`}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Boteco de esquina, mesa na calçada, forró às quintas."
              maxLength={2000}
            />
          </label>

          <div className="flex gap-2.5">
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="rotulo text-muted-3">horário</span>
              <input
                className={CAMPO}
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                placeholder="ter a dom, 18h–02h"
                maxLength={255}
              />
            </label>
            <label className="flex w-32 shrink-0 flex-col gap-1.5">
              <span className="rotulo text-muted-3">longneck</span>
              <input
                className={CAMPO}
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                placeholder="12,00"
                inputMode="decimal"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between">
              <span className="rotulo text-muted-3">toda semana</span>
              <span className="text-[11px] text-muted-3">só se tiver algo fixo</span>
            </span>
            <textarea
              rows={2}
              className={`${CAMPO} resize-none leading-relaxed`}
              value={programacao}
              onChange={(e) => setProgramacao(e.target.value)}
              placeholder="quinta é forró, sábado tem samba"
              maxLength={2000}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="rotulo text-muted-3">instagram</span>
            <input
              className={CAMPO}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@bardochina"
              maxLength={80}
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
                className="flex flex-wrap items-center gap-3.5 rounded-[18px] border border-white/7 bg-card p-3.5"
              >
                <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-violet to-plum" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-bold">{l.nome}</div>
                  <div className="mt-0.5 truncate text-xs text-muted-2">
                    {l.endereco ?? (
                      <span className="text-amber">sem endereço · {l.categoria}</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-muted-3">
                  {l.lat.toFixed(4)}, {l.lng.toFixed(4)}
                </span>
                <CorrigirLugar
                  lugar={l}
                  aoSalvar={(atualizado) =>
                    setLista((atual) =>
                      (atual ?? []).map((x) => (x.id === atualizado.id ? atualizado : x)),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
