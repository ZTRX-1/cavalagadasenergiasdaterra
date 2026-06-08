import { Sparkles, Lock } from "lucide-react";
import type { AdminModule } from "@/hooks/use-permissions";

const MODULE_COPY: Partial<Record<AdminModule, { titulo: string; descricao: string }>> = {
  reservas: {
    titulo: "Reservas",
    descricao:
      "Central completa de gestão de reservas, contratos, pagamentos e acompanhamento operacional.",
  },
  participantes: {
    titulo: "Participantes",
    descricao:
      "Controle avançado de participantes, fichas operacionais, documentos e logística das expedições.",
  },
  financeiro: {
    titulo: "Financeiro",
    descricao:
      "Receitas, despesas, fluxo de caixa, lucratividade e indicadores financeiros por expedição.",
  },
  documentos: {
    titulo: "Documentos",
    descricao:
      "Gestão centralizada de contratos, comprovantes, termos e documentos operacionais.",
  },
  midia: {
    titulo: "Mídia",
    descricao:
      "Biblioteca oficial de fotos, vídeos, materiais institucionais e conteúdos de marketing.",
  },
  ia: {
    titulo: "Governança",
    descricao:
      "Configurações estratégicas da operação, inteligência artificial, automações e regras de negócio.",
  },
  automacoes: {
    titulo: "Automações",
    descricao:
      "Fluxos inteligentes entre CRM, WhatsApp, IA Bárbara e operações internas.",
  },
  integracoes: {
    titulo: "Integrações",
    descricao:
      "Conexões com OpenAI, N8N, Evolution API, e-mail e serviços externos.",
  },
};

export function RestrictedAccess({ modulo }: { modulo: AdminModule }) {
  const copy = MODULE_COPY[modulo] ?? {
    titulo: "Módulo restrito",
    descricao: "Esta área está sendo preparada para a próxima fase do projeto.",
  };

  return (
    <div className="relative isolate mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-[color:var(--admin-borda)] bg-gradient-to-br from-[color:var(--admin-carvao-deep)] via-[color:var(--admin-carvao)] to-[color:var(--admin-petroleo)]/40 px-6 py-16 text-center md:px-12 md:py-20">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[color:var(--admin-dourado)]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[color:var(--admin-dourado-glow)]/5 blur-3xl" />

      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-amber-200">
        <Lock className="h-3 w-3" strokeWidth={1.8} />
        Próxima etapa
      </span>

      <div className="mt-8 grid h-16 w-16 place-items-center rounded-2xl bg-[color:var(--admin-petroleo)]/50 ring-1 ring-[color:var(--admin-borda-strong)] shadow-[var(--admin-glow-dourado)]">
        <Sparkles className="h-7 w-7 text-[color:var(--admin-dourado-glow)]" strokeWidth={1.4} />
      </div>

      <h1 className="mt-6 font-display text-3xl text-[color:var(--admin-cinza-1)] md:text-4xl">
        {copy.titulo}
      </h1>
      <p className="mt-3 max-w-xl text-sm text-[color:var(--admin-cinza-2)] md:text-base">
        {copy.descricao}
      </p>

      <div className="mt-10 max-w-xl space-y-4 text-[13px] leading-relaxed text-[color:var(--admin-cinza-2)] md:text-sm">
        <p>
          Este módulo faz parte da próxima etapa de evolução da plataforma{" "}
          <span className="text-[color:var(--admin-cinza-1)]">Cavalgadas Energias da Terra</span>.
        </p>
        <p>
          Em breve você terá acesso a recursos avançados de gestão operacional, financeira,
          documental e automações inteligentes.
        </p>
        <p className="text-[color:var(--admin-cinza-3)]">
          A estrutura desta área já está sendo preparada para a próxima fase do projeto.
        </p>
      </div>

      <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/60 px-4 py-2 text-[10px] uppercase tracking-[0.24em] text-[color:var(--admin-cinza-3)]">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" />
        Em desenvolvimento
      </div>
    </div>
  );
}
