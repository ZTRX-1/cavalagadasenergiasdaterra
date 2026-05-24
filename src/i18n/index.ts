import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import pt from "./locales/pt/common.json";
import en from "./locales/en/common.json";
import es from "./locales/es/common.json";

const STORAGE_KEY = "i18nextLng";

function detectInitialLang(): "pt" | "en" | "es" {
  if (typeof window === "undefined") return "pt";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "pt" || stored === "en" || stored === "es") return stored;
  const nav = window.navigator.language?.slice(0, 2).toLowerCase();
  if (nav === "en") return "en";
  if (nav === "es") return "es";
  return "pt";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      pt: { common: pt },
      en: { common: en },
      es: { common: es },
    },
    lng: detectInitialLang(),
    fallbackLng: "pt",
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  if (typeof window !== "undefined") {
    i18n.on("languageChanged", (lng) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, lng);
        document.documentElement.lang =
          lng === "en" ? "en" : lng === "es" ? "es" : "pt-BR";
      } catch {
        /* noop */
      }
    });
  }
}

export default i18n;
