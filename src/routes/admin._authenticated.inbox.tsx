import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Inbox, Search, Send, Bot, User, MessageSquare, Plus, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { useCan } from "@/hooks/use-permissions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/inbox")({
  component: InboxPage,
});

const CANAIS = ["whatsapp", "instagram", "site", "email", "telefone", "manual", "outro"] as const;
type Canal = typeof CANAIS[number];
type Autor = "cliente" | "operador" | "ia" | "sistema";

type LeadLite = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  protocolo: string | null;
};

type Msg = {
  id: string;
  canal: Canal;
  direcao: "entrada" | "saida";
  autor: Autor;
  conteudo: string | null;
  remetente: string | null;
  destinatario: string | null;
  lead_id: string | null;
  reserva_id: string | null;
  created_at: string;
  lido: boolean;
  metadata: Record<string, unknown>;
};

async function listMessages(q: string): Promise<(Msg & { lead?: LeadLite | null })[]> {
  let qb = supabase
    .from("mensagens_canal")
    .select("*, lead:leads(id,nome,telefone,email,protocolo)")
    .order("created_at", { ascending: false })
    .limit(200);

  const term = q.trim();
  if (term) {
    // Busca por conteúdo, remetente, destinatário e protocolo do lead vinculado
    qb = qb.or(
      `conteudo.ilike.%${term}%,remetente.ilike.%${term}%,destinatario.ilike.%${term}%`,
    );
  }
  const { data, error } = await qb;
  if (error) throw error;
  return (data ?? []) as unknown as (Msg & { lead?: LeadLite | null })[];
}

async function searchLeads(term: string): Promise<LeadLite[]> {
  if (!term.trim()) return [];
  const t = term.trim();
  const { data } = await supabase
    .from("leads")
    .select("id,nome,telefone,email,protocolo")
    .or(`nome.ilike.%${t}%,telefone.ilike.%${t}%,email.ilike.%${t}%,protocolo.ilike.%${t}%`)
    .limit(8);
  return (data ?? []) as LeadLite[];
}

