import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Empacota o app num `server.js` com só as dependências que ele de fato importa,
   * em vez de exigir o `node_modules` inteiro na imagem. É o que torna o Dockerfile
   * do frontend viável (ADR de raiz 0001: front e back no mesmo box).
   *
   * Efeito colateral a lembrar: o standalone **não** copia `public/` nem
   * `.next/static` — quem faz isso é o Dockerfile. Se um dia a imagem subir sem CSS
   * e sem ícone do PWA, é este par de COPY que faltou, não o build.
   */
  output: "standalone",

  /**
   * O servidor de desenvolvimento do Next 16 bloqueia requisições cross-origin aos
   * assets de dev por padrão. Sem liberar o domínio do túnel, abrir o app pelo celular
   * em outra rede carrega o HTML e nada mais — o JS e o HMR são recusados, e a tela
   * fica quebrada de um jeito que parece bug do app.
   *
   * `*.trycloudflare.com` é o domínio dos túneis rápidos do `cloudflared`, usados para
   * conferir o app num telefone de verdade (o teste de campo do R8). Vale só em
   * desenvolvimento — o Next ignora esta chave em produção.
   *
   * O IP solto é a máquina de desenvolvimento na rede local, para abrir o app pelo
   * celular sem túnel. **Ele muda quando o DHCP renovar** — se o telefone carregar
   * só o HTML, conferir o IP antes de procurar bug no app. Testar por IP também
   * custa a geolocalização: `navigator.geolocation` exige contexto seguro e por
   * `http://` nem existe. Quem precisa dela usa o túnel, que é HTTPS.
   */
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.15.63"],
};

export default nextConfig;
