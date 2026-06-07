import { supabase } from "@/integrations/supabase/client";

export async function addParticipanteManual(input: {
  reservaId: string;
  expedicaoId: string | null;
  dataId: string | null;
  nome: string;
  email?: string | null;
  telefone?: string | null;
}) {
  const { data, error } = await supabase
    .from("participantes")
    .insert({
      reserva_id: input.reservaId,
      expedicao_id: input.expedicaoId,
      data_id: input.dataId,
      nome: input.nome,
      email: input.email ?? null,
      telefone: input.telefone ?? null,
      status: "confirmado",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
