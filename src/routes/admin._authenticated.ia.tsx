import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Bot, Clock, Phone, MessageSquare, ListChecks, Sparkles, ShieldCheck, Languages, PenLine, Cpu, Wallet, GitBranch } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { useCan } from "@/hooks/use-permissions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/ia")({
  component: IAConfigPage,
});

type ModoIA = "sombra" | "sugestao" | "autonomo";

type IAConfig = {
  nome_exibido: string;
  idiomas: string[];
  modo: ModoIA;
  limite_confianca: number;
  gatilhos_handoff: string[];
  assinatura_padrao: string | null;
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
  modelo_principal: string | null;
  modelo_fallback: string | null;
  modelo_classificacao: string | null;
  budget_mensal_usd: number;
  prompt_versao: string | null;
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

const MODOS: { key: ModoIA; label: string; descricao: string }[] = [
  { key: "sombra",   label: "Sombra",    descricao: "A IA observa e registra, mas nunca responde. Operador atua manualmente." },
  { key: "sugestao", label: "Sugestão",  descricao: "A IA propõe respostas; o operador revisa e aprova antes do envio." },
  { key: "autonomo", label: "Autônomo",  descricao: "A IA responde sozinha quando a confiança ≥ limite. Handoff automático abaixo disso." },
];

const IDIOMAS = [
  { key: "pt", label: "Português" },
  { key: "en", label: "Inglês" },
  { key: "es", label: "Espanhol" },
];

const GATILHOS_PRESET = [
  "Cliente menciona reembolso",
  "Cliente menciona cancelamento",
  "Valor da reserva > 10.000",
  "Cliente em estado emocional negativo",
  "Pergunta sobre seguro / responsabilidade",
  "Cliente solicita falar com humano",
  "Confiança da IA abaixo do limite",
];

async function getIA(): Promise<IAConfig> {
  const { data, error } = await supabase
    .from("ia_configuracoes")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  const raw = (data ?? {}) as Record<string, unknown>;
  const arr = (v: unknown): string[] => Array.isArray(v) ? v.map((x) => typeof x === "string" ? x : String(x)) : [];
  const modoRaw = (raw.modo as string) ?? "sombra";
  const modo: ModoIA = (["sombra","sugestao","autonomo"] as const).includes(modoRaw as ModoIA) ? (modoRaw as ModoIA) : "sombra";
  return {
    nome_exibido: (raw.nome_exibido as string) ?? "Bárbara",
    idiomas: arr(raw.idiomas).length ? arr(raw.idiomas) : ["pt","en","es"],
    modo,
    limite_confianca: typeof raw.limite_confianca === "number" ? raw.limite_confianca : Number(raw.limite_confianca ?? 0.8),
    gatilhos_handoff: arr(raw.gatilhos_handoff),
    assinatura_padrao: (raw.assinatura_padrao as string) ?? "",
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
    onSuccess: () => { toast.success("Configurações da Bárbara salvas"); qc.invalidateQueries({ queryKey: ["admin", "ia-config"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <div className="text-[color:var(--admin-cinza-3)] text-sm">Carregando…</div>;

  const update = <K extends keyof IAConfig>(key: K, value: IAConfig[K]) => setForm({ ...form, [key]: value });

  const toggleIn = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governança"
        title={`Configurações da ${form.nome_exibido || "Bárbara"}`}
        description="Identidade, modo de operação, limites de confiança e gatilhos de handoff."
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
        Este painel define como a assistente se comporta. As configurações são lidas pelo sistema operacional
        e, na Fase 3, pela própria IA Bárbara. Hoje servem ao operador que "atua como Bárbara" durante o piloto.
      </AdminPageIntro>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Identidade" icon={Sparkles}>
          <Field label="Nome exibido para clientes">
            <input
              type="text"
              disabled={!canEdit}
              value={form.nome_exibido}
              onChange={(e) => update("nome_exibido", e.target.value)}
              className="admin-input h-9 w-full px-3 text-sm"
              placeholder="Bárbara"
            />
          </Field>
          <Field label="Assinatura padrão (rodapé das mensagens)">
            <textarea
              rows={2}
              disabled={!canEdit}
              value={form.assinatura_padrao ?? ""}
              onChange={(e) => update("assinatura_padrao", e.target.value)}
              className="admin-input w-full p-3 text-sm"
              placeholder="— Bárbara · Atendimento Cavalgadas"
            />
          </Field>
          <label className="mt-3 flex items-center gap-2 text-sm text-[color:var(--admin-cinza-2)]">
            <input type="checkbox" disabled={!canEdit} checked={form.ativa} onChange={(e) => update("ativa", e.target.checked)} />
            Assistente ativa
          </label>
        </Card>

        <Card title="Modo de operação" icon={ShieldCheck}>
          <div className="space-y-2">
            {MODOS.map((m) => {
              const active = form.modo === m.key;
              return (
                <button
                  type="button"
                  key={m.key}
                  disabled={!canEdit}
                  onClick={() => update("modo", m.key)}
                  className={`block w-full rounded-md border px-3 py-2 text-left text-xs transition ${
                    active
                      ? "border-[color:var(--admin-dourado)] bg-[color:var(--admin-dourado)]/10"
                      : "border-[color:var(--admin-borda)] hover:border-[color:var(--admin-dourado)]/40"
                  }`}
                >
                  <div className={`text-sm font-medium ${active ? "text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-cinza-1)]"}`}>{m.label}</div>
                  <div className="text-[color:var(--admin-cinza-3)] mt-0.5">{m.descricao}</div>
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Field label={`Limite mínimo de confiança para resposta automática: ${(form.limite_confianca * 100).toFixed(0)}%`}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                disabled={!canEdit || form.modo !== "autonomo"}
                value={form.limite_confianca}
                onChange={(e) => update("limite_confianca", Number(e.target.value))}
                className="w-full accent-[color:var(--admin-dourado)]"
              />
            </Field>
            {form.modo !== "autonomo" ? (
              <div className="text-[10px] text-[color:var(--admin-cinza-3)]">
                Só se aplica no modo Autônomo.
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="Idiomas suportados" icon={Languages}>
          <div className="flex flex-wrap gap-2">
            {IDIOMAS.map((i) => {
              const active = form.idiomas.includes(i.key);
              return (
                <button
                  type="button"
                  key={i.key}
                  disabled={!canEdit}
                  onClick={() => update("idiomas", toggleIn(form.idiomas, i.key))}
                  className={`rounded-md border px-3 py-1.5 text-xs ${active ? "border-[color:var(--admin-dourado)] bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)]"}`}
                >
                  {i.label}
                </button>
              );
            })}
          </div>
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
        </Card>

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
                  onClick={() => update("dias_atendimento", toggleIn(form.dias_atendimento, d.key))}
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

        <Card title="Gatilhos de handoff" icon={PenLine}>
          <div className="space-y-1 mb-3">
            {GATILHOS_PRESET.map((g) => {
              const active = form.gatilhos_handoff.includes(g);
              return (
                <label key={g} className="flex items-center gap-2 text-xs text-[color:var(--admin-cinza-2)]">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={active}
                    onChange={() => update("gatilhos_handoff", toggleIn(form.gatilhos_handoff, g))}
                  />
                  {g}
                </label>
              );
            })}
          </div>
          <div className="text-[10px] text-[color:var(--admin-cinza-3)]">
            Quando qualquer gatilho marcado disparar, a conversa é encaminhada à fila de Handoff humano.
          </div>
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
