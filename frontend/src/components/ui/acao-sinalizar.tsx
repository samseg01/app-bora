"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { guardarDestino, useSessao } from "@/lib/auth";
import { invalidarMeus, meusSinais } from "@/lib/meus";
import { ErroLocalizacao, pedirPosicao } from "@/lib/localizacao";
import { hora } from "@/lib/tempo";
import type { TipoSinalizacao } from "@/lib/types";

/**
 * O "Tô indo" e a confirmação que vem depois — a tela 2e do hi-fi, implementada como
 * estado do detalhe e não como rota nova: a pessoa não saiu do rolê, ela marcou
 * presença nele.
 *
 * **Duas ações, não uma** (ADR-009, emenda 2), e a diferença é onde a pessoa está:
 * - **"Tô aqui"** — pede a localização, o servidor confere se está dentro do raio e
 *   recusa com 403 se não estiver. É o único que alimenta o frescor.
 * - **"Tô indo"** — não pede nada, porque afirma justamente que a pessoa não está lá.
 *   Não acende nada hoje: quem vai ler isso é a aba de Conexões, que não tem backend.
 *   A tela diz isso em vez de fingir que serve para alguma coisa agora.
 *
 * As duas não são paralelas: **quem disse que ia e chegou toca "Tô aqui" e vira
 * presença**, na mesma linha. Por isso, com intenção marcada, o "Tô aqui" continua na
 * tela — é o próximo passo, não uma alternativa.
 *
 * A restrição a curador/dono CAIU com o ADR-009 (item 40): ela existia porque o sinal
 * era autodeclarado e forjável, e a âncora agora é a coordenada, não o papel.
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

  /** O sinal ativo desta pessoa neste rolê. O `tipo` importa: "Tô indo" e "Tô aqui"
      levam a telas diferentes, e a transição de um para o outro é a mesma linha. */
  const [sinal, setSinal] = useState<{ id: string; tipo: TipoSinalizacao } | null>(null);
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
        setSinal({ id: meu.id, tipo: meu.tipo });
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

  async function toAqui() {
    if (!sessao) return;
    setOcupado(true);
    setErro(null);
    try {
      // O único momento do app em que a coordenada é pedida para escrever algo. Ela vai
      // no corpo, o servidor confere contra o raio do lugar e descarta — nada é gravado.
      const pos = await pedirPosicao();
      const s = await api.sinalizar(sessao.token, roleId, "presenca", pos);
      setSinal({ id: s.id, tipo: s.tipo });
      setRestante(minutosRestantes(s.timestamp));
      invalidarMeus();
      router.refresh();
    } catch (e) {
      setErro(mensagemDeFalha(e));
    } finally {
      setOcupado(false);
    }
  }

  async function toIndo() {
    if (!sessao) return;
    setOcupado(true);
    setErro(null);
    try {
      const s = await api.sinalizar(sessao.token, roleId, "intencao");
      setSinal({ id: s.id, tipo: s.tipo });
      setRestante(minutosRestantes(s.timestamp));
      invalidarMeus();
    } catch {
      setErro("Não deu pra marcar agora. Tenta de novo.");
    } finally {
      setOcupado(false);
    }
  }

  async function cancelar() {
    if (!sessao || !sinal) return;
    setOcupado(true);
    try {
      await api.cancelarSinal(sessao.token, sinal.id);
      setSinal(null);
      setRestante(null);
      invalidarMeus();
      router.refresh();
    } catch {
      setErro("Não deu pra cancelar. Tenta de novo.");
    } finally {
      setOcupado(false);
    }
  }

  if (sinal?.tipo === "presenca" && restante !== null && sessao) {
    return (
      <Confirmado
        restante={restante}
        dataFim={dataFim}
        aoCancelar={cancelar}
        ocupado={ocupado}
      />
    );
  }

  // Disse que vem, ainda não chegou. Não é um fim de fluxo: o "Tô aqui" continua na
  // tela porque chegar é o próximo passo, e é ele que acende o rolê para os outros.
  if (sinal?.tipo === "intencao" && sessao) {
    return (
      <div className="rounded-[20px] border border-white/8 bg-card-alt px-4.5 py-4">
        <div className="rotulo text-muted-2">tá anotado</div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted text-pretty">
          Você marcou que vem. Isso <strong className="text-text-faint">não acende o rolê</strong>{" "}
          para os outros — quem faz isso é chegar lá. Quando estiver no lugar, toca em “Tô aqui”.
        </p>
        <button
          type="button"
          onClick={toAqui}
          disabled={ocupado}
          className="mt-3.5 w-full rounded-2xl bg-magenta py-3.5 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {ocupado ? "Conferindo onde você está…" : "Cheguei — Tô aqui"}
        </button>
        <p className="mt-2.5 text-center text-[11.5px] leading-snug text-muted-3">
          {erro ?? "Confere sua localização e esquece. Ninguém vê seu nome."}
        </p>
        <button
          type="button"
          onClick={cancelar}
          disabled={ocupado}
          className="mt-2 w-full text-[12.5px] font-medium text-muted-3 hover:text-text-faint disabled:opacity-50"
        >
          Não vou mais
        </button>
      </div>
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
          Tô aqui — acende o rolê
        </Link>
        <p className="mt-2.5 text-center text-[11.5px] text-muted-3">
          Entrar leva dez segundos. Ninguém vê seu nome no mapa.
        </p>
      </div>
    );
  }

  // Duas ações, e a hierarquia visual diz qual é a do produto: "Tô aqui" é o CTA
  // primário porque é o que alimenta o frescor. "Tô indo" é secundário porque hoje não
  // acende nada — e o texto embaixo diz isso, em vez de deixar a pessoa achar que
  // marcou o rolê para todo mundo.
  return (
    <div>
      <button
        type="button"
        onClick={toAqui}
        disabled={ocupado}
        className="w-full rounded-2xl bg-magenta py-4 text-[15px] font-bold text-white disabled:opacity-60"
      >
        {ocupado ? "Conferindo onde você está…" : "Tô aqui — acende o rolê"}
      </button>
      <button
        type="button"
        onClick={toIndo}
        disabled={ocupado}
        className="mt-2.5 w-full rounded-2xl border border-white/10 bg-card-alt py-3.5 text-[14px] font-semibold text-text-soft disabled:opacity-60"
      >
        Ainda tô indo
      </button>
      <p className="mt-2.5 text-center text-[11.5px] leading-snug text-muted-3 text-pretty">
        {erro ?? "“Tô aqui” confere se você está no lugar e some sozinho em 2h. Ninguém vê seu nome."}
      </p>
    </div>
  );
}

