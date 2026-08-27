"use client";

import { useEffect, useState } from "react";
import { Desktop, Mobile } from "@/components/viewport";
import { Porta } from "@/components/ui/porta";
import { PerfilDesktop } from "@/views/desktop/perfil";
import { PerfilMobile } from "@/views/mobile/perfil";
import { api } from "@/lib/api";
import { limparSessao, useSessao } from "@/lib/auth";
import { BAIRRO_PILOTO } from "@/lib/config";
import type { UsuarioPublic } from "@/lib/types";

/**
 * Tela 2h. Primeira tela do app a rodar com dado real de usuário — nome e data de
 * cadastro vêm de `GET /auth/me`, que só passou a existir junto com o login.
 *
 * Design: docs/front-end-ideias/entrar/ (a auth) e o hi-fi 2h (o perfil em si).
 */
export default function PerfilPage() {
  return (
    <Porta
      titulo="Seu perfil"
      descricao="Bairro, lugares salvos e privacidade ficam aqui depois que você entrar."
    >
      <PerfilCarregado />
    </Porta>
  );
}

function PerfilCarregado() {
  // A Porta já garantiu que há sessão; aqui só se lê o token para as chamadas.
  const sessao = useSessao();
  const [eu, setEu] = useState<UsuarioPublic | null>(null);
  const [salvos, setSalvos] = useState(0);

  const token = sessao?.token;

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    void (async () => {
      try {
        const u = await api.eu(token);
        if (vivo) setEu(u);
      } catch {
        // Token recusado pelo backend (expirado, segredo trocado): sai da sessão em
        // vez de deixar a tela num limbo silencioso.
        limparSessao();
        if (vivo) location.reload();
        return;
      }
      try {
        const s = await api.salvos(token);
        if (vivo) setSalvos(s.length);
      } catch {
        /* salvos é acessório aqui; a tela vale sem ele */
      }
    })();
    return () => {
      vivo = false;
    };
  }, [token]);

  if (!eu) return null;

  const desde = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(eu.created_at));

  return (
    <>
      <Mobile>
        <PerfilMobile bairro={BAIRRO_PILOTO} salvos={salvos} nome={eu.nome} desde={desde} />
      </Mobile>
      <Desktop>
        <PerfilDesktop bairro={BAIRRO_PILOTO} salvos={salvos} nome={eu.nome} desde={desde} />
      </Desktop>
    </>
  );
}
