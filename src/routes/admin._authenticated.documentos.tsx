import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Download, Trash2, Building2, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmpty } from "@/components/admin/admin-empty";
import { AdminUploader } from "@/components/admin/admin-uploader";
import {
  listDocumentos,
  uploadDocumento,
  deleteDocumento,
  getDocumentoSignedUrl,
  listExpedicoes,
  listParticipantes,
  listReservas,
  TIPOS_DOCUMENTO,
  type DocumentoRow,
} from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/documentos")({
  component: DocumentosPage,
});

function DocumentosPage() {
  const qc = useQueryClient();
  const { data: docs = [], isLoading } = useQuery({ queryKey: ["admin", "documentos"], queryFn: listDocumentos });
  const { data: expedicoes = [] } = useQuery({ queryKey: ["admin", "expedicoes"], queryFn: listExpedicoes });
  const { data: participantes = [] } = useQuery({ queryKey: ["admin", "participantes"], queryFn: listParticipantes });
  const { data: reservas = [] } = useQuery({ queryKey: ["admin", "reservas"], queryFn: listReservas });

  const [aba, setAba] = useState<"institucional" | "participante">("institucional");
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<string>("contrato");
  const [expedicaoId, setExpedicaoId] = useState<string>("");
  const [participanteId, setParticipanteId] = useState<string>("");
  const [reservaId, setReservaId] = useState<string>("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "documentos"] });

  const upMut = useMutation({
    mutationFn: async (files: File[]) => {
      const escopo = aba === "participante" ? "participante" : (expedicaoId || reservaId ? "expedicao" : "institucional");
      for (const file of files) {
        await uploadDocumento({
          file,
          titulo: titulo || file.name,
          tipo,
          escopo,
          expedicao_id: expedicaoId || null,
          participante_id: aba === "participante" ? (participanteId || null) : null,
          reserva_id: reservaId || null,
        });
      }
    },
    onSuccess: () => { toast.success("Documento enviado"); setTitulo(""); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const delMut = useMutation({
    mutationFn: (d: DocumentoRow) => deleteDocumento(d),
    onSuccess: () => { toast.success("Removido"); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const abrirDoc = async (d: DocumentoRow) => {
    try {
      const url = await getDocumentoSignedUrl(d);
      window.open(url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const labelExpedicao = (id?: string | null) => expedicoes.find((e) => e.id === id)?.nome ?? "—";
  const labelParticipante = (id?: string | null) => participantes.find((p) => p.id === id)?.nome ?? "—";
  const labelReserva = (id?: string | null) => reservas.find((r) => r.id === id)?.protocolo ?? "—";

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação"
        title="Documentos"
        description="Contratos, termos, fichas médicas e roteiros vinculados a expedições, reservas e participantes."
      />

      <div className="mb-4 flex gap-2 border-b border-[color:var(--admin-borda)]">
        <button
          onClick={() => setAba("institucional")}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] transition border-b-2 ${aba === "institucional" ? "border-[color:var(--admin-dourado)] text-[color:var(--admin-cinza-1)]" : "border-transparent text-[color:var(--admin-cinza-3)]"}`}
        >
          <Building2 className="h-4 w-4" /> Institucionais / Expedição
        </button>
        <button
          onClick={() => setAba("participante")}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] transition border-b-2 ${aba === "participante" ? "border-[color:var(--admin-dourado)] text-[color:var(--admin-cinza-1)]" : "border-transparent text-[color:var(--admin-cinza-3)]"}`}
        >
          <Users className="h-4 w-4" /> Participantes
        </button>
      </div>

      <div className="space-y-4">
        <div className="admin-card">
          <h3 className="font-display text-[16px] text-[color:var(--admin-cinza-1)] mb-3">
            {aba === "participante" ? "Novo documento de participante" : "Novo documento institucional / de expedição"}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Título</label>
              <input className="admin-input mt-1 w-full" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Contrato Expedição Canastra" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Tipo</label>
              <select className="admin-input mt-1 w-full" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS_DOCUMENTO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            {aba === "institucional" ? (
              <>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Expedição (opcional)</label>
                  <select className="admin-input mt-1 w-full" value={expedicaoId} onChange={(e) => setExpedicaoId(e.target.value)}>
                    <option value="">— Institucional (geral)</option>
                    {expedicoes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Reserva (opcional)</label>
                  <select className="admin-input mt-1 w-full" value={reservaId} onChange={(e) => setReservaId(e.target.value)}>
                    <option value="">—</option>
                    {reservas.map((r) => <option key={r.id} value={r.id}>{r.protocolo} · {r.expedicao_nome}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Participante</label>
                <select className="admin-input mt-1 w-full" value={participanteId} onChange={(e) => setParticipanteId(e.target.value)}>
                  <option value="">—</option>
                  {participantes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="mt-4">
            <AdminUploader
              onFiles={(f) => upMut.mutateAsync(f)}
              accept={{ "application/pdf": [".pdf"] }}
              hint={aba === "participante" ? "Apenas PDF. Documentos de participantes ficam isolados por escopo." : "Apenas PDF. Documentos institucionais e de expedição."}
            />
          </div>
        </div>

        {(() => {
          const filtrados = docs.filter((d) => aba === "participante" ? d.escopo === "participante" : d.escopo !== "participante");
          if (isLoading) return <div className="admin-card h-40 animate-pulse" />;
          if (filtrados.length === 0) return <AdminEmpty icon={FileText} titulo="Nenhum documento" descricao="Envie o primeiro documento acima." />;
          return (
            <div className="admin-card overflow-x-auto p-0">
              <table className="w-full text-left text-sm min-w-[680px]">
                <thead className="bg-[color:var(--admin-carvao-deep)]/60 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                  <tr>
                    <th className="px-5 py-3.5 font-medium">Documento</th>
                    <th className="px-3 py-3.5 font-medium">Tipo</th>
                    <th className="px-3 py-3.5 font-medium">Vínculo</th>
                    <th className="px-5 py-3.5 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((d) => {
                    const tipoLabel = TIPOS_DOCUMENTO.find((t) => t.id === d.tipo)?.label ?? d.tipo;
                    return (
                      <tr key={d.id} className="border-t border-[color:var(--admin-borda)] hover:bg-[color:var(--admin-petroleo)]/20">
                        <td className="px-5 py-4 text-[color:var(--admin-cinza-1)]">{d.titulo}</td>
                        <td className="px-3 py-4 text-[color:var(--admin-cinza-2)]">{tipoLabel}</td>
                        <td className="px-3 py-4 text-[11px] text-[color:var(--admin-cinza-3)] space-y-0.5">
                          {d.expedicao_id && <div>Exp: {labelExpedicao(d.expedicao_id)}</div>}
                          {d.reserva_id && <div>Reserva: {labelReserva(d.reserva_id)}</div>}
                          {d.participante_id && <div>Part: {labelParticipante(d.participante_id)}</div>}
                          {!d.expedicao_id && !d.reserva_id && !d.participante_id && <div>Institucional</div>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button className="admin-btn-ghost px-2 py-1.5" title="Abrir" onClick={() => abrirDoc(d)}>
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button className="admin-btn-ghost px-2 py-1.5 hover:!bg-rose-500/10 hover:!text-rose-300" title="Excluir" onClick={() => delMut.mutate(d)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