/** Traduz a falha para o que a pessoa precisa fazer a respeito.

    O 403 vem com a distância e o limite calculados pelo servidor, e é ele que aparece:
    o ADR-009 registra que o GPS erra mais justamente dentro do bar, então esta recusa
    vai acontecer com gente honesta que está mesmo lá. "Não foi possível" faria ela achar
    que o app quebrou. */
function mensagemDeFalha(e: unknown): string {
  if (e instanceof ErroLocalizacao) {
    if (e.tipo === "negado")
      return "Sem a localização não dá pra confirmar que você está aqui. Você pode marcar “Ainda tô indo”.";
    if (e.tipo === "sem-suporte")
      return "Este navegador não informa localização por aqui. Tenta pelo app instalado.";
    return "Não consegui te localizar agora. Tenta de novo em alguns segundos.";
  }
  if (e instanceof ApiError && e.status === 403) {
    return e.detalhe ?? "Você precisa estar no lugar para marcar presença.";
  }
  return "Não deu pra marcar agora. Tenta de novo.";
}

/** A 2e: “Tá marcado”, com o contador e o desfazer. Comentar saiu daqui para
    `contar-como-esta.tsx`: estava trancando atrás da sinalização a única contribuição
    que uma conta comum tem permissão de dar. */
function Confirmado({
  restante,
  dataFim,
  aoCancelar,
  ocupado,
}: {
  restante: number;
  dataFim: string;
  aoCancelar: () => void;
  ocupado: boolean;
}) {
  const h = Math.floor(restante / 60);
  const m = restante % 60;


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
