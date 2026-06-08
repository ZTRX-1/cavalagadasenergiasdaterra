import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Users, Mail } from "lucide-react";

export const Route = createFileRoute("/admin/_authenticated/equipe")({
  component: EquipePage,
});

function EquipePage() {
  const { data: membros, isLoading } = useQuery({
    queryKey: ["admin", "equipe"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, nome, cargo, bio, avatar_url, especialidades, ultimo_login");
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Operação"
        title="Equipe"
        description="Conecte-se com os membros da operação."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-[color:var(--admin-petroleo)] animate-pulse" />
            ))
          : membros?.map((m) => (
              <div
                key={m.user_id}
                className="group relative overflow-hidden rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] p-6 transition-all hover:border-[color:var(--admin-dourado)]/40"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-[color:var(--admin-petroleo)] ring-1 ring-[color:var(--admin-borda-strong)]">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.nome || ""} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xl font-medium text-[color:var(--admin-dourado)]">
                        {m.nome?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[color:var(--admin-cinza-1)] truncate">{m.nome}</h3>
                    <p className="text-xs text-[color:var(--admin-dourado)] uppercase tracking-wider mt-0.5">{m.cargo}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                      <span className="text-[10px] text-[color:var(--admin-cinza-3)]">Online</span>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-xs text-[color:var(--admin-cinza-2)] line-clamp-2 leading-relaxed">{m.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.especialidades?.slice(0, 3).map((esp, i) => (
                    <span key={i} className="px-2 py-1 rounded-md bg-[color:var(--admin-petroleo)] text-[9px] text-[color:var(--admin-cinza-2)] uppercase">
                      {esp}
                    </span>
                  ))}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
