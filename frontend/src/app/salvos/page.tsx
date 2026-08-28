"use client";

import { useEffect, useState } from "react";
import { Desktop, Mobile } from "@/components/viewport";
import { Porta } from "@/components/ui/porta";
import { SalvosDesktop, type ItemSalvo } from "@/views/desktop/salvos";
import { SalvosMobile } from "@/views/mobile/salvos";
import { api } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import { bairroDoCookie, BAIRROS } from "@/lib/bairros";

/**
 * Tela 2g — o caderninho, com dado real.
 *
 * Antes mostrava seis lugares de exemplo mesmo depois do login, o que é a pior versão
 * do problema: dado inventado apresentado como sendo seu.
 *
 * `GET /salvos` devolve só `lugar_id`, então cada item custa uma chamada a
 * `/lugares/{id}` — o N+1 do item 16 do TODO da raiz. Com o volume de um caderninho
 * pessoal isso é aceitável; com a rota enriquecida vira uma chamada só.
 */
export default function SalvosPage() {
  return (
    <Porta
      titulo="Seus lugares salvos"
      descricao="O caderninho é só seu — ninguém mais vê. Para isso, ele precisa saber quem é você."
    >
      <SalvosCarregados />
    </Porta>
  );
}

function SalvosCarregados() {
  const sessao = useSessao();
  const token = sessao?.token;
  const [itens, setItens] = useState<ItemSalvo[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    void (async () => {
      const bairro = bairroDoCookie() ?? BAIRROS[0].nome;
      const [salvos, pins] = await Promise.all([
        api.salvos(token),
        api.mapa(bairro).catch(() => []),
      ]);
      const lugares = await Promise.all(
        salvos.map((s) => api.lugar(s.lugar_id).catch(() => null)),
      );
      if (!vivo) return;
      setItens(
        lugares
          .filter((l) => l !== null)
          .map((lugar) => ({
            lugar,
            // O rolê ativo só existe em /mapa; para lugar de outro bairro fica nulo.
            role: pins.find((p) => p.lugar.id === lugar.id)?.role_ativo ?? null,
          })),
      );
    })();
    return () => {
      vivo = false;
    };
  }, [token]);

  if (!itens) return null;

  return (
    <>
      <Mobile>
        <SalvosMobile itens={itens} />
      </Mobile>
      <Desktop>
        <SalvosDesktop itens={itens} />
      </Desktop>
    </>
  );
}
