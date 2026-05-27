import { useRouterState } from "@tanstack/react-router";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "@/lib/utils";

export function WhatsappFloat() {
  // Em /reserva/* o botão flutuante pode atrapalhar o form em mobile — escondemos lá.
  const path = useRouterState({ select: (s) => s.location.pathname });
  const hide = path.startsWith("/reserva/");
  if (hide) return null;

  return (
    <a
      href={buildContactWhatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className={cn(
        "fixed z-40 inline-flex items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant transition-transform hover:scale-105",
        "bottom-5 right-5 h-14 w-14 md:bottom-8 md:right-8 md:h-16 md:w-16",
      )}
    >
      <WhatsAppIcon className="h-7 w-7 md:h-8 md:w-8" />
    </a>
  );
}
