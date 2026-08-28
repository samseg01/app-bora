"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { guardarDestino, useSessao } from "@/lib/auth";
import { invalidarMeus, meusSinais } from "@/lib/meus";
import { hora } from "@/lib/tempo";

/**
 * O "Tô indo" e a confirmação que vem depois — a tela 2e do hi-fi, implementada como
 * estado do detalhe e não como rota nova: a pessoa não saiu do rolê, ela marcou
 * presença nele.
 *
 * Três públicos, três comportamentos, todos honestos:
 * - deslogado: leva para entrar, guardando o destino (auth preguiçosa);
 * - papel comum: botão desabilitado com o motivo, porque `POST /sinalizacoes` responde
 *   403 por decisão registrada (ADR-0006) — o motor de frescor começa restrito;
 * - curador ou dono: sinaliza de verdade.
 *
 * O contador de expiração é **convenção de interface**, não promessa da API: o backend
 * não apaga sinal nenhum, ele deixa de contar depois da janela warm. "Some sozinho" é
 * verdade sobre o efeito, não sobre a linha no banco.
 *
 * O "Tá marcado" **não pode viver só em estado de componente**: ao sair do detalhe e
 * voltar, o React desmonta tudo e a tela voltava a oferecer "Tô indo" para quem já
 * tinha marcado — dizendo que o sinal não existe enquanto ele estava no banco
 * alimentando o frescor. Por isso o estado é rehidratado de `GET /sinalizacoes/minhas`
 * a cada montagem. A fonte da verdade é o servidor; o componente só reflete.
 */

/** Espelha FRESCOR_WARM_WINDOW_MINUTES do backend. */
const JANELA_MIN = 120;

/** Minutos que faltam para o sinal sair da janela. Fora de componente de propósito:
    ler o relógio durante o render é impuro e o React Compiler recusa. */
function minutosRestantes(timestamp: string): number {
  const fim = new Date(timestamp).getTime() + JANELA_MIN * 60_000;
  return Math.max(0, Math.round((fim - Date.now()) / 60_000));
}

export function AcaoSinalizar({ roleId, dataFim }: { roleId: string; dataFim: string }) {
  const sessao = useSessao();
  const caminho = usePathname();
  const router = useRouter();

  const [sinalId, setSinalId] = useState<string | null>(null);
  /** Minutos restantes no instante em que se marcou (ou em que se rehidratou). É um
      retrato, não um relógio: reabrir a tela recalcula. */
  const [restante, setRestante] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const token = sessao?.token;

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    void meusSinais(token)
      .then((sinais) => {
        const meu = sinais.find((s) => s.role_id === roleId);
        if (!vivo || !meu) return;
        const faltam = minutosRestantes(meu.timestamp);
        // Zero significa que a janela fechou entre o corte do servidor e agora: o
        // sinal não conta mais para ninguém, então não anunciamos que conta.
        if (faltam <= 0) return;
        setSinalId(meu.id);
        setRestante(faltam);
      })
      .catch(() => {
        /* silencioso: sem isto a tela só perde a memória do sinal, que é o
           comportamento antigo — não vale um erro na cara de quem só quer marcar */
      });
    return () => {
      vivo = false;
    };
  }, [token, roleId]);

  const podeSinalizar =
    sessao?.papel === "curador" || sessao?.papel === "dono_estabelecimento";

  async function sinalizar() {
    if (!sessao) return;
    setOcupado(true);
    setErro(null);
    try {
      const s = await api.sinalizar(sessao.token, roleId);
      setSinalId(s.id);
      setRestante(minutosRestantes(s.timestamp));
      invalidarMeus();
      router.refresh();
    } catch (e) {
      setErro(
        e instanceof ApiError && e.status === 403
          ? "Sinalizar ainda está com os curadores."
          : "Não deu pra marcar agora. Tenta de novo.",
      );
    } finally {
      setOcupado(false);
    }
  }

  async function cancelar() {
    if (!sessao || !sinalId) return;
    setOcupado(true);
    try {
      await api.cancelarSinal(sessao.token, sinalId);
      setSinalId(null);
      setRestante(null);
      invalidarMeus();
      router.refresh();
    } catch {
      setErro("Não deu pra cancelar. Tenta de novo.");
    } finally {
      setOcupado(false);
    }
  }

  if (sinalId && restante !== null && sessao) {
    return (
      <Confirmado
        restante={restante}
        dataFim={dataFim}
        roleId={roleId}
        token={sessao.token}
        aoCancelar={cancelar}
        ocupado={ocupado}
      />
    );
  }

  if (!sessao) {
    return (
      <div>
        <Link
          href="/entrar"
          onClick={() => guardarDestino(caminho)}
          className="block rounded-2xl bg-magenta py-4 text-center text-[15px] font-bold text-white"
        >
          Tô indo — vale por 2h
        </Link>
        <p className="mt-2.5 text-center text-[11.5px] text-muted-3">
          Entrar leva dez segundos. Ninguém vê seu nome no mapa.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={sinalizar}
        disabled={!podeSinalizar || ocupado}
        className={`w-full rounded-2xl py-4 text-[15px] font-bold ${
          podeSinalizar
            ? "bg-magenta text-white disabled:opacity-60"
            : "cursor-not-allowed bg-magenta/40 text-white/70"
        }`}
      >
        {ocupado ? "Marcando…" : "Tô indo — vale por 2h"}
      </button>
      <p className="mt-2.5 text-center text-[11.5px] leading-snug text-muted-3">
        {erro ??
          (podeSinalizar
            ? "Expira sozinho. Ninguém vê seu nome."
            : "Sinalizar ainda está com os curadores do bairro.")}
      </p>
    </div>
  );
}