function InboxPage() {
  const qc = useQueryClient();
  const { canEdit } = useCan("ia");
  const [q, setQ] = useState("");
  const [composing, setComposing] = useState(false);
  const { data: msgs = [] } = useQuery({ queryKey: ["inbox", q], queryFn: () => listMessages(q) });

  // Filtro adicional client-side: nome/telefone/email/protocolo do lead vinculado
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return msgs;
    return msgs.filter((m) => {
      const c = (m.conteudo ?? "").toLowerCase();
      const r = (m.remetente ?? "").toLowerCase();
      const d = (m.destinatario ?? "").toLowerCase();
      const l = m.lead;
      const inLead = l && (
        (l.nome ?? "").toLowerCase().includes(term) ||
        (l.telefone ?? "").toLowerCase().includes(term) ||
        (l.email ?? "").toLowerCase().includes(term) ||
        (l.protocolo ?? "").toLowerCase().includes(term)
      );
      return c.includes(term) || r.includes(term) || d.includes(term) || inLead;
    });
  }, [msgs, q]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("mensagens_canal")
        .update({ lido: true, lido_em: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inbox"] }),
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Atendimento · IA Bárbara"
        title="Caixa de entrada unificada"
        description="WhatsApp, Instagram, site, e-mail e telefone em um único lugar. Mensagens manuais e simuladas (IA) entram aqui."
        actions={canEdit ? (
          <button
            onClick={() => setComposing(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--admin-dourado)] px-4 py-2 text-sm font-medium text-[color:var(--admin-carvao-deep)] hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Registrar mensagem
          </button>
        ) : null}
      />

      <AdminPageIntro>
        Esta inbox aceita registros manuais e estará pronta para receber mensagens automáticas
        do WhatsApp (Evolution API), Instagram, site, e-mail e telefone na Fase 3 — sem qualquer mudança de estrutura.
      </AdminPageIntro>

      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-cinza-3)]" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, telefone, e-mail, protocolo, reserva ou conteúdo…"
          className="admin-input h-10 w-full pl-9 pr-3 text-sm"
        />
      </div>

      <div className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[color:var(--admin-cinza-3)]">
            <Inbox className="mx-auto mb-3 h-6 w-6 opacity-60" />
            Nenhuma mensagem encontrada.
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--admin-borda)]">
            {filtered.map((m) => (
              <li key={m.id} className="flex items-start gap-3 p-4">
                <AuthorIcon autor={m.autor} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-[color:var(--admin-cinza-3)]">
                    <span className="text-[color:var(--admin-dourado)]">{m.canal}</span>
                    <span>· {m.direcao}</span>
                    <span>· {m.autor}</span>
                    {!m.lido && <span className="rounded-full bg-[color:var(--admin-dourado)]/20 px-2 py-0.5 text-[color:var(--admin-dourado)]">novo</span>}
                    <span className="ml-auto normal-case tracking-normal">
                      {new Date(m.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--admin-cinza-1)] whitespace-pre-wrap break-words">
                    {m.conteudo || "—"}
                  </div>
                  <div className="mt-1 text-[11px] text-[color:var(--admin-cinza-3)]">
                    {m.remetente && <>de <span className="text-[color:var(--admin-cinza-2)]">{m.remetente}</span> </>}
                    {m.destinatario && <>→ <span className="text-[color:var(--admin-cinza-2)]">{m.destinatario}</span> </>}
                    {m.lead && (
                      <Link to="/admin/leads/$id" params={{ id: m.lead.id }} className="text-[color:var(--admin-dourado)] hover:underline">
                        · {m.lead.nome}{m.lead.protocolo ? ` (${m.lead.protocolo})` : ""}
                      </Link>
                    )}
                  </div>
                </div>
                {!m.lido && (
                  <button
                    onClick={() => markRead.mutate(m.id)}
                    className="rounded-md border border-[color:var(--admin-borda)] px-2 py-1 text-[11px] text-[color:var(--admin-cinza-2)] hover:bg-[color:var(--admin-petroleo-soft)]/40"
                  >
                    Marcar como lida
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {composing && (
        <ComposeModal onClose={() => setComposing(false)} onSaved={() => { setComposing(false); qc.invalidateQueries({ queryKey: ["inbox"] }); }} />
      )}
    </div>
  );
}

function AuthorIcon({ autor }: { autor: Autor }) {
  const Icon = autor === "ia" ? Bot : autor === "cliente" ? User : MessageSquare;
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]">
      <Icon className="h-4 w-4" />
    </div>
  );
}

function ComposeModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [canal, setCanal] = useState<Canal>("whatsapp");
  const [direcao, setDirecao] = useState<"entrada" | "saida">("entrada");
  const [autor, setAutor] = useState<Autor>("cliente");
  const [remetente, setRemetente] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [leadQuery, setLeadQuery] = useState("");
  const [lead, setLead] = useState<LeadLite | null>(null);
  const [registrarIA, setRegistrarIA] = useState(false);
  const [confidence, setConfidence] = useState(0.85);
  const [latencia, setLatencia] = useState<number | "">("");
  const [motivoHandoff, setMotivoHandoff] = useState("");

  const { data: sugestoes = [] } = useQuery({
    queryKey: ["lead-search", leadQuery],
    queryFn: () => searchLeads(leadQuery),
    enabled: leadQuery.trim().length >= 2 && !lead,
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!conteudo.trim()) throw new Error("Conteúdo obrigatório");
      const { data: msg, error } = await supabase
        .from("mensagens_canal")
        .insert({
          canal, direcao, autor,
          remetente: remetente || null,
          destinatario: destinatario || null,
          conteudo,
          lead_id: lead?.id ?? null,
          status: "registrado",
        })
        .select("id")
        .single();
      if (error) throw error;

      if (registrarIA || autor === "ia") {
        const { error: e2 } = await supabase
          .from("ia_interacoes")
          .insert({
            canal,
            direcao,
            autor: autor === "ia" ? "ia" : "humano",
            conteudo,
            resposta_final: direcao === "saida" ? conteudo : null,
            modelo: autor === "ia" ? "simulado" : null,
            confidence: autor === "ia" ? confidence : null,
            latencia_ms: latencia === "" ? null : Number(latencia),
            motivo_handoff: motivoHandoff || null,
            lead_id: lead?.id ?? null,
            mensagem_id: msg.id,
          });
        if (e2) throw e2;
      }
    },
    onSuccess: () => { toast.success("Mensagem registrada"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-medium text-[color:var(--admin-cinza-1)]">Registrar mensagem</h2>
          <button onClick={onClose} className="text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-cinza-1)]"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <F label="Canal">
            <select value={canal} onChange={(e) => setCanal(e.target.value as Canal)} className="admin-input h-9 w-full px-3 text-sm">
              {CANAIS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </F>
          <F label="Direção">
            <select value={direcao} onChange={(e) => setDirecao(e.target.value as "entrada" | "saida")} className="admin-input h-9 w-full px-3 text-sm">
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </F>
          <F label="Autor">
            <select value={autor} onChange={(e) => setAutor(e.target.value as Autor)} className="admin-input h-9 w-full px-3 text-sm">
              <option value="cliente">Cliente</option>
              <option value="operador">Operador</option>
              <option value="ia">IA (simulada)</option>
              <option value="sistema">Sistema</option>
            </select>
          </F>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <F label="Remetente"><input value={remetente} onChange={(e) => setRemetente(e.target.value)} placeholder="+55…  /  @user  /  email" className="admin-input h-9 w-full px-3 text-sm" /></F>
          <F label="Destinatário"><input value={destinatario} onChange={(e) => setDestinatario(e.target.value)} className="admin-input h-9 w-full px-3 text-sm" /></F>
        </div>

        <div className="mt-4">
          <F label="Vincular ao lead">
            {lead ? (
              <div className="flex items-center gap-2 rounded-md border border-[color:var(--admin-borda)] px-3 py-2 text-sm">
                <span className="flex-1">{lead.nome} {lead.protocolo ? `· ${lead.protocolo}` : ""}</span>
                <button onClick={() => { setLead(null); setLeadQuery(""); }} className="text-xs text-[color:var(--admin-cinza-3)] hover:text-red-400">Remover</button>
              </div>
            ) : (
              <>
                <input value={leadQuery} onChange={(e) => setLeadQuery(e.target.value)} placeholder="Buscar por nome, telefone, email ou protocolo…" className="admin-input h-9 w-full px-3 text-sm" />
                {sugestoes.length > 0 && (
                  <ul className="mt-1 max-h-40 overflow-y-auto rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]">
                    {sugestoes.map((s) => (
                      <li key={s.id}>
                        <button onClick={() => setLead(s)} className="block w-full text-left px-3 py-2 text-sm hover:bg-[color:var(--admin-petroleo-soft)]/40">
                          {s.nome} <span className="text-[color:var(--admin-cinza-3)]">{s.telefone || s.email || s.protocolo}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </F>
        </div>

        <div className="mt-4">
          <F label="Conteúdo">
            <textarea rows={5} value={conteudo} onChange={(e) => setConteudo(e.target.value)} className="admin-input w-full p-3 text-sm" />
          </F>
        </div>

        {(autor === "ia" || registrarIA) ? null : (
          <label className="mt-3 flex items-center gap-2 text-xs text-[color:var(--admin-cinza-3)]">
            <input type="checkbox" checked={registrarIA} onChange={(e) => setRegistrarIA(e.target.checked)} />
            Também registrar em ia_interacoes (simulação)
          </label>
        )}

        {(autor === "ia" || registrarIA) && (
          <div className="mt-4 grid gap-4 md:grid-cols-3 rounded-md border border-[color:var(--admin-borda)] p-3">
            <F label="Confiança (0–1)">
              <input type="number" step="0.05" min="0" max="1" value={confidence} onChange={(e) => setConfidence(Number(e.target.value))} className="admin-input h-9 w-full px-3 text-sm" />
            </F>
            <F label="Latência (ms)">
              <input type="number" value={latencia} onChange={(e) => setLatencia(e.target.value === "" ? "" : Number(e.target.value))} className="admin-input h-9 w-full px-3 text-sm" />
            </F>
            <F label="Motivo de handoff (opcional)">
              <input value={motivoHandoff} onChange={(e) => setMotivoHandoff(e.target.value)} className="admin-input h-9 w-full px-3 text-sm" />
            </F>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-[color:var(--admin-borda)] px-4 py-2 text-sm text-[color:var(--admin-cinza-1)]">Cancelar</button>
          <button
            disabled={!conteudo.trim() || save.isPending}
            onClick={() => save.mutate()}
            className="inline-flex items-center gap-2 rounded-md bg-[color:var(--admin-dourado)] px-4 py-2 text-sm font-medium text-[color:var(--admin-carvao-deep)] hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Registrar
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-[color:var(--admin-cinza-3)]">
      <div className="mb-1">{label}</div>
      {children}
    </label>
  );
}
