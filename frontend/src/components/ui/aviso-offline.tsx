/**
 * Faixa de desenvolvimento: a tela abaixo está com dado de exemplo porque a API não
 * respondeu. Nunca aparece em produção — lá a falha estoura de verdade.
 */
export function AvisoOffline() {
  return (
    <div className="bg-amber/15 px-4 py-2 text-center text-[11px] font-semibold text-amber">
      API fora do ar — mostrando dado de exemplo. Suba o backend com{" "}
      <code className="font-mono">docker compose up -d</code>.
    </div>
  );
}
