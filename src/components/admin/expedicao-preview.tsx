import { useEffect, useMemo, useRef, useState } from "react";
import { Check, MapPin, Plane, Info, Calendar, Monitor, Smartphone, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ExpedicaoRow } from "@/lib/admin/api";

type AssetLite = { id?: string; url: string; tipo: string; titulo?: string | null; is_capa?: boolean; ordem?: number };
type DataLite = {
  id: string;
  data_inicio: string;
  data_fim: string;
  vagas_disponiveis: number;
  vagas_total: number;
  preco_pix?: number | null;
  preco_cartao?: number | null;
};

const SECTION_LABELS: Record<string, string> = {
  hero: "Topo da página (capa + nome + resumo)",
  card: "Card nas listagens",
  meta: "Faixa de duração / nível / preço",
  descricao: "Bloco 'Sobre a expedição'",
  inclui: "Caixa 'O que está incluso'",
  preco: "Caixa 'Condições de pagamento'",
  roteiro: "Seção 'Como cada dia se desenrola'",
  "como-chegar": "Seção 'Como chegar'",
  galeria: "Carrossel e galeria de fotos",
  datas: "Bloco 'Próximas datas'",
  requisitos: "Lista 'Informações importantes'",
  publicacao: "Visibilidade pública (publicado/rascunho)",
};

function formatBRL(value?: number | null) {
  if (value == null || isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value));
}

function formatDateRange(inicio: string, fim: string) {
  try {
    const a = new Date(inicio + "T00:00:00");
    const b = new Date(fim + "T00:00:00");
    const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
    return `${fmt.format(a)} → ${fmt.format(b)}`;
  } catch {
    return `${inicio} → ${fim}`;
  }
}

