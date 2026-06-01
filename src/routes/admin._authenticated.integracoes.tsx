import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plug, MessageCircle, Brain, Workflow, Mail } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/integracoes")({
  component: IntegracoesPage,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  whatsapp: MessageCircle,
  openai: Brain,
  n8n: Workflow,
  email: Mail,
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  nao_configurado: { label: "Não configurado", cls: "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-3)]" },
  pendente: { label: "Pendente", cls: "border-amber-400/30 bg-amber-400/10 text-amber-200" },
  ativo: { label: "Ativo", cls: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" },
  erro: { label: "Com erro", cls: "border-red-400/30 bg-red-400/10 text-red-200" },
};

type Integracao = {
  id: string;
  chave: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  status: string;
};

async function listIntegracoes(): Promise<Integracao[]> {
  const { data, error } = await supabase
    .from("integracoes_status")
    .select("id, chave, nome, descricao, categoria, status")
    .order("nome");
  if (error) throw error;
  return data ?? [];
}

function IntegracoesPage() {
  const { data: integracoes = [] } = useQuery({ queryKey: ["admin", "integracoes"], queryFn: listIntegracoes });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governança"
        title="Integrações"
        description="Conectores que serão usados pelas automações da próxima fase."
      />
      <AdminPageIntro>
        Esta área lista as integrações externas que o sistema vai suportar. Cada cartão será preenchido com chaves e
        credenciais à medida que cada conexão for liberada.
      </AdminPageIntro>

      <div className="grid gap-3 md:grid-cols-2">
        {integracoes.map((i) => {
          const Icon = ICONS[i.chave] ?? Plug;
          const st = STATUS_LABELS[i.status] ?? STATUS_LABELS.nao_configurado;
          return (
            <div key={i.id} className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[color:var(--admin-petroleo)]/60 text-[color:var(--admin-dourado)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[color:var(--admin-cinza-1)]">{i.nome}</div>
                    <div className="text-[11px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">{i.categoria}</div>
                    <p className="mt-1 text-xs text-[color:var(--admin-cinza-2)]">{i.descricao}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${st.cls}`}>{st.label}</span>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  disabled
                  title="Configuração liberada na próxima fase"
                  className="cursor-not-allowed rounded-md border border-[color:var(--admin-borda)] px-3 py-1.5 text-xs text-[color:var(--admin-cinza-3)] opacity-70"
                >
                  Configurar (em breve)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
