import { tagsDoLugar } from "@/lib/tags";

/**
 * As tags da casa, como se leem.
 *
 * Sem tag, não renderiza nada — nem rótulo, nem caixa vazia. Um "Tags" seguido de nada
 * afirma que a casa não tem característica alguma, quando o que houve foi ninguém ter
 * anotado ainda. É a mesma regra do frescor `null`: ausência de dado não é um estado
 * a exibir.
 *
 * Ciano de propósito, e não magenta nem âmbar: essas duas cores dizem "está acontecendo
 * agora" em todo o app, e uma tag é permanente. Pintar tag de magenta faria a ficha de
 * uma casa vazia parecer acesa.
 */
export function TagsLugar({
  tags,
  className = "",
}: {
  tags: string[] | null | undefined;
  className?: string;
}) {
  const lista = tagsDoLugar(tags);
  if (lista.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {lista.map((t) => (
        <li
          key={t}
          className="rounded-full border border-cyan/25 bg-cyan/10 px-2.5 py-1 text-[11.5px] font-medium text-cyan"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}
