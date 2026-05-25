import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Image as ImageIcon, ArrowUp, ArrowDown, Trash2, Star, Link2, Video } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmpty } from "@/components/admin/admin-empty";
import { AdminUploader } from "@/components/admin/admin-uploader";
import {
  listExpedicoes,
  listAssets,
  uploadAsset,
  deleteAsset,
  setCapa,
  moveAsset,
  addVideoUrl,
  type AssetRow,
} from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/midia")({
  component: MidiaPage,
});

function MidiaPage() {
  const qc = useQueryClient();
  const { data: expedicoes = [] } = useQuery({ queryKey: ["admin", "expedicoes"], queryFn: listExpedicoes });
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const expedicaoId = selecionada ?? expedicoes[0]?.id ?? null;

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["admin", "assets", expedicaoId],
    queryFn: () => (expedicaoId ? listAssets(expedicaoId) : Promise.resolve([])),
    enabled: !!expedicaoId,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "assets", expedicaoId] });

  const upMut = useMutation({
    mutationFn: (files: File[]) =>
      Promise.all(files.map((f) => uploadAsset(expedicaoId!, f, "imagem"))),
    onSuccess: () => { toast.success("Mídia enviada"); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const delMut = useMutation({
    mutationFn: (a: AssetRow) => deleteAsset(a),
    onSuccess: () => { toast.success("Removida"); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const capaMut = useMutation({
    mutationFn: (a: AssetRow) => setCapa(a),
    onSuccess: () => { toast.success("Capa atualizada"); refresh(); qc.invalidateQueries({ queryKey: ["admin", "expedicoes"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const moveMut = useMutation({
    mutationFn: ({ a, dir }: { a: AssetRow; dir: "up" | "down" }) => moveAsset(a, dir),
    onSuccess: () => refresh(),
  });

  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitulo, setVideoTitulo] = useState("");
  const addVideoMut = useMutation({
    mutationFn: () => addVideoUrl(expedicaoId!, videoUrl, videoTitulo || undefined),
    onSuccess: () => { toast.success("Vídeo adicionado"); setVideoUrl(""); setVideoTitulo(""); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação"
        title="Mídia"
        description="Biblioteca de fotos e vídeos por expedição. Defina capa, organize a galeria e adicione vídeos externos."
      />

      <div className="admin-card mb-4 border-l-2 border-[color:var(--admin-dourado)]/60 bg-[color:var(--admin-petroleo-soft)]/30">
        <p className="text-[12.5px] leading-relaxed text-[color:var(--admin-cinza-2)]">
          Toda mídia desta tela fica <strong className="text-[color:var(--admin-cinza-1)]">vinculada à expedição selecionada</strong> e aparece na página pública dela. A foto marcada como <strong className="text-[color:var(--admin-dourado)]">CAPA</strong> é usada no card e no topo da expedição no site.
        </p>
      </div>

      {expedicoes.length === 0 ? (
        <AdminEmpty icon={ImageIcon} titulo="Nenhuma expedição" descricao="Crie uma expedição primeiro para gerenciar mídia." />
      ) : (
        <div className="space-y-4">
          <div className="admin-card">
            <label className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Expedição</label>
            <select
              className="admin-input mt-2 w-full"
              value={expedicaoId ?? ""}
              onChange={(e) => setSelecionada(e.target.value)}
            >
              {expedicoes.map((e) => (
                <option key={e.id} value={e.id}>{e.nome}</option>
              ))}
            </select>
          </div>

          {expedicaoId && (
            <>
              <div className="admin-card">
                <h3 className="font-display text-[16px] text-[color:var(--admin-cinza-1)] mb-3">Enviar imagens</h3>
                <AdminUploader
                  onFiles={async (f) => { await upMut.mutateAsync(f); }}
                  accept={{ "image/*": [] }}
                  hint="JPG, PNG ou WebP. Múltiplos arquivos suportados."
                />
              </div>

              <div className="admin-card">
                <h3 className="font-display text-[16px] text-[color:var(--admin-cinza-1)] mb-3 flex items-center gap-2">
                  <Video className="h-4 w-4" /> Adicionar vídeo externo
                </h3>
                <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <input className="admin-input" placeholder="Título" value={videoTitulo} onChange={(e) => setVideoTitulo(e.target.value)} />
                  <input className="admin-input" placeholder="https://youtube.com/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                  <button className="admin-btn-primary" disabled={!videoUrl || addVideoMut.isPending} onClick={() => addVideoMut.mutate()}>
                    <Link2 className="h-4 w-4" /> Adicionar
                  </button>
                </div>
              </div>

              <div className="admin-card">
                <h3 className="font-display text-[16px] text-[color:var(--admin-cinza-1)] mb-3">Galeria ({assets.length})</h3>
                {isLoading ? (
                  <div className="h-32 animate-pulse" />
                ) : assets.length === 0 ? (
                  <p className="text-[13px] text-[color:var(--admin-cinza-3)]">Nenhuma mídia ainda.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {assets.map((a) => (
                      <div key={a.id} className="group relative overflow-hidden rounded-lg ring-1 ring-[color:var(--admin-borda)]">
                        {a.tipo === "video" ? (
                          <div className="aspect-video grid place-items-center bg-[color:var(--admin-petroleo)] text-[color:var(--admin-cinza-2)]">
                            <Video className="h-8 w-8" />
                          </div>
                        ) : (
                          <img src={a.url} alt={a.titulo ?? ""} className="aspect-video w-full object-cover" />
                        )}
                        {a.is_capa && (
                          <span className="absolute top-2 left-2 rounded-md bg-[color:var(--admin-dourado)] px-2 py-0.5 text-[10px] font-medium text-[color:var(--admin-carvao-deep)]">
                            CAPA
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex gap-1">
                            <button className="rounded p-1 text-white hover:bg-white/10" title="Mover ←" onClick={() => moveMut.mutate({ a, dir: "up" })}>
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button className="rounded p-1 text-white hover:bg-white/10" title="Mover →" onClick={() => moveMut.mutate({ a, dir: "down" })}>
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex gap-1">
                            {a.tipo === "imagem" && !a.is_capa && (
                              <button className="rounded p-1 text-[color:var(--admin-dourado)] hover:bg-white/10" title="Definir capa" onClick={() => capaMut.mutate(a)}>
                                <Star className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button className="rounded p-1 text-rose-300 hover:bg-white/10" title="Remover" onClick={() => delMut.mutate(a)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
