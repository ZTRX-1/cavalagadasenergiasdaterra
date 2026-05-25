import { createFileRoute } from "@tanstack/react-router";
import { Image } from "lucide-react";
import { AdminPlaceholder } from "@/components/admin/admin-placeholder";

export const Route = createFileRoute("/admin/_authenticated/midia")({
  component: () => (
    <AdminPlaceholder
      icon={Image}
      titulo="Mídia"
      descricao="Biblioteca premium de fotos e vídeos por expedição — upload, organização, capas, ordenação editorial."
    />
  ),
});
