import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Bot, Clock, Phone, MessageSquare, ListChecks } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { useCan } from "@/hooks/use-permissions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/ia")({
  component: IAConfigPage,
});

type IAConfig = {
  horario_inicio: string | null;
  horario_fim: string | null;
  dias_atendimento: string[];
  mensagem_fora_horario: string | null;
  whatsapp_comercial: string | null;
  whatsapp_financeiro: string | null;
  perguntas_qualificacao: string[];
  regras_encaminhamento: string[];
  tom_ia: string | null;
  ativa: boolean;
};

const DIAS = [
  { key: "seg", label: "Seg" },
  { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" },
  { key: "sab", label: "Sáb" },
  { key: "dom", label: "Dom" },
];

const TONS = [
  { key: "acolhedor", label: "Acolhedor" },
  { key: "tecnico", label: "Técnico" },
  { key: "informal", label: "Informal" },
  { key: "executivo", label: "Executivo" },
];

async function getIA(): Promise<IAConfig> {
  const { data, error } = await supabase
    .from("ia_configuracoes")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  const raw = (data ?? {}) as Record<string, unknown>;
  const arr = (v: unknown): string[] => Array.isArray(v) ? v.map((x) => typeof x === "string" ? x : String(x)) : [];
  return {
    horario_inicio: (raw.horario_inicio as string) ?? "08:00",
    horario_fim: (raw.horario_fim as string) ?? "20:00",
    dias_atendimento: (raw.dias_atendimento as string[]) ?? ["seg","ter","qua","qui","sex","sab"],
    mensagem_fora_horario: (raw.mensagem_fora_horario as string) ?? "",
    whatsapp_comercial: (raw.whatsapp_comercial as string) ?? "",
    whatsapp_financeiro: (raw.whatsapp_financeiro as string) ?? "",
    perguntas_qualificacao: arr(raw.perguntas_qualificacao),
    regras_encaminhamento: arr(raw.regras_encaminhamento),
    tom_ia: (raw.tom_ia as string) ?? "acolhedor",
    ativa: Boolean(raw.ativa),
  };
}

async function saveIA(payload: IAConfig) {
  const { error } = await supabase
    .from("ia_configuracoes")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) throw error;
}

