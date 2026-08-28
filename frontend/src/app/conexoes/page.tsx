import { Porta } from "@/components/ui/porta";
import { ConexoesEmBreve } from "@/views/conexoes-em-breve";

/**
 * Aba de Conexões. As telas estão prontas e desenhadas
 * (`docs/front-end-ideias/conexoes/`), mas **nenhuma rota existe no backend** — não há
 * `Conexao`, nem check-in com escopo, nem salvos compartilhados (itens 27–30 do TODO
 * da raiz).
 *
 * Enquanto isso, a aba mostrava gente inventada como se fossem conexões de quem entrou.
 * Não dá: é a mesma mentira do card do curador, com nome e foto. Agora ela diz a
 * verdade — a feature não está pronta — e o design segue no canvas até o backend existir.
 */
export default function ConexoesPage() {
  return (
    <Porta
      titulo="Suas conexões"
      descricao="Ver onde as pessoas com quem você sai estão exige saber quem é você."
    >
      <ConexoesEmBreve />
    </Porta>
  );
}
