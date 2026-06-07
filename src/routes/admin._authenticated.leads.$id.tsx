import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Send, Star, Flame, Brain, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { ConverterLeadModal } from "@/components/admin/converter-lead-modal";
import {
  getLead, updateLead, LEAD_ETAPAS, CONVERSA_TIPOS,
  LEAD_TEMPERATURAS, LEAD_STATUS_ATENDIMENTO, LEAD_MOTIVOS_PERDA,
  listLeadConversas, addLeadConversa,
  getLeadMemoria, upsertLeadMemoria,
  type LeadRow, type LeadEtapaId, type LeadConversaTipo, type LeadMemoriaRow,
  type LeadTemperaturaId, type LeadStatusAtendimentoId, type LeadMotivoPerdaId,
} from "@/lib/admin/api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/leads/$id")({
  component: LeadEdit,
});

function LeadEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: lead } = useQuery({ queryKey: ["admin", "lead", id], queryFn: () => getLead(id) });
  const { data: conversas = [] } = useQuery({ queryKey: ["admin", "lead-conv", id], queryFn: () => listLeadConversas(id) });
  const { data: memoria } = useQuery({ queryKey: ["admin", "lead-mem", id], queryFn: () => getLeadMemoria(id) });
  // se já existe reserva vinda desse lead, mostra atalho
  const { data: reservaExistente } = useQuery({
    queryKey: ["admin", "reserva-do-lead", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservas")
        .select("id, protocolo")
        .eq("lead_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data as { id: string; protocolo: string } | null;
    },
  });
  const [form, setForm] = useState<Partial<LeadRow> | null>(null);
  const [nota, setNota] = useState("");
  const [tipoNota, setTipoNota] = useState<LeadConversaTipo>("observacao_interna");
  const [converter, setConverter] = useState(false);
  useEffect(() => { if (lead) setForm(lead); }, [lead]);

  const saveMut = useMutation({
    mutationFn: (patch: Partial<LeadRow>) => updateLead(id, patch),
    onSuccess: () => { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const conversaMut = useMutation({
    mutationFn: () => addLeadConversa({ leadId: id, tipo: tipoNota, conteudo: nota.trim() }),
    onSuccess: () => {
      setNota("");
      qc.invalidateQueries({ queryKey: ["admin", "lead-conv", id] });
      qc.invalidateQueries({ queryKey: ["admin", "lead", id] });
      toast.success("Registrado");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!form) return <div className="admin-card h-40 animate-pulse" />;

  const podeConverter =
    !reservaExistente &&
    form.etapa_atendimento !== "convertido" &&
    form.etapa_atendimento !== "perdido";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={form.protocolo ?? "lead"}
        title={form.nome ?? ""}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <TemperaturaBadge value={form.temperatura_lead ?? "frio"} />
            <button className="admin-btn-ghost" onClick={() => nav({ to: "/admin/leads" })}><ArrowLeft className="h-4 w-4" /> Voltar</button>
            <button className="admin-btn-primary" onClick={() => saveMut.mutate(form)}><Save className="h-4 w-4" /> Salvar</button>
          </div>
        }
      />

      {/* CTA principal: converter ou ver reserva */}
      {reservaExistente ? (
        <Link
          to="/admin/reservas/$id"
          params={{ id: reservaExistente.id }}
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 hover:bg-emerald-500/15 transition"
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            <div>
              <div className="text-sm font-medium text-[color:var(--admin-cinza-1)]">
                Reserva já criada
              </div>
              <div className="text-[11px] text-[color:var(--admin-cinza-3)]">
                Protocolo {reservaExistente.protocolo} — clique pra abrir a ficha completa
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[color:var(--admin-dourado)]" />
        </Link>
      ) : podeConverter ? (
        <button
          onClick={() => setConverter(true)}
          className="flex w-full items-center justify-between rounded-xl border border-[color:var(--admin-dourado)]/30 bg-[color:var(--admin-dourado)]/10 px-4 py-3 hover:bg-[color:var(--admin-dourado)]/15 transition"
        >
          <div className="text-left">
            <div className="text-sm font-medium text-[color:var(--admin-cinza-1)]">
              Pronto pra reservar? Converta em reserva
            </div>
            <div className="text-[11px] text-[color:var(--admin-cinza-3)]">
              Cria a reserva já vinculada, com participantes prontos pra completar — e move o lead pra Convertido
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-[color:var(--admin-dourado)]" />
        </button>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AdminSection titulo="Atendimento" descricao="Onde está esse lead na jornada e o que precisa acontecer agora.">
            <div className="grid grid-cols-2 gap-3">
              <AdminField label="Etapa do Atendimento">
                <select className="admin-input" value={form.etapa_atendimento ?? "novo"} onChange={(e) => setForm({ ...form, etapa_atendimento: e.target.value as LeadEtapaId, status: e.target.value })}>
                  {LEAD_ETAPAS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </AdminField>
              <AdminField label="Nível de Interesse (1 a 5)">
                <select className="admin-input" value={form.nivel_interesse ?? 3} onChange={(e) => setForm({ ...form, nivel_interesse: Number(e.target.value) })}>
                  <option value={5}>⭐⭐⭐⭐⭐ Altíssimo</option>
                  <option value={4}>⭐⭐⭐⭐ Alto</option>
                  <option value={3}>⭐⭐⭐ Médio</option>
                  <option value={2}>⭐⭐ Baixo</option>
                  <option value={1}>⭐ Muito baixo</option>
                </select>
              </AdminField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <AdminField label="Temperatura">
                <select className="admin-input" value={form.temperatura_lead ?? "frio"} onChange={(e) => setForm({ ...form, temperatura_lead: e.target.value as LeadTemperaturaId })}>
                  {LEAD_TEMPERATURAS.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>)}
                </select>
              </AdminField>
              <AdminField label="Status de atendimento">
                <select className="admin-input" value={form.status_atendimento ?? "ia"} onChange={(e) => setForm({ ...form, status_atendimento: e.target.value as LeadStatusAtendimentoId })}>
                  {LEAD_STATUS_ATENDIMENTO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </AdminField>
              <AdminField label="Próxima ação">
                <input className="admin-input" placeholder="Ex: Follow-up 24h, Enviar contrato…" value={form.proxima_acao ?? ""} onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })} />
              </AdminField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AdminField label="Lead Score (0 a 100, gerado pela IA)">
                <input type="number" min={0} max={100} className="admin-input" value={form.lead_score ?? 0} onChange={(e) => setForm({ ...form, lead_score: Math.max(0, Math.min(100, Number(e.target.value))) })} />
              </AdminField>
              <AdminField label={form.etapa_atendimento === "perdido" ? "Motivo da perda" : "Motivo da perda (se aplicável)"}>
                <select className="admin-input" value={form.motivo_perda ?? ""} onChange={(e) => setForm({ ...form, motivo_perda: (e.target.value || null) as LeadMotivoPerdaId | null })}>
                  <option value="">—</option>
                  {LEAD_MOTIVOS_PERDA.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </AdminField>
            </div>
            {form.motivo_perda ? (
              <AdminField label="Detalhe da perda">
                <input className="admin-input" value={form.motivo_perda_detalhe ?? ""} onChange={(e) => setForm({ ...form, motivo_perda_detalhe: e.target.value })} />
              </AdminField>
            ) : null}
            <AdminField label="Resumo do atendimento (equipe)">
              <textarea className="admin-input min-h-[80px]" value={form.resumo_atendimento ?? ""} onChange={(e) => setForm({ ...form, resumo_atendimento: e.target.value })} />
            </AdminField>
            {form.resumo_ia ? (
              <div className="rounded-lg border border-violet-400/20 bg-violet-400/5 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-violet-300/80">
                  <Brain className="h-3 w-3" /> Resumo gerado por IA
                </div>
                <p className="text-sm text-[color:var(--admin-cinza-1)]">{form.resumo_ia}</p>
              </div>
            ) : null}
          </AdminSection>

          <AdminSection titulo="Dados do lead">
            <AdminField label="Nome"><input className="admin-input" value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></AdminField>
            <div className="grid grid-cols-2 gap-3">
              <AdminField label="E-mail"><input className="admin-input" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></AdminField>
              <AdminField label="Telefone"><input className="admin-input" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></AdminField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AdminField label="Cidade"><input className="admin-input" value={form.cidade ?? ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></AdminField>
              <AdminField label="Estado"><input className="admin-input" value={form.estado ?? ""} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></AdminField>
            </div>
            <AdminField label="Expedição de interesse"><input className="admin-input" value={form.expedicao_interesse ?? ""} onChange={(e) => setForm({ ...form, expedicao_interesse: e.target.value })} /></AdminField>
            <div className="grid grid-cols-3 gap-3">
              <AdminField label="Data de interesse"><input type="date" className="admin-input" value={form.data_interesse ?? ""} onChange={(e) => setForm({ ...form, data_interesse: e.target.value || null })} /></AdminField>
              <AdminField label="Pessoas"><input type="number" className="admin-input" value={form.quantidade_pessoas ?? 1} onChange={(e) => setForm({ ...form, quantidade_pessoas: Number(e.target.value) })} /></AdminField>
              <AdminField label="Valor estimado"><input type="number" className="admin-input" value={form.valor_estimado ?? ""} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value ? Number(e.target.value) : null })} /></AdminField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <AdminField label="Canal de entrada">
                <select className="admin-input" value={form.canal_entrada ?? ""} onChange={(e) => setForm({ ...form, canal_entrada: e.target.value || null })}>
                  <option value="">—</option>
                  <option value="site">Site</option>
                  <option value="instagram">Instagram</option>
                  <option value="google">Google</option>
                  <option value="indicacao">Indicação</option>
                  <option value="outro">Outro</option>
                </select>
              </AdminField>
              <AdminField label="Canal de atendimento">
                <select className="admin-input" value={form.canal_atendimento ?? ""} onChange={(e) => setForm({ ...form, canal_atendimento: e.target.value || null })}>
                  <option value="">—</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telefone">Telefone</option>
                  <option value="email">E-mail</option>
                  <option value="presencial">Presencial</option>
                </select>
              </AdminField>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <AdminField label="UTM source"><input className="admin-input" value={form.utm_source ?? ""} onChange={(e) => setForm({ ...form, utm_source: e.target.value || null })} /></AdminField>
              <AdminField label="UTM medium"><input className="admin-input" value={form.utm_medium ?? ""} onChange={(e) => setForm({ ...form, utm_medium: e.target.value || null })} /></AdminField>
              <AdminField label="UTM campaign"><input className="admin-input" value={form.utm_campaign ?? ""} onChange={(e) => setForm({ ...form, utm_campaign: e.target.value || null })} /></AdminField>
            </div>
            
            <div className="rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/40 p-4 space-y-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">Inteligência de Marketing</div>
              <div className="grid grid-cols-2 gap-4">
                <AdminField label="Primeira página visitada">
                  <div className="text-sm text-[color:var(--admin-cinza-2)] bg-[color:var(--admin-carvao-deep)]/60 px-3 py-2 rounded border border-[color:var(--admin-borda)] truncate" title={form.primeira_pagina_visitada ?? "—"}>
                    {form.primeira_pagina_visitada ?? "—"}
                  </div>
                </AdminField>
                <AdminField label="Última página visitada">
                  <div className="text-sm text-[color:var(--admin-cinza-2)] bg-[color:var(--admin-carvao-deep)]/60 px-3 py-2 rounded border border-[color:var(--admin-borda)] truncate" title={form.ultima_pagina_visitada ?? "—"}>
                    {form.ultima_pagina_visitada ?? "—"}
                  </div>
                </AdminField>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <AdminField label="Dispositivo">
                  <div className="text-sm text-[color:var(--admin-cinza-2)] bg-[color:var(--admin-carvao-deep)]/60 px-3 py-2 rounded border border-[color:var(--admin-borda)]">
                    {form.dispositivo ?? "—"}
                  </div>
                </AdminField>
                <AdminField label="Visitas">
                  <div className="text-sm text-[color:var(--admin-cinza-2)] bg-[color:var(--admin-carvao-deep)]/60 px-3 py-2 rounded border border-[color:var(--admin-borda)]">
                    {form.quantidade_visitas ?? 1}
                  </div>
                </AdminField>
                <AdminField label="Conversão">
                  <div className="text-sm text-[color:var(--admin-cinza-2)] bg-[color:var(--admin-carvao-deep)]/60 px-3 py-2 rounded border border-[color:var(--admin-borda)]">
                    {form.data_conversao ? new Date(form.data_conversao).toLocaleDateString("pt-BR") : "Pendente"}
                  </div>
                </AdminField>
              </div>
            </div>

            <AdminField label="Observações"><textarea className="admin-input min-h-[80px]" value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></AdminField>
          </AdminSection>

          <MemoriaCard leadId={id} memoria={memoria ?? null} />
        </div>

        <div className="space-y-6">
          <AdminSection titulo="Resumo visual">
            <div className="flex items-center justify-between rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/60 p-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < (form.nivel_interesse ?? 3) ? "fill-[color:var(--admin-dourado)] text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-borda)]"}`} />
                ))}
              </div>
              <div className="flex items-center gap-1 text-amber-300">
                <Flame className="h-4 w-4" /> <span className="text-sm font-medium">{form.lead_score ?? 0}</span>
              </div>
            </div>
            <p className="text-xs text-[color:var(--admin-cinza-3)]">
              Última interação: {form.ultima_interacao_at ? new Date(form.ultima_interacao_at).toLocaleString("pt-BR") : "—"}
            </p>
          </AdminSection>

          <AdminSection titulo="Registrar interação" descricao="Cada anotação fica salva no histórico permanente.">
            <AdminField label="Tipo">
              <select className="admin-input" value={tipoNota} onChange={(e) => setTipoNota(e.target.value as LeadConversaTipo)}>
                {CONVERSA_TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </AdminField>
            <textarea className="admin-input min-h-[80px]" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Liguei, mandei mensagem, recebi resposta…" />
            <button
              className="admin-btn-primary w-full"
              disabled={!nota.trim() || conversaMut.isPending}
              onClick={() => conversaMut.mutate()}
            >
              <Send className="h-4 w-4" /> Registrar
            </button>
          </AdminSection>

          <HistoricoAbas conversas={conversas} />

        </div>
      </div>

      {converter ? (
        <ConverterLeadModal
          open={converter}
          onOpenChange={setConverter}
          lead={lead as LeadRow}
          onConverted={() => {
            qc.invalidateQueries({ queryKey: ["admin", "lead", id] });
            qc.invalidateQueries({ queryKey: ["admin", "reserva-do-lead", id] });
          }}
        />
      ) : null}
    </div>
  );
}