/** A 2e: “Tá marcado”, com o que fazer em seguida. */
function Confirmado({
  restante,
  dataFim,
  roleId,
  token,
  aoCancelar,
  ocupado,
}: {
  restante: number;
  dataFim: string;
  roleId: string;
  token: string;
  aoCancelar: () => void;
  ocupado: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [abrindo, setAbrindo] = useState(false);

  const h = Math.floor(restante / 60);
  const m = restante % 60;

  async function comentar() {
    if (!texto.trim()) return;
    try {
      await api.comentar(token, roleId, texto.trim());
      setEnviado(true);
      setTexto("");
    } catch {
      /* silencioso: o sinal já está feito, o comentário é bônus */
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      <span className="pulse-agora flex h-19 w-19 items-center justify-center rounded-full bg-magenta">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}>
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <h2 className="mt-5.5 font-display text-[33px] leading-none uppercase">Tá marcado</h2>
      <p className="mt-2.5 max-w-[17rem] text-[13.5px] leading-relaxed text-muted">
        Seu sinal alimenta o mapa e some sozinho. O rolê vai até {hora(dataFim)}.
      </p>

      <div className="mt-6 w-full rounded-[20px] border border-white/7 bg-card-alt px-4.5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="rotulo text-muted-2">some em</span>
          <span className="font-display text-[22px]">
            {h > 0 ? `${h}h ${m}min` : `${m}min`}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/9">
          <div
            className="h-full rounded-full bg-gradient-to-r from-magenta to-amber"
            style={{ width: `${Math.min(100, (restante / JANELA_MIN) * 100)}%` }}
          />
        </div>
      </div>

      {enviado ? (
        <p className="mt-4 w-full rounded-2xl border border-white/8 bg-card-alt px-4 py-3.5 text-[13px] text-text-faint">
          Contado. Quem abrir o mapa vê.
        </p>
      ) : abrindo ? (
        <div className="mt-4 flex w-full flex-col gap-2.5">
          <textarea
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="fila andando, som bom, cabe gente…"
            className="w-full resize-none rounded-2xl border border-white/10 bg-sunken px-4 py-3 text-left text-[13.5px] text-text outline-none placeholder:text-muted-3 focus:border-magenta"
          />
          <button
            type="button"
            onClick={comentar}
            className="rounded-2xl bg-magenta py-3 text-[14px] font-bold text-white"
          >
            Contar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAbrindo(true)}
          className="mt-4 w-full rounded-2xl border border-white/16 py-3.5 text-[14px] font-semibold text-text-soft"
        >
          Contar como está lá dentro
        </button>
      )}

      <button
        type="button"
        onClick={aoCancelar}
        disabled={ocupado}
        className="mt-4 text-[12.5px] font-medium text-muted-3 hover:text-text-faint disabled:opacity-50"
      >
        {ocupado ? "…" : "Cancelar meu sinal"}
      </button>
    </div>
  );
}
