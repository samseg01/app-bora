"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  distanciaLegivel,
  ErroLocalizacao,
  interpretar,
  pedirPosicao,
  type Achado,
  type FalhaLocalizacao,
} from "@/lib/localizacao";

/**
 * "Buscar pela minha localização" na tela de abertura.
 *
 * Atalho, não substituto: a lista de recortes continua ali, e o resultado daqui apenas
 * pré-seleciona um deles. Quem está fora de área precisa poder escolher assim mesmo — a
 * pessoa pode estar em casa às 18h decidindo aonde ir mais tarde, e nesse caso a
 * localização atual é a informação menos relevante da tela.
 *
 * A resposta é honesta nos dois sentidos: se o recorte curado mais próximo está a 12 km,
 * a tela diz 12 km em vez de fingir cobertura. Descobrir cedo que o app não atende a sua
 * região é melhor do que descobrir depois de escolher um bairro no escuro.
 */
const RECADO: Record<FalhaLocalizacao, string> = {
  negado: "Você bloqueou a localização. Dá pra escolher o bairro na lista, funciona igual.",
  indisponivel: "O aparelho não conseguiu se localizar agora. Escolha na lista.",
  demorou: "A localização demorou demais. Escolha na lista — leva menos tempo.",
  "sem-suporte": "Este navegador não oferece localização. Escolha o bairro na lista.",
  "erro-rede": "Não deu pra falar com o servidor agora. Escolha o bairro na lista.",
};

export function BuscarPorLocalizacao({
  aoEncontrar,
}: {
  /** Pré-seleciona o recorte na lista da tela de abertura. */
  aoEncontrar: (bairro: string) => void;
}) {
  const [estado, setEstado] = useState<"parado" | "buscando">("parado");
  const [falha, setFalha] = useState<FalhaLocalizacao | null>(null);
  const [achado, setAchado] = useState<Achado | null>(null);

  async function buscar() {
    setEstado("buscando");
    setFalha(null);
    setAchado(null);
    try {
      const { lat, lng } = await pedirPosicao();
      const resultado = interpretar(await api.proximos(lat, lng));
      setAchado(resultado);
      if (resultado.bairro) aoEncontrar(resultado.bairro);
    } catch (e) {
      setFalha(e instanceof ErroLocalizacao ? e.tipo : "erro-rede");
    } finally {
      setEstado("parado");
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={buscar}
        disabled={estado === "buscando"}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/16 py-3.5 text-[13.5px] font-semibold text-text-soft transition-colors hover:border-white/30 disabled:opacity-60"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff6fa0" strokeWidth={2}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2v3.2M12 18.8V22M22 12h-3.2M5.2 12H2" />
          <circle cx="12" cy="12" r="8" />
        </svg>
        {estado === "buscando" ? "Procurando você…" : "Buscar pela minha localização"}
      </button>

      {falha && (
        <p className="mt-2.5 text-center text-[12px] leading-relaxed text-muted-3">
          {RECADO[falha]}
        </p>
      )}

      {achado && <Resultado achado={achado} />}

      {!falha && !achado && (
        <p className="mt-2.5 text-center text-[11.5px] leading-relaxed text-muted-3">
          Só para achar o bairro. Sua posição não é guardada nem fica visível pra ninguém.
        </p>
      )}
    </div>
  );
}

function Resultado({ achado }: { achado: Achado }) {
  if (!achado.bairro || achado.distancia_m === null) {
    return (
      <div className="mt-3 rounded-[18px] border border-white/8 bg-card-alt px-4 py-3.5">
        <div className="text-[13.5px] font-bold">Ainda não andamos por aí</div>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-2">
          Nenhum recorte que a gente curou fica perto de você. Escolha um da lista pra dar uma
          olhada — ou espere: a curadoria anda a pé, um bairro por vez.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-[18px] border border-magenta/30 bg-gradient-to-br from-magenta/12 to-violet/8 px-4 py-3.5">
      <div className="rotulo text-magenta-soft">
        {achado.dentro ? "você está aqui" : "o mais perto que curamos"}
      </div>
      <div className="mt-1.5 text-[15px] font-bold">
        {achado.bairro}
        <span className="ml-2 text-[12.5px] font-medium text-muted-2">
            a {distanciaLegivel(achado.distancia_m)}
        </span>
      </div>

      {achado.lugares.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-1.5 border-t border-white/8 pt-2.5">
          {achado.lugares.map(({ lugar, distancia_m, role_ativo }) => (
            <li key={lugar.id} className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="min-w-0 truncate text-text-faint">
                {lugar.nome}
                {role_ativo && <span className="text-magenta-soft"> · {role_ativo.titulo}</span>}
              </span>
              <span className="shrink-0 text-muted-3">{distanciaLegivel(distancia_m)}</span>
            </li>
          ))}
        </ul>
      )}

      {!achado.dentro && (
        <p className="mt-2.5 text-[12px] leading-relaxed text-muted-2">
          Longe pra ir a pé hoje, mas dá pra ver o que está rolando lá.
        </p>
      )}
    </div>
  );
}
