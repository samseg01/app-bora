import Link from "next/link";
import { AcaoSalvar } from "@/components/ui/acao-salvar";
import { FrescorPill } from "@/components/ui/frescor-pill";
import { hora } from "@/lib/tempo";
import type { LugarDetalhe, RolePin } from "@/lib/types";

/**
 * A ficha do lugar — o conteúdo da tela `/lugar/[id]`, compartilhado pelas duas
 * visualizações porque é a mesma leitura; só a moldura muda.
 *
 * Esta tela não existia. Só havia `/role/[id]`, então um lugar sem rolê hoje era
 * inalcançável na interface: clicar no nome não levava a lugar nenhum. Isso deixava de
 * fora justamente o degrau de baixo da escada do `conceito.md` — o boteco aberto e com
 * movimento, sem nada programado.
 *
 * Cada campo aparece só se existir. Nada de "não informado", que enche a tela de buracos
 * e conta que o cadastro está pela metade; a ausência de uma linha já diz isso a quem
 * cadastra, sem dizer nada a quem lê.
 */
export function LugarFicha({
  lugar,
  roleHoje,
}: {
  lugar: LugarDetalhe;
  roleHoje: RolePin | null;
}) {
  const preco = lugar.preco_longneck ? Number(lugar.preco_longneck) : null;

  const foto = lugar.fotos?.[0];

  return (
    <div className="flex flex-col">
      {/* Primeiro plano: a foto que o curador tirou no lugar. Sem foto, o bloco de cor do
          design — que nunca foi provisório, é a escolha visual do hi-fi enquanto não há
          foto de campo. O degradê vem do nome, então a mesma casa tem sempre a mesma cor.

          `<img>` e não `next/image` de propósito: a URL é arbitrária (hoje colada pelo
          curador, amanhã vinda do nosso armazenamento), e `remotePatterns` exigiria
          declarar cada host antes de saber quais serão. */}
      <div className="relative h-56 w-full shrink-0 overflow-hidden lg:h-72">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt={`Foto de ${lugar.nome}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-magenta via-violet to-plum" />
        )}
        {/* O degradê para baixo costura a imagem com o fundo da tela e mantém o título
            legível sobre qualquer foto. */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
      </div>

      <div className="-mt-6 flex flex-col gap-5 px-5.5 pb-8 lg:px-8">
      <div>
        <div className="rotulo text-amber">{lugar.categoria}</div>
        <h1 className="mt-2 font-display text-[34px] leading-none uppercase lg:text-[42px]">
          {lugar.nome}
        </h1>
        <p className="mt-2 text-[13px] text-muted-2">{lugar.endereco ?? lugar.bairro}</p>
      </div>

      {/* O que a casa é, escrito por quem esteve lá. */}
      {lugar.descricao && (
        <p className="text-[14px] leading-relaxed text-text-soft text-pretty">{lugar.descricao}</p>
      )}

      {roleHoje ? (
        <Link
          href={`/role/${roleHoje.id}`}
          className="rounded-[20px] border border-magenta/30 bg-gradient-to-br from-magenta/12 to-violet/8 px-4.5 py-4"
        >
          <div className="flex items-center gap-2.5">
            <span className="rotulo text-magenta-soft">hoje aqui</span>
            <FrescorPill frescor={roleHoje.frescor} />
          </div>
          <div className="mt-1.5 text-[15px] font-bold">{roleHoje.titulo}</div>
          <div className="mt-0.5 text-[12.5px] text-muted-2">
            {hora(roleHoje.data_inicio)}–{hora(roleHoje.data_fim)}
          </div>
        </Link>
      ) : (
        // Sem rolê programado, o lugar ainda pode estar aceso por sinal próprio — é o
        // "boteco cheio numa terça" do conceito, o degrau de baixo da escada. A API já
        // calcula esse frescor (`frescor_de_lugar`); a primeira versão desta tela o
        // descartava e dizia só "nada marcado", que é menos do que a gente sabe.
        <div className="rounded-[20px] border border-white/8 bg-card-alt px-4.5 py-4">
          {lugar.frescor && (
            <div className="mb-2">
              <FrescorPill frescor={lugar.frescor} />
            </div>
          )}
          <p className="text-[13px] leading-relaxed text-muted">
            {lugar.frescor
              ? "Sem rolê marcado, mas alguém sinalizou movimento aqui agora."
              : "Nada marcado aqui hoje. A casa pode estar aberta assim mesmo — o que a gente publica é o que alguém foi ver."}
          </p>
        </div>
      )}

      {(lugar.horario_funcionamento || preco !== null || lugar.instagram) && (
        <dl className="flex flex-col gap-2.5 rounded-[20px] border border-white/7 bg-card-alt px-4.5 py-4">
          {lugar.horario_funcionamento && (
            <Linha rotulo="horário">{lugar.horario_funcionamento}</Linha>
          )}
          {preco !== null && (
            <Linha rotulo="longneck">
              {preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              {/* O preço nunca aparece sozinho: sem a data ele vira promessa que a casa
                  não pode cumprir. Com ela, continua verdade depois de mudar. */}
              {lugar.preco_visto_em && (
                <span className="ml-1.5 text-[11.5px] font-normal text-muted-3">
                  visto em {new Date(lugar.preco_visto_em + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              )}
            </Linha>
          )}
          {lugar.instagram && (
            <Linha rotulo="instagram">
              <a
                href={`https://instagram.com/${lugar.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="text-magenta-soft hover:underline"
              >
                @{lugar.instagram}
              </a>
            </Linha>
          )}
        </dl>
      )}

      <div className="flex gap-2.5">
        <AcaoSalvar lugarId={lugar.id} variante="botao" />
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lugar.lat},${lugar.lng}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-2xl border border-white/18 px-5 py-3 text-[13.5px] font-semibold text-text-soft"
        >
          Rota
        </a>
      </div>

      {lugar.comentarios_recentes.length > 0 && (
        <div>
          <div className="rotulo text-muted-3">o que dizem</div>
          <div className="mt-3 flex flex-col gap-2.5">
            {lugar.comentarios_recentes.map((c, i) => (
              <div key={i} className="rounded-[18px] border border-white/7 bg-card px-4 py-3.5">
                <p className="text-[13.5px] leading-relaxed text-text-dim">“{c.texto}”</p>
                <div className="mt-1.5 text-[11.5px] text-muted-3">{c.autor_nome}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="rotulo shrink-0 text-muted-3">{rotulo}</dt>
      <dd className="text-right text-[13.5px] font-semibold text-text-soft">{children}</dd>
    </div>
  );
}
