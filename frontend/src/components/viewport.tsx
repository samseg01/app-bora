import type { ReactNode } from "react";

/**
 * As duas partições de visualização.
 *
 * Mesmo app, mesmas URLs, mesmos dados — só a composição muda. A escolha é feita
 * por CSS, não por user-agent: o servidor renderiza as duas árvores e o breakpoint
 * decide qual aparece. Isso custa DOM duplicado, e compra três coisas que importam
 * mais neste estágio: nada de detecção de dispositivo (que erra com tablet e com
 * "modo desktop" no celular), nada de complicação de cache por variante, e a
 * visualização acompanha o usuário redimensionando a janela.
 *
 * O corte é em `lg` (1024px): abaixo disso não há largura para duas colunas de
 * verdade, e a visualização mobile esticada até 28rem se vira bem em tablet.
 *
 * Quando uma das visualizações virar cliente e com estado (o mapa com pan e zoom,
 * por exemplo), trocar o `hidden` por `<Activity mode="hidden">` do React 19.2, que
 * esconde mantendo estado e desmontando efeitos. Se o DOM duplicado virar problema
 * medido, a saída é `proxy.ts` (o antigo `middleware.ts`, renomeado no Next 16)
 * reescrevendo por user-agent — mas aí voltam o cache por variante e o erro de
 * detecção. Não antecipar.
 */

export function Mobile({ children }: { children: ReactNode }) {
  return <div className="lg:hidden">{children}</div>;
}

export function Desktop({ children }: { children: ReactNode }) {
  return <div className="hidden lg:block">{children}</div>;
}
