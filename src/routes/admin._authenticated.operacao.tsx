import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, Clock, CheckCircle2, HandIcon, ClipboardList, FileText, Wallet, BookOpen, Plus, X,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { useCan } from "@/hooks/use-permissions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/operacao")({
  component: OperacaoPage,
});

type Aba = "atencao" | "handoffs" | "tarefas";
const PRIORIDADES = ["baixa", "media", "alta", "critica"] as const;

function OperacaoPage() {
  const [aba, setAba] = useState<Aba>("atencao");
  const { canEdit } = useCan("ia");
  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação · IA Bárbara"
        title="Central operacional"
        description="Atenção do dia, handoffs com SLA e tarefas — pronta para operar antes da IA entrar."
      />
      <AdminPageIntro>
        Aqui o operador conduz o atendimento inteiro: vê o que precisa de ação hoje, recebe e resolve handoffs,
        e fecha tarefas geradas manualmente ou por automação. Quando a Bárbara entrar, ela usa exatamente os mesmos registros.
      </AdminPageIntro>

      <div className="mb-4 flex gap-2">
        {([["atencao","Atenção hoje"],["handoffs","Handoffs"],["tarefas","Tarefas"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setAba(k)}
            className={`rounded-md border px-3 py-1.5 text-xs uppercase tracking-wide ${
              aba === k
                ? "border-[color:var(--admin-dourado)]/40 bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]"
                : "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-cinza-1)]"
            }`}>{l}</button>
        ))}
      </div>

      {aba === "atencao" && <CentralAtencao />}
      {aba === "handoffs" && <Handoffs canEdit={canEdit} />}
      {aba === "tarefas" && <Tarefas canEdit={canEdit} />}
    </div>
  );
}

/* ============== ATENÇÃO ============== */
type AtencaoRow = {
  categoria: string; item_id: string; lead_id: string | null; reserva_id: string | null;
  prioridade: string; ocorrido_em: string; vence_em: string | null; atrasado: boolean; titulo: string;
};

