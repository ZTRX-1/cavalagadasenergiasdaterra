import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ParticipanteRow } from "@/lib/admin/api";

function idade(nasc: string | null): string {
  if (!nasc) return "—";
  const d = new Date(nasc);
  const a = new Date(Date.now() - d.getTime()).getUTCFullYear() - 1970;
  return `${a}`;
}

export function exportarFichaGuiaPDF(opts: {
  expedicaoNome: string;
  data?: string | null;
  participantes: ParticipanteRow[];
}) {
  const { expedicaoNome, data, participantes } = opts;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  // Cabeçalho
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Ficha do Guia — Cavalgada Editora", 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Expedição: ${expedicaoNome}`, 40, 60);
  if (data) doc.text(`Data: ${data}`, 40, 76);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 40, 92);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: 110,
    head: [[
      "#", "Nome", "Idade", "Peso (kg)", "Experiência",
      "Telefone", "Restrições / Alergias", "Observações médicas",
    ]],
    body: participantes.map((p, i) => [
      String(i + 1),
      p.nome ?? "—",
      idade(p.data_nascimento),
      p.peso ? String(p.peso) : "—",
      p.experiencia_equestre ?? "—",
      p.telefone ?? "—",
      [p.restricoes_alimentares, p.restricoes].filter(Boolean).join(" · ") || "—",
      p.observacoes_medicas ?? "—",
    ]),
    styles: { fontSize: 9, cellPadding: 6, valign: "top" },
    headStyles: { fillColor: [34, 34, 34], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 120 },
      2: { cellWidth: 40 },
      3: { cellWidth: 50 },
      4: { cellWidth: 75 },
      5: { cellWidth: 90 },
      6: { cellWidth: 140 },
      7: { cellWidth: 200 },
    },
    didDrawPage: () => {
      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      const pageSize = doc.internal.pageSize;
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Página ${pageCount}  ·  Documento operacional — uso interno`,
        40,
        pageSize.getHeight() - 20,
      );
    },
  });

  const safe = expedicaoNome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  doc.save(`ficha-guia-${safe}.pdf`);
}
