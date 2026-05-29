import { Lock } from "lucide-react";

/**
 * Banner mostrado para usuárias com papel "socia" em páginas que ainda
 * não estão liberadas para edição. Permite visualizar, mas avisa que a
 * edição entra na próxima fase do projeto.
 */
export function EmDesenvolvimentoBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 md:px-5 md:py-4">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" strokeWidth={1.8} />
      <div className="text-[13px] leading-relaxed text-amber-100 md:text-sm">
        <strong className="font-medium">Visualização apenas.</strong>{" "}
        Esta seção entra em operação na próxima fase do projeto. Você pode
        explorar e conhecer a estrutura, mas a edição está bloqueada por enquanto.
      </div>
    </div>
  );
}
