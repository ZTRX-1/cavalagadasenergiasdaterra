import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Star, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { AdminUploader } from "@/components/admin/admin-uploader";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import {
  getExpedicao,
  updateExpedicao,
  listAssets,
  uploadAsset,
  deleteAsset,
  setCapa,
  moveAsset,
  listDatas,
  createData,
  updateData,
  deleteData,
  slugify,
  type ExpedicaoRow,
} from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/expedicoes/$id")({
  component: ExpedicaoEdit,
  errorComponent: ({ error, reset }) => (
    <div className="admin-card space-y-3">
      <h2 className="font-display text-lg text-[color:var(--admin-cinza-1)]">Não foi possível carregar a expedição</h2>
      <p className="text-sm text-[color:var(--admin-cinza-3)]">{(error as Error).message}</p>
      <button className="admin-btn-ghost" onClick={() => reset()}>Tentar de novo</button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="admin-card">
      <p className="text-sm text-[color:var(--admin-cinza-2)]">Expedição não encontrada.</p>
    </div>
  ),
});

function ExpedicaoEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: exp, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "expedicao", id],
    queryFn: () => getExpedicao(id),
  });
  const { data: assets = [] } = useQuery({
    queryKey: ["admin", "assets", id],
    queryFn: () => listAssets(id),
    enabled: !!exp,
  });
  const { data: datas = [] } = useQuery({
    queryKey: ["admin", "datas", id],
    queryFn: () => listDatas(id),
    enabled: !!exp,
  });

  const [form, setForm] = useState<Partial<ExpedicaoRow> | null>(null);
  useEffect(() => { if (exp) setForm(exp); }, [exp]);

  const saveMut = useMutation({
    mutationFn: (patch: Partial<ExpedicaoRow>) => updateExpedicao(id, patch),
    onSuccess: () => { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  if (isLoading || isFetching && !exp) return <div className="admin-card h-40 animate-pulse" />;
  if (!exp) {
    return (
      <div className="admin-card space-y-3">
        <p className="text-sm text-[color:var(--admin-cinza-2)]">Expedição não encontrada ou ainda não disponível.</p>
        <button className="admin-btn-ghost" onClick={() => nav({ to: "/admin/expedicoes" })}>Voltar à lista</button>
      </div>
    );
  }
  if (!form) return <div className="admin-card h-40 animate-pulse" />;

  const setF = (patch: Partial<ExpedicaoRow>) => setForm((f) => ({ ...(f ?? {}), ...patch }));

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        eyebrow={form.status ?? "rascunho"}
        title={form.nome ?? "Expedição"}
        description={form.subtitulo ?? "Editar dados, mídia, datas e publicação"}
        actions={
          <div className="flex items-center gap-2">
            <button className="admin-btn-ghost" onClick={() => nav({ to: "/admin/expedicoes" })}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <button className="admin-btn-ghost" onClick={() => saveMut.mutate({ ...form, status: "rascunho" })}>
              Salvar rascunho
            </button>
            <button className="admin-btn-primary" onClick={() => saveMut.mutate({ ...form, status: "publicado", ativo: true })} disabled={saveMut.isPending}>
              <Save className="h-4 w-4" /> Salvar e publicar
            </button>
          </div>
        }
      />

      <Tabs defaultValue="geral">
        <TabsList className="bg-[color:var(--admin-carvao-deep)]/60 border border-[color:var(--admin-borda)]">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="datas">Datas & Vagas</TabsTrigger>
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
          <TabsTrigger value="publicacao">Publicação</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <AdminSection titulo="Identidade">
              <AdminField label="Nome">
                <input className="admin-input" value={form.nome ?? ""} onChange={(e) => setF({ nome: e.target.value, slug: form.slug || slugify(e.target.value) })} />
              </AdminField>
              <AdminField label="Subtítulo">
                <input className="admin-input" value={form.subtitulo ?? ""} onChange={(e) => setF({ subtitulo: e.target.value })} />
              </AdminField>
              <AdminField label="Slug">
                <input className="admin-input font-mono text-sm" value={form.slug ?? ""} onChange={(e) => setF({ slug: slugify(e.target.value) })} />
              </AdminField>
              <div className="grid grid-cols-2 gap-3">
                <AdminField label="Marca">
                  <select className="admin-input" value={form.marca ?? "cavalgadas"} onChange={(e) => setF({ marca: e.target.value })}>
                    <option value="cavalgadas">Cavalgadas</option>
                    <option value="canastra-a-cavalo">Canastra a Cavalo</option>
                    <option value="elas-na-sela">Elas na Sela</option>
                  </select>
                </AdminField>
                <AdminField label="Dificuldade">
                  <select className="admin-input" value={form.nivel ?? "Iniciante"} onChange={(e) => setF({ nivel: e.target.value })}>
                    <option>Iniciante</option>
                    <option>Iniciante a intermediário</option>
                    <option>Intermediário</option>
                    <option>Intermediário a avançado</option>
                    <option>Avançado</option>
                  </select>
                </AdminField>
              </div>
              <AdminField label="Duração">
                <input className="admin-input" value={form.duracao ?? ""} onChange={(e) => setF({ duracao: e.target.value })} placeholder="4 dias / 3 noites" />
              </AdminField>
            </AdminSection>

            <AdminSection titulo="Localização">
              <div className="grid grid-cols-3 gap-3">
                <AdminField label="País">
                  <input className="admin-input" value={form.pais ?? ""} onChange={(e) => setF({ pais: e.target.value })} />
                </AdminField>
                <AdminField label="Estado">
                  <input className="admin-input" value={form.estado ?? ""} onChange={(e) => setF({ estado: e.target.value ?? null })} />
                </AdminField>
                <AdminField label="Cidade">
                  <input className="admin-input" value={form.cidade ?? ""} onChange={(e) => setF({ cidade: e.target.value ?? null })} />
                </AdminField>
              </div>
              <AdminField label="Região (rótulo público)">
                <input className="admin-input" value={form.regiao ?? ""} onChange={(e) => setF({ regiao: e.target.value ?? null })} />
              </AdminField>
            </AdminSection>

            <AdminSection titulo="Descrição">
              <AdminField label="Resumo curto">
                <textarea className="admin-input min-h-[80px]" value={form.descricao_curta ?? ""} onChange={(e) => setF({ descricao_curta: e.target.value })} />
              </AdminField>
              <AdminField label="Descrição completa">
                <textarea className="admin-input min-h-[180px]" value={form.descricao_longa ?? ""} onChange={(e) => setF({ descricao_longa: e.target.value })} />
              </AdminField>
              <AdminField label="Observações internas">
                <textarea className="admin-input min-h-[60px]" value={form.observacoes ?? ""} onChange={(e) => setF({ observacoes: e.target.value ?? null })} />
              </AdminField>
            </AdminSection>
          </div>

          <div className="space-y-6">
            <AdminSection titulo="Preview">
              <div className="space-y-3">
                {(() => {
                  const capa = form.capa_url || form.imagem_url || assets.find((a) => a.tipo === "imagem" && a.is_capa)?.url || assets.find((a) => a.tipo === "imagem")?.url;
                  return capa ? (
                    <img src={capa} className="aspect-[4/3] w-full rounded-md object-cover ring-1 ring-[color:var(--admin-borda)]" />
                  ) : (
                    <div className="aspect-[4/3] w-full rounded-md bg-[color:var(--admin-petroleo)] grid place-items-center text-[11px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">
                      Envie uma imagem na aba Mídia
                    </div>
                  );
                })()}
                <div>
                  <StatusBadge status={form.status ?? "rascunho"} />
                </div>
                <h3 className="font-display text-lg">{form.nome}</h3>
                <p className="text-xs text-[color:var(--admin-cinza-2)]">{form.descricao_curta}</p>
              </div>
            </AdminSection>
            <AdminSection titulo="Tags">
              <AdminField label="Tags (separadas por vírgula)">
                <input
                  className="admin-input"
                  value={(form.tags ?? []).join(", ")}
                  onChange={(e) => setF({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                />
              </AdminField>
            </AdminSection>
          </div>
        </TabsContent>

        <TabsContent value="midia" className="mt-6 space-y-6">
          <AdminSection titulo="Galeria" descricao="A imagem marcada com estrela é a capa pública.">
            <AdminUploader
              accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
              hint="JPG, PNG ou WebP"
              onFiles={async (files) => {
                for (const f of files) {
                  try { await uploadAsset(id, f, "imagem"); } catch (e) { toast.error((e as Error).message); }
                }
                qc.invalidateQueries({ queryKey: ["admin", "assets", id] });
                toast.success(`${files.length} arquivo(s) enviado(s)`);
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assets.filter((a) => a.tipo === "imagem").map((a) => (
                <div key={a.id} className="group relative overflow-hidden rounded-lg ring-1 ring-[color:var(--admin-borda)]">
                  <img src={a.url} className="aspect-[4/3] w-full object-cover" />
                  {a.is_capa ? (
                    <div className="absolute left-2 top-2 rounded-full bg-[color:var(--admin-dourado)]/95 px-2 py-0.5 text-[10px] font-medium text-[color:var(--admin-carvao-deep)]">Capa</div>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                    <button title="Subir" className="admin-btn-ghost px-2 py-1" onClick={async () => { await moveAsset(a, "up"); qc.invalidateQueries({ queryKey: ["admin", "assets", id] }); }}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button title="Descer" className="admin-btn-ghost px-2 py-1" onClick={async () => { await moveAsset(a, "down"); qc.invalidateQueries({ queryKey: ["admin", "assets", id] }); }}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button title="Definir capa" className="admin-btn-ghost px-2 py-1" onClick={async () => { await setCapa(a); qc.invalidateQueries({ queryKey: ["admin"] }); toast.success("Capa atualizada"); }}>
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button title="Remover" className="admin-btn-ghost px-2 py-1 hover:!bg-rose-500/10" onClick={async () => { await deleteAsset(a); qc.invalidateQueries({ queryKey: ["admin", "assets", id] }); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AdminSection>

          <AdminSection titulo="Vídeo">
            <AdminField label="URL do vídeo (YouTube ou Vimeo)" hint="Use embed externo — sem upload para storage.">
              <input className="admin-input" value={form.video_url ?? ""} onChange={(e) => setF({ video_url: e.target.value ?? null })} />
            </AdminField>
          </AdminSection>

          <AdminSection titulo="Documentos (PDFs)">
            <AdminUploader
              accept={{ "application/pdf": [".pdf"] }}
              hint="Políticas, roteiro impresso, contratos"
              onFiles={async (files) => {
                for (const f of files) {
                  try { await uploadAsset(id, f, "pdf"); } catch (e) { toast.error((e as Error).message); }
                }
                qc.invalidateQueries({ queryKey: ["admin", "assets", id] });
              }}
            />
            <ul className="divide-y divide-[color:var(--admin-borda)]">
              {assets.filter((a) => a.tipo === "pdf").map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="truncate text-[color:var(--admin-cinza-2)]">{a.titulo ?? a.url}</span>
                  <button className="admin-btn-ghost px-2 py-1 hover:!bg-rose-500/10" onClick={async () => { await deleteAsset(a); qc.invalidateQueries({ queryKey: ["admin", "assets", id] }); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </AdminSection>
        </TabsContent>

        <TabsContent value="datas" className="mt-6">
          <AdminSection
            titulo="Próximas datas"
            actions={
              <button
                className="admin-btn-ghost"
                onClick={async () => {
                  const today = new Date().toISOString().slice(0, 10);
                  await createData({
                    expedicao_id: id,
                    data_inicio: today,
                    data_fim: today,
                    vagas_total: form.vagas_total_padrao ?? 10,
                    vagas_disponiveis: form.vagas_total_padrao ?? 10,
                    status: "disponivel",
                    preco_pix: null,
                    preco_cartao: null,
                  });
                  qc.invalidateQueries({ queryKey: ["admin", "datas", id] });
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar data
              </button>
            }
          >
            {datas.length === 0 ? (
              <p className="text-sm text-[color:var(--admin-cinza-3)]">Nenhuma data cadastrada ainda.</p>
            ) : (
              <div className="space-y-2">
                {datas.map((d) => (
                  <div key={d.id} className="grid grid-cols-12 items-center gap-2 rounded-md border border-[color:var(--admin-borda)] p-3">
                    <input type="date" className="admin-input col-span-2" value={d.data_inicio} onChange={(e) => updateData(d.id, { data_inicio: e.target.value }).then(() => qc.invalidateQueries({ queryKey: ["admin", "datas", id] }))} />
                    <input type="date" className="admin-input col-span-2" value={d.data_fim} onChange={(e) => updateData(d.id, { data_fim: e.target.value }).then(() => qc.invalidateQueries({ queryKey: ["admin", "datas", id] }))} />
                    <input type="number" placeholder="Vagas total" className="admin-input col-span-1" value={d.vagas_total} onChange={(e) => updateData(d.id, { vagas_total: Number(e.target.value) }).then(() => qc.invalidateQueries({ queryKey: ["admin", "datas", id] }))} />
                    <input type="number" placeholder="Disp." className="admin-input col-span-1" value={d.vagas_disponiveis} onChange={(e) => updateData(d.id, { vagas_disponiveis: Number(e.target.value) }).then(() => qc.invalidateQueries({ queryKey: ["admin", "datas", id] }))} />
                    <input type="number" placeholder="Pix" className="admin-input col-span-2" value={d.preco_pix ?? ""} onChange={(e) => updateData(d.id, { preco_pix: e.target.value ? Number(e.target.value) : null }).then(() => qc.invalidateQueries({ queryKey: ["admin", "datas", id] }))} />
                    <input type="number" placeholder="Cartão" className="admin-input col-span-2" value={d.preco_cartao ?? ""} onChange={(e) => updateData(d.id, { preco_cartao: e.target.value ? Number(e.target.value) : null }).then(() => qc.invalidateQueries({ queryKey: ["admin", "datas", id] }))} />
                    <button className="admin-btn-ghost col-span-2 hover:!bg-rose-500/10" onClick={async () => { await deleteData(d.id); qc.invalidateQueries({ queryKey: ["admin", "datas", id] }); }}>
                      <Trash2 className="h-3.5 w-3.5" /> Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>
        </TabsContent>

        <TabsContent value="comercial" className="mt-6 space-y-6">
          <AdminSection titulo="Preço & parcelamento">
            <div className="grid grid-cols-3 gap-3">
              <AdminField label="Moeda">
                <select className="admin-input" value={form.moeda ?? "BRL"} onChange={(e) => setF({ moeda: e.target.value })}>
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </AdminField>
              <AdminField label="Preço cheio">
                <input type="number" className="admin-input" value={form.preco ?? 0} onChange={(e) => setF({ preco: Number(e.target.value) })} />
              </AdminField>
              <AdminField label="Máximo parcelas">
                <input type="number" className="admin-input" value={form.parcelamento_max ?? 1} onChange={(e) => setF({ parcelamento_max: Number(e.target.value) })} />
              </AdminField>
            </div>
          </AdminSection>
          <AdminSection titulo="O que inclui" descricao="Uma linha por item.">
            <textarea className="admin-input min-h-[140px]" value={(form.inclui ?? []).join("\n")} onChange={(e) => setF({ inclui: e.target.value.split("\n").filter(Boolean) })} />
          </AdminSection>
          <AdminSection titulo="Requisitos / observações" descricao="Uma linha por item.">
            <textarea className="admin-input min-h-[140px]" value={(form.requisitos ?? []).join("\n")} onChange={(e) => setF({ requisitos: e.target.value.split("\n").filter(Boolean) })} />
          </AdminSection>
        </TabsContent>

        <TabsContent value="publicacao" className="mt-6 space-y-6">
          <AdminSection titulo="Status & visibilidade">
            <div className="grid grid-cols-2 gap-3">
              <AdminField label="Status">
                <select className="admin-input" value={form.status ?? "rascunho"} onChange={(e) => setF({ status: e.target.value as ExpedicaoRow["status"] })}>
                  <option value="rascunho">Rascunho</option>
                  <option value="publicado">Publicado</option>
                  <option value="pausado">Pausado</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </AdminField>
              <AdminField label="Ordem (menor aparece primeiro)">
                <input type="number" className="admin-input" value={form.ordem ?? 0} onChange={(e) => setF({ ordem: Number(e.target.value) })} />
              </AdminField>
            </div>
            <label className="flex items-center gap-2 text-sm text-[color:var(--admin-cinza-2)]">
              <input type="checkbox" checked={form.ativo ?? true} onChange={(e) => setF({ ativo: e.target.checked })} />
              Ativo no site público
            </label>
          </AdminSection>
          <p className="text-xs text-[color:var(--admin-cinza-3)]">
            <Link to="/expedicoes/$slug" params={{ slug: form.slug ?? "" }} className="underline">
              Abrir página pública desta expedição →
            </Link>
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
