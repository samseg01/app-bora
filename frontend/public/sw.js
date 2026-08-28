/*
 * Service worker do Bora?
 *
 * ## A regra que define este arquivo: cachear a casca, nunca o dado
 *
 * O produto responde "o que está rolando AGORA". Servir de cache um rolê de ontem
 * rotulado como "bombando agora" seria a pior coisa que este app pode fazer — pior que
 * não abrir. Por isso aqui não há cache de resposta de API nem de página renderizada:
 * elas carregam dado que envelhece em minutos.
 *
 * O que é cacheado é só o que não mente: JS, CSS, fontes e ícones. Isso basta para o
 * app abrir instantaneamente na rua; os dados vêm da rede, e quando não vêm, as telas
 * já sabem dizer que não vieram (`ApiOffline` em `lib/api.ts`).
 *
 * Navegação sem rede cai na página `/offline.html`, que não finge ter conteúdo.
 */

const VERSAO = "bora-v1";
const ESTATICOS = `${VERSAO}-estaticos`;
const CASCA = `${VERSAO}-casca`;
const OFFLINE = "/offline.html";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(CASCA)
      .then((cache) => cache.addAll([OFFLINE]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves.filter((c) => !c.startsWith(VERSAO)).map((c) => caches.delete(c)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Assets imutáveis do build e ícones: conteúdo que não envelhece. */
function ehEstatico(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:css|js|woff2?|ttf|png|jpg|jpeg|svg|webp|avif)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // A API passa direto, sempre. Ver a regra no topo: dado de frescor não se cacheia.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (ehEstatico(url)) {
    evento.respondWith(
      caches.match(req).then(
        (acertou) =>
          acertou ??
          fetch(req).then((resp) => {
            // Só guardamos resposta completa e boa; opaca ou parcial vira lixo silencioso.
            if (resp.ok && resp.status === 200) {
              const copia = resp.clone();
              caches.open(ESTATICOS).then((cache) => cache.put(req, copia));
            }
            return resp;
          }),
      ),
    );
    return;
  }

  // Navegação: rede sempre. Falhou, mostramos a página de offline — nunca uma versão
  // antiga da home, que pareceria atual e estaria errada.
  if (req.mode === "navigate") {
    evento.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE).then((r) => r ?? Response.error())),
    );
  }
});