function MemoriaCard({ leadId, memoria }: { leadId: string; memoria: LeadMemoriaRow | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<LeadMemoriaRow>>(memoria ?? {});
  useEffect(() => { if (memoria) setForm(memoria); }, [memoria]);
  const mut = useMutation({
    mutationFn: () => upsertLeadMemoria(leadId, form),
    onSuccess: () => { toast.success("Memória atualizada"); qc.invalidateQueries({ queryKey: ["admin", "lead-mem", leadId] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <AdminSection
      titulo="Memória do lead (para a IA)"
      descricao="Resumo de quem é essa pessoa — alimenta o atendimento por IA no futuro. Pode ser preenchido manualmente agora."
    >
      <AdminField label="Perfil"><textarea className="admin-input min-h-[60px]" value={form.perfil ?? ""} onChange={(e) => setForm({ ...form, perfil: e.target.value })} placeholder="Ex: Mulher 38 anos, executiva, já fez cavalgada no Pantanal." /></AdminField>
      <AdminField label="Objetivos"><input className="admin-input" value={form.objetivos ?? ""} onChange={(e) => setForm({ ...form, objetivos: e.target.value })} placeholder="Desconectar, conexão com a natureza…" /></AdminField>
      <AdminField label="Interesses"><input className="admin-input" value={form.interesses ?? ""} onChange={(e) => setForm({ ...form, interesses: e.target.value })} /></AdminField>
      <AdminField label="Restrições"><input className="admin-input" value={form.restricoes ?? ""} onChange={(e) => setForm({ ...form, restricoes: e.target.value })} placeholder="Alimentar, médica, datas…" /></AdminField>
      <AdminField label="Orçamento (R$)"><input type="number" className="admin-input" value={form.orcamento ?? ""} onChange={(e) => setForm({ ...form, orcamento: e.target.value ? Number(e.target.value) : null })} /></AdminField>
      <button className="admin-btn-ghost w-full" onClick={() => mut.mutate()} disabled={mut.isPending}>Salvar memória</button>
    </AdminSection>
  );
}

const CONVERSA_EVENTOS = new Set(["mensagem_ia", "mensagem_humana", "ligacao", "email", "observacao_interna"]);

function HistoricoAbas({ conversas }: { conversas: Array<{ id: string; created_at: string; conteudo: string | null; tipo_evento: string }> }) {
  const [aba, setAba] = useState<"conversas" | "timeline" | "tudo">("tudo");
  const filtradas = conversas.filter((c) => {
    if (aba === "tudo") return true;
    const isConversa = CONVERSA_EVENTOS.has(c.tipo_evento);
    return aba === "conversas" ? isConversa : !isConversa;
  });
  const Tab = ({ id, label }: { id: typeof aba; label: string }) => (
    <button
      onClick={() => setAba(id)}
      className={`px-3 py-1 text-[11px] uppercase tracking-[0.18em] rounded-md border transition ${
        aba === id
          ? "border-[color:var(--admin-dourado)]/40 bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]"
          : "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-cinza-1)]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <AdminSection titulo="Histórico" descricao="Conversas com o lead e eventos da timeline (criação, mudanças, IA, transferências).">
      <div className="flex items-center gap-2">
        <Tab id="tudo" label="Tudo" />
        <Tab id="conversas" label="Conversas" />
        <Tab id="timeline" label="Timeline" />
      </div>
      <ol className="space-y-3 mt-2">
        {filtradas.map((c) => (
          <li key={c.id} className="relative pl-5">
            <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-[color:var(--admin-dourado)]" />
            <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">{new Date(c.created_at).toLocaleString("pt-BR")}</div>
            <div className="mt-0.5 text-sm text-[color:var(--admin-cinza-1)] whitespace-pre-wrap">{c.conteudo ?? "—"}</div>
            <div className="mt-1"><StatusBadge status={c.tipo_evento} /></div>
          </li>
        ))}
        {filtradas.length === 0 ? <p className="text-sm text-[color:var(--admin-cinza-3)]">Nada por aqui ainda.</p> : null}
      </ol>
    </AdminSection>
  );
}

function TemperaturaBadge({ value }: { value: LeadTemperaturaId }) {
  const t = LEAD_TEMPERATURAS.find((x) => x.id === value) ?? LEAD_TEMPERATURAS[0];
  const tone: Record<LeadTemperaturaId, string> = {
    frio: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    morno: "border-amber-300/30 bg-amber-300/10 text-amber-100",
    quente: "border-orange-400/40 bg-orange-400/10 text-orange-200",
    urgente: "border-rose-500/40 bg-rose-500/10 text-rose-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] uppercase tracking-[0.18em] ${tone[value]}`}>
      <span>{t.emoji}</span> {t.label}
    </span>
  );
}

