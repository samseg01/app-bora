"use client";

import { Desktop, Mobile } from "@/components/viewport";
import { Porta } from "@/components/ui/porta";
import { PainelDono } from "@/components/ui/painel-dono";
import { DesktopShell } from "@/views/desktop/shell";
import { MobileShell } from "@/views/mobile/shell";

/**
 * A visão do dono do estabelecimento — a terceira superfície do produto, ao lado do
 * app público e do painel do curador.
 *
 * É uma tela só nas duas visualizações: o conteúdo é a mesma leitura agregada, e não
 * há navegação para lugar nenhum. Por isso o desktop vai sem coluna lateral — uma nav
 * de um item é moldura vazia.
 */
export default function EstabelecimentoPage() {
  return (
    <Porta
      titulo="Painel do estabelecimento"
      descricao="Aqui o dono da casa vê o que a comunidade fez com ela. Precisa entrar."
      exige="dono_estabelecimento"
    >
      <Mobile>
        <MobileShell nav={false}>
          <PainelDono />
        </MobileShell>
      </Mobile>
      <Desktop>
        <DesktopShell semBarra>
          <PainelDono />
        </DesktopShell>
      </Desktop>
    </Porta>
  );
}
