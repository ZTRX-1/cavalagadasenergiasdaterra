import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Trash2,
  Upload,
  ExternalLink,
  FileText,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  IdCard,
  Weight,
  AlertCircle,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import {
  getParticipante,
  updateParticipante,
  deleteParticipante,
  listDocumentosByParticipante,
  uploadDocumento,
  deleteDocumento,
  getDocumentoSignedUrl,
  listExpedicoes,
  type ParticipanteRow,
  type DocumentoRow,
} from "@/lib/admin/api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/participantes/$id")({
  component: ParticipanteFichaPage,
});

type ReservaLite = {
  id: string;
  protocolo: string;
  expedicao_nome: string;
  data_label: string;
  valor_total: number | null;
  valor_pago: number;
  status_operacional: string;
  status_pagamento: string;
};

async function getReservaDoParticipante(reservaId: string): Promise<ReservaLite | null> {
  const { data, error } = await supabase
    .from("reservas")
    .select("id, protocolo, expedicao_nome, data_label, valor_total, valor_pago, status_operacional, status_pagamento")
    .eq("id", reservaId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as ReservaLite) ?? null;
}

const STATUS_OPTS = [
  { id: "pendente", label: "Pendente" },
  { id: "confirmado", label: "Confirmado" },
  { id: "cancelado", label: "Cancelado" },
];

const EXP_OPTS = [
  { id: "iniciante", label: "Iniciante" },
  { id: "intermediario", label: "Intermediário" },
  { id: "avancado", label: "Avançado" },
];