export function ExpedicaoPreview({
  form,
  assets,
  datas,
}: {
  form: Partial<ExpedicaoRow>;
  assets: AssetLite[];
  datas: DataLite[];
}) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [highlight, setHighlight] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onHl = (e: Event) => {
      const target = (e as CustomEvent<string | null>).detail ?? null;
      setHighlight(target);
      if (target && stageRef.current) {
        const el = stageRef.current.querySelector<HTMLElement>(`[data-section="${target}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener("admin-preview-highlight", onHl);
    return () => window.removeEventListener("admin-preview-highlight", onHl);
  }, []);

  const imagens = useMemo(() => assets.filter((a) => a.tipo === "imagem"), [assets]);
  const capa = form.capa_url || form.imagem_url || imagens.find((a) => a.is_capa)?.url || imagens[0]?.url || null;
  const roteiro = (form.roteiro ?? []) as { dia: string; titulo: string; desc: string }[];
  const inclui = (form.inclui ?? []) as string[];
  const requisitos = (form.requisitos ?? []) as string[];

  const stageWidth = device === "desktop" ? 1280 : 390;
  const containerW = device === "desktop" ? 620 : 360;
  const scale = containerW / stageWidth;
  const stageHeight = device === "desktop" ? 1200 : 2200;

  const sectionClass = (id: string) =>
    `transition-all duration-500 ${highlight === id ? "ring-4 ring-[color:var(--admin-dourado-glow)]/80 ring-offset-2 ring-offset-black rounded-lg" : ""}`;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Preview ao vivo</div>
          <div className="text-xs text-[color:var(--admin-cinza-2)]">
            {form.status === "publicado" ? "Publicado · alterações ainda não salvas" : "Pré-visualização — alterações não salvas"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDevice("desktop")}
            className={`grid h-7 w-7 place-items-center rounded-md transition ${device === "desktop" ? "bg-[color:var(--admin-dourado)]/20 text-[color:var(--admin-dourado-glow)]" : "text-[color:var(--admin-cinza-3)] hover:bg-white/5"}`}
            aria-label="Preview desktop"
            title="Desktop"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice("mobile")}
            className={`grid h-7 w-7 place-items-center rounded-md transition ${device === "mobile" ? "bg-[color:var(--admin-dourado)]/20 text-[color:var(--admin-dourado-glow)]" : "text-[color:var(--admin-cinza-3)] hover:bg-white/5"}`}
            aria-label="Preview mobile"
            title="Mobile"
          >
            <Smartphone className="h-4 w-4" />
          </button>
          {form.slug ? (
            <Link
              to="/expedicoes/$slug"
              params={{ slug: form.slug }}
              target="_blank"
              rel="noreferrer"
              className="ml-1 grid h-7 w-7 place-items-center rounded-md text-[color:var(--admin-cinza-3)] transition hover:bg-white/5 hover:text-[color:var(--admin-dourado-glow)]"
              title="Abrir página pública em nova aba"
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      {highlight ? (
        <div className="rounded-md border border-[color:var(--admin-dourado-glow)]/40 bg-[color:var(--admin-dourado)]/10 px-3 py-2 text-[11px] leading-snug text-[color:var(--admin-dourado-glow)]">
          Você está editando: <strong className="font-medium">{SECTION_LABELS[highlight] ?? highlight}</strong>
        </div>
      ) : null}

      <div
        className="relative w-full overflow-hidden rounded-lg border border-[color:var(--admin-borda)] bg-black"
        style={{ height: `${stageHeight * scale}px` }}
      >
        <div
          ref={stageRef}
          className="absolute left-0 top-0 origin-top-left overflow-y-auto bg-[#0a0a0a]"
          style={{
            width: `${stageWidth}px`,
            height: `${stageHeight}px`,
            transform: `scale(${scale})`,
          }}
        >
          {/* HERO */}
          <section
            data-section="hero"
            className={`relative min-h-[640px] text-white border-b border-white/10 ${sectionClass("hero")}`}
          >
            {capa ? (
              <img src={capa} alt={form.nome ?? ""} className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-stone-800 to-black text-stone-500">
                <span className="text-sm">Envie uma capa para ver aqui</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
            <div className="relative mx-auto flex min-h-[640px] max-w-5xl flex-col justify-end px-12 pb-16 pt-32">
              <div
                data-section="meta"
                className={`flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/80 ${sectionClass("meta")}`}
              >
                <span>{form.duracao || "Duração"}</span>
                <span className="h-1 w-1 rounded-full bg-amber-500" />
                <span>{form.nivel || "Nível"}</span>
                <span className="h-1 w-1 rounded-full bg-amber-500" />
                <span>A partir de {formatBRL(form.preco)} <span className="text-white/60">por pessoa</span></span>
              </div>
              <h1 className="mt-5 max-w-3xl font-serif text-6xl">{form.nome || "Nome da expedição"}</h1>
              <p className="mt-5 max-w-2xl text-lg text-white/85">{form.descricao_curta || "Resumo curto da expedição"}</p>
            </div>
          </section>

          {/* Card simulado de listagem */}
          <section data-section="card" className={`bg-stone-950 px-12 py-10 ${sectionClass("card")}`}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Como aparece nas listagens</div>
            <div className="mt-4 grid max-w-md grid-cols-[140px_1fr] gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-xl">
              {capa ? (
                <img src={capa} alt="" className="aspect-[4/3] w-full rounded-lg object-cover shadow-lg" />
              ) : (
                <div className="aspect-[4/3] w-full rounded bg-stone-800" />
              )}
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-amber-400/80">{form.regiao || form.estado || form.pais || "Localização"}</div>
                <div className="mt-1 font-serif text-lg leading-tight text-white">{form.nome || "Nome"}</div>
                <div className="mt-1 line-clamp-2 text-xs text-stone-400">{form.descricao_curta || "Resumo curto"}</div>
                <div className="mt-2 text-xs text-amber-300">{formatBRL(form.preco)}</div>
              </div>
            </div>
          </section>

          {/* Descrição + Inclui + Preço */}
          <section className="bg-[#f8f5ef] px-12 py-16 text-stone-900">
            <div className="grid gap-12 md:grid-cols-12">
              <div data-section="descricao" className={`md:col-span-7 ${sectionClass("descricao")}`}>
                <div className="text-[10px] uppercase tracking-[0.22em] text-amber-700">A experiência</div>
                <h2 className="mt-3 font-serif text-3xl">Sobre a expedição</h2>
                <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-stone-700">
                  {form.descricao_longa || "Descrição completa da expedição aparecerá aqui."}
                </p>
                {requisitos.length > 0 && (
                  <div data-section="requisitos" className={`mt-10 ${sectionClass("requisitos")}`}>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-amber-700">Informações importantes</div>
                    <ul className="mt-3 space-y-2 text-sm text-stone-700">
                      {requisitos.map((r) => (
                        <li key={r} className="flex items-start gap-2"><span className="mt-2 h-1 w-1 rounded-full bg-amber-600" />{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <aside className="md:col-span-5 space-y-5">
                <div data-section="inclui" className={`rounded border border-stone-200 bg-white p-6 shadow-sm ${sectionClass("inclui")}`}>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-amber-700">O que está incluso</div>
                  <ul className="mt-4 space-y-2 text-sm">
                    {inclui.length === 0 ? (
                      <li className="text-stone-400">Liste os itens em Comercial → O que inclui</li>
                    ) : inclui.map((i) => (
                      <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />{i}</li>
                    ))}
                  </ul>
                </div>
                <div data-section="preco" className={`rounded border border-stone-200 bg-white p-6 shadow-sm ${sectionClass("preco")}`}>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-amber-700">Condições de pagamento</div>
                  <div className="mt-3 font-serif text-2xl text-amber-700">A partir de {formatBRL(form.preco)}</div>
                  <p className="mt-2 text-xs text-stone-500">Até {form.parcelamento_max ?? 1}x no cartão.</p>
                </div>
              </aside>
            </div>
          </section>

          {/* Roteiro */}
          {roteiro.length > 0 && (
            <section data-section="roteiro" className={`bg-stone-100 px-12 py-16 text-stone-900 ${sectionClass("roteiro")}`}>
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-700">Roteiro resumido</div>
              <h2 className="mt-3 font-serif text-3xl">Como cada dia se desenrola</h2>
              <div className="mt-8 grid gap-px overflow-hidden rounded border border-stone-300 bg-stone-300 md:grid-cols-2">
                {roteiro.map((d, i) => (
                  <div key={i} className="bg-white p-6">
                    <div className="font-serif text-xl text-amber-700">{d.dia}</div>
                    <div className="mt-1 font-serif text-lg">{d.titulo}</div>
                    <p className="mt-2 text-sm text-stone-600">{d.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Como chegar */}
          {(form.como_chegar_aeroporto || form.como_chegar_referencia || form.como_chegar_conteudo || form.como_chegar_observacoes) && (
            <section data-section="como-chegar" className={`bg-[#f8f5ef] px-12 py-16 text-stone-900 ${sectionClass("como-chegar")}`}>
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-700">Logística</div>
              <h2 className="mt-3 font-serif text-3xl">{form.como_chegar_titulo?.trim() || "Como chegar"}</h2>
              <div className="mt-8 grid gap-8 md:grid-cols-12">
                <div className="md:col-span-7 space-y-5">
                  {(form.como_chegar_aeroporto || form.como_chegar_referencia) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {form.como_chegar_aeroporto && (
                        <div className="rounded border border-stone-200 bg-white p-5">
                          <div className="flex items-center gap-2 text-amber-700"><Plane className="h-4 w-4" /><span className="text-[10px] uppercase tracking-wider">Aeroporto</span></div>
                          <p className="mt-2 font-serif text-lg">{form.como_chegar_aeroporto}</p>
                        </div>
                      )}
                      {form.como_chegar_referencia && (
                        <div className="rounded border border-stone-200 bg-white p-5">
                          <div className="flex items-center gap-2 text-amber-700"><MapPin className="h-4 w-4" /><span className="text-[10px] uppercase tracking-wider">Cidade</span></div>
                          <p className="mt-2 font-serif text-lg">{form.como_chegar_referencia}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {form.como_chegar_conteudo && (
                    <p className="whitespace-pre-line text-base leading-relaxed text-stone-700">{form.como_chegar_conteudo}</p>
                  )}
                </div>
                {form.como_chegar_observacoes && (
                  <aside className="md:col-span-5">
                    <div className="rounded border border-stone-200 bg-stone-50 p-5">
                      <div className="flex items-center gap-2 text-amber-700"><Info className="h-4 w-4" /><span className="text-[10px] uppercase tracking-wider">Observações</span></div>
                      <p className="mt-3 whitespace-pre-line text-sm text-stone-700">{form.como_chegar_observacoes}</p>
                    </div>
                  </aside>
                )}
              </div>
            </section>
          )}

          {/* Galeria */}
          {imagens.length > 0 && (
            <section data-section="galeria" className={`bg-stone-950 px-12 py-16 text-white ${sectionClass("galeria")}`}>
              <div className="text-[10px] uppercase tracking-[0.22em] text-amber-400">Galeria</div>
              <h2 className="mt-3 font-serif text-3xl">A expedição em imagens</h2>
              <div className="mt-8 grid grid-cols-3 gap-3">
                {imagens.slice(0, 6).map((a) => (
                  <figure key={a.id ?? a.url} className="overflow-hidden rounded">
                    <img src={a.url} alt={a.titulo ?? ""} className="aspect-[4/3] w-full object-cover" />
                    {a.titulo ? <figcaption className="mt-2 text-xs text-stone-400">{a.titulo}</figcaption> : null}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {/* Próximas datas */}
          <section data-section="datas" className={`bg-stone-100 px-12 py-16 text-stone-900 ${sectionClass("datas")}`}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-700">Próximas datas</div>
            <h2 className="mt-3 font-serif text-3xl">Escolha seu período</h2>
            <div className="mt-6 space-y-3">
              {datas.length === 0 ? (
                <p className="text-stone-500">Nenhuma data cadastrada ainda.</p>
              ) : datas.slice(0, 6).map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded border border-stone-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-amber-700" />
                    <div>
                      <div className="font-serif text-base">{formatDateRange(d.data_inicio, d.data_fim)}</div>
                      <div className="text-xs text-stone-500">{d.vagas_disponiveis}/{d.vagas_total} vagas</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-stone-500">Pix</div>
                    <div className="font-serif text-amber-700">{formatBRL(d.preco_pix ?? form.preco)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section data-section="publicacao" className={`bg-stone-900 px-12 py-10 text-stone-300 ${sectionClass("publicacao")}`}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Visibilidade</div>
            <p className="mt-2 text-sm">
              Esta expedição está como <strong className="text-amber-400">{form.status ?? "rascunho"}</strong>
              {form.ativo === false ? " e desativada no site." : ""}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
