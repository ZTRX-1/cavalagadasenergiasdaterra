import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Workflow, Zap } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/automacoes")({
  component: AutomacoesPage,
});

const EVENTOS = [
  { evento: "lead_criado", label: "Lead criado", desc: "Disparado sempre que um lead é registrado pela primeira vez." },
  { evento: "lead_qualificado", label: "Lead qualificado", desc: "Quando o lead avança para a etapa de qualificação." },
  { evento: "reserva_criada", label: "Reserva criada", desc: "Disparado ao criar uma nova reserva ou pré-reserva." },
  { evento: "contrato_enviado", label: "Contrato enviado", desc: "Disparado quando o contrato é enviado ao cliente." },
  { evento: "contrato_assinado", label: "Contrato assinado", desc: "Quando o cliente devolve o contrato assinado." },
  { evento: "pagamento_recebido", label: "Pagamento recebido", desc: "Cada confirmação de pagamento dispara este evento." },
  { evento: "parcela_vencendo", label: "Parcela vencendo", desc: "Aviso automático para parcelas próximas do vencimento." },
  { evento: "parcela_atrasada", label: "Parcela atrasada", desc: "Disparado quando uma parcela passa da data prevista." },
  { evento: "documento_recebido", label: "Documento recebido", desc: "Quando um novo documento entra na central." },
  { evento: "documento_aprovado", label: "Documento aprovado", desc: "Quando um documento muda para o status aprovado." },
];

function AutomacoesPage() {
  const { data: contagens = {} } = useQuery({
    queryKey: ["admin", "automacoes-eventos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks_eventos")
        .select("evento")
        .limit(1000);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of data ?? []) map[r.evento] = (map[r.evento] ?? 0) + 1;
      return map;
    },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governança"
        title="Central de Automações"
        description="Catálogo de eventos disponíveis para conectar com integrações externas no futuro."
      />
      <AdminPageIntro>
        Cada item abaixo representa um <strong>gatilho</strong> que o sistema já está emitindo internamente.
        Eles serão usados para acionar fluxos no n8n, mensagens via WhatsApp e respostas da IA. Por enquanto, a página é
        apenas de visualização.
      </AdminPageIntro>

      <div className="grid gap-3 md:grid-cols-2">
        {EVENTOS.map((e) => (
          <div key={e.evento} className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--admin-petroleo)]/60 text-[color:var(--admin-dourado)]">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[color:var(--admin-cinza-1)]">{e.label}</div>
                  <code className="text-[11px] text-[color:var(--admin-cinza-3)]">{e.evento}</code>
                  <p className="mt-1 text-xs text-[color:var(--admin-cinza-2)]">{e.desc}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[color:var(--admin-cinza-3)]">disparos</div>
                <div className="font-display text-lg text-[color:var(--admin-cinza-1)]">{contagens[e.evento] ?? 0}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/30 px-4 py-3 text-xs text-[color:var(--admin-cinza-3)]">
        <Workflow className="h-4 w-4 text-[color:var(--admin-dourado)]" />
        Integração com n8n e webhooks externos será habilitada na próxima fase.
      </div>
    </div>
  );
}