function fmtBRL(v: number | null | undefined) {
  return (Number(v ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ParticipanteFichaPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [confirmDel, setConfirmDel] = useState(false);

  const { data: participante, isLoading } = useQuery({
    queryKey: ["admin", "participante", id],
    queryFn: () => getParticipante(id),
  });
  const { data: expedicoes = [] } = useQuery({
    queryKey: ["admin", "expedicoes"],
    queryFn: listExpedicoes,
  });
  const { data: reserva } = useQuery({
    queryKey: ["admin", "reserva-lite", participante?.reserva_id],
    queryFn: () => (participante?.reserva_id ? getReservaDoParticipante(participante.reserva_id) : Promise.resolve(null)),
    enabled: !!participante?.reserva_id,
  });
  const docsQ = useQuery({
    queryKey: ["admin", "participante", id, "docs"],
    queryFn: () => listDocumentosByParticipante(id),
  });

  const [form, setForm] = useState<Partial<ParticipanteRow>>({});
  useEffect(() => {
    if (participante) setForm(participante);
  }, [participante]);

  const updMut = useMutation({
    mutationFn: (patch: Partial<ParticipanteRow>) => updateParticipante(id, patch),
    onSuccess: () => {
      toast.success("Participante atualizado");
      qc.invalidateQueries({ queryKey: ["admin", "participante", id] });
      qc.invalidateQueries({ queryKey: ["admin", "participantes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: () => deleteParticipante(id),
    onSuccess: () => {
      toast.success("Participante removido");
      qc.invalidateQueries({ queryKey: ["admin", "participantes"] });
      navigate({ to: "/admin/participantes" });
    },
  });

  const save = () => {
    updMut.mutate({
      nome: form.nome ?? "Sem nome",
      email: form.email ?? null,
      telefone: form.telefone ?? null,
      cpf: form.cpf ?? null,
      peso: form.peso ?? null,
      data_nascimento: form.data_nascimento ?? null,
      experiencia_equestre: form.experiencia_equestre ?? null,
      status: form.status ?? "pendente",
      observacoes_medicas: form.observacoes_medicas ?? null,
      restricoes_alimentares: form.restricoes_alimentares ?? null,
      acompanhante: form.acompanhante ?? null,
      expedicao_id: form.expedicao_id ?? null,
      cpf_recebido: form.cpf_recebido ?? false,
      pagamento_recebido: form.pagamento_recebido ?? false,
      contrato_assinado: form.contrato_assinado ?? false,
      ficha_medica_enviada: form.ficha_medica_enviada ?? false,
      documentacao_aprovada: form.documentacao_aprovada ?? false,
    });
  };

  if (isLoading) {
    return <div className="admin-card h-40 animate-pulse" />;
  }
  if (!participante) {
    return (
      <div className="admin-card p-8 text-center text-[color:var(--admin-cinza-3)]">
        Participante não encontrado.{" "}
        <Link to="/admin/participantes" className="text-[color:var(--admin-dourado)] hover:underline">
          Voltar para a lista
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow={
          <Link to="/admin/participantes" className="inline-flex items-center gap-1 text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-dourado)]">
            <ArrowLeft className="h-3 w-3" /> Participantes
          </Link>
        }
        title={participante.nome || "Sem nome"}
        description={
          <span className="inline-flex items-center gap-2">
            <StatusBadge status={participante.status} />
            <span className="text-[color:var(--admin-cinza-3)]">
              Atualizado em {new Date(participante.updated_at).toLocaleString("pt-BR")}
            </span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <button className="admin-btn-ghost" onClick={() => setConfirmDel(true)}>
              <Trash2 className="h-4 w-4" /> Remover
            </button>
            <button className="admin-btn-primary" onClick={save} disabled={updMut.isPending}>
              <Save className="h-4 w-4" /> Salvar alterações
            </button>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <section className="admin-card p-5 space-y-5">
          <h3 className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Dados pessoais</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nome completo">
              <input className="admin-input" value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className="admin-input" value={form.status ?? "pendente"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="E-mail" icon={Mail}>
              <input className="admin-input" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Telefone" icon={Phone}>
              <input className="admin-input" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </Field>
            <Field label="CPF" icon={IdCard}>
              <input className="admin-input" value={form.cpf ?? ""} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </Field>
            <Field label="Data de nascimento" icon={Calendar}>
              <input className="admin-input" type="date" value={form.data_nascimento ?? ""} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
            </Field>
            <Field label="Peso (kg)" icon={Weight}>
              <input className="admin-input" type="number" step="0.1" value={form.peso ?? ""} onChange={(e) => setForm({ ...form, peso: e.target.value ? Number(e.target.value) : null })} />
            </Field>
            <Field label="Experiência equestre">
              <select className="admin-input" value={form.experiencia_equestre ?? ""} onChange={(e) => setForm({ ...form, experiencia_equestre: e.target.value || null })}>
                <option value="">—</option>
                {EXP_OPTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Expedição">
              <select className="admin-input" value={form.expedicao_id ?? ""} onChange={(e) => setForm({ ...form, expedicao_id: e.target.value || null })}>
                <option value="">—</option>
                {expedicoes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </Field>
            <Field label="Acompanhante">
              <input className="admin-input" value={form.acompanhante ?? ""} onChange={(e) => setForm({ ...form, acompanhante: e.target.value })} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Observações médicas" icon={AlertCircle}>
              <textarea
                rows={3}
                className="admin-input"
                value={form.observacoes_medicas ?? ""}
                onChange={(e) => setForm({ ...form, observacoes_medicas: e.target.value })}
              />
            </Field>
            <Field label="Restrições alimentares">
              <textarea
                rows={3}
                className="admin-input"
                value={form.restricoes_alimentares ?? ""}
                onChange={(e) => setForm({ ...form, restricoes_alimentares: e.target.value })}
              />
            </Field>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="admin-card p-5">
            <h3 className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)] mb-4 flex items-center gap-2">
              Checklist Operacional
            </h3>
            <div className="space-y-3">
              <ToggleRow label="CPF Recebido" checked={!!form.cpf_recebido} onChange={(v) => setForm({ ...form, cpf_recebido: v })} at={null} />
              <ToggleRow label="Pagamento Recebido" checked={!!form.pagamento_recebido} onChange={(v) => setForm({ ...form, pagamento_recebido: v })} at={null} />
              <ToggleRow label="Contrato Assinado" checked={!!form.contrato_assinado} onChange={(v) => setForm({ ...form, contrato_assinado: v })} at={null} />
              <ToggleRow label="Ficha Médica Enviada" checked={!!form.ficha_medica_enviada} onChange={(v) => setForm({ ...form, ficha_medica_enviada: v })} at={null} />
              <ToggleRow label="Documentação Aprovada" checked={!!form.documentacao_aprovada} onChange={(v) => setForm({ ...form, documentacao_aprovada: v })} at={null} />
            </div>
          </section>

          <section className="admin-card p-5">
            <h3 className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)] mb-3 flex items-center gap-2">
              <BookOpen className="h-3 w-3" /> Reserva vinculada
            </h3>
            {reserva ? (
              <Link
                to="/admin/reservas/$id"
                params={{ id: reserva.id }}
                className="block rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/30 p-3 hover:border-[color:var(--admin-dourado)]/40 transition-colors"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">{reserva.protocolo}</div>
                <div className="text-sm text-[color:var(--admin-cinza-1)] mt-1">{reserva.expedicao_nome}</div>
                <div className="text-[11px] text-[color:var(--admin-cinza-3)] mt-0.5">{reserva.data_label}</div>
                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <span className="text-[color:var(--admin-cinza-3)]">{fmtBRL(reserva.valor_pago)} / {fmtBRL(reserva.valor_total)}</span>
                  <StatusBadge status={reserva.status_pagamento} />
                </div>
              </Link>
            ) : (
              <p className="text-[12px] text-[color:var(--admin-cinza-3)] italic">
                Não vinculado a uma reserva ainda.
              </p>
            )}
          </section>

          <DocsCard participanteId={id} docs={docsQ.data ?? []} onChanged={() => qc.invalidateQueries({ queryKey: ["admin", "participante", id, "docs"] })} />
        </aside>
      </div>

      <ConfirmDialog open={confirmDel} onOpenChange={setConfirmDel} title="Remover participante" destructive onConfirm={() => delMut.mutate()} />
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: typeof Mail; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function DocsCard({ participanteId, docs, onChanged }: { participanteId: string; docs: DocumentoRow[]; onChanged: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadDocumento({
        file,
        titulo: file.name,
        tipo: "outro",
        escopo: "participante",
        participante_id: participanteId,
      });
      toast.success("Documento enviado");
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openDoc = async (doc: DocumentoRow) => {
    try {
      const url = await getDocumentoSignedUrl(doc);
      window.open(url, "_blank");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const del = async (doc: DocumentoRow) => {
    if (!confirm(`Excluir "${doc.titulo}"?`)) return;
    try {
      await deleteDocumento(doc);
      toast.success("Documento removido");
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <section className="admin-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)] flex items-center gap-2">
          <FileText className="h-3 w-3" /> Documentos
        </h3>
        <label className={`inline-flex items-center gap-1 text-xs cursor-pointer text-[color:var(--admin-dourado)] hover:underline ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          <Upload className="h-3 w-3" />
          {uploading ? "Enviando…" : "Anexar"}
          <input ref={fileRef} type="file" onChange={onPick} className="hidden" />
        </label>
      </div>
      {docs.length === 0 ? (
        <p className="text-[11px] text-[color:var(--admin-cinza-3)] italic">
          Nenhum documento. Suba RG, contrato, comprovante ou atestado.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--admin-borda)]/60 bg-[color:var(--admin-petroleo-soft)]/20 px-2.5 py-1.5">
              <button onClick={() => openDoc(d)} className="flex items-center gap-2 text-xs text-[color:var(--admin-cinza-1)] hover:text-[color:var(--admin-dourado)] truncate min-w-0">
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{d.titulo}</span>
              </button>
              <button onClick={() => del(d)} className="text-[color:var(--admin-cinza-3)] hover:text-rose-300">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
