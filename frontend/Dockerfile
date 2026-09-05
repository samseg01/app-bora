# Imagem de produção do frontend (Next 16, SSR standalone).
#
# Só existe por causa do ADR de raiz 0001: front e back rodam no mesmo box, atrás
# do mesmo Caddy. Até 03/09 o frontend não era conteinerizado — ia pra Vercel.
#
# Três estágios para que a imagem final não carregue nem o node_modules de build
# nem o código-fonte: `output: "standalone"` no next.config.ts faz o Next montar
# um server.js com só as dependências que ele de fato importa.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `NEXT_PUBLIC_*` é assado no bundle do navegador, então precisa existir AQUI e não
# adianta passar depois no `environment:` do compose. O valor é relativo de propósito:
# no mesmo box e atrás do mesmo Caddy, o navegador pede /api/v1 na própria origem —
# sem CORS, sem domínio hardcoded, e trocar de domínio não obriga a rebuildar.
ARG NEXT_PUBLIC_API_URL=/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Esta é lida em tempo de execução pelo server component (ver lib/api.ts), mas vai
# junto no build para o caso de o Next inliná-la — o valor é o mesmo nos dois momentos.
ARG API_URL_INTERNA=http://api:8000/api/v1
ENV API_URL_INTERNA=$API_URL_INTERNA

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# NODE_ENV=production é também o que desliga as fixtures de exemplo do R6: em
# produção /salvos, /perfil, /curador e /conexoes pedem login em vez de mostrar
# dado inventado. Rodar esta imagem com NODE_ENV=development vazaria exemplo.

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
