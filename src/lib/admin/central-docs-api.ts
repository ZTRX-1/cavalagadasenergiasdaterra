import { supabase } from "@/integrations/supabase/client";

export type CategoriaDoc =
  | "nota_fiscal"
  | "contrato"
  | "comprovante"
  | "termo"
  | "documento_participante"
  | "documento_interno"
  | "outro";

export type StatusDoc = "recebido" | "enviado" | "aprovado" | "rejeitado" | "arquivado";

export const CATEGORIAS: { id: CategoriaDoc; label: string; descricao: string }[] = [
  { id: "nota_fiscal", label: "Notas Fiscais", descricao: "NFs de despesas, fornecedores, prestadores." },
  { id: "contrato", label: "Contratos", descricao: "Contratos de reserva, prestação de serviço, parcerias." },
  { id: "comprovante", label: "Comprovantes", descricao: "Comprovantes de pagamento, recibos." },
  { id: "termo", label: "Termos", descricao: "Termos de responsabilidade, aceite, política." },
  { id: "documento_participante", label: "Documentos do Participante", descricao: "RG, CPF, exames, atestados." },
  { id: "documento_interno", label: "Documentos Internos", descricao: "Material da equipe, manuais, procedimentos." },
  { id: "outro", label: "Outros", descricao: "Demais documentos." },
];

export const STATUS_DOC: { id: StatusDoc; label: string; tone: "ok" | "warn" | "info" | "danger" | "neutral" }[] = [
  { id: "recebido", label: "Recebido", tone: "info" },
  { id: "enviado", label: "Enviado", tone: "warn" },
  { id: "aprovado", label: "Aprovado", tone: "ok" },
  { id: "rejeitado", label: "Rejeitado", tone: "danger" },
  { id: "arquivado", label: "Arquivado", tone: "neutral" },
];

export interface DocumentoCentral {
  id: string;
  categoria: CategoriaDoc;
  titulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_mime: string | null;
  arquivo_tamanho: number | null;
  lead_id: string | null;
  reserva_id: string | null;
  cliente_nome: string | null;
  cliente_email: string | null;
  expedicao_id: string | null;
  participante_id: string | null;
  nf_numero: string | null;
  nf_cnpj: string | null;
  nf_empresa: string | null;
  nf_data: string | null;
  nf_valor: number | null;
  status: StatusDoc;
  observacoes_internas: string | null;
  texto_extraido: string | null;
  dados_extraidos: Record<string, unknown>;
  status_processamento: "pendente" | "processando" | "concluido" | "erro";
  enviado_por: string | null;
  enviado_por_nome: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const BUCKET = "central-docs";

export async function listDocumentosCentral(): Promise<DocumentoCentral[]> {
  const { data, error } = await supabase
    .from("documentos_central" as never)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DocumentoCentral[];
}

export async function createDocumentoCentral(
  input: Partial<DocumentoCentral> & { titulo: string; categoria: CategoriaDoc },
  arquivo?: File | null,
): Promise<DocumentoCentral> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  const nomeAutor =
    (userData.user?.user_metadata as { nome?: string } | undefined)?.nome ?? userData.user?.email ?? null;

  let arquivo_url: string | null = input.arquivo_url ?? null;
  let arquivo_nome: string | null = input.arquivo_nome ?? null;
  let arquivo_mime: string | null = input.arquivo_mime ?? null;
  let arquivo_tamanho: number | null = input.arquivo_tamanho ?? null;

  if (arquivo) {
    const ext = arquivo.name.split(".").pop() ?? "bin";
    const path = `${input.categoria}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, arquivo, {
      contentType: arquivo.type,
      upsert: false,
    });
    if (upErr) throw upErr;
    arquivo_url = path;
    arquivo_nome = arquivo.name;
    arquivo_mime = arquivo.type;
    arquivo_tamanho = arquivo.size;
  }

  const payload = {
    ...input,
    arquivo_url,
    arquivo_nome,
    arquivo_mime,
    arquivo_tamanho,
    enviado_por: userId,
    enviado_por_nome: nomeAutor,
  };

  const { data, error } = await supabase
    .from("documentos_central" as never)
    .insert(payload as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as DocumentoCentral;
}

export async function updateDocumentoCentral(
  id: string,
  patch: Partial<DocumentoCentral>,
): Promise<void> {
  const { error } = await supabase
    .from("documentos_central" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDocumentoCentral(id: string, arquivo_url: string | null): Promise<void> {
  if (arquivo_url) {
    await supabase.storage.from(BUCKET).remove([arquivo_url]);
  }
  const { error } = await supabase.from("documentos_central" as never).delete().eq("id", id);
  if (error) throw error;
}

export async function getDocumentoSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
