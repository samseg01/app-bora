"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, ApiOffline } from "@/lib/api";
import { consumirDestino, salvarSessao } from "@/lib/auth";

/**
 * Entrar e criar conta. Uma composição só para as duas visualizações: o formulário é
 * a mesma coluna estreita nas duas larguras — campo de email não fica melhor com 800px.
 * O que muda é a moldura, e isso vive em `entrar/page.tsx` e `criar-conta/page.tsx`.
 *
 * Auth preguiçosa (decisão registrada em docs/plano-frontend.md): a pessoa só chega
 * aqui porque tentou fazer algo. Por isso volta para onde estava, não para a home.
 */

const CAMPO =
  "w-full border border-linha bg-sunken px-4 py-3.5 text-[14.5px] text-text outline-none placeholder:text-muted-3 focus:border-selecao";

export function FormularioAuth({ modo }: { modo: "entrar" | "criar" }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const criando = modo === "criar";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      if (criando) {
        await api.criarConta(nome.trim(), email.trim(), senha);
      }
      const { access_token } = await api.entrar(email.trim(), senha);
      salvarSessao(access_token);
      router.replace(consumirDestino());
      router.refresh();
    } catch (err) {
      setErro(mensagemDe(err, criando));
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col">
      <h1 className="titulo text-[38px] leading-none lg:text-[42px]">
        {criando ? "Criar conta" : "Entrar"}
      </h1>
      {criando && (
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">
          Leva dez segundos. Serve pra guardar o que você salvar e pra avisar quem você
          deixar entrar.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3.5">
        {criando && (
          <label className="flex flex-col gap-2">
            <span className="rotulo text-muted-3">como te chamam</span>
            <input
              className={CAMPO}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Marina"
              autoComplete="name"
              required
              maxLength={120}
            />
          </label>
        )}

        <label className="flex flex-col gap-2">
          <span className="rotulo text-muted-3">email</span>
          <input
            className={CAMPO}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between">
            <span className="rotulo text-muted-3">senha</span>
            <span className="text-[11px] text-muted-3">
              {criando ? "mínimo 8 caracteres" : ""}
            </span>
          </span>
          <div className="relative">
            <input
              className={`${CAMPO} pr-20`}
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete={criando ? "new-password" : "current-password"}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-semibold text-muted-2 hover:text-text"
            >
              {mostrarSenha ? "esconder" : "mostrar"}
            </button>
          </div>
        </label>
      </div>

      {erro && (
        <p
          role="alert"
          className="rounded-[16px] mt-4 border border-linha-forte bg-card px-4 py-3 text-[13px] leading-snug text-text-soft"
        >
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-[12px] mt-5 bg-text py-4 text-[15px] font-bold text-bg disabled:opacity-60"
      >
        {enviando ? "Um instante…" : criando ? "Criar conta e salvar" : "Entrar e salvar"}
      </button>

      <div className="mt-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-[11px] text-muted-3">
          {criando ? "já tem conta?" : "ainda não tem conta?"}
        </span>
        <div className="h-px flex-1 bg-white/8" />
      </div>

      <Link
        href={criando ? "/entrar" : "/criar-conta"}
        className="rounded-[16px] mt-4 border border-linha py-3.5 text-center text-[14.5px] font-semibold text-text-soft hover:border-linha"
      >
        {criando ? "Entrar" : "Criar conta"}
      </Link>

      {criando ? (
        <div className="elevado rounded-[16px] mt-7 flex items-start gap-3.5 border border-linha bg-card-alt px-4 py-3.5">
          <div className="h-8.5 w-8.5 shrink-0 rounded-full bg-gradient-to-br from-pedra to-pedra-funda" />
          <p className="text-[12.5px] leading-relaxed text-text-faint">
            Você entra como gente comum, e é assim mesmo.{" "}
            <span className="font-semibold text-text">Curador é convite</span> — a gente chama
            quem já conhece o bairro a pé.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex items-start gap-3 border border-muted/16 bg-muted/6 px-4 py-3.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="mt-0.5 shrink-0"
          >
            <rect x="4" y="10" width="16" height="10" rx="2.5" />
            <path d="M8 10V7a4 4 0 018 0v3" />
          </svg>
          <p className="text-xs leading-relaxed text-text-faint">
            Email e senha, só. Sem telefone, sem rede social, sem localização em segundo plano.
          </p>
        </div>
      )}
    </form>
  );
}

/** O usuário não deve ler código de status: cada caso vira uma frase acionável. */
function mensagemDe(err: unknown, criando: boolean): string {
  if (err instanceof ApiOffline) {
    return "Não consegui falar com o servidor. Confere a conexão e tenta de novo.";
  }
  if (err instanceof ApiError) {
    if (err.status === 401) return "Email ou senha não conferem.";
    if (err.status === 409) return "Já existe conta com esse email. Tenta entrar.";
    if (err.status === 422) {
      return criando
        ? "Confere o email e use uma senha de pelo menos 8 caracteres."
        : "Confere o email e a senha.";
    }
  }
  return "Deu ruim aqui do nosso lado. Tenta de novo em instantes.";
}
