/**
 * Avatar em bloco de cor, no lugar de foto — mesma decisão do resto do app
 * (fotos reais entram depois). O gradiente é derivado do nome, então a mesma
 * pessoa tem sempre a mesma cor em todas as telas, sem guardar nada.
 */

const GRADIENTES = [
  "from-violet to-cyan",
  "from-amber to-magenta",
  "from-cyan to-violet",
  "from-magenta to-amber",
  "from-plum to-violet",
  "from-violet to-plum",
];

function indiceDe(nome: string) {
  let soma = 0;
  for (let i = 0; i < nome.length; i++) soma += nome.charCodeAt(i);
  return soma % GRADIENTES.length;
}

export function Avatar({
  nome,
  tamanho = 44,
  className = "",
}: {
  nome: string;
  tamanho?: number;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={nome}
      style={{ width: tamanho, height: tamanho }}
      className={`shrink-0 rounded-full bg-gradient-to-br ${GRADIENTES[indiceDe(nome)]} ${className}`}
    />
  );
}

/** Pilha de avatares sobrepostos — "Rafa e Bia salvaram". */
export function AvatarPilha({ nomes, tamanho = 18 }: { nomes: string[]; tamanho?: number }) {
  return (
    <div className="flex shrink-0">
      {nomes.slice(0, 3).map((nome, i) => (
        <Avatar
          key={nome}
          nome={nome}
          tamanho={tamanho}
          className={i > 0 ? "-ml-1.5 ring-2 ring-card" : ""}
        />
      ))}
    </div>
  );
}