function CentralAtencao() {
  const { data = [] } = useQuery({
    queryKey: ["central-atencao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_central_atencao")
        .select("*")
        .order("atrasado", { ascending: false })
        .order("vence_em", { ascending: true, nullsFirst: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as AtencaoRow[];
    },
  });

  const grupos = useMemo(() => {
    const g: Record<string, AtencaoRow[]> = { handoff: [], tarefa: [], pagamento: [], documento: [], reserva: [] };
    for (const r of data) (g[r.categoria] ??= []).push(r);
    return g;
  }, [data]);

  const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
    handoff: HandIcon, tarefa: ClipboardList, pagamento: Wallet, documento: FileText, reserva: BookOpen,
  };
  const LABEL: Record<string, string> = {
    handoff: "Handoffs pendentes", tarefa: "Tarefas em aberto",
    pagamento: "Pagamentos próximos / atrasados", documento: "Documentos pendentes",
    reserva: "Reservas aguardando ação",
  };

  if (data.length === 0) {
    return <Empty icon={CheckCircle2} text="Tudo em dia. Nada exige atenção agora." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(grupos).map(([cat, items]) => items.length === 0 ? null : (
        <div key={cat} className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[color:var(--admin-cinza-1)]">
            {(() => { const I = ICON[cat]; return <I className="h-4 w-4 text-[color:var(--admin-dourado)]" />; })()}
            {LABEL[cat]} <span className="ml-auto text-xs text-[color:var(--admin-cinza-3)]">{items.length}</span>
          </div>
          <ul className="space-y-2">
            {items.slice(0, 8).map((r) => (
              <li key={`${r.categoria}-${r.item_id}`} className="flex items-start gap-2 text-sm">
                {r.atrasado
                  ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  : <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--admin-cinza-3)]" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[color:var(--admin-cinza-1)] truncate">{r.titulo}</div>
                  <div className="text-[11px] text-[color:var(--admin-cinza-3)]">
                    {r.prioridade}
                    {r.vence_em && ` · vence ${new Date(r.vence_em).toLocaleString("pt-BR")}`}
                    {r.lead_id && (
                      <Link to="/admin/leads/$id" params={{ id: r.lead_id }} className="ml-2 text-[color:var(--admin-dourado)] hover:underline">abrir lead</Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ============== HANDOFFS ============== */
type HandoffRow = {
  id: string; motivo: string; prioridade: string; status: string; origem: string;
  lead_id: string | null; reserva_id: string | null; atribuido_para: string | null;
  responsavel_anterior: string | null; responsavel_atual: string | null;
  criado_em: string; prazo: string | null; resolvido_em: string | null;
  sla_status: "no_prazo" | "atrasado" | "resolvido"; segundos_em_aberto: number; notas: string | null;
};

function Handoffs({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<"todos" | "no_prazo" | "atrasado" | "resolvido">("todos");
  const [criar, setCriar] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["handoffs-sla"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_handoffs_sla")
        .select("*")
        .order("criado_em", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as HandoffRow[];
    },
  });

  const filtrados = filtro === "todos" ? data : data.filter((d) => d.sla_status === filtro);

  const update = useMutation({
    mutationFn: async (p: { id: string; patch: Partial<HandoffRow> }) => {
      const { error } = await supabase.from("ia_handoff_queue").update(p.patch).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["handoffs-sla"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["todos","no_prazo","atrasado","resolvido"] as const).map((k) => (
          <button key={k} onClick={() => setFiltro(k)}
            className={`rounded-md border px-3 py-1 text-[11px] uppercase tracking-wide ${
              filtro === k
                ? "border-[color:var(--admin-dourado)]/40 bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]"
                : "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-3)]"
            }`}>{k.replace("_"," ")}</button>
        ))}
        {canEdit && (
          <button onClick={() => setCriar(true)} className="ml-auto inline-flex items-center gap-2 rounded-md bg-[color:var(--admin-dourado)] px-3 py-1.5 text-xs font-medium text-[color:var(--admin-carvao-deep)] hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Novo handoff
          </button>
        )}
      </div>

      {filtrados.length === 0 ? <Empty icon={HandIcon} text="Nenhum handoff." /> : (
        <ul className="space-y-2">
          {filtrados.map((h) => (
            <li key={h.id} className="rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/30 p-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-[color:var(--admin-cinza-3)]">
                <span className={
                  h.sla_status === "atrasado" ? "text-rose-400" :
                  h.sla_status === "resolvido" ? "text-emerald-400" : "text-[color:var(--admin-dourado)]"
                }>{h.sla_status.replace("_"," ")}</span>
                <span>· {h.prioridade}</span>
                <span>· origem {h.origem}</span>
                <span>· status {h.status}</span>
                <span className="ml-auto normal-case tracking-normal">
                  criado {new Date(h.criado_em).toLocaleString("pt-BR")}
                  {h.prazo && <> · prazo {new Date(h.prazo).toLocaleString("pt-BR")}</>}
                </span>
              </div>
              <div className="mt-1 text-sm text-[color:var(--admin-cinza-1)]">{h.motivo}</div>
              {h.notas && <div className="mt-1 text-xs text-[color:var(--admin-cinza-3)] whitespace-pre-wrap">{h.notas}</div>}
              {(h.lead_id || h.reserva_id) && (
                <div className="mt-2 text-[11px]">
                  {h.lead_id && <Link to="/admin/leads/$id" params={{ id: h.lead_id }} className="text-[color:var(--admin-dourado)] hover:underline">abrir lead</Link>}
                </div>
              )}
              {canEdit && h.status !== "resolvido" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {h.status === "pendente" && (
                    <button onClick={() => update.mutate({ id: h.id, patch: { status: "em_andamento" } })}
                      className="rounded-md border border-[color:var(--admin-borda)] px-3 py-1 text-xs text-[color:var(--admin-cinza-1)] hover:bg-[color:var(--admin-petroleo-soft)]/40">
                      Assumir
                    </button>
                  )}
                  <button onClick={() => update.mutate({ id: h.id, patch: { status: "resolvido", resolvido_em: new Date().toISOString() } })}
                    className="rounded-md bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30">
                    Resolver
                  </button>
                  <button onClick={() => update.mutate({ id: h.id, patch: { status: "cancelado" } })}
                    className="rounded-md border border-[color:var(--admin-borda)] px-3 py-1 text-xs text-[color:var(--admin-cinza-3)] hover:text-red-400">
                    Cancelar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {criar && <CriarHandoff onClose={() => setCriar(false)} onSaved={() => { setCriar(false); qc.invalidateQueries({ queryKey: ["handoffs-sla"] }); }} />}
    </div>
  );
}

function CriarHandoff({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [motivo, setMotivo] = useState("");
  const [prioridade, setPrioridade] = useState<typeof PRIORIDADES[number]>("media");
  const [origem, setOrigem] = useState<"humano" | "automacao" | "ia" | "sistema">("humano");
  const [leadId, setLeadId] = useState("");
  const [notas, setNotas] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!motivo.trim()) throw new Error("Motivo obrigatório");
      const { error } = await supabase.from("ia_handoff_queue").insert({
        motivo, prioridade, origem, status: "pendente",
        lead_id: leadId || null, notas: notas || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Handoff criado"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal title="Novo handoff" onClose={onClose}>
      <Field label="Motivo"><input value={motivo} onChange={(e) => setMotivo(e.target.value)} className="admin-input h-9 w-full px-3 text-sm" /></Field>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Field label="Prioridade">
          <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as typeof PRIORIDADES[number])} className="admin-input h-9 w-full px-3 text-sm">
            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Origem">
          <select value={origem} onChange={(e) => setOrigem(e.target.value as typeof origem)} className="admin-input h-9 w-full px-3 text-sm">
            <option value="humano">humano</option><option value="automacao">automação</option>
            <option value="ia">ia</option><option value="sistema">sistema</option>
          </select>
        </Field>
      </div>
      <div className="mt-3"><Field label="Lead ID (opcional)"><input value={leadId} onChange={(e) => setLeadId(e.target.value)} className="admin-input h-9 w-full px-3 text-sm" /></Field></div>
      <div className="mt-3"><Field label="Notas"><textarea rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} className="admin-input w-full p-3 text-sm" /></Field></div>
      <ModalActions onClose={onClose} onSave={() => save.mutate()} disabled={!motivo.trim() || save.isPending} />
    </Modal>
  );
}

/* ============== TAREFAS ============== */
type TarefaRow = {
  id: string; titulo: string; descricao: string | null; tipo: string;
  prioridade: string; status: string; origem: string;
  lead_id: string | null; reserva_id: string | null; participante_id: string | null; expedicao_id: string | null;
  due_at: string | null; created_at: string; concluida_em: string | null;
};

function Tarefas({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<"abertas" | "atrasadas" | "concluidas" | "todas">("abertas");
  const [criar, setCriar] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["tarefas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tarefas").select("*").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as TarefaRow[];
    },
  });

  const filtradas = useMemo(() => {
    const agora = new Date();
    return data.filter((t) => {
      if (filtro === "todas") return true;
      if (filtro === "concluidas") return t.status === "concluida";
      if (filtro === "abertas") return t.status === "aberta" || t.status === "em_andamento";
      if (filtro === "atrasadas") return (t.status === "aberta" || t.status === "em_andamento") && t.due_at && new Date(t.due_at) < agora;
      return true;
    });
  }, [data, filtro]);

  const update = useMutation({
    mutationFn: async (p: { id: string; patch: Partial<TarefaRow> }) => {
      const { error } = await supabase.from("tarefas").update(p.patch).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["tarefas"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["abertas","atrasadas","concluidas","todas"] as const).map((k) => (
          <button key={k} onClick={() => setFiltro(k)}
            className={`rounded-md border px-3 py-1 text-[11px] uppercase tracking-wide ${
              filtro === k
                ? "border-[color:var(--admin-dourado)]/40 bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]"
                : "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-3)]"
            }`}>{k}</button>
        ))}
        {canEdit && (
          <button onClick={() => setCriar(true)} className="ml-auto inline-flex items-center gap-2 rounded-md bg-[color:var(--admin-dourado)] px-3 py-1.5 text-xs font-medium text-[color:var(--admin-carvao-deep)] hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Nova tarefa
          </button>
        )}
      </div>

      {filtradas.length === 0 ? <Empty icon={ClipboardList} text="Nenhuma tarefa." /> : (
        <ul className="space-y-2">
          {filtradas.map((t) => {
            const atrasada = t.due_at && t.status !== "concluida" && new Date(t.due_at) < new Date();
            return (
              <li key={t.id} className="rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/30 p-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-[color:var(--admin-cinza-3)]">
                  <span className={atrasada ? "text-rose-400" : t.status === "concluida" ? "text-emerald-400" : "text-[color:var(--admin-dourado)]"}>
                    {t.status}{atrasada ? " · atrasada" : ""}
                  </span>
                  <span>· {t.prioridade}</span>
                  <span>· origem {t.origem}</span>
                  <span>· {t.tipo}</span>
                  <span className="ml-auto normal-case tracking-normal">
                    {t.due_at && <>vence {new Date(t.due_at).toLocaleString("pt-BR")}</>}
                  </span>
                </div>
                <div className="mt-1 text-sm text-[color:var(--admin-cinza-1)]">{t.titulo}</div>
                {t.descricao && <div className="mt-1 text-xs text-[color:var(--admin-cinza-3)] whitespace-pre-wrap">{t.descricao}</div>}
                {t.lead_id && (
                  <div className="mt-1 text-[11px]"><Link to="/admin/leads/$id" params={{ id: t.lead_id }} className="text-[color:var(--admin-dourado)] hover:underline">abrir lead</Link></div>
                )}
                {canEdit && t.status !== "concluida" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {t.status === "aberta" && (
                      <button onClick={() => update.mutate({ id: t.id, patch: { status: "em_andamento" } })}
                        className="rounded-md border border-[color:var(--admin-borda)] px-3 py-1 text-xs text-[color:var(--admin-cinza-1)] hover:bg-[color:var(--admin-petroleo-soft)]/40">
                        Assumir
                      </button>
                    )}
                    <button onClick={() => update.mutate({ id: t.id, patch: { status: "concluida", concluida_em: new Date().toISOString() } })}
                      className="rounded-md bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/30">
                      Concluir
                    </button>
                    <button onClick={() => update.mutate({ id: t.id, patch: { status: "cancelada" } })}
                      className="rounded-md border border-[color:var(--admin-borda)] px-3 py-1 text-xs text-[color:var(--admin-cinza-3)] hover:text-red-400">
                      Cancelar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {criar && <CriarTarefa onClose={() => setCriar(false)} onSaved={() => { setCriar(false); qc.invalidateQueries({ queryKey: ["tarefas"] }); }} />}
    </div>
  );
}

function CriarTarefa({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("operacional");
  const [prioridade, setPrioridade] = useState<typeof PRIORIDADES[number]>("media");
  const [origem] = useState<"manual" | "automacao" | "ia" | "sistema">("manual");
  const [leadId, setLeadId] = useState("");
  const [dueAt, setDueAt] = useState("");

  const save = useMutation({
    mutationFn: async () => {
      if (!titulo.trim()) throw new Error("Título obrigatório");
      const { error } = await supabase.from("tarefas").insert({
        titulo, descricao: descricao || null, tipo, prioridade, origem, status: "aberta",
        lead_id: leadId || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Tarefa criada"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Modal title="Nova tarefa" onClose={onClose}>
      <Field label="Título"><input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="admin-input h-9 w-full px-3 text-sm" /></Field>
      <div className="mt-3"><Field label="Descrição"><textarea rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} className="admin-input w-full p-3 text-sm" /></Field></div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Field label="Tipo"><input value={tipo} onChange={(e) => setTipo(e.target.value)} className="admin-input h-9 w-full px-3 text-sm" /></Field>
        <Field label="Prioridade">
          <select value={prioridade} onChange={(e) => setPrioridade(e.target.value as typeof PRIORIDADES[number])} className="admin-input h-9 w-full px-3 text-sm">
            {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Vence em"><input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="admin-input h-9 w-full px-3 text-sm" /></Field>
      </div>
      <div className="mt-3"><Field label="Lead ID (opcional)"><input value={leadId} onChange={(e) => setLeadId(e.target.value)} className="admin-input h-9 w-full px-3 text-sm" /></Field></div>
      <ModalActions onClose={onClose} onSave={() => save.mutate()} disabled={!titulo.trim() || save.isPending} />
    </Modal>
  );
}

/* ============== helpers ============== */
function Empty({ icon: I, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40 p-10 text-center text-sm text-[color:var(--admin-cinza-3)]">
      <I className="mx-auto mb-3 h-6 w-6 opacity-60" />{text}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs text-[color:var(--admin-cinza-3)]"><div className="mb-1">{label}</div>{children}</label>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium text-[color:var(--admin-cinza-1)]">{title}</h2>
          <button onClick={onClose} className="text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-cinza-1)]"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ModalActions({ onClose, onSave, disabled }: { onClose: () => void; onSave: () => void; disabled: boolean }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <button onClick={onClose} className="rounded-md border border-[color:var(--admin-borda)] px-4 py-2 text-sm text-[color:var(--admin-cinza-1)]">Cancelar</button>
      <button disabled={disabled} onClick={onSave} className="rounded-md bg-[color:var(--admin-dourado)] px-4 py-2 text-sm font-medium text-[color:var(--admin-carvao-deep)] hover:opacity-90 disabled:opacity-50">Salvar</button>
    </div>
  );
}
