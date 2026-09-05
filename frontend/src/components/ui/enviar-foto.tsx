"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import { urlDaFoto } from "@/lib/fotos";

/**
 * Tirar a foto do lugar, na calçada, e receber de volta o caminho dela (item 45).
 *
 * O `<input type="file" accept="image/*">` do Android abre o seletor que já oferece
 * **câmera e galeria** na mesma folha. Não uso `capture="environment"` de propósito:
 * `capture` força a câmera e **remove a galeria**, o que quebraria o caso real de já ter
 * fotografado a casa antes de sentar para cadastrar.
 *
 * O input fica escondido atrás de um botão porque o controle nativo de arquivo é feio,
 * pequeno e não se estiliza — e este é um botão que se aperta de pé, no escuro, com uma
 * mão só.
 *
 * A prévia mostra a foto **carregada do servidor**, não um `URL.createObjectURL` do
 * arquivo local. É mais lento e é de propósito: prévia local confirma que o arquivo foi
 * escolhido; esta confirma que ele subiu, foi gravado e está sendo servido de volta — que
 * é a pergunta que interessa quando se está longe de casa e não dá para conferir depois.
 */
export function EnviarFoto({
  valor,
  aoEnviar,
}: {
  /** O caminho atual (`/fotos/x.jpg` ou uma URL colada). Vazio quando não há. */
  valor: string;
  aoEnviar: (caminho: string) => void;
}) {
  const sessao = useSessao();
  const input = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const previa = urlDaFoto(valor);

  async function escolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpa o input sempre: sem isso, escolher a MESMA foto de novo depois de um erro não
    // dispara `change`, e a tela fica parada parecendo travada.
    evento.target.value = "";
    if (!arquivo || !sessao) return;

    setErro(null);
    setEnviando(true);
    try {
      aoEnviar(await api.enviarFoto(sessao.token, arquivo));
    } catch (e) {
      // A mensagem do servidor é específica (tipo recusado, tamanho) e é melhor que
      // qualquer texto genérico que eu escrevesse aqui — quem está na rua precisa saber
      // se tenta de novo ou se muda de foto.
      setErro(e instanceof ApiError ? e.detalhe : "Não deu pra enviar. Tenta de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      {previa && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previa}
          alt="Foto do lugar"
          className="rounded-[10px] mb-2 h-32 w-full border border-linha object-cover"
        />
      )}

      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={escolher}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={enviando}
        className="w-full border border-linha bg-sunken px-3 py-2.5 text-[13px] text-text disabled:opacity-50"
      >
        {enviando ? "enviando…" : previa ? "trocar a foto" : "tirar ou escolher foto"}
      </button>

      {erro && <p className="mt-1.5 text-[12px] text-muted-3">{erro}</p>}
    </div>
  );
}
