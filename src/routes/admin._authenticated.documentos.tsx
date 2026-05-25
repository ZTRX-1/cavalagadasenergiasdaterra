import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const Route = createFileRoute("/admin/_authenticated/documentos")({
  component: () => (
    <AdminPlaceholder
      icon={FileText}
      titulo="Documentos"
      descricao="Contratos, termos de responsabilidade, fichas médicas e qualquer documento vinculado a expedições ou participantes."
    />
  ),
});