function IAConfigPage() {
  const qc = useQueryClient();
  const { canEdit } = useCan("ia");
  const { data } = useQuery({ queryKey: ["admin", "ia-config"], queryFn: getIA });
  const [form, setForm] = useState<IAConfig | null>(null);
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: () => saveIA(form!),
    onSuccess: () => { toast.success("Configurações da IA salvas"); qc.invalidateQueries({ queryKey: ["admin", "ia-config"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <div className="text-[color:var(--admin-cinza-3)] text-sm">Carregando…</div>;

  const update = <K extends keyof IAConfig>(key: K, value: IAConfig[K]) => setForm({ ...form, [key]: value });

  const toggleDia = (d: string) => {
    const next = form.dias_atendimento.includes(d)
      ? form.dias_atendimento.filter((x) => x !== d)
      : [...form.dias_atendimento, d];
    update("dias_atendimento", next);
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governança"
        title="Configurações da IA"
        description="Defina horário de atendimento, tom da assistente, canais e regras de qualificação."
        actions={canEdit ? (
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--admin-dourado)] px-4 py-2 text-sm font-medium text-[color:var(--admin-carvao-deep)] hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Salvar
          </button>
        ) : null}
      />

      {!canEdit ? <EmDesenvolvimentoBanner /> : null}

      <AdminPageIntro>
        Esta área prepara a assistente virtual da empresa. Os campos são salvos no banco e ficam disponíveis para
        integrações futuras (WhatsApp, OpenAI, n8n) sem que seja necessário reestruturar nada.
      </AdminPageIntro>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Horário de atendimento" icon={Clock}>
          <div className="flex items-center gap-3">
            <Field label="Início">
              <input type="time" value={form.horario_inicio ?? ""} onChange={(e) => update("horario_inicio", e.target.value)} disabled={!canEdit} className="admin-input h-9 w-full px-3 text-sm" />
            </Field>
            <Field label="Fim">
              <input type="time" value={form.horario_fim ?? ""} onChange={(e) => update("horario_fim", e.target.value)} disabled={!canEdit} className="admin-input h-9 w-full px-3 text-sm" />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {DIAS.map((d) => {
              const active = form.dias_atendimento.includes(d.key);
              return (
                <button
                  type="button"
                  key={d.key}
                  disabled={!canEdit}
                  onClick={() => toggleDia(d.key)}
                  className={`rounded-md border px-3 py-1.5 text-xs ${active ? "border-[color:var(--admin-dourado)] bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)]"}`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="Mensagem fora do horário" icon={MessageSquare}>
          <textarea
            rows={4}
            disabled={!canEdit}
            value={form.mensagem_fora_horario ?? ""}
            onChange={(e) => update("mensagem_fora_horario", e.target.value)}
            className="admin-input w-full p-3 text-sm"
          />
        </Card>

        <Card title="Canais WhatsApp" icon={Phone}>
          <Field label="Comercial">
            <input type="tel" disabled={!canEdit} value={form.whatsapp_comercial ?? ""} onChange={(e) => update("whatsapp_comercial", e.target.value)} className="admin-input h-9 w-full px-3 text-sm" placeholder="+55 35 9..." />
          </Field>
          <Field label="Financeiro">
            <input type="tel" disabled={!canEdit} value={form.whatsapp_financeiro ?? ""} onChange={(e) => update("whatsapp_financeiro", e.target.value)} className="admin-input h-9 w-full px-3 text-sm" placeholder="+55 35 9..." />
          </Field>
        </Card>

        <Card title="Tom da assistente" icon={Bot}>
          <div className="flex flex-wrap gap-2">
            {TONS.map((t) => {
              const active = form.tom_ia === t.key;
              return (
                <button
                  type="button"
                  key={t.key}
                  disabled={!canEdit}
                  onClick={() => update("tom_ia", t.key)}
                  className={`rounded-md border px-3 py-1.5 text-xs ${active ? "border-[color:var(--admin-dourado)] bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)]"}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-[color:var(--admin-cinza-2)]">
            <input type="checkbox" disabled={!canEdit} checked={form.ativa} onChange={(e) => update("ativa", e.target.checked)} />
            Assistente ativa
          </label>
        </Card>

        <ListEditor
          title="Perguntas de qualificação"
          icon={ListChecks}
          items={form.perguntas_qualificacao}
          onChange={(v) => update("perguntas_qualificacao", v)}
          canEdit={canEdit}
          placeholder="Ex.: Já cavalgou antes?"
        />

        <ListEditor
          title="Regras de encaminhamento"
          icon={ListChecks}
          items={form.regras_encaminhamento}
          onChange={(v) => update("regras_encaminhamento", v)}
          canEdit={canEdit}
          placeholder="Ex.: Se valor > 5.000, encaminhar ao CEO."
        />
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[color:var(--admin-cinza-1)]">
        <Icon className="h-4 w-4 text-[color:var(--admin-dourado)]" />
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block flex-1 text-xs text-[color:var(--admin-cinza-3)]">
      <div className="mb-1">{label}</div>
      {children}
    </label>
  );
}

function ListEditor({
  title, icon: Icon, items, onChange, canEdit, placeholder,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
  onChange: (v: string[]) => void;
  canEdit: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft.trim()) return;
    onChange([...items, draft.trim()]);
    setDraft("");
  };
  return (
    <Card title={title} icon={Icon}>
      <ul className="space-y-2 mb-3">
        {items.length === 0 ? (
          <li className="text-xs text-[color:var(--admin-cinza-3)]">Nenhum item cadastrado.</li>
        ) : items.map((it, i) => (
          <li key={i} className="flex items-center gap-2 rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/30 px-3 py-2 text-sm text-[color:var(--admin-cinza-2)]">
            <span className="flex-1">{it}</span>
            {canEdit ? (
              <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-xs text-[color:var(--admin-cinza-3)] hover:text-red-400">Remover</button>
            ) : null}
          </li>
        ))}
      </ul>
      {canEdit ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder={placeholder}
            className="admin-input h-9 flex-1 px-3 text-sm"
          />
          <button type="button" onClick={add} className="rounded-md border border-[color:var(--admin-borda)] px-3 py-1.5 text-xs text-[color:var(--admin-cinza-1)] hover:bg-[color:var(--admin-petroleo-soft)]/40">Adicionar</button>
        </div>
      ) : null}
    </Card>
  );
}
