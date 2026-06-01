import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getExpedicaoBySlug } from "@/lib/expedicoes.functions";
import { criarPreReserva } from "@/lib/pre-reserva.functions";
import { buildReservaWhatsappUrl } from "@/lib/whatsapp";
import { formatDateRange, formatPrice } from "@/lib/format";
import { getExpedicaoImage } from "@/lib/expedicao-images";
import { ESTADOS_BR, maskCPF, maskPhone, ageFromDateString } from "@/lib/br-estados";
import { cn } from "@/lib/utils";


const qo = (slug: string) =>
  queryOptions({ queryKey: ["expedicao", slug], queryFn: () => getExpedicaoBySlug({ data: { slug } }) });

const searchSchema = z.object({ data: z.string().optional() });

export const Route = createFileRoute("/reserva/$slug")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `Pré-reserva · ${params.slug.replace(/-/g, " ")}` },
      { name: "description", content: "Faça sua pré-reserva online em poucos minutos." },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(qo(params.slug));
    if (!data) throw notFound();
    return data;
  },
  component: ReservaPage,
});

const schema = z.object({
  data_id: z.string().uuid({ message: "Selecione uma data" }),
  responsavel: z.object({
    nome: z.string().trim().min(2, "Informe o nome completo"),
    cpf: z.string().trim().min(11, "CPF inválido"),
    telefone: z.string().trim().min(10, "Telefone inválido"),
    email: z.string().trim().email("E-mail inválido"),
    cidade: z.string().trim().min(2, "Informe a cidade"),
    estado: z.string().trim().min(2, "Informe o estado"),
  }),
  participantes: z.array(z.object({
    nome: z.string().trim().min(2, "Nome obrigatório"),
    idade: z.coerce.number().int().min(1).max(110),
    peso: z.coerce.number({ invalid_type_error: "Informe o peso" })
      .min(20, "Peso mínimo 20 kg")
      .max(110, "Por bem-estar dos cavalos, o peso máximo permitido é 110 kg."),
    experiencia: z.enum(["nenhuma", "iniciante", "intermediario", "avancado"]),
  })).min(1),
  adicionais: z.object({
    tipo_grupo: z.string().min(2, "Selecione"),
    forma_pagamento: z.string().min(2, "Selecione"),
    como_conheceu: z.string().min(2, "Selecione"),
    restricoes: z.string().optional(),
    observacoes: z.string().optional(),
  }),
  aceites: z.object({
    responsabilidade: z.literal(true, { errorMap: () => ({ message: "Necessário aceitar" }) }),
    cancelamento: z.literal(true, { errorMap: () => ({ message: "Necessário aceitar" }) }),
    riscos: z.literal(true, { errorMap: () => ({ message: "Necessário aceitar" }) }),
  }),
});

type FormValues = z.infer<typeof schema>;

const STEPS = ["Responsável", "Participantes", "Adicionais", "Aceites", "Confirmação"];

function ReservaPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(qo(slug));

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<null | { protocolo: string; expedicao_nome: string; quantidade_participantes: number; nome_responsavel: string }>(null);
  const [submitting, setSubmitting] = useState(false);
  const protocolo = useMemo(() => `CET-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      data_id: search.data ?? "",
      responsavel: { nome: "", cpf: "", telefone: "", email: "", cidade: "", estado: "" },
      participantes: [{ nome: "", idade: 18, peso: 70, experiencia: "nenhuma" }],
      adicionais: { tipo_grupo: "individual", forma_pagamento: "pix", como_conheceu: "instagram", restricoes: "", observacoes: "" },
      aceites: { responsabilidade: false as unknown as true, cancelamento: false as unknown as true, riscos: false as unknown as true },
    },
    mode: "onTouched",
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "participantes" });
  const [responsavelParticipa, setResponsavelParticipa] = useState(true);
  const [qtdTotal, setQtdTotal] = useState(1); // default: individual

  // Sincroniza quantidade de participantes com o total escolhido
  useEffect(() => {
    const current = form.getValues("participantes");
    if (qtdTotal === current.length) return;
    if (qtdTotal > current.length) {
      const toAdd = qtdTotal - current.length;
      for (let i = 0; i < toAdd; i++) append({ nome: "", idade: 18, peso: 70, experiencia: "nenhuma" });
    } else {
      replace(current.slice(0, qtdTotal));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qtdTotal]);

  // Sugere quantidade conforme tipo de grupo (sem travar o usuário)
  const tipoGrupo = form.watch("adicionais.tipo_grupo");
  useEffect(() => {
    if (tipoGrupo === "individual" && qtdTotal !== 1) setQtdTotal(1);
    else if (tipoGrupo === "casal" && qtdTotal < 2) setQtdTotal(2);
    else if (tipoGrupo === "familia" && qtdTotal < 3) setQtdTotal(4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoGrupo]);

  // "Você também participa?" · copia dados do responsável para participante 1
  const resp = form.watch("responsavel");
  useEffect(() => {
    if (!responsavelParticipa) return;
    if (resp.nome) form.setValue("participantes.0.nome", resp.nome, { shouldValidate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responsavelParticipa, resp.nome]);


  if (!data) return null;
  const { expedicao, datas } = data;

  if (submitted) {
    const dt = datas.find((d) => d.id === form.getValues("data_id"));
    const dataLabel = dt ? formatDateRange(dt.data_inicio, dt.data_fim) : "";
    const waUrl = buildReservaWhatsappUrl({
      nomeResponsavel: submitted.nome_responsavel,
      expedicaoNome: submitted.expedicao_nome,
      dataLabel,
      quantidadeParticipantes: submitted.quantidade_participantes,
      protocolo: submitted.protocolo,
    });
    return <SucessoView protocolo={submitted.protocolo} waUrl={waUrl} nome={submitted.expedicao_nome} dataLabel={dataLabel} />;
  }

  const next = async () => {
    const fieldsByStep: (keyof FormValues | `${keyof FormValues}.${string}`)[][] = [
      ["data_id", "responsavel"],
      ["participantes"],
      ["adicionais"],
      ["aceites"],
      [],
    ];
    const ok = await form.trigger(fieldsByStep[step] as any, { shouldFocus: true });
    if (!ok) {
      toast.error("Revise os campos destacados.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));
  const backHref = "/expedicoes" as const;

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const res = {
        protocolo,
        expedicao_nome: expedicao.nome,
        quantidade_participantes: values.participantes.length,
        nome_responsavel: values.responsavel.nome,
      };
      localStorage.setItem(`cet.reserva.${protocolo}`, JSON.stringify({ ...res, data_label: datas.find((d) => d.id === values.data_id) ? formatDateRange(datas.find((d) => d.id === values.data_id)!.data_inicio, datas.find((d) => d.id === values.data_id)!.data_fim) : "", status: "pre_reserva_enviada", created_at: new Date().toISOString() }));
      setSubmitted(res);
      const dt = datas.find((d) => d.id === values.data_id);
      const dataLabel = dt ? formatDateRange(dt.data_inicio, dt.data_fim) : "";
      const waUrl = buildReservaWhatsappUrl({
        nomeResponsavel: res.nome_responsavel,
        expedicaoNome: res.expedicao_nome,
        dataLabel,
        quantidadeParticipantes: res.quantidade_participantes,
        protocolo: res.protocolo,
      });
      if (typeof window !== "undefined") setTimeout(() => window.open(waUrl, "_blank"), 800);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar reserva. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  });

  const selectedDate = datas.find((d) => d.id === form.watch("data_id"));
  const formaPag = form.watch("adicionais.forma_pagamento");
  const qtdParts = form.watch("participantes")?.length ?? 1;
  const totalBase = expedicao.preco * qtdParts;
  const totalCartao = totalBase * 1.0599; // acréscimo cartão (~5.99%)
  const parcelas6x = totalCartao / 6;

  return (
    <div className="bg-background pb-24">
      {/* HERO da reserva · cinematográfico */}
      <section className="relative isolate overflow-hidden text-areia">
        <img src={getExpedicaoImage(expedicao.slug)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-carvao/85 via-carvao/70 to-carvao/95" />
        <div className="container-tight relative pb-14 pt-32 md:pb-20 md:pt-40">
          <Link to="/expedicoes/$slug" params={{ slug }} className="inline-flex items-center gap-2 font-eyebrow text-[0.65rem] uppercase tracking-[0.28em] text-areia/75 hover:text-cobre-soft">
            <ArrowLeft className="h-3 w-3" /> Trocar expedição ou data
          </Link>
          <div className="eyebrow mt-7 text-cobre-soft">Pré-reserva boutique</div>
          <h1 className="mt-3 font-display text-4xl text-balance text-shadow-strong md:text-6xl">{expedicao.nome}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-areia/85">
            {selectedDate && <span className="rounded-full border border-areia/25 px-3 py-1 font-eyebrow text-[0.62rem] uppercase tracking-[0.22em]">{formatDateRange(selectedDate.data_inicio, selectedDate.data_fim)}</span>}
            <span className="rounded-full border border-areia/25 px-3 py-1 font-eyebrow text-[0.62rem] uppercase tracking-[0.22em]">{expedicao.duracao}</span>
            <span className="rounded-full border border-areia/25 px-3 py-1 font-eyebrow text-[0.62rem] uppercase tracking-[0.22em]">{expedicao.nivel}</span>
            {selectedDate && selectedDate.status === "poucas_vagas" && (
              <span className="rounded-full bg-cobre/90 px-3 py-1 font-eyebrow text-[0.62rem] uppercase tracking-[0.22em] text-areia">Últimas vagas</span>
            )}
          </div>
          <p className="mt-6 max-w-xl text-areia/80">A partir de <span className="font-display text-xl text-areia">{formatPrice(expedicao.preco, expedicao.moeda)}</span> por participante · concierge dedicado em todas as etapas.</p>
        </div>
      </section>

      <div className="container-tight mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12">
        {/* Resumo sticky */}
        <aside className="lg:col-span-4 lg:order-2 lg:self-start">
          <div className="lg:sticky lg:top-24">

            <div className="overflow-hidden rounded-sm border border-border bg-card shadow-card">
              <img src={getExpedicaoImage(expedicao.slug)} alt={expedicao.nome} className="h-44 w-full object-cover" />
              <div className="p-6">
                <div className="eyebrow">Resumo da reserva</div>
                <h2 className="mt-2 font-display text-2xl">{expedicao.nome}</h2>
                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Data</dt><dd className="text-right font-medium">{selectedDate ? formatDateRange(selectedDate.data_inicio, selectedDate.data_fim) : "—"}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Duração</dt><dd className="font-medium">{expedicao.duracao}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Nível</dt><dd className="font-medium">{expedicao.nivel}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Participantes</dt><dd className="font-medium">{qtdParts}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Pagamento</dt><dd className="font-medium">{formaPag === "cartao" ? "Cartão 6x" : formaPag === "pix" ? "PIX à vista" : formaPag === "sinal" ? "Sinal + Saldo" : formaPag}</dd></div>
                </dl>
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[0.65rem] uppercase tracking-widest text-muted-foreground">Total</span>
                    <span className="font-display text-3xl text-cobre">{formatPrice(formaPag === "cartao" ? totalCartao : totalBase, expedicao.moeda)}</span>
                  </div>
                  {formaPag === "cartao" && (
                    <div className="mt-1 text-right text-xs text-muted-foreground">6x de {formatPrice(parcelas6x, expedicao.moeda)} · acréscimo de cartão incluso</div>
                  )}
                  {formaPag === "pix" && qtdParts > 0 && (
                    <div className="mt-1 text-right text-xs text-muted-foreground">{qtdParts} × {formatPrice(expedicao.preco, expedicao.moeda)}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Form */}
        <div className="lg:col-span-8 lg:order-1">
          <div className="eyebrow">Pré-reserva</div>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">Reserve sua vaga em 5 passos</h2>

          {/* Stepper premium */}
          <ol className="mt-10 grid grid-cols-5 gap-1.5">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-col items-stretch gap-2">
                <div className={cn("h-[3px] rounded-full transition-all duration-500", i < step ? "bg-cobre" : i === step ? "bg-gradient-to-r from-cobre to-cobre-soft" : "bg-border")} />
                <span className={cn("hidden text-[0.6rem] font-eyebrow uppercase tracking-[0.22em] transition-colors md:block", i === step ? "text-cobre" : i < step ? "text-foreground/70" : "text-muted-foreground")}>
                  {String(i + 1).padStart(2, "0")} · {label}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground md:hidden">Etapa {step + 1} de {STEPS.length} · <span className="text-cobre">{STEPS[step]}</span></p>

          <form onSubmit={onSubmit} className="mt-10">
            {step === 0 && (
              <Step title="Dados do responsável" desc="Quem ficará como contato principal pela reserva.">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Nome completo" error={form.formState.errors.responsavel?.nome?.message} className="sm:col-span-2">
                    <Input {...form.register("responsavel.nome")} placeholder="Como aparece no documento" />
                  </Field>
                  <Field label="CPF" error={form.formState.errors.responsavel?.cpf?.message}>
                    <Controller
                      control={form.control}
                      name="responsavel.cpf"
                      render={({ field }) => (
                        <input
                          className="input"
                          inputMode="numeric"
                          placeholder="000.000.000-00"
                          value={field.value}
                          onChange={(e) => field.onChange(maskCPF(e.target.value))}
                        />
                      )}
                    />
                  </Field>
                  <Field label="Telefone (WhatsApp)" error={form.formState.errors.responsavel?.telefone?.message}>
                    <Controller
                      control={form.control}
                      name="responsavel.telefone"
                      render={({ field }) => (
                        <input
                          className="input"
                          inputMode="tel"
                          placeholder="(11) 99999-9999"
                          value={field.value}
                          onChange={(e) => field.onChange(maskPhone(e.target.value))}
                        />
                      )}
                    />
                  </Field>
                  <Field label="E-mail" error={form.formState.errors.responsavel?.email?.message} className="sm:col-span-2">
                    <Input type="email" inputMode="email" placeholder="voce@exemplo.com" {...form.register("responsavel.email")} />
                  </Field>
                  <Field label="Estado" error={form.formState.errors.responsavel?.estado?.message}>
                    <select className="input" {...form.register("responsavel.estado")}>
                      <option value="">Selecione</option>
                      {ESTADOS_BR.map((e) => (
                        <option key={e.sigla} value={e.sigla}>{e.sigla} · {e.nome}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Cidade" error={form.formState.errors.responsavel?.cidade?.message}>
                    <Input {...form.register("responsavel.cidade")} placeholder="Sua cidade" />
                  </Field>
                  <Field label="Data desejada" error={form.formState.errors.data_id?.message} className="sm:col-span-2">
                    <select className="input" {...form.register("data_id")}>
                      <option value="">Selecione a data</option>
                      {datas.map((d) => (
                        <option key={d.id} value={d.id} disabled={d.status === "esgotado"}>
                          {formatDateRange(d.data_inicio, d.data_fim)} {d.status === "esgotado" ? " · esgotado" : d.status === "poucas_vagas" ? " · poucas vagas" : ""}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </Step>
            )}


            {step === 1 && (
              <Step title="Participantes" desc="Informe quantas pessoas embarcam nesta expedição.">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Tipo de grupo">
                    <select className="input" {...form.register("adicionais.tipo_grupo")}>
                      <option value="individual">Individual</option>
                      <option value="casal">Casal</option>
                      <option value="familia">Família</option>
                      <option value="amigos">Grupo de amigos</option>
                      <option value="corporativo">Corporativo</option>
                    </select>
                  </Field>
                  <Field label="Quantidade total de participantes">
                    <select
                      className="input"
                      value={qtdTotal}
                      onChange={(e) => setQtdTotal(Math.max(1, Math.min(20, Number(e.target.value))))}
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>{n} {n === 1 ? "pessoa" : "pessoas"}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-sm border border-border bg-card p-4 transition-colors hover:border-cobre/60">
                  <input
                    type="checkbox"
                    checked={responsavelParticipa}
                    onChange={(e) => setResponsavelParticipa(e.target.checked)}
                    className="mt-0.5 h-5 w-5 accent-cobre"
                  />
                  <div>
                    <div className="font-display text-base">Você também participará da experiência?</div>
                    <p className="mt-0.5 text-xs text-muted-foreground">Se sim, copiaremos seus dados para o Participante 1 automaticamente.</p>
                  </div>
                </label>

                <div className="mt-6 space-y-4">
                  {fields.map((f, i) => (
                    <div key={f.id} className="rounded-sm border border-border bg-card p-5">
                      <div className="flex items-center justify-between">
                        <div className="font-display text-lg">
                          Participante {i + 1}
                          {i === 0 && responsavelParticipa && (
                            <span className="ml-2 font-eyebrow text-[0.6rem] uppercase tracking-[0.22em] text-cobre">Responsável</span>
                          )}
                        </div>
                        {fields.length > 1 && i > 0 && (
                          <button type="button" onClick={() => { remove(i); setQtdTotal((q) => Math.max(1, q - 1)); }} className="text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive">Remover</button>
                        )}
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Nome completo" error={form.formState.errors.participantes?.[i]?.nome?.message} className="sm:col-span-2">
                          <Input {...form.register(`participantes.${i}.nome`)} placeholder="Como aparece no documento" />
                        </Field>
                        <Field label="Data de nascimento" error={form.formState.errors.participantes?.[i]?.idade?.message}>
                          <Controller
                            control={form.control}
                            name={`participantes.${i}.idade`}
                            render={({ field }) => (
                              <input
                                type="date"
                                className="input"
                                max={new Date().toISOString().slice(0, 10)}
                                min="1920-01-01"
                                onChange={(e) => {
                                  const age = ageFromDateString(e.target.value);
                                  if (age != null && age > 0) field.onChange(age);
                                }}
                              />
                            )}
                          />
                          <span className="text-[0.7rem] text-muted-foreground">Idade calculada: {form.watch(`participantes.${i}.idade`) || "—"} anos</span>
                        </Field>
                        <Field label="Peso (kg) · máx. 110 kg" error={form.formState.errors.participantes?.[i]?.peso?.message}>
                          <Input type="number" inputMode="decimal" step="0.1" min={20} max={110} {...form.register(`participantes.${i}.peso`)} />
                          <span className="text-[0.7rem] text-muted-foreground">Por bem-estar e segurança dos cavalos, o peso máximo permitido por cavaleiro é <strong>110 kg</strong>. Travessias longas com sobrepeso comprometem a saúde do animal.</span>
                        </Field>
                        <Field label="Experiência com cavalgada" className="sm:col-span-2">
                          <Controller
                            control={form.control}
                            name={`participantes.${i}.experiencia`}
                            render={({ field }) => (
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {[
                                  { v: "nenhuma", t: "Nenhuma" },
                                  { v: "iniciante", t: "Iniciante" },
                                  { v: "intermediario", t: "Intermediário" },
                                  { v: "avancado", t: "Avançado" },
                                ].map((o) => (
                                  <button
                                    key={o.v}
                                    type="button"
                                    onClick={() => field.onChange(o.v)}
                                    data-active={field.value === o.v}
                                    className="option-card items-center text-center"
                                  >
                                    <span className="font-eyebrow text-[0.7rem] uppercase tracking-[0.2em]">{o.t}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </Step>
            )}


            {step === 2 && (
              <Step title="Informações adicionais" desc="Para deixarmos tudo afinado para você.">
                <div className="space-y-8">
                  <div>
                    <div className="eyebrow mb-3">Forma de pagamento</div>
                    <Controller
                      control={form.control}
                      name="adicionais.forma_pagamento"
                      render={({ field }) => (
                        <div className="grid gap-3 sm:grid-cols-3">
                          {[
                            { v: "pix", t: "PIX à vista", d: "Sem acréscimo · 5% de desconto possível", price: totalBase },
                            { v: "sinal", t: "Sinal + Saldo", d: "30% sinal + saldo até 30 dias antes", price: totalBase },
                            { v: "cartao", t: "Cartão em 6x", d: `Acréscimo ~5,99% incluso`, price: totalCartao },
                          ].map((opt) => (
                            <button
                              key={opt.v}
                              type="button"
                              onClick={() => field.onChange(opt.v)}
                              data-active={field.value === opt.v}
                              className="option-card"
                            >
                              <div className="font-display text-lg">{opt.t}</div>
                              <div className="text-xs text-muted-foreground">{opt.d}</div>
                              <div className="mt-1 font-eyebrow text-[0.7rem] uppercase tracking-[0.18em] text-cobre">{formatPrice(opt.price, expedicao.moeda)}</div>
                              {opt.v === "cartao" && <div className="text-[0.7rem] text-muted-foreground">6× {formatPrice(parcelas6x, expedicao.moeda)}</div>}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  <div>
                    <div className="eyebrow mb-3">Como nos conheceu?</div>
                    <Controller
                      control={form.control}
                      name="adicionais.como_conheceu"
                      render={({ field }) => (
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                          {["instagram","facebook","tiktok","indicacao","google","outros"].map((v) => (
                            <button key={v} type="button" onClick={() => field.onChange(v)} data-active={field.value === v} className="option-card items-center text-center capitalize">
                              <span className="font-eyebrow text-[0.72rem] uppercase tracking-[0.2em]">{v === "outros" ? "Outro" : v}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Restrições alimentares" className="sm:col-span-2">
                      <textarea className="input min-h-[88px]" {...form.register("adicionais.restricoes")} placeholder="Vegetarianos, alergias, intolerâncias..." />
                    </Field>
                    <Field label="Observações" className="sm:col-span-2">
                      <textarea className="input min-h-[110px]" {...form.register("adicionais.observacoes")} placeholder="Algo mais que devamos saber?" />
                    </Field>
                  </div>
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step title="Aceite jurídico" desc="Leia atentamente e confirme para prosseguir.">
                <div className="space-y-4">
                  <AceiteItem
                    name="aceites.responsabilidade"
                    control={form.control}
                    error={form.formState.errors.aceites?.responsabilidade?.message}
                    title="Termo de responsabilidade"
                    text="Declaro estar ciente de que a expedição envolve atividades físicas ao ar livre com cavalos e assumo a responsabilidade pelas informações de saúde e condicionamento físico informadas."
                  />
                  <AceiteItem
                    name="aceites.cancelamento"
                    control={form.control}
                    error={form.formState.errors.aceites?.cancelamento?.message}
                    title="Política de cancelamento"
                    text="Estou ciente de que cancelamentos com menos de 30 dias de antecedência podem implicar retenção parcial ou total do valor pago, conforme política detalhada no contrato."
                  />
                  <AceiteItem
                    name="aceites.riscos"
                    control={form.control}
                    error={form.formState.errors.aceites?.riscos?.message}
                    title="Aceite de riscos"
                    text="Reconheço que a cavalgada é uma atividade de aventura sujeita a riscos inerentes (clima, terreno, comportamento animal), os quais foram esclarecidos e aceito participar de livre e espontânea vontade."
                  />
                </div>
              </Step>
            )}

            {step === 4 && (
              <Step title="Confirmação" desc="Revise os dados e finalize sua pré-reserva.">
                <ResumoConfirmacao expedicaoNome={expedicao.nome} datas={datas} values={form.getValues()} />
              </Step>
            )}

            {/* Nav */}
            <div className="mt-10 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              {step === 0 ? (
                <Link to={backHref} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm uppercase tracking-widest text-foreground hover:border-cobre hover:text-cobre">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Link>
              ) : (
                <button type="button" onClick={back} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm uppercase tracking-widest text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next} className="inline-flex items-center justify-center gap-2 rounded-full bg-floresta-deep px-7 py-3 text-sm uppercase tracking-widest text-areia transition-colors hover:bg-cobre">
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-cobre px-8 py-3 text-sm uppercase tracking-widest text-areia transition-colors hover:bg-cobre-soft disabled:opacity-60">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <>Finalizar pré-reserva <Check className="h-4 w-4" /></>}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}

function Step({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="input" />;
}

function AceiteItem({ name, control, title, text, error }: any) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <label className={cn("flex cursor-pointer gap-4 rounded-sm border bg-card p-5 transition-colors", error ? "border-destructive" : "border-border hover:border-cobre/60")}>
          <input
            type="checkbox"
            checked={!!field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-cobre"
          />
          <div>
            <div className="font-display text-lg">{title}</div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          </div>
        </label>
      )}
    />
  );
}

function ResumoConfirmacao({ expedicaoNome, datas, values }: any) {
  const dt = datas.find((d: any) => d.id === values.data_id);
  return (
    <div className="space-y-5 rounded-sm border border-border bg-card p-6">
      <ResumoRow label="Expedição" value={expedicaoNome} />
      <ResumoRow label="Data" value={dt ? formatDateRange(dt.data_inicio, dt.data_fim) : "—"} />
      <ResumoRow label="Responsável" value={`${values.responsavel.nome} · ${values.responsavel.email}`} />
      <ResumoRow label="Participantes" value={String(values.participantes.length)} />
      <ResumoRow label="Forma de pagamento" value={values.adicionais.forma_pagamento} />
      <p className="border-t border-border pt-4 text-sm text-muted-foreground">
        Ao finalizar, geraremos seu <strong className="text-foreground">protocolo</strong> e abriremos o WhatsApp com a mensagem para nossa equipe confirmar a vaga.
      </p>
    </div>
  );
}

function ResumoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function SucessoView({ protocolo, waUrl, nome, dataLabel }: { protocolo: string; waUrl: string; nome: string; dataLabel: string }) {
  return (
    <div className="min-h-screen bg-background pb-24 pt-32 md:pt-40">
      <div className="container-tight max-w-2xl text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-floresta-deep text-areia">
          <Check className="h-7 w-7" />
        </div>
        <div className="eyebrow mt-8">Pré-reserva confirmada</div>
        <h1 className="mt-4 font-display text-4xl md:text-5xl">Sua trilha começou.</h1>
        <p className="mt-4 text-muted-foreground">
          Recebemos sua pré-reserva para <strong className="text-foreground">{nome}</strong> em {dataLabel}.
          Em instantes você será direcionado ao WhatsApp para conversar com nossa equipe.
        </p>
        <div className="mt-10 rounded-sm border border-border bg-card p-8">
          <div className="eyebrow">Seu protocolo</div>
          <div className="mt-3 font-display text-4xl text-cobre">{protocolo}</div>
          <p className="mt-3 text-xs text-muted-foreground">Guarde este número. Você pode consultar o status em "Minha Reserva".</p>
        </div>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-3 text-sm uppercase tracking-widest text-white">
            Abrir WhatsApp
          </a>
          <Link to="/minha-reserva" search={{ p: protocolo }} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3 text-sm uppercase tracking-widest text-foreground hover:border-cobre hover:text-cobre">
            Consultar reserva
          </Link>
        </div>
      </div>
    </div>
  );
}
