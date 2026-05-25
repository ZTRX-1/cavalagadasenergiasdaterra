import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const Route = createFileRoute("/admin/_authenticated/participantes")({
  component: () => (
    <AdminPlaceholder
      icon={Users}
      titulo="Participantes"
      descricao="Cadastro completo de cavaleiros e cavaleiras — documentos, ficha médica, alergias, restrições e histórico de expedições."
    />
  ),
});
