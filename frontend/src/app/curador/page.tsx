"use client";

import { useEffect, useState } from "react";
import { Desktop, Mobile } from "@/components/viewport";
import { Porta } from "@/components/ui/porta";
import { CuradorDesktop } from "@/views/desktop/curador";
import { CuradorMobile } from "@/views/mobile/curador";
import { api } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import { bairroDoCookie, BAIRROS } from "@/lib/bairros";
import type { LugarPublic, RoleDescoberta } from "@/lib/types";

/**
 * Painel do curador, com dado real. Era a última tela a mostrar ficção depois do login
 * — e a mais fácil de ligar, porque o CRUD em `/curador/*` existe e é testado desde o
 * esqueleto do backend.
 *
 * A `Porta` exige o papel, não só a sessão: quem entra como gente comum vê que publicar
 * é de quem valida em campo.
 */
const DUAS_HORAS_MS = 2 * 60 * 60 * 1000;

export default function CuradorPage() {
  return (
    <Porta
      titulo="Painel do curador"
      descricao="Publicar rolê é coisa de quem valida em campo. Precisa entrar como curador."
      curador
    >
      <PainelCarregado />
    </Porta>
  );
}

function PainelCarregado() {
  const sessao = useSessao();
  const token = sessao?.token;
  const [dados, setDados] = useState<{
    roles: RoleDescoberta[];
    lugares: LugarPublic[];
    terminandoLogo: number;
  } | null>(null);

  const bairro = bairroDoCookie() ?? BAIRROS[0].nome;

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    void (async () => {
      const [roles, lugares] = await Promise.all([
        api.curadorRoles(token, bairro),
        api.curadorLugares(token, bairro),
      ]);
      if (!vivo) return;

      // `GET /curador/roles` devolve RolePublic, sem o nome do lugar — a tela precisa
      // dele, então resolvemos aqui em vez de pedir mais uma rota ao backend.
      const porId = new Map(lugares.map((l) => [l.id, l] as const));
      const agora = Date.now();

      setDados({
        lugares,
        terminandoLogo: roles.filter(
          (r) => new Date(r.data_fim).getTime() - agora < DUAS_HORAS_MS,
        ).length,
        roles: roles.map((r) => ({
          id: r.id,
          titulo: r.titulo,
          descricao: r.descricao ?? null,
          categoria: r.categoria,
          data_inicio: r.data_inicio,
          data_fim: r.data_fim,
          frescor: r.frescor,
          lugar_nome: porId.get(r.lugar_id)?.nome ?? "—",
          lugar_bairro: porId.get(r.lugar_id)?.bairro ?? "",
        })),
      });
    })();
    return () => {
      vivo = false;
    };
  }, [token, bairro]);

  if (!dados) return null;

  return (
    <>
      <Mobile>
        <CuradorMobile roles={dados.roles} lugares={dados.lugares} bairro={bairro} />
      </Mobile>
      <Desktop>
        <CuradorDesktop
          roles={dados.roles}
          lugares={dados.lugares}
          bairro={bairro}
          terminandoLogo={dados.terminandoLogo}
        />
      </Desktop>
    </>
  );
}
