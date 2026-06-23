import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft, Save, Send, ArrowRight, User as UserIcon,
  Users, Wallet, FileText, MessageSquare, Brain, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConverterLeadModal } from "@/components/admin/converter-lead-modal";
import { ReservaResumoCard } from "@/components/admin/reserva-resumo-card";
import { ProximaAcaoBanner } from "@/components/admin/proxima-acao-banner";
import {
  getLead, updateLead, LEAD_ETAPAS, CONVERSA_TIPOS,
  LEAD_MOTIVOS_PERDA,
  listLeadConversas, addLeadConversa,
  getLeadMemoria, upsertLeadMemoria,
  type LeadRow, type LeadEtapaId, type LeadConversaTipo, type LeadMemoriaRow,
  type LeadMotivoPerdaId,
} from "@/lib/admin/api";
import { supabase } from "@/integrations/supabase/client";
import { jornadaEstagio, jornadaFromLead, JORNADA_TONE_CLASS } from "@/lib/admin/jornada";

export const Route = createFileRoute("/admin/_authenticated/leads/$id")({
  component: LeadEdit,
});

function LeadEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: lead } = useQuery({ queryKey: ["admin", "lead", id], queryFn: () => getLead(id) });
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
  const [converter, setConverter] = useState(false);
  useEffect(() => { if (lead) setForm(lead); }, [lead]);

  const saveMut = useMutation({
    mutationFn: (patch: Partial<LeadRow>) => updateLead(id, patch),
    onSuccess: () => { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!form) return <div className="admin-card h-40 animate-pulse" />;

  const jornada = jornadaFromLead(form as LeadRow);
  const estagio = jornadaEstagio(jornada);
  const podeConverter =
    !reservaExistente &&
    jornada !== "reserva_confirmada" &&
    jornada !== "expedicao_realizada" &&
    jornada !== "perdido";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={form.protocolo ?? "cliente"}
        title={form.nome ?? ""}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${JORNADA_TONE_CLASS[estagio.tone]}`}>
              {estagio.label}
            </span>
            <button className="admin-btn-ghost" onClick={() => nav({ to: "/admin/leads" })}><ArrowLeft className="h-4 w-4" /> Voltar</button>
            <button className="admin-btn-primary" onClick={() => saveMut.mutate(form)}><Save className="h-4 w-4" /> Salvar</button>
          </div>
        }
      />

      <ProximaAcaoBanner lead={form as LeadRow} contexto={{ temReserva: !!reservaExistente }} />

      {podeConverter ? (
        <button
          onClick={() => setConverter(true)}
          className="flex w-full items-center justify-between rounded-xl border border-[color:var(--admin-dourado)]/30 bg-[color:var(--admin-dourado)]/10 px-4 py-3 hover:bg-[color:var(--admin-dourado)]/15 transition"
        >
          <div className="text-left">
            <div className="text-sm font-medium text-[color:var(--admin-cinza-1)]">Converter em reserva</div>
            <div className="text-[11px] text-[color:var(--admin-cinza-3)]">Cria a reserva vinculada e habilita as abas Participantes, Financeiro e Documentos.</div>
          </div>
          <ArrowRight className="h-4 w-4 text-[color:var(--admin-dourado)]" />
        </button>
      ) : null}

      <Tabs defaultValue="cliente" className="w-full">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="bg-[color:var(--admin-carvao-deep)] border border-[color:var(--admin-borda)] p-1 min-w-max">
            <TabAba value="cliente"      icon={<UserIcon className="h-3.5 w-3.5" />}      label="Cliente" />
            <TabAba value="participantes" icon={<Users className="h-3.5 w-3.5" />}        label="Participantes" />
            <TabAba value="financeiro"   icon={<Wallet className="h-3.5 w-3.5" />}        label="Financeiro" />
            <TabAba value="documentos"   icon={<FileText className="h-3.5 w-3.5" />}      label="Documentos" />
            <TabAba value="conversas"    icon={<MessageSquare className="h-3.5 w-3.5" />} label="Conversas" />
            <TabAba value="ia"           icon={<Brain className="h-3.5 w-3.5" />}         label="IA" />
          </TabsList>
        </div>

        <TabsContent value="cliente" className="mt-4">
          <ClienteTab form={form} setForm={setForm} />
        </TabsContent>

        <TabsContent value="participantes" className="mt-4">
          {reservaExistente ? (
            <ReservaResumoCard reservaId={reservaExistente.id} />
          ) : (
            <EmptyAba mensagem="Converta este cliente em reserva para ver e editar a ficha dos participantes." />
          )}
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          {reservaExistente ? (
            <ReservaResumoCard reservaId={reservaExistente.id} />
          ) : (
            <EmptyAba mensagem="O financeiro aparece aqui assim que houver uma reserva vinculada." />
          )}
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          {reservaExistente ? (
            <ReservaResumoCard reservaId={reservaExistente.id} />
          ) : (
            <EmptyAba mensagem="Documentos por participante aparecem aqui após a conversão em reserva." />
          )}
        </TabsContent>

        <TabsContent value="conversas" className="mt-4">
          <ConversasTab leadId={id} />
        </TabsContent>

        <TabsContent value="ia" className="mt-4">
          <IATab leadId={id} resumoIA={form.resumo_ia ?? null} />
        </TabsContent>
      </Tabs>

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

function TabAba({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-[color:var(--admin-dourado)] data-[state=active]:text-[color:var(--admin-carvao-deep)] text-xs font-medium px-3 py-2 flex items-center gap-1.5"
    >
      {icon} {label}
    </TabsTrigger>
  );
}

function EmptyAba({ mensagem }: { mensagem: string }) {
  return (
    <div className="admin-card p-8 text-center text-sm text-[color:var(--admin-cinza-3)]">
      {mensagem}
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* CLIENTE                                                              */
/* -------------------------------------------------------------------- */

function ClienteTab({ form, setForm }: { form: Partial<LeadRow>; setForm: (f: Partial<LeadRow>) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Dados */}
      <AdminSection titulo="Dados">
        <AdminField label="Nome">
          <input className="admin-input" value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </AdminField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AdminField label="Telefone / WhatsApp">
            <input className="admin-input" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </AdminField>
          <AdminField label="E-mail">
            <input className="admin-input" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </AdminField>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AdminField label="Cidade">
            <input className="admin-input" value={form.cidade ?? ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
          </AdminField>
          <AdminField label="Estado">
            <input className="admin-input" value={form.estado ?? ""} onChange={(e) => setForm({ ...form, estado: e.target.value })} />
          </AdminField>
          <AdminField label="Idade">
            <input type="number" className="admin-input" value={form.idade ?? ""} onChange={(e) => setForm({ ...form, idade: e.target.value ? Number(e.target.value) : null })} />
          </AdminField>
        </div>
        <AdminField label="Data de nascimento">
          <input type="date" className="admin-input" value={form.data_nascimento ?? ""} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value || null })} />
        </AdminField>
      </AdminSection>

      {/* Interesse */}
      <AdminSection titulo="Interesse">
        <AdminField label="Expedição">
          <input className="admin-input" value={form.expedicao_interesse ?? ""} onChange={(e) => setForm({ ...form, expedicao_interesse: e.target.value })} />
        </AdminField>
        <div className="grid grid-cols-2 gap-3">
          <AdminField label="Data">
            <input type="date" className="admin-input" value={form.data_interesse ?? ""} onChange={(e) => setForm({ ...form, data_interesse: e.target.value || null })} />
          </AdminField>
          <AdminField label="Participantes">
            <input type="number" className="admin-input" value={form.quantidade_pessoas ?? 1} onChange={(e) => setForm({ ...form, quantidade_pessoas: Number(e.target.value) })} />
          </AdminField>
        </div>
        <AdminField label="Forma de pagamento (preferência)">
          <input className="admin-input" placeholder="Pix, cartão, boleto…" value={(form as any).forma_pagamento_preferida ?? ""} onChange={(e) => setForm({ ...form, observacoes: form.observacoes ?? "" })} disabled />
        </AdminField>
      </AdminSection>

      {/* Objetivo (texto original do cliente — sem reescrita) */}
      <AdminSection titulo="Objetivo" descricao="Texto original do cliente.">
        <textarea
          className="admin-input min-h-[120px]"
          value={form.motivacao_viagem ?? ""}
          onChange={(e) => setForm({ ...form, motivacao_viagem: e.target.value })}
        />
      </AdminSection>

      {/* Restrições */}
      <AdminSection titulo="Restrições" descricao="Texto original do cliente.">
        <textarea
          className="admin-input min-h-[120px]"
          value={form.observacoes_importantes ?? ""}
          onChange={(e) => setForm({ ...form, observacoes_importantes: e.target.value })}
        />
      </AdminSection>

      {/* Observações internas */}
      <AdminSection titulo="Observações" descricao="Anotações internas da equipe.">
        <textarea
          className="admin-input min-h-[120px]"
          value={form.observacoes ?? ""}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
        />
      </AdminSection>

      {/* Etapa & motivo de perda (operacional) */}
      <AdminSection titulo="Estado" descricao="Para mover sem usar o Kanban.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AdminField label="Etapa">
            <select
              className="admin-input"
              value={form.etapa_atendimento ?? "novo"}
              onChange={(e) => setForm({ ...form, etapa_atendimento: e.target.value as LeadEtapaId })}
            >
              {LEAD_ETAPAS.slice(0, 7).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </AdminField>
          <AdminField label="Motivo da perda (se aplicável)">
            <select
              className="admin-input"
              value={form.motivo_perda ?? ""}
              onChange={(e) => setForm({ ...form, motivo_perda: (e.target.value || null) as LeadMotivoPerdaId | null })}
            >
              <option value="">—</option>
              {LEAD_MOTIVOS_PERDA.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </AdminField>
        </div>
        <AdminField label="Próxima ação (manual)">
          <input
            className="admin-input"
            placeholder="Ex: Ligar amanhã às 14h…"
            value={form.proxima_acao ?? ""}
            onChange={(e) => setForm({ ...form, proxima_acao: e.target.value })}
          />
        </AdminField>
      </AdminSection>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* CONVERSAS — timeline única                                           */
/* -------------------------------------------------------------------- */

function ConversasTab({ leadId }: { leadId: string }) {
  const qc = useQueryClient();
  const { data: conversas = [] } = useQuery({
    queryKey: ["admin", "lead-conv", leadId],
    queryFn: () => listLeadConversas(leadId),
  });
  const [nota, setNota] = useState("");
  const [tipoNota, setTipoNota] = useState<LeadConversaTipo>("observacao_interna");

  const mut = useMutation({
    mutationFn: () => addLeadConversa({ leadId, tipo: tipoNota, conteudo: nota.trim() }),
    onSuccess: () => {
      setNota("");
      qc.invalidateQueries({ queryKey: ["admin", "lead-conv", leadId] });
      toast.success("Registrado");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <AdminSection titulo="Linha do tempo" descricao="WhatsApp, e-mail, ligações, mensagens internas — tudo em ordem cronológica.">
        <ol className="space-y-3">
          {conversas.map((c) => (
            <li key={c.id} className="relative pl-5">
              <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-[color:var(--admin-dourado)]" />
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                <span>{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                <StatusBadge status={c.tipo_evento} />
                {c.canal ? <span className="text-[10px]">via {c.canal}</span> : null}
              </div>
              <div className="mt-1 text-sm text-[color:var(--admin-cinza-1)] whitespace-pre-wrap break-words">
                {c.conteudo ?? "—"}
              </div>
            </li>
          ))}
          {conversas.length === 0 ? (
            <p className="text-sm text-[color:var(--admin-cinza-3)]">Nada registrado ainda.</p>
          ) : null}
        </ol>
      </AdminSection>

      <AdminSection titulo="Registrar" descricao="Toda anotação fica salva no histórico.">
        <AdminField label="Tipo">
          <select className="admin-input" value={tipoNota} onChange={(e) => setTipoNota(e.target.value as LeadConversaTipo)}>
            {CONVERSA_TIPOS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </AdminField>
        <textarea className="admin-input min-h-[100px]" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Liguei, mandei mensagem, recebi resposta…" />
        <button className="admin-btn-primary w-full" disabled={!nota.trim() || mut.isPending} onClick={() => mut.mutate()}>
          <Send className="h-4 w-4" /> Registrar
        </button>
      </AdminSection>
    </div>
  );
}

/* -------------------------------------------------------------------- */
/* IA — Fatos / Inferências / Resumo / Histórico                        */
/* -------------------------------------------------------------------- */

interface MemoriaItem {
  id: string;
  tipo: string;
  categoria: string | null;
  chave: string | null;
  valor: string;
  origem: string;
  confianca: number | null;
  created_at: string;
}

function IATab({ leadId, resumoIA }: { leadId: string; resumoIA: string | null }) {
  const qc = useQueryClient();
  const { data: memoria } = useQuery({ queryKey: ["admin", "lead-mem", leadId], queryFn: () => getLeadMemoria(leadId) });
  const { data: itens = [] } = useQuery({
    queryKey: ["admin", "lead-mem-itens", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_memoria_itens")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MemoriaItem[];
    },
  });

  const fatos = itens.filter((i) => i.tipo === "fato");
  const inferencias = itens.filter((i) => i.tipo === "inferencia");

  const addMut = useMutation({
    mutationFn: async (input: { tipo: "fato" | "inferencia"; valor: string; categoria?: string }) => {
      const { error } = await supabase.from("lead_memoria_itens").insert({
        lead_id: leadId,
        tipo: input.tipo,
        valor: input.valor,
        categoria: input.categoria ?? null,
        origem: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "lead-mem-itens", leadId] }),
  });

  const delMut = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("lead_memoria_itens").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "lead-mem-itens", leadId] }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <MemoriaLista
        titulo="Fatos"
        descricao="Informações confirmadas pelo cliente — nunca misturar com suposições."
        cor="emerald"
        itens={fatos}
        onAdd={(v) => addMut.mutate({ tipo: "fato", valor: v })}
        onDelete={(id) => delMut.mutate(id)}
      />
      <MemoriaLista
        titulo="Inferências"
        descricao="Suposições feitas pela IA ou pela equipe — tratar como hipótese."
        cor="violet"
        itens={inferencias}
        onAdd={(v) => addMut.mutate({ tipo: "inferencia", valor: v })}
        onDelete={(id) => delMut.mutate(id)}
      />

      <AdminSection titulo="Resumo" descricao="Visão geral do cliente para a IA.">
        <ResumoMemoriaForm leadId={leadId} memoria={memoria ?? null} />
      </AdminSection>

      <AdminSection titulo="Histórico" descricao="Resumo automático mais recente.">
        {resumoIA ? (
          <p className="text-sm text-[color:var(--admin-cinza-1)] whitespace-pre-wrap leading-relaxed">{resumoIA}</p>
        ) : (
          <p className="text-sm text-[color:var(--admin-cinza-3)]">Sem resumo gerado ainda.</p>
        )}
      </AdminSection>
    </div>
  );
}

function MemoriaLista({
  titulo, descricao, cor, itens, onAdd, onDelete,
}: {
  titulo: string;
  descricao: string;
  cor: "emerald" | "violet";
  itens: MemoriaItem[];
  onAdd: (valor: string) => void;
  onDelete: (id: string) => void;
}) {
  const [valor, setValor] = useState("");
  const tone = cor === "emerald"
    ? "border-emerald-400/30 bg-emerald-400/5"
    : "border-violet-400/30 bg-violet-400/5";
  return (
    <section className={`admin-card border ${tone}`}>
      <header className="mb-3">
        <h3 className="font-display text-base text-[color:var(--admin-cinza-1)]">{titulo}</h3>
        <p className="text-[11px] text-[color:var(--admin-cinza-3)]">{descricao}</p>
      </header>
      <ul className="space-y-2 mb-3">
        {itens.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-2 rounded-md border border-[color:var(--admin-borda)]/50 bg-[color:var(--admin-carvao-deep)]/40 p-2 text-sm">
            <div className="min-w-0">
              {i.categoria ? <div className="text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">{i.categoria}</div> : null}
              <div className="break-words text-[color:var(--admin-cinza-1)]">{i.valor}</div>
            </div>
            <button onClick={() => onDelete(i.id)} className="text-[color:var(--admin-cinza-3)] hover:text-rose-300 shrink-0" aria-label="Remover">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {itens.length === 0 ? (
          <li className="text-[12px] text-[color:var(--admin-cinza-3)] italic">Nada registrado.</li>
        ) : null}
      </ul>
      <div className="flex gap-2">
        <input
          className="admin-input flex-1"
          placeholder={cor === "emerald" ? "Ex: Mora em Belo Horizonte" : "Ex: Provavelmente busca aventura em casal"}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && valor.trim()) { onAdd(valor.trim()); setValor(""); } }}
        />
        <button
          className="admin-btn-ghost"
          onClick={() => { if (valor.trim()) { onAdd(valor.trim()); setValor(""); } }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function ResumoMemoriaForm({ leadId, memoria }: { leadId: string; memoria: LeadMemoriaRow | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<LeadMemoriaRow>>(memoria ?? {});
  useEffect(() => { if (memoria) setForm(memoria); }, [memoria]);
  const mut = useMutation({
    mutationFn: () => upsertLeadMemoria(leadId, form),
    onSuccess: () => { toast.success("Resumo atualizado"); qc.invalidateQueries({ queryKey: ["admin", "lead-mem", leadId] }); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <div className="space-y-3">
      <AdminField label="Perfil"><textarea className="admin-input min-h-[60px]" value={form.perfil ?? ""} onChange={(e) => setForm({ ...form, perfil: e.target.value })} /></AdminField>
      <AdminField label="Objetivos"><input className="admin-input" value={form.objetivos ?? ""} onChange={(e) => setForm({ ...form, objetivos: e.target.value })} /></AdminField>
      <AdminField label="Restrições"><textarea className="admin-input min-h-[60px]" value={form.restricoes ?? ""} onChange={(e) => setForm({ ...form, restricoes: e.target.value })} /></AdminField>
      <button className="admin-btn-ghost w-full" onClick={() => mut.mutate()} disabled={mut.isPending}>Salvar resumo</button>
    </div>
  );
}
