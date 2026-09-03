"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { guardarDestino, useSessao } from "@/lib/auth";
import { invalidarMeus, meusSinais } from "@/lib/meus";
import { distanciaLegivel, pedirPosicao } from "@/lib/localizacao";
import { hora } from "@/lib/tempo";
import type { TipoSinalizacao } from "@/lib/types";

/**
 * O "Tô indo" e a confirmação que vem depois — a tela 2e do hi-fi, implementada como
 * estado do detalhe e não como rota nova: a pessoa não saiu do rolê, ela marcou
 * presença nele.
 *
 * **Duas ações, um botão só.** O ADR-009 (emenda 2) separou "Tô aqui" de "Tô indo",
 * e elas continuam separadas *no dado* — só a primeira alimenta o frescor. O que
 * mudou em 02/09 é quem escolhe entre as duas: **o app, não a pessoa**.
 *
 * A razão é que a diferença entre elas não é preferência, é **fato verificável**: ou
 * você está dentro do raio ou não está, e o telefone sabe. Oferecer as duas era
 * pedir que a pessoa declarasse algo que o aparelho podia medir — com o risco de ela
 * declarar errado, por engano ou de propósito, e envenenar o frescor.
 *
 * O botão pergunta a localização e decide: dentro do raio vira `presenca`; longe ou
 * sem permissão vira `intencao`, **e a tela diz por quê**. Com intenção marcada o
 * mesmo botão continua ali, porque chegar é o próximo passo — a transição
 * intenção→presença acontece na mesma linha (ver `POST /sinalizacoes`).
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
  /** A distância que o servidor recusou, quando recusou. Guardada para a tela de
      intenção poder dizer POR QUE virou "vou" em vez de "estou" — sem isso a
      pessoa toca esperando acender o rolê e recebe outra coisa, sem explicação. */
  const [distancia, setDistancia] = useState<number | null>(null);
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

  /**
   * Um botão só. O app pergunta onde a pessoa está e **decide qual das duas ações
   * é a verdadeira** — porque a diferença entre "Tô aqui" e "Tô indo" não é
   * preferência, é fato: ou você está dentro do raio ou não está, e o telefone
   * sabe. Fazer a pessoa escolher era pedir que ela declarasse algo que o
   * aparelho podia medir, com o risco de ela escolher errado (por engano ou de
   * propósito) e envenenar o frescor.
   *
   * A cascata, em ordem de tentativa:
   *
   * 1. **Está no raio** → `presenca`. Acende o rolê. É o caso que o produto quer.
   * 2. **Está longe** (403) → `intencao`, e a tela explica que anotou a intenção
   *    em vez de mostrar um erro. Ficar longe não é falha da pessoa: ela clicou a
   *    coisa certa, só ainda não chegou.
   * 3. **Negou a localização, ou o GPS falhou** → `intencao` também. O ADR-009 diz
   *    "sem permissão, sem sinal", e isso continua valendo — para **presença**.
   *    Intenção não afirma estar em lugar nenhum, então não precisa de GPS, e
   *    recusá-la por falta de permissão seria punir quem só quis avisar que vem.
   *
   * O que NÃO muda: intenção continua sem alimentar o frescor, e continua virando
   * presença na mesma linha quando a pessoa chega e toca de novo.
   */
  async function bora() {
    if (!sessao) return;
    setOcupado(true);
    setErro(null);
    try {
      let pos: { lat: number; lng: number } | null = null;
      try {
        pos = await pedirPosicao();
      } catch {
        // Sem localização não dá para afirmar presença — mas dá para registrar
        // que a pessoa pretende ir, e é isso que fazemos abaixo.
      }

      if (pos) {
        try {
          const s = await api.sinalizar(sessao.token, roleId, "presenca", pos);
          setSinal({ id: s.id, tipo: s.tipo });
          setRestante(minutosRestantes(s.timestamp));
          invalidarMeus();
          router.refresh();
          return;
        } catch (e) {
          // 403 é o servidor dizendo "você não está aqui" — resposta esperada, não
          // erro. Qualquer outra coisa é falha de verdade e sobe.
          if (!(e instanceof ApiError && e.status === 403)) throw e;
          setDistancia(distanciaDoErro(e));
        }
      }

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

  // Disse que vem, ainda não chegou. Não é fim de fluxo: o mesmo botão continua na
  // tela porque chegar é o próximo passo, e é ele que acende o rolê para os outros.
  //
  // A tela DIZ A CAUSA. Como agora há um botão só, a pessoa tocou esperando acender
  // o rolê e recebeu outra coisa — sem explicar por quê, isso lê como o app ter
  // feito algo pelas costas dela.
  if (sinal?.tipo === "intencao" && sessao) {
    return (
      <div className="elevado rounded-[16px]  border border-linha bg-card-alt px-4.5 py-4">
        <div className="rotulo text-muted-2">tá anotado</div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted text-pretty">
          {distancia
            ? `Você está a ${distanciaLegivel(distancia)} daqui, então ficou anotado que você vem. `
            : "Ficou anotado que você vem. "}
          Isso <strong className="text-text-faint">não acende o rolê</strong> para os outros —
          quem faz isso é chegar lá. Toca de novo quando estiver no lugar.
        </p>
        <button
          type="button"
          onClick={bora}
          disabled={ocupado}
          className="rounded-[12px] mt-3.5 w-full bg-text py-3.5 text-[15px] font-bold text-bg disabled:opacity-60"
        >
          {ocupado ? "Conferindo onde você está…" : "Cheguei"}
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
          className="rounded-[12px] block bg-text py-4 text-center text-[15px] font-bold text-bg"
        >
          Bora
        </Link>
        <p className="mt-2.5 text-center text-[11.5px] text-muted-3">
          Entrar leva dez segundos. Ninguém vê seu nome no mapa.
        </p>
      </div>
    );
  }

  // Um botão. O texto secundário conta a regra ANTES do toque — que vai conferir a
  // localização e que sem estar lá o sinal vira "vou". Descobrir isso depois de
  // tocar seria a pessoa achar que acendeu o rolê quando não acendeu.
  return (
    <div>
      <button
        type="button"
        onClick={bora}
        disabled={ocupado}
        className="rounded-[12px] w-full bg-text py-4 text-[15px] font-bold text-bg disabled:opacity-60"
      >
        {ocupado ? "Conferindo onde você está…" : "Bora"}
      </button>
      <p className="mt-2.5 text-center text-[11.5px] leading-snug text-muted-3 text-pretty">
        {erro ??
          "Se você já estiver no lugar, acende o rolê pra quem está decidindo. Se ainda não, fica anotado que você vem. Ninguém vê seu nome."}
      </p>
    </div>
  );
}

/** A distância que o servidor recusou, em metros, lida do `detail` estruturado.

    A conta é do backend, feita com PostGIS contra o raio daquele lugar. Refazê-la
    no cliente exigiria a coordenada do lugar e daria um número ligeiramente
    diferente — dois números para a mesma pergunta é pior que um.

    Até 02/09 isto era um `match()` sobre a frase em português da mensagem de erro.
    Duas coisas erradas de uma vez: quebraria calado no primeiro dia em que alguém
    reescrevesse o texto do backend, e a própria regex tinha um byte de backspace
    no lugar da borda de palavra — escrito por engano e invisível em qualquer revisão. */
function distanciaDoErro(e: ApiError): number | null {
  const m = e.dados?.distancia_m;
  return typeof m === "number" ? m : null;
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
      <span className="pulse-live flex h-19 w-19 items-center justify-center rounded-full bg-live">
        {/* `text-text` porque o círculo voltou a ser magenta na camada 2. Este ✓ já
            foi invisível uma vez — era `stroke="#fff"` fixo dentro de um círculo que
            virou branco, e só apareceu num screenshot de telefone. Agora a cor vem
            da classe, então ela acompanha o fundo em vez de ficar para trás. */}
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          className="text-text"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <h2 className="mt-5.5 titulo text-[33px] leading-none">Tá marcado</h2>
      <p className="mt-2.5 max-w-[17rem] text-[13.5px] leading-relaxed text-muted">
        Seu sinal alimenta o mapa e some sozinho. O rolê vai até {hora(dataFim)}.
      </p>

      <div className="rounded-[12px] mt-6 w-full border border-linha bg-card-alt px-4.5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="rotulo text-muted-2">some em</span>
          <span className="titulo text-[22px]">
            {h > 0 ? `${h}h ${m}min` : `${m}min`}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/9">
          <div
            // O gradiente magenta→âmbar é literalmente o do hi-fi
            // (`linear-gradient(90deg,#ff3d81,#ffb443)`): a barra vai de "agora" a
            // "esfriando", que é o que ela mede. Na camada 1 tinha virado
            // branco→preto, e a metáfora se perdia junto com a cor.
            className="h-full rounded-full bg-gradient-to-r from-live to-warm"
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
