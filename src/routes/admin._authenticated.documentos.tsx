import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { FileText, Download, Trash2, Scale, Compass, User } from "lucide-react";
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
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { useCan } from "@/hooks/use-permissions";

export const Route = createFileRoute("/admin/_authenticated/documentos")({
  component: DocumentosPage,
});

type Escopo = "institucional" | "expedicao" | "participante";

const ABAS: { id: Escopo; label: string; icon: typeof Scale; descricao: string }[] = [
  {
    id: "institucional",
    label: "Institucional / Jurídico",
    icon: Scale,
    descricao: "Contratos-modelo, termos, políticas e aceite de risco da empresa.",
  },
  {
    id: "expedicao",
    label: "Operacional / Expedição",
    icon: Compass,
    descricao: "Roteiros, checklists, PDFs da viagem — vinculados a uma expedição.",
  },
  {
    id: "participante",
    label: "Participante",
    icon: User,
    descricao: "Documentos individuais (RG, exames, comprovantes). Isolados por participante.",
  },
];

function DocumentosPage() {
  const qc = useQueryClient();
  const { data: docs = [], isLoading } = useQuery({ queryKey: ["admin", "documentos"], queryFn: listDocumentos });
  const { data: expedicoes = [] } = useQuery({ queryKey: ["admin", "expedicoes"], queryFn: listExpedicoes });
  const { data: participantes = [] } = useQuery({ queryKey: ["admin", "participantes"], queryFn: listParticipantes });
  const { data: reservas = [] } = useQuery({ queryKey: ["admin", "reservas"], queryFn: listReservas });

  const [aba, setAba] = useState<Escopo>("institucional");
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<string>("contrato");
  const [expedicaoId, setExpedicaoId] = useState<string>("");
  const [participanteId, setParticipanteId] = useState<string>("");
  const [reservaId, setReservaId] = useState<string>("");
  const [filtroExp, setFiltroExp] = useState<string>("");
  const [filtroPart, setFiltroPart] = useState<string>("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "documentos"] });

  const upMut = useMutation({
    mutationFn: async (files: File[]) => {
      // Validação de vínculo conforme escopo
      if (aba === "expedicao" && !expedicaoId) throw new Error("Selecione a expedição vinculada.");
      if (aba === "participante" && !participanteId) throw new Error("Selecione o participante.");
      for (const file of files) {
        await uploadDocumento({
          file,
          titulo: titulo || file.name,
          tipo,
          escopo: aba,
          expedicao_id: aba === "expedicao" ? expedicaoId : null,
          participante_id: aba === "participante" ? participanteId : null,
          reserva_id: aba === "expedicao" ? (reservaId || null) : null,
        });
      }
    },
    onSuccess: () => {
      toast.success("Documento enviado");
      setTitulo("");
      setReservaId("");
      refresh();
    },
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

  const filtrados = useMemo(() => {
    return docs.filter((d) => {
      // Compat: documentos antigos sem escopo viram institucional
      const escopo = (d.escopo as Escopo) || (d.participante_id ? "participante" : d.expedicao_id ? "expedicao" : "institucional");
      if (escopo !== aba) return false;
      if (aba === "expedicao" && filtroExp && d.expedicao_id !== filtroExp) return false;
      if (aba === "participante" && filtroPart && d.participante_id !== filtroPart) return false;
      return true;
    });
  }, [docs, aba, filtroExp, filtroPart]);

  const abaAtual = ABAS.find((a) => a.id === aba)!;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação"
        title="Documentos"
        description="Três escopos isolados: jurídico da empresa, operacional por expedição e individual por participante."
      />

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-[color:var(--admin-borda)]">
        {ABAS.map((a) => {
          const Icon = a.icon;
          const ativa = aba === a.id;
          return (
            <button
              key={a.id}
              onClick={() => setAba(a.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] transition border-b-2 ${
                ativa
                  ? "border-[color:var(--admin-dourado)] text-[color:var(--admin-cinza-1)]"
                  : "border-transparent text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-cinza-2)]"
              }`}
            >
              <Icon className="h-4 w-4" /> {a.label}
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-[12px] text-[color:var(--admin-cinza-3)]">{abaAtual.descricao}</p>

      <div className="space-y-4">
        {/* Upload */}
        <div className="admin-card">
          <h3 className="font-display text-[16px] text-[color:var(--admin-cinza-1)] mb-3">
            Novo documento — {abaAtual.label}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Título</label>
              <input className="admin-input mt-1 w-full" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Contrato Expedição Canastra" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Categoria</label>
              <select className="admin-input mt-1 w-full" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS_DOCUMENTO.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            {aba === "expedicao" && (
              <>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Expedição *</label>
                  <select className="admin-input mt-1 w-full" value={expedicaoId} onChange={(e) => setExpedicaoId(e.target.value)}>
                    <option value="">— selecione —</option>
                    {expedicoes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Reserva (opcional)</label>
                  <select className="admin-input mt-1 w-full" value={reservaId} onChange={(e) => setReservaId(e.target.value)}>
                    <option value="">—</option>
                    {reservas.filter((r) => !expedicaoId || r.expedicao_id === expedicaoId).map((r) => (
                      <option key={r.id} value={r.id}>{r.protocolo} · {r.expedicao_nome}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {aba === "participante" && (
              <div className="md:col-span-2">
                <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Participante *</label>
                <select className="admin-input mt-1 w-full" value={participanteId} onChange={(e) => setParticipanteId(e.target.value)}>
                  <option value="">— selecione —</option>
                  {participantes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <p className="mt-1 text-[11px] text-[color:var(--admin-cinza-3)]">
                  Este documento ficará isolado e visível apenas no perfil deste participante.
                </p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <AdminUploader
              onFiles={(f) => upMut.mutateAsync(f)}
              accept={{ "application/pdf": [".pdf"] }}
              hint="Apenas PDF — armazenado em bucket privado."
            />
          </div>
        </div>

        {/* Filtros por aba */}
        {aba === "expedicao" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Filtrar:</span>
            <select className="admin-input w-auto" value={filtroExp} onChange={(e) => setFiltroExp(e.target.value)}>
              <option value="">Todas as expedições</option>
              {expedicoes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </div>
        )}
        {aba === "participante" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Filtrar:</span>
            <select className="admin-input w-auto" value={filtroPart} onChange={(e) => setFiltroPart(e.target.value)}>
              <option value="">Todos os participantes</option>
              {participantes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
        )}

        {/* Lista */}
        {isLoading ? (
          <div className="admin-card h-40 animate-pulse" />
        ) : filtrados.length === 0 ? (
          <AdminEmpty icon={FileText} titulo="Nenhum documento" descricao="Envie o primeiro documento acima." />
        ) : (
          <div className="admin-card overflow-x-auto p-0">
            <table className="w-full text-left text-sm min-w-[680px]">
              <thead className="bg-[color:var(--admin-carvao-deep)]/60 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                <tr>
                  <th className="px-5 py-3.5 font-medium">Documento</th>
                  <th className="px-3 py-3.5 font-medium">Categoria</th>
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
                        {!d.expedicao_id && !d.reserva_id && !d.participante_id && <div>Jurídico geral</div>}
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
        )}
      </div>
    </div>
  );
}
