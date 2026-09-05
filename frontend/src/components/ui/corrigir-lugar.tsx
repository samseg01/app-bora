"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useSessao } from "@/lib/auth";
import { EditorHorarios } from "./editor-horarios";
import { EnviarFoto } from "./enviar-foto";
import { SeletorTags } from "./seletor-tags";
import { faixaNova } from "@/lib/horarios";
import type { FaixaHorario, LugarPublic } from "@/lib/types";

/**
 * Corrigir a ficha de um lugar já cadastrado.
 *
 * Nasceu cobrindo só endereço e coordenada, e isso virou um buraco na mesma tarde: a
 * migration 0004 acrescentou descrição, instagram, horário, preço e a foto — e os lugares
 * cadastrados antes dela não tinham como receber nada disso. Cadastrar de novo para
 * preencher um campo perderia os salvos e comentários já ligados àquele lugar.
 *
 * Fora daqui de propósito: nome e categoria. Errar esses dois é cadastro errado, e o
 * certo é tirar do ar e refazer — não emendar.
 */
const CAMPO =
  "w-full border border-linha bg-sunken px-3 py-2.5 text-[13px] text-text outline-none placeholder:text-muted-3 focus:border-linha";

function soIdentificador(entrada: string): string {
  return entrada
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/$/, "");
}

export function CorrigirLugar({
  lugar,
  aoSalvar,
}: {
  lugar: LugarPublic;
  aoSalvar: (atualizado: LugarPublic) => void;
}) {
  const sessao = useSessao();
  const [aberto, setAberto] = useState(false);
  const [endereco, setEndereco] = useState(lugar.endereco ?? "");
  const [descricao, setDescricao] = useState(lugar.descricao ?? "");
  const [instagram, setInstagram] = useState(lugar.instagram ?? "");
  const [horarios, setHorarios] = useState<FaixaHorario[]>(
    lugar.horarios?.length ? lugar.horarios : [faixaNova()],
  );
  const [tags, setTags] = useState<string[]>(lugar.tags ?? []);
  const [programacao, setProgramacao] = useState(lugar.programacao ?? "");
  const [preco, setPreco] = useState(lugar.preco_longneck ?? "");
  const [raio, setRaio] = useState(lugar.raio_metros?.toString() ?? "");
  const [foto, setFoto] = useState(lugar.fotos?.[0] ?? "");
  const [coords, setCoords] = useState(`${lugar.lat}, ${lugar.lng}`);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!sessao) return;
    const [lat, lng] = coords.split(",").map((n) => Number(n.trim()));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setErro("Cole as coordenadas do Google Maps: -23.5441, -46.6396");
      return;
    }
    const valor = preco.toString().trim().replace(",", ".");
    if (valor && !Number.isFinite(Number(valor))) {
      setErro("O preço precisa ser um número: 12,00");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await api.atualizarLugar(sessao.token, lugar.id, {
        endereco: endereco.trim() || null,
        descricao: descricao.trim() || null,
        instagram: soIdentificador(instagram) || null,
        horarios: horarios.filter((f) => f.dias.length > 0).length
          ? horarios.filter((f) => f.dias.length > 0)
          : null,
        programacao: programacao.trim() || null,
        tags: tags.length ? tags : null,
        preco_longneck: valor ? Number(valor) : null,
        raio_metros: raio.trim() ? Number(raio) : null,
        fotos: foto.trim() ? [foto.trim()] : null,
        lat,
        lng,
      });
      aoSalvar(atualizado);
      setAberto(false);
    } catch {
      setErro("Não deu pra salvar. Tenta de novo.");
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="shrink-0 text-[11.5px] font-semibold text-muted-2 hover:text-text-soft"
      >
        corrigir
      </button>
    );
  }

  return (
    // Cada campo com rótulo. A primeira versão era uma pilha de inputs com placeholder e
    // mais nada — e placeholder some quando o campo tem valor, que é justamente o caso
    // aqui: este formulário abre com tudo preenchido. Resultado: sete caixas de texto
    // sem nome, e ninguém achava o horário de funcionamento.
    <div className="rounded-[16px] mt-3 flex w-full flex-col gap-2.5 border-t border-linha pt-3">
      <Campo rotulo="o que é a casa">
        <textarea
          rows={3}
          className={`${CAMPO} resize-none leading-relaxed`}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Boteco de esquina, mesa na calçada."
          maxLength={2000}
        />
      </Campo>

      <Campo rotulo="endereço">
        <input
          className={CAMPO}
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Av. Prestes Maia, 78"
          maxLength={255}
        />
      </Campo>

      <SeletorTags valor={tags} onChange={setTags} />

      <Campo rotulo="funcionamento">
        <EditorHorarios faixas={horarios} aoMudar={setHorarios} />
      </Campo>

      <div className="w-24">
        <Campo rotulo="longneck">
          <input
            className={CAMPO}
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="12,00"
            inputMode="decimal"
          />
        </Campo>
      </div>

      <Campo rotulo="toda semana">
        <textarea
          rows={2}
          className={`${CAMPO} resize-none leading-relaxed`}
          value={programacao}
          onChange={(e) => setProgramacao(e.target.value)}
          placeholder="quinta é forró, sábado tem samba"
          maxLength={2000}
        />
      </Campo>

      <Campo rotulo="instagram">
        <input
          className={CAMPO}
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="@perfil"
          maxLength={80}
        />
      </Campo>

      <Campo rotulo="foto do lugar">
        <EnviarFoto valor={foto} aoEnviar={setFoto} />
        {/* O campo de texto continua porque nem toda foto nasce aqui: uma imagem que a
            casa já publicou serve enquanto o curador não passou lá. O upload é o caminho
            principal; colar URL é a saída. */}
        <input
          className={`${CAMPO} mt-2`}
          value={foto}
          onChange={(e) => setFoto(e.target.value)}
          placeholder="ou cole a url de uma imagem"
        />
      </Campo>

      <Campo rotulo="coordenadas">
        <input
          className={`${CAMPO} font-mono`}
          value={coords}
          onChange={(e) => setCoords(e.target.value)}
          placeholder="-23.5441, -46.6396"
        />
      </Campo>

      {/* Fica colado nas coordenadas porque é a mesma pergunta: onde a casa está e até
          onde ela vai. É o único campo do formulário que só quem esteve lá consegue
          responder — daí o texto de ajuda falar de passos, e não de metros abstratos. */}
      <Campo rotulo="raio de presença">
        <input
          className={CAMPO}
          value={raio}
          onChange={(e) => setRaio(e.target.value)}
          placeholder="150"
          inputMode="numeric"
        />
        <span className="mt-1 text-[11px] leading-snug text-muted-3 text-pretty">
          Até onde alguém ainda está “na casa”, em metros. Um boteco de esquina são uns 50;
          uma festa que toma a rua, uns 400. Em branco usa 150. Quem sinalizar de fora
          disso é recusado — então errar para menos barra gente que está mesmo lá.
        </span>
      </Campo>

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="rounded-[12px] flex-1 bg-text py-2.5 text-[13px] font-bold text-bg disabled:opacity-60"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-[12px]  border border-linha px-4 py-2.5 text-[13px] font-semibold text-muted-2"
        >
          Cancelar
        </button>
      </div>
      {erro && <p className="text-[11.5px] text-text-faint">{erro}</p>}
    </div>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="rotulo text-muted-3">{rotulo}</span>
      {children}
    </label>
  );
}
