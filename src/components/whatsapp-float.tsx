import { buildContactWhatsappUrl } from "@/lib/whatsapp";

export function WhatsappFloat() {
  return (
    <a
      href={buildContactWhatsappUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elegant transition-transform hover:scale-105 md:bottom-8 md:right-8 md:h-16 md:w-16"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 md:h-8 md:w-8" fill="currentColor" aria-hidden>
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.997 2.722.997.36 0 .684-.04 1.022-.116.628-.144 1.7-.708 1.945-1.336.115-.288.115-.547.073-.79-.05-.227-.6-.448-1.026-.65zm-2.99 7.355h-.012c-1.953 0-3.85-.53-5.515-1.515l-.395-.235-4.085 1.07 1.09-3.98-.26-.41a10.92 10.92 0 0 1-1.665-5.785c0-6.04 4.92-10.96 10.96-10.96 2.93 0 5.685 1.143 7.755 3.214 2.07 2.072 3.21 4.825 3.21 7.755-.005 6.04-4.925 10.96-10.96 10.96z"/>
      </svg>
    </a>
  );
}
