"use client";

import { useEffect, useState } from "react";
import { Desktop, Mobile } from "@/components/viewport";
import { Porta } from "@/components/ui/porta";
import { SalvosDesktop, type ItemSalvo } from "@/views/desktop/salvos";
import { SalvosMobile } from "@/views/mobile/salvos";
import { api } from "@/lib/api";
import { useSessao } from "@/lib/auth";

/**
 * Tela 2g — o caderninho, com dado real.
 *
 * Antes mostrava seis lugares de exemplo mesmo depois do login, o que é a pior versão
 * do problema: dado inventado apresentado como sendo seu.
 *
 * Uma chamada monta a tela inteira. Até 28/08 eram N+1: `GET /salvos` devolvia só
 * `lugar_id`, cada item custava um `/lugares/{id}`, e o rolê de hoje vinha de um
 * `GET /mapa` — **filtrado pelo bairro selecionado**. Resultado: lugar salvo em outro
 * recorte aparecia como "sem rolê hoje" mesmo tendo rolê. O caderninho atravessa
 * bairros por natureza, e perguntar isso ao mapa de um bairro só era a pergunta errada.
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
    void api
      .salvos(token)
      .then((salvos) => {
        if (!vivo) return;
        setItens(salvos.map((s) => ({ lugar: s.lugar, role: s.role_ativo })));
      })
      .catch(() => {
        if (vivo) setItens([]);
      });
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
