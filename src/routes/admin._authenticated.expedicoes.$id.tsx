import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save, Star, Trash2, ChevronUp, ChevronDown, Plus, ExternalLink, CheckCircle2, Circle, CalendarDays } from "lucide-react";
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
  updateAsset,
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

type RoteiroDia = { dia: string; titulo: string; desc: string };

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

  const checklist = useMemo(() => {
    if (!form) return [];
    const imagens = assets.filter((a) => a.tipo === "imagem");
    return [
      { ok: !!form.nome && form.nome.trim().length > 0, label: "Nome da expedição" },
      { ok: !!form.descricao_curta && form.descricao_curta.trim().length > 0, label: "Resumo curto (vai aparecer no card)" },
      { ok: Number(form.preco ?? 0) > 0, label: "Preço definido" },
      { ok: !!form.duracao && form.duracao.trim().length > 0, label: "Duração" },
      { ok: (form.inclui?.length ?? 0) > 0, label: "Pelo menos 1 item em \"O que inclui\"" },
      { ok: imagens.length >= 1, label: "Pelo menos 1 foto enviada" },
      { ok: (form.roteiro?.length ?? 0) > 0, label: "Roteiro com ao menos 1 dia" },
    ];
  }, [form, assets]);

  const pendentes = checklist.filter((i) => !i.ok).length;

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

  // ----- Roteiro helpers -----
  const roteiro: RoteiroDia[] = form.roteiro ?? [];
  const setRoteiro = (next: RoteiroDia[]) => setF({ roteiro: next });
  const addDia = () => setRoteiro([...roteiro, { dia: `Dia ${roteiro.length + 1}`, titulo: "", desc: "" }]);
  const removeDia = (idx: number) => setRoteiro(roteiro.filter((_, i) => i !== idx));
  const moveDia = (idx: number, dir: "up" | "down") => {
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= roteiro.length) return;
    const next = [...roteiro];
    [next[idx], next[target]] = [next[target], next[idx]];
    setRoteiro(next);
  };
  const updateDia = (idx: number, patch: Partial<RoteiroDia>) => {
    const next = [...roteiro];
    next[idx] = { ...next[idx], ...patch };
    setRoteiro(next);
  };

  return (
    <div className="space-y-6 pb-12">
      <AdminPageHeader
        eyebrow={form.status ?? "rascunho"}
        title={form.nome ?? "Expedição"}
        description={form.subtitulo ?? "Edite os dados, mídia, roteiro, datas e publicação"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button className="admin-btn-ghost" onClick={() => nav({ to: "/admin/expedicoes" })}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            {form.slug && (
              <a
                href={`/expedicoes/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="admin-btn-ghost"
                title="Abrir página pública em nova aba"
              >
                <ExternalLink className="h-4 w-4" /> Ver página pública
              </a>
            )}
            <button className="admin-btn-ghost" onClick={() => saveMut.mutate({ ...form, status: "rascunho" })}>
              Salvar rascunho
            </button>
            <button className="admin-btn-primary" onClick={() => saveMut.mutate({ ...form, status: "publicado", ativo: true })} disabled={saveMut.isPending}>
              <Save className="h-4 w-4" /> Salvar e publicar
            </button>
          </div>
        }
      />

      {/* Checklist de publicação */}
      <div className="admin-card p-6 md:p-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Checklist de publicação</div>
            <h3 className="mt-1.5 font-display text-lg leading-tight text-[color:var(--admin-cinza-1)]">
              {pendentes === 0 ? "Pronto para publicar" : `${pendentes} item(ns) pendente(s)`}
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--admin-cinza-3)]">
              Itens mínimos para a expedição aparecer publicamente no site.
            </p>
          </div>
          <div className="shrink-0">
            <StatusBadge status={form.status ?? "rascunho"} />
          </div>
        </div>
        <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-start gap-2.5 text-[13px] leading-snug">
              {item.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" strokeWidth={1.8} />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--admin-cinza-3)]" strokeWidth={1.6} />
              )}
              <span className={item.ok ? "text-[color:var(--admin-cinza-2)]" : "text-[color:var(--admin-cinza-3)]"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Tabs defaultValue="geral">
        <TabsList className="bg-[color:var(--admin-carvao-deep)]/60 border border-[color:var(--admin-borda)] flex-wrap h-auto gap-1">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="roteiro">Roteiro</TabsTrigger>
          <TabsTrigger value="como-chegar">Como chegar</TabsTrigger>
          <TabsTrigger value="midia">Mídia & narrativa</TabsTrigger>
          <TabsTrigger value="datas">Datas & Vagas</TabsTrigger>
          <TabsTrigger value="comercial">Comercial</TabsTrigger>
          <TabsTrigger value="publicacao">Publicação</TabsTrigger>
        </TabsList>

        {/* ============== COMO CHEGAR ============== */}
        <TabsContent value="como-chegar" className="mt-6">
          <AdminSection
            titulo="Como chegar"
            descricao="Informações de logística exibidas em uma seção dedicada na página pública da expedição. Tudo é opcional — a seção só aparece no site quando há ao menos um campo preenchido."
          >
            <AdminField
              label="Título da seção"
              hint="Personalize o título exibido no site. Deixe em branco para usar 'Como Chegar'."
            >
              <input
                className="admin-input"
                value={form.como_chegar_titulo ?? ""}
                onChange={(e) => setF({ como_chegar_titulo: e.target.value || null })}
                placeholder="Como Chegar"
              />
            </AdminField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AdminField
                label="Aeroporto mais próximo"
                hint="Informe o aeroporto normalmente utilizado pelos participantes."
              >
                <input
                  className="admin-input"
                  value={form.como_chegar_aeroporto ?? ""}
                  onChange={(e) => setF({ como_chegar_aeroporto: e.target.value || null })}
                  placeholder="Ex.: Belo Horizonte (Confins)"
                />
              </AdminField>
              <AdminField
                label="Cidade de referência"
                hint="Informe a principal cidade utilizada como ponto de chegada."
              >
                <input
                  className="admin-input"
                  value={form.como_chegar_referencia ?? ""}
                  onChange={(e) => setF({ como_chegar_referencia: e.target.value || null })}
                  placeholder="Ex.: Cruzília (MG)"
                />
              </AdminField>
            </div>
            <AdminField
              label="Texto principal"
              hint="Descreva, em alguns parágrafos, como os participantes costumam chegar ao destino."
            >
              <textarea
                className="admin-input min-h-[140px]"
                value={form.como_chegar_conteudo ?? ""}
                onChange={(e) => setF({ como_chegar_conteudo: e.target.value || null })}
                placeholder="A expedição acontece na região de..."
              />
            </AdminField>
            <AdminField
              label="Observações adicionais"
              hint="Detalhes extras: transfer, distâncias, recomendações de horário, dicas logísticas."
            >
              <textarea
                className="admin-input min-h-[100px]"
                value={form.como_chegar_observacoes ?? ""}
                onChange={(e) => setF({ como_chegar_observacoes: e.target.value || null })}
                placeholder="Recomendamos chegar no dia anterior..."
              />
            </AdminField>
          </AdminSection>
        </TabsContent>

        <TabsContent value="geral" className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <AdminSection titulo="Identidade">
              <AdminField label="Nome">
                <input className="admin-input" value={form.nome ?? ""} onChange={(e) => setF({ nome: e.target.value, slug: form.slug || slugify(e.target.value) })} />
              </AdminField>
              <AdminField label="Subtítulo">
                <input className="admin-input" value={form.subtitulo ?? ""} onChange={(e) => setF({ subtitulo: e.target.value })} />
              </AdminField>
              <AdminField label="Slug" hint="Endereço da página pública: /expedicoes/seu-slug. Cuidado ao editar depois de publicar.">
                <input className="admin-input font-mono text-sm" value={form.slug ?? ""} onChange={(e) => setF({ slug: slugify(e.target.value) })} />
              </AdminField>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <AdminField label="Resumo curto" hint="Aparece no card da expedição.">
                <textarea className="admin-input min-h-[80px]" value={form.descricao_curta ?? ""} onChange={(e) => setF({ descricao_curta: e.target.value })} />
              </AdminField>
              <AdminField label="Descrição completa" hint="Aparece na página da expedição, abaixo do hero.">
                <textarea className="admin-input min-h-[180px]" value={form.descricao_longa ?? ""} onChange={(e) => setF({ descricao_longa: e.target.value })} />
              </AdminField>
              <AdminField label="Observações internas" hint="Só visível para a equipe.">
                <textarea className="admin-input min-h-[60px]" value={form.observacoes ?? ""} onChange={(e) => setF({ observacoes: e.target.value ?? null })} />
              </AdminField>
            </AdminSection>
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <AdminSection titulo="Capa & Preview" descricao="Esta imagem aparece no card de listagem e no topo da página pública.">
              {(() => {
                const capaAsset = assets.find((a) => a.tipo === "imagem" && a.is_capa) ?? assets.find((a) => a.tipo === "imagem");
                const capa = form.capa_url || form.imagem_url || capaAsset?.url;
                return (
                  <div className="space-y-3">
                    <CapaEditor
                      capaUrl={capa ?? null}
                      onUpload={async (file) => {
                        try {
                          const row = await uploadAsset(id, file, "imagem");
                          await setCapa(row);
                          qc.invalidateQueries({ queryKey: ["admin"] });
                          toast.success("Capa atualizada");
                        } catch (err) { toast.error((err as Error).message); }
                      }}
                      onRemove={capaAsset ? async () => {
                        try {
                          await deleteAsset(capaAsset);
                          qc.invalidateQueries({ queryKey: ["admin"] });
                          toast.success("Capa removida");
                        } catch (err) { toast.error((err as Error).message); }
                      } : undefined}
                    />
                    <div>
                      <StatusBadge status={form.status ?? "rascunho"} />
                    </div>
                    <h3 className="font-display text-lg break-words">{form.nome}</h3>
                    <p className="text-xs text-[color:var(--admin-cinza-2)] break-words">{form.descricao_curta}</p>
                  </div>
                );
              })()}
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


        {/* ============== ROTEIRO ============== */}
        <TabsContent value="roteiro" className="mt-6">
          <AdminSection
            titulo="Roteiro dia-a-dia"
            descricao="Cada bloco vira um cartão na seção 'Como cada dia se desenrola' da página pública. Lembre-se de clicar em 'Salvar e publicar' no topo após editar."
            actions={
              <button className="admin-btn-ghost" onClick={addDia}>
                <Plus className="h-3.5 w-3.5" /> Adicionar dia
              </button>
            }
          >
            {roteiro.length === 0 ? (
              <div className="rounded-md border border-dashed border-[color:var(--admin-borda)] p-8 text-center text-sm text-[color:var(--admin-cinza-3)]">
                Nenhum dia cadastrado ainda. Comece adicionando o Dia 1.
              </div>
            ) : (
              <div className="space-y-3">
                {roteiro.map((d, idx) => (
                  <div key={idx} className="rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/40 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-[color:var(--admin-petroleo)] text-[11px] font-medium text-[color:var(--admin-dourado-glow)]">
                          {idx + 1}
                        </span>
                        <input
                          className="admin-input w-32"
                          value={d.dia}
                          onChange={(e) => updateDia(idx, { dia: e.target.value })}
                          placeholder="Dia 1"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="admin-btn-ghost px-2 py-1.5" title="Subir" onClick={() => moveDia(idx, "up")} disabled={idx === 0}>
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <button className="admin-btn-ghost px-2 py-1.5" title="Descer" onClick={() => moveDia(idx, "down")} disabled={idx === roteiro.length - 1}>
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button className="admin-btn-ghost px-2 py-1.5 hover:!bg-rose-500/10 hover:!text-rose-300" title="Remover" onClick={() => removeDia(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
                      <AdminField label="Título do dia">
                        <input
                          className="admin-input"
                          value={d.titulo}
                          onChange={(e) => updateDia(idx, { titulo: e.target.value })}
                          placeholder="Boas-vindas à travessia"
                        />
                      </AdminField>
                      <AdminField label="Descrição">
                        <textarea
                          className="admin-input min-h-[90px]"
                          value={d.desc}
                          onChange={(e) => updateDia(idx, { desc: e.target.value })}
                          placeholder="O que acontece neste dia."
                        />
                      </AdminField>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {roteiro.length > 0 && (
              <div className="pt-2 text-right">
                <button className="admin-btn-primary" onClick={() => saveMut.mutate({ roteiro })} disabled={saveMut.isPending}>
                  <Save className="h-4 w-4" /> Salvar roteiro
                </button>
              </div>
            )}
          </AdminSection>
        </TabsContent>

        {/* ============== MÍDIA ============== */}
        <TabsContent value="midia" className="mt-6 space-y-6">
          {(() => {
            const imagens = assets.filter((a) => a.tipo === "imagem");
            const ok = imagens.length >= 8;
            return (
              <AdminSection
                titulo="Fotos da expedição"
                descricao="Estas são as fotos do carrossel da página pública. A primeira é também a capa que aparece no topo da página e no card de listagem. Você pode reordenar, trocar legenda ou substituir qualquer foto. Padrão: 8 fotos com uma legenda emocional em cada uma."
                actions={
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
                    {imagens.length} / 8 fotos
                  </span>
                }
              >
                <AdminUploader
                  accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
                  hint="Arraste até 8 fotos de uma vez ou clique para escolher. JPG, PNG ou WebP."
                  onFiles={async (files) => {
                    for (const f of files) {
                      try { await uploadAsset(id, f, "imagem"); } catch (e) { toast.error((e as Error).message); }
                    }
                    qc.invalidateQueries({ queryKey: ["admin", "assets", id] });
                    qc.invalidateQueries({ queryKey: ["admin", "expedicao", id] });
                    toast.success(`${files.length} foto(s) enviada(s)`);
                  }}
                />
                <div className="space-y-3">
                  {imagens.length === 0 && (
                    <div className="rounded-md border border-dashed border-[color:var(--admin-borda)] p-6 text-center text-sm text-[color:var(--admin-cinza-3)]">
                      Nenhuma foto ainda. Envie acima — a primeira vira a capa.
                    </div>
                  )}
                  {imagens.map((a, idx) => (
                    <div key={a.id} className="grid gap-3 rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/40 p-3 md:grid-cols-[160px_1fr]">
                      <div className="relative">
                        <img src={a.url} alt="" className="aspect-[4/3] w-full rounded-md object-cover ring-1 ring-[color:var(--admin-borda)]" />
                        {a.is_capa && (
                          <div className="absolute left-1.5 top-1.5 rounded-full bg-[color:var(--admin-dourado)]/95 px-2 py-0.5 text-[10px] font-medium text-[color:var(--admin-carvao-deep)]">
                            Capa
                          </div>
                        )}
                        <div className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
                          #{idx + 1}
                        </div>
                      </div>
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-[11px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">
                            Foto {idx + 1}{a.is_capa ? " — Capa" : ""}
                          </div>
                        </div>
                        <AdminField label="Legenda (aparece sob a foto no carrossel)">
                          <textarea
                            className="admin-input min-h-[70px]"
                            defaultValue={a.titulo ?? ""}
                            onBlur={async (e) => {
                              const value = e.target.value.trim();
                              if (value === (a.titulo ?? "").trim()) return;
                              try {
                                await updateAsset(a.id, { titulo: value || null });
                                qc.invalidateQueries({ queryKey: ["admin", "assets", id] });
                                toast.success("Legenda salva");
                              } catch (err) { toast.error((err as Error).message); }
                            }}
                            placeholder="Ex.: 'O primeiro passo antes da travessia.'"
                          />
                        </AdminField>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button className="admin-btn-ghost gap-1 px-2 py-1.5 text-[11px]" onClick={async () => { await moveAsset(a, "up"); qc.invalidateQueries({ queryKey: ["admin", "assets", id] }); }} disabled={idx === 0}>
                            <ChevronUp className="h-3.5 w-3.5" /> Subir
                          </button>
                          <button className="admin-btn-ghost gap-1 px-2 py-1.5 text-[11px]" onClick={async () => { await moveAsset(a, "down"); qc.invalidateQueries({ queryKey: ["admin", "assets", id] }); }} disabled={idx === imagens.length - 1}>
                            <ChevronDown className="h-3.5 w-3.5" /> Descer
                          </button>
                          <button className="admin-btn-ghost gap-1 px-2 py-1.5 text-[11px]" onClick={async () => { await setCapa(a); qc.invalidateQueries({ queryKey: ["admin"] }); toast.success("Capa atualizada"); }} disabled={a.is_capa}>
                            <Star className="h-3.5 w-3.5" /> Definir capa
                          </button>
                          <button className="admin-btn-ghost gap-1 px-2 py-1.5 text-[11px] hover:!bg-rose-500/10 hover:!text-rose-300 ml-auto" onClick={async () => { if (!confirm("Remover esta foto?")) return; await deleteAsset(a); qc.invalidateQueries({ queryKey: ["admin"] }); }}>
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminSection>
            );
          })()}


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
            titulo="Próximas datas e vagas"
            descricao="Cada linha é uma turma. Vagas total = limite da turma. Vagas disponíveis = quanto ainda pode ser vendido. Preço Pix e Cartão são os valores que aparecem no site."
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
                    preco_pix: form.preco ?? null,
                    preco_cartao: form.preco ?? null,
                  });
                  qc.invalidateQueries({ queryKey: ["admin", "datas", id] });
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar data
              </button>
            }
          >
            {datas.length === 0 ? (
              <div className="rounded-md border border-dashed border-[color:var(--admin-borda)] p-6 text-center text-sm text-[color:var(--admin-cinza-3)]">
                Nenhuma data cadastrada ainda. Clique em "Adicionar data" para começar.
              </div>
            ) : (
              <div className="space-y-3">
                {datas.map((d) => (
                  <DataRow
                    key={d.id}
                    data={d}
                    onSave={(patch) => updateData(d.id, patch).then(() => qc.invalidateQueries({ queryKey: ["admin", "datas", id] }))}
                    onDelete={async () => { if (!confirm("Remover esta data?")) return; await deleteData(d.id); qc.invalidateQueries({ queryKey: ["admin", "datas", id] }); }}
                  />
                ))}
              </div>
            )}
          </AdminSection>
        </TabsContent>
        <TabsContent value="comercial" className="mt-6 space-y-6">
          <AdminSection titulo="Preço & parcelamento">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

function CapaEditor({
  capaUrl,
  onUpload,
  onRemove,
}: {
  capaUrl: string | null;
  onUpload: (file: File) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
}) {
  const inputId = "capa-upload-input";
  if (capaUrl) {
    return (
      <div className="relative group">
        <img src={capaUrl} alt="Capa da expedição" className="aspect-[4/3] w-full rounded-md object-cover ring-1 ring-[color:var(--admin-borda)]" />
        <div className="absolute inset-0 flex items-end justify-between gap-2 rounded-md bg-gradient-to-t from-black/70 via-black/0 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <label htmlFor={inputId} className="admin-btn-primary cursor-pointer text-[11px] px-2 py-1.5">
            Trocar capa
          </label>
          {onRemove && (
            <button className="admin-btn-ghost text-[11px] px-2 py-1.5 bg-black/40 hover:!bg-rose-500/30" onClick={() => onRemove()}>
              Remover
            </button>
          )}
        </div>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
      </div>
    );
  }
  return (
    <label htmlFor={inputId} className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-petroleo)]/40 px-4 text-center transition hover:border-[color:var(--admin-dourado)]/60 hover:bg-[color:var(--admin-petroleo)]/60">
      <span className="text-xs font-medium text-[color:var(--admin-cinza-1)]">Clique para enviar a capa</span>
      <span className="text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">JPG, PNG ou WebP</span>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}


type DataRowRecord = Awaited<ReturnType<typeof listDatas>>[number];

function DataRow({ data, onSave, onDelete }: { data: DataRowRecord; onSave: (patch: Partial<DataRowRecord>) => Promise<unknown>; onDelete: () => void | Promise<void> }) {
  const [local, setLocal] = useState({
    data_inicio: isoToBrDate(data.data_inicio),
    data_fim: isoToBrDate(data.data_fim),
    vagas_total: data.vagas_total != null ? String(data.vagas_total) : "",
    vagas_disponiveis: data.vagas_disponiveis != null ? String(data.vagas_disponiveis) : "",
    preco_pix: data.preco_pix != null ? String(data.preco_pix) : "",
    preco_cartao: data.preco_cartao != null ? String(data.preco_cartao) : "",
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (editing) return;
    setLocal({
      data_inicio: isoToBrDate(data.data_inicio),
      data_fim: isoToBrDate(data.data_fim),
      vagas_total: data.vagas_total != null ? String(data.vagas_total) : "",
      vagas_disponiveis: data.vagas_disponiveis != null ? String(data.vagas_disponiveis) : "",
      preco_pix: data.preco_pix != null ? String(data.preco_pix) : "",
      preco_cartao: data.preco_cartao != null ? String(data.preco_cartao) : "",
    });
  }, [editing, data.id, data.data_inicio, data.data_fim, data.vagas_total, data.vagas_disponiveis, data.preco_pix, data.preco_cartao]);

  const commit = (patch: Partial<DataRowRecord>) => { void onSave(patch).finally(() => setEditing(false)); };
  const total = Number(local.vagas_total) || 0;
  const disp = Number(local.vagas_disponiveis) || 0;
  const dispOver = disp > total;
  const onlyDigits = (value: string) => value.replace(/\D/g, "");
  const moneyValue = (value: string) => value.replace(/[^0-9,\.]/g, "").replace(/,/g, ".").replace(/(\..*)\./g, "$1");

  const Lbl = ({ children }: { children: React.ReactNode }) => (
    <span className="block text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)] mb-1">{children}</span>
  );

  return (
    <div className="rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <Lbl>Início</Lbl>
          <DateField
            value={local.data_inicio}
            onChange={(value) => { setEditing(true); setLocal((s) => ({ ...s, data_inicio: value })); }}
            onCommit={(value) => {
              const iso = brToIsoDate(value);
              if (iso && iso !== data.data_inicio) commit({ data_inicio: iso }); else setEditing(false);
            }}
          />
        </div>
        <div>
          <Lbl>Fim</Lbl>
          <DateField
            value={local.data_fim}
            onChange={(value) => { setEditing(true); setLocal((s) => ({ ...s, data_fim: value })); }}
            onCommit={(value) => {
              const iso = brToIsoDate(value);
              if (iso && iso !== data.data_fim) commit({ data_fim: iso }); else setEditing(false);
            }}
          />
        </div>
        <div>
          <Lbl>Vagas total</Lbl>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="admin-input w-full"
            value={local.vagas_total}
            onFocus={() => setEditing(true)}
            onChange={(e) => setLocal((s) => ({ ...s, vagas_total: onlyDigits(e.target.value) }))}
            onBlur={(e) => {
              const v = e.target.value === "" ? 0 : Number(e.target.value);
              if (v !== data.vagas_total) commit({ vagas_total: v }); else setEditing(false);
            }}
          />
        </div>
        <div>
          <Lbl>Vagas disponíveis</Lbl>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className={`admin-input w-full ${dispOver ? "ring-1 ring-amber-400/60" : ""}`}
            value={local.vagas_disponiveis}
            onFocus={() => setEditing(true)}
            onChange={(e) => setLocal((s) => ({ ...s, vagas_disponiveis: onlyDigits(e.target.value) }))}
            onBlur={(e) => {
              const v = e.target.value === "" ? 0 : Number(e.target.value);
              if (v !== data.vagas_disponiveis) commit({ vagas_disponiveis: v }); else setEditing(false);
            }}
          />
        </div>
        <div>
          <Lbl>Preço Pix (R$)</Lbl>
          <input
            type="text"
            inputMode="decimal"
            className="admin-input w-full"
            value={local.preco_pix}
            onFocus={() => setEditing(true)}
            onChange={(e) => setLocal((s) => ({ ...s, preco_pix: moneyValue(e.target.value) }))}
            onBlur={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              if (v !== data.preco_pix) commit({ preco_pix: v }); else setEditing(false);
            }}
          />
        </div>
        <div>
          <Lbl>Preço cartão (R$)</Lbl>
          <input
            type="text"
            inputMode="decimal"
            className="admin-input w-full"
            value={local.preco_cartao}
            onFocus={() => setEditing(true)}
            onChange={(e) => setLocal((s) => ({ ...s, preco_cartao: moneyValue(e.target.value) }))}
            onBlur={(e) => {
              const v = e.target.value === "" ? null : Number(e.target.value);
              if (v !== data.preco_cartao) commit({ preco_cartao: v }); else setEditing(false);
            }}
          />
        </div>
      </div>
      {dispOver && (
        <p className="mt-2 text-[11px] text-amber-300">Vagas disponíveis não pode passar do total da turma.</p>
      )}
      <div className="mt-3 flex justify-end">
        <button className="admin-btn-ghost gap-1 text-[12px] hover:!bg-rose-500/10 hover:!text-rose-300" onClick={() => onDelete()}>
          <Trash2 className="h-3.5 w-3.5" /> Remover data
        </button>
      </div>
    </div>
  );
}

function DateField({ value, onChange, onCommit }: { value: string; onChange: (value: string) => void; onCommit: (value: string) => void }) {
  return (
    <div className="relative">
      <input
        type="date"
        className="admin-input admin-input-date w-full pr-10"
        value={value}
        onFocus={() => onChange(value)}
        onChange={(e) => onChange(e.target.value)}
        onBlur={(e) => onCommit(e.target.value)}
      />
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-dourado-glow)]" strokeWidth={1.7} />
    </div>
  );
}
