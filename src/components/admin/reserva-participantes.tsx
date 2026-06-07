import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Upload, Trash2, ExternalLink, FileText, CheckCircle2, Clock, Download } from "lucide-react";
import {
  listParticipantesDaReserva,
  updateParticipante,
  listDocumentosByParticipante,
  uploadDocumento,
  deleteDocumento,
  getDocumentoSignedUrl,
  deleteParticipante,
  type ParticipanteRow,
  type DocumentoRow,
} from "@/lib/admin/api";
import { cn } from "@/lib/utils";
import { exportParticipantesCSV } from "@/lib/admin/export-utils";
import { getReservaDetalhada } from "@/lib/admin/financeiro-api";


const STATUS_OPTS = [
  { id: "pendente", label: "Pendente", tone: "warn" },
  { id: "confirmado", label: "Confirmado", tone: "ok" },
  { id: "cancelado", label: "Cancelado", tone: "danger" },
];

const TONE: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  danger: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

export function ReservaParticipantes({ reservaId }: { reservaId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "reserva", reservaId, "participantes"],
    queryFn: () => listParticipantesDaReserva(reservaId),
  });

  return (
    <section className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/20 p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[color:var(--admin-cinza-3)] text-xs uppercase tracking-[0.2em]">
            <Users className="h-3.5 w-3.5" /> Participantes
          </div>
          <button
            onClick={async () => {
              try {
                const res = await getReservaDetalhada(reservaId);
                await exportParticipantesCSV(reservaId, res?.protocolo || "exp");
                toast.success("Exportação concluída");
              } catch (e) {
                toast.error("Falha ao exportar");
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs text-[color:var(--admin-dourado)] hover:text-white transition-colors"
            title="Exportar para Excel/CSV"
          >
            <Download className="h-3 w-3" /> Exportar
          </button>
        </div>
        <span className="text-[11px] text-[color:var(--admin-cinza-3)]">
          {(q.data ?? []).length} pessoa{(q.data ?? []).length === 1 ? "" : "s"} nesta reserva
        </span>
      </header>


      {q.isLoading ? (
        <p className="text-sm text-[color:var(--admin-cinza-3)]">Carregando…</p>
      ) : (q.data ?? []).length === 0 ? (
        <p className="text-sm text-[color:var(--admin-cinza-3)]">
          Nenhum participante vinculado a esta reserva.
        </p>
      ) : (
        <ul className="space-y-3">
          {(q.data ?? []).map((p, idx) => (
            <ParticipanteCard
              key={p.id}
              index={idx + 1}
              participante={p}
              onChanged={() => qc.invalidateQueries({ queryKey: ["admin", "reserva", reservaId, "participantes"] })}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ParticipanteCard({
  index,
  participante,
  onChanged,
}: {
  index: number;
  participante: ParticipanteRow;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [nome, setNome] = useState(participante.nome ?? "");
  const [cpf, setCpf] = useState(participante.cpf ?? "");
  const [peso, setPeso] = useState(participante.peso?.toString() ?? "");

  const updMut = useMutation({
    mutationFn: (patch: Partial<ParticipanteRow>) => updateParticipante(participante.id, patch),
    onSuccess: () => { toast.success("Participante atualizado"); onChanged(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const docsQ = useQuery({
    queryKey: ["admin", "participante", participante.id, "docs"],
    queryFn: () => listDocumentosByParticipante(participante.id),
  });

  const statusTone = STATUS_OPTS.find((s) => s.id === participante.status)?.tone ?? "warn";

  return (
    <li className="rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[color:var(--admin-petroleo-soft)]/40 text-[11px] text-[color:var(--admin-cinza-2)]">
            {index}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ring-1 uppercase tracking-[0.12em]",
              TONE[statusTone],
            )}
          >
            {participante.status === "confirmado" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {STATUS_OPTS.find((s) => s.id === participante.status)?.label ?? participante.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={participante.status}
            onChange={(e) => updMut.mutate({ status: e.target.value })}
            className="rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1 text-xs"
          >
            {STATUS_OPTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button
            type="button"
            onClick={async () => {
              if (confirm(`Excluir participante ${participante.nome || index}? Esta ação não pode ser desfeita.`)) {
                try {
                  await deleteParticipante(participante.id);
                  toast.success("Participante excluído");
                  onChanged();
                } catch (e) {
                  toast.error("Erro ao excluir");
                }
              }
            }}
            className="p-1.5 text-[color:var(--admin-cinza-3)] hover:text-rose-400 transition-colors"
            title="Excluir participante"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>


      <div className="grid sm:grid-cols-3 gap-2">
        <Field label="Nome">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => { if (nome !== (participante.nome ?? "")) updMut.mutate({ nome }); }}
            className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
          />
        </Field>
        <Field label="CPF">
          <input
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            onBlur={() => { if (cpf !== (participante.cpf ?? "")) updMut.mutate({ cpf: cpf || null }); }}
            className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
          />
        </Field>
        <Field label="Peso (kg)">
          <input
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            onBlur={() => {
              const n = peso ? Number(peso.replace(",", ".")) : null;
              if (n !== (participante.peso ?? null)) updMut.mutate({ peso: n });
            }}
            className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
          />
        </Field>
      </div>

      <ParticipanteDocs
        participanteId={participante.id}
        nome={participante.nome}
        docs={docsQ.data ?? []}
        onChanged={() => qc.invalidateQueries({ queryKey: ["admin", "participante", participante.id, "docs"] })}
      />
    </li>
  );
}

function ParticipanteDocs({
  participanteId,
  nome,
  docs,
  onChanged,
}: {
  participanteId: string;
  nome: string;
  docs: DocumentoRow[];
  onChanged: () => void;
}) {
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
    <div className="border-t border-[color:var(--admin-borda)] pt-3 mt-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
          <FileText className="h-3 w-3" /> Documentos de {nome?.split(" ")[0] || "participante"}
        </div>
        <label
          className={cn(
            "inline-flex items-center gap-1 text-xs cursor-pointer text-[color:var(--admin-dourado)] hover:underline",
            uploading && "opacity-50 pointer-events-none",
          )}
        >
          <Upload className="h-3 w-3" />
          {uploading ? "Enviando…" : "Anexar arquivo"}
          <input ref={fileRef} type="file" onChange={onPick} className="hidden" />
        </label>
      </div>

      {docs.length === 0 ? (
        <p className="text-[11px] text-[color:var(--admin-cinza-3)] italic">
          Nenhum documento anexado. Suba RG, contrato assinado, comprovante, atestado, ou o que precisar.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--admin-borda)]/60 bg-[color:var(--admin-petroleo-soft)]/20 px-2.5 py-1.5"
            >
              <button
                type="button"
                onClick={() => openDoc(d)}
                className="flex items-center gap-2 text-xs text-[color:var(--admin-cinza-1)] hover:text-[color:var(--admin-dourado)] truncate min-w-0"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{d.titulo}</span>
              </button>
              <button
                type="button"
                onClick={() => del(d)}
                className="text-[color:var(--admin-cinza-3)] hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
