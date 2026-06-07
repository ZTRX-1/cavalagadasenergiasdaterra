import { supabase } from "@/integrations/supabase/client";
import { listParticipantesDaReserva } from "@/lib/admin/api";

/**
 * Converte uma lista de participantes em CSV e dispara o download.
 */
export async function exportParticipantesCSV(reservaId: string, protocolo: string) {
  try {
    const participantes = await listParticipantesDaReserva(reservaId);
    
    if (!participantes || participantes.length === 0) {
      throw new Error("Nenhum participante para exportar.");
    }

    // Cabeçalhos (Headers)
    const headers = [
      "Nome",
      "Email",
      "Telefone",
      "CPF",
      "Peso (kg)",
      "Data Nascimento",
      "Status",
      "Experiência Equestre",
      "Restrições Alimentares",
      "Observações Médicas"
    ];

    // Mapear dados para linhas do CSV
    const rows = participantes.map(p => [
      p.nome || "",
      p.email || "",
      p.telefone || "",
      p.cpf || "",
      p.peso || "",
      p.data_nascimento || "",
      p.status || "",
      p.experiencia_equestre || "",
      p.restricoes_alimentares || "",
      p.observacoes_medicas || ""
    ]);

    // Criar conteúdo CSV
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Adicionar BOM para Excel reconhecer acentuação
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `participantes-reserva-${protocolo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error("Erro ao exportar CSV:", error);
    throw error;
  }
}
