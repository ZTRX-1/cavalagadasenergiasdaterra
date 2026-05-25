import { createFileRoute } from "@tanstack/react-router";
import { Compass } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const Route = createFileRoute("/admin/_authenticated/expedicoes")({
  component: () => (
    <AdminPlaceholder
      icon={Compass}
      titulo="Expedições"
      descricao="Aqui você gerenciará todas as expedições — criar, editar, ativar datas, controlar vagas e galerias. Em desenvolvimento."
    />
  ),
});
