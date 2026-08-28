import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * O servidor de desenvolvimento do Next 16 bloqueia requisições cross-origin aos
   * assets de dev por padrão. Sem liberar o domínio do túnel, abrir o app pelo celular
   * em outra rede carrega o HTML e nada mais — o JS e o HMR são recusados, e a tela
   * fica quebrada de um jeito que parece bug do app.
   *
   * `*.trycloudflare.com` é o domínio dos túneis rápidos do `cloudflared`, usados para
   * conferir o app num telefone de verdade (o teste de campo do R8). Vale só em
   * desenvolvimento — o Next ignora esta chave em produção.
   */
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
