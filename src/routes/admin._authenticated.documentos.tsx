import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText,
  Receipt,
  ScrollText,
  ShieldCheck,
  UserSquare2,
  Briefcase,
  Files,
  Download,
  Trash2,
  Filter,
  X,
  Sparkles,
  Search,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { AdminEmpty } from "@/components/admin/admin-empty";
import { AdminUploader } from "@/components/admin/admin-uploader";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCan } from "@/hooks/use-permissions";
import {
  listDocumentosCentral,
  createDocumentoCentral,
  deleteDocumentoCentral,
  updateDocumentoCentral,
  getDocumentoSignedUrl,
  CATEGORIAS,
  STATUS_DOC,
  type CategoriaDoc,
  type StatusDoc,
  type DocumentoCentral,
} from "@/lib/admin/central-docs-api";
import { listExpedicoes, listReservas, listLeads } from "@/lib/admin/api";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/admin/_authenticated/documentos")({
  component: CentralDocumentosPage,
});

const CATEGORIA_ICON: Record<CategoriaDoc, typeof FileText> = {
  nota_fiscal: Receipt,
  contrato: ScrollText,
  comprovante: FileText,
  termo: ShieldCheck,
  documento_participante: UserSquare2,
  documento_interno: Briefcase,
  outro: Files,
};

function fmtSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CentralDocumentosPage() {
  const qc = useQueryClient();
  const { canEdit } = useCan("documentos");

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["admin", "central-docs"],
    queryFn: listDocumentosCentral,
  });
  const { data: expedicoes = [] } = useQuery({ queryKey: ["admin", "expedicoes"], queryFn: listExpedicoes });
  const { data: reservas = [] } = useQuery({ queryKey: ["admin", "reservas"], queryFn: listReservas });
  const { data: leads = [] } = useQuery({ queryKey: ["admin", "leads"], queryFn: listLeads });

  // Filtros
  const [filtroCat, setFiltroCat] = useState<CategoriaDoc | "todos">("todos");
  const [filtroExp, setFiltroExp] = useState<string>("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("");
  const [filtroData, setFiltroData] = useState<string>("");
  const [busca, setBusca] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const docsFiltrados = useMemo(() => {
    return docs.filter((d) => {
      if (filtroCat !== "todos" && d.categoria !== filtroCat) return false;
      if (filtroExp !== "todos" && d.expedicao_id !== filtroExp) return false;
      if (filtroCliente && !(d.cliente_nome ?? "").toLowerCase().includes(filtroCliente.toLowerCase())) return false;
      if (filtroData) {
        const c = new Date(d.created_at).toISOString().slice(0, 10);
        if (c !== filtroData) return false;
      }
      if (busca) {
        const blob =
          `${d.titulo} ${d.descricao ?? ""} ${d.nf_empresa ?? ""} ${d.nf_numero ?? ""} ${d.cliente_nome ?? ""} ${d.observacoes_internas ?? ""}`.toLowerCase();
        if (!blob.includes(busca.toLowerCase())) return false;
      }
      return true;
    });
  }, [docs, filtroCat, filtroExp, filtroCliente, filtroData, busca]);

  // KPIs por categoria
  const kpis = useMemo(() => {
    const m: Record<string, number> = { total: docs.length };
    for (const c of CATEGORIAS) m[c.id] = 0;
    for (const d of docs) m[d.categoria] = (m[d.categoria] ?? 0) + 1;
    return m;
  }, [docs]);

  const deleteMut = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string | null }) => deleteDocumentoCentral(id, url),
    onSuccess: () => {
      toast.success("Documento removido");
      qc.invalidateQueries({ queryKey: ["admin", "central-docs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDownload = async (d: DocumentoCentral) => {
    if (!d.arquivo_url) return toast.error("Sem arquivo anexado");
    try {
      const url = await getDocumentoSignedUrl(d.arquivo_url);
      window.open(url, "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Central de Documentos"
        title="Documentos e Notas Fiscais"
        description="Tudo num só lugar: contratos, notas fiscais, comprovantes, termos e documentos do participante — organizados por categoria, com vínculos a reservas, leads, clientes e expedições."
        actions={
          canEdit ? (
            <Button onClick={() => setDialogOpen(true)} className="bg-[color:var(--admin-dourado)] text-black hover:bg-[color:var(--admin-dourado)]/90">
              + Adicionar documento
            </Button>
          ) : null
        }
      />

      <AdminPageIntro>
        Use as categorias para classificar cada arquivo. Vincule a documentos um lead, reserva,
        cliente ou expedição — isso prepara o sistema para futuras automações e leitura por IA
        (extração de dados de notas fiscais, contratos e comprovantes).
      </AdminPageIntro>

      {/* KPIs por categoria */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <button
          onClick={() => setFiltroCat("todos")}
          className={`admin-card text-left p-4 transition-all ${filtroCat === "todos" ? "ring-1 ring-[color:var(--admin-dourado)]" : ""}`}
        >
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Total</div>
          <div className="mt-2 font-display text-2xl text-[color:var(--admin-cinza-1)]">{kpis.total}</div>
        </button>
        {CATEGORIAS.map((c) => {
          const Icon = CATEGORIA_ICON[c.id];
          return (
            <button
              key={c.id}
              onClick={() => setFiltroCat(c.id)}
              className={`admin-card text-left p-4 transition-all ${filtroCat === c.id ? "ring-1 ring-[color:var(--admin-dourado)]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-[color:var(--admin-dourado)]" strokeWidth={1.5} />
                <span className="font-display text-xl text-[color:var(--admin-cinza-1)]">{kpis[c.id] ?? 0}</span>
              </div>
              <div className="mt-2 text-[11px] text-[color:var(--admin-cinza-2)] leading-tight">{c.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="admin-card mt-6 p-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
          <Filter className="h-3.5 w-3.5" strokeWidth={1.6} /> Filtros rápidos
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="md:col-span-2 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-cinza-3)]" />
            <Input
              placeholder="Buscar título, NF, empresa, cliente…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filtroExp} onValueChange={setFiltroExp}>
            <SelectTrigger><SelectValue placeholder="Expedição" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as expedições</SelectItem>
              {expedicoes.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Cliente" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} />
          <Input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
        </div>
        {(filtroCat !== "todos" || filtroExp !== "todos" || filtroCliente || filtroData || busca) && (
          <button
            onClick={() => { setFiltroCat("todos"); setFiltroExp("todos"); setFiltroCliente(""); setFiltroData(""); setBusca(""); }}
            className="mt-3 inline-flex items-center gap-1 text-xs text-[color:var(--admin-cinza-2)] hover:text-[color:var(--admin-dourado)]"
          >
            <X className="h-3 w-3" /> limpar filtros
          </button>
        )}
      </div>

      {/* Listagem */}
      <div className="mt-6 admin-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-[color:var(--admin-cinza-3)]">Carregando…</div>
        ) : docsFiltrados.length === 0 ? (
          <AdminEmpty
            icon={Files}
            title="Nenhum documento encontrado"
            description="Adicione um documento ou ajuste os filtros para visualizar os arquivos da central."
          />
        ) : (
          <div className="divide-y divide-[color:var(--admin-borda)]">
            {docsFiltrados.map((d) => {
              const Icon = CATEGORIA_ICON[d.categoria];
              const expNome = expedicoes.find((e) => e.id === d.expedicao_id)?.nome;
              const resv = reservas.find((r) => r.id === d.reserva_id);
              const lead = leads.find((l) => l.id === d.lead_id);
              const statusInfo = STATUS_DOC.find((s) => s.id === d.status);
              return (
                <div key={d.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[color:var(--admin-petroleo)]/40 ring-1 ring-[color:var(--admin-borda-strong)]">
                      <Icon className="h-5 w-5 text-[color:var(--admin-dourado)]" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-[color:var(--admin-cinza-1)] truncate">{d.titulo}</span>
                        {statusInfo && <AdminStatusBadge tone={statusInfo.tone}>{statusInfo.label}</AdminStatusBadge>}
                        {d.status_processamento !== "pendente" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--admin-petroleo)]/40 px-2 py-0.5 text-[10px] text-[color:var(--admin-cinza-2)]">
                            <Sparkles className="h-3 w-3" /> IA: {d.status_processamento}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[color:var(--admin-cinza-3)]">
                        <span>{CATEGORIAS.find((c) => c.id === d.categoria)?.label}</span>
                        {d.arquivo_nome && <span>• {d.arquivo_nome} ({fmtSize(d.arquivo_tamanho)})</span>}
                        {expNome && <span>• Expedição: {expNome}</span>}
                        {resv && <span>• Reserva: {resv.protocolo}</span>}
                        {lead && <span>• Lead: {lead.nome}</span>}
                        {d.cliente_nome && <span>• Cliente: {d.cliente_nome}</span>}
                        {d.nf_numero && <span>• NF nº {d.nf_numero}</span>}
                        <span>• Recebido em {fmtDate(d.created_at)}</span>
                      </div>
                      {d.observacoes_internas && (
                        <p className="mt-1 text-xs italic text-[color:var(--admin-cinza-2)] line-clamp-2">
                          “{d.observacoes_internas}”
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canEdit && (
                      <Select
                        value={d.status}
                        onValueChange={async (v) => {
                          try {
                            await updateDocumentoCentral(d.id, { status: v as StatusDoc });
                            toast.success("Status atualizado");
                            qc.invalidateQueries({ queryKey: ["admin", "central-docs"] });
                          } catch (e) { toast.error((e as Error).message); }
                        }}
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_DOC.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDownload(d)} disabled={!d.arquivo_url}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Remover "${d.titulo}"?`)) deleteMut.mutate({ id: d.id, url: d.arquivo_url });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[color:var(--admin-vermelho)]" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NovoDocumentoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        expedicoes={expedicoes.map((e) => ({ id: e.id, nome: e.nome }))}
        reservas={reservas.map((r) => ({ id: r.id, label: `${r.protocolo} — ${r.cliente_nome ?? "—"}` }))}
        leads={leads.map((l) => ({ id: l.id, nome: l.nome }))}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "central-docs"] })}
      />
    </>
  );
}

function NovoDocumentoDialog({
  open,
  onClose,
  expedicoes,
  reservas,
  leads,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  expedicoes: { id: string; nome: string }[];
  reservas: { id: string; label: string }[];
  leads: { id: string; nome: string }[];
  onSaved: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState<CategoriaDoc>("nota_fiscal");
  const [descricao, setDescricao] = useState("");
  const [expedicaoId, setExpedicaoId] = useState<string>("");
  const [reservaId, setReservaId] = useState<string>("");
  const [leadId, setLeadId] = useState<string>("");
  const [clienteNome, setClienteNome] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [nfNumero, setNfNumero] = useState("");
  const [nfCnpj, setNfCnpj] = useState("");
  const [nfEmpresa, setNfEmpresa] = useState("");
  const [nfData, setNfData] = useState("");
  const [nfValor, setNfValor] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  const reset = () => {
    setTitulo(""); setCategoria("nota_fiscal"); setDescricao("");
    setExpedicaoId(""); setReservaId(""); setLeadId(""); setClienteNome("");
    setObservacoes(""); setNfNumero(""); setNfCnpj(""); setNfEmpresa("");
    setNfData(""); setNfValor(""); setArquivo(null);
  };

  const handleSave = async () => {
    if (!titulo.trim()) return toast.error("Informe um título");
    setSalvando(true);
    try {
      await createDocumentoCentral(
        {
          titulo: titulo.trim(),
          categoria,
          descricao: descricao || null,
          expedicao_id: expedicaoId || null,
          reserva_id: reservaId || null,
          lead_id: leadId || null,
          cliente_nome: clienteNome || null,
          observacoes_internas: observacoes || null,
          nf_numero: nfNumero || null,
          nf_cnpj: nfCnpj || null,
          nf_empresa: nfEmpresa || null,
          nf_data: nfData || null,
          nf_valor: nfValor ? Number(nfValor) : null,
        },
        arquivo,
      );
      toast.success("Documento adicionado");
      reset();
      onSaved();
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar documento</DialogTitle>
          <DialogDescription>
            Anexe um arquivo, classifique e vincule a uma expedição, reserva, lead ou cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Título *</Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: NF Pousada Canastra — Maio/2026" />
          </div>
          <div>
            <Label>Categoria *</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaDoc)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Cliente (opcional)</Label>
            <Input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} />
          </div>
          <div>
            <Label>Expedição (opcional)</Label>
            <Select value={expedicaoId || "none"} onValueChange={(v) => setExpedicaoId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nenhuma —</SelectItem>
                {expedicoes.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reserva (opcional)</Label>
            <Select value={reservaId || "none"} onValueChange={(v) => setReservaId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nenhuma —</SelectItem>
                {reservas.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Lead (opcional)</Label>
            <Select value={leadId || "none"} onValueChange={(v) => setLeadId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Nenhum —</SelectItem>
                {leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Descrição (opcional)</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
          </div>

          {categoria === "nota_fiscal" && (
            <>
              <div>
                <Label>Número da NF</Label>
                <Input value={nfNumero} onChange={(e) => setNfNumero(e.target.value)} />
              </div>
              <div>
                <Label>CNPJ emissor</Label>
                <Input value={nfCnpj} onChange={(e) => setNfCnpj(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Empresa emissora</Label>
                <Input value={nfEmpresa} onChange={(e) => setNfEmpresa(e.target.value)} />
              </div>
              <div>
                <Label>Data da NF</Label>
                <Input type="date" value={nfData} onChange={(e) => setNfData(e.target.value)} />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={nfValor} onChange={(e) => setNfValor(e.target.value)} />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <Label>Observações internas</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2}
              placeholder="Notas visíveis apenas para a equipe interna." />
          </div>

          <div className="md:col-span-2">
            <Label>Arquivo</Label>
            <AdminUploader
              multiple={false}
              hint="PDF, imagem, XML — até 20MB"
              onFiles={(files) => { setArquivo(files[0] ?? null); }}
            />
            {arquivo && (
              <div className="mt-2 text-xs text-[color:var(--admin-cinza-2)]">
                Selecionado: {arquivo.name} ({fmtSize(arquivo.size)})
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={salvando}>Cancelar</Button>
          <Button onClick={handleSave} disabled={salvando} className="bg-[color:var(--admin-dourado)] text-black hover:bg-[color:var(--admin-dourado)]/90">
            {salvando ? "Salvando…" : "Salvar documento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
