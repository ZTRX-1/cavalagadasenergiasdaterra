import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

export type TrackingData = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  primeira_pagina_visitada?: string;
  ultima_pagina_visitada?: string;
  dispositivo?: string;
  quantidade_visitas?: number;
};

const STORAGE_KEY = "cet_tracking_data";

export function useTracking() {
  const location = useLocation();

  useEffect(() => {
    // 1. Obter dados atuais do storage
    let data: TrackingData = {};
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) data = JSON.parse(stored);
    } catch (e) {
      console.error("Erro ao ler tracking data:", e);
    }

    // 2. Capturar UTMs da URL atual
    const searchParams = new URLSearchParams(window.location.search);
    const utms = {
      utm_source: searchParams.get("utm_source"),
      utm_medium: searchParams.get("utm_medium"),
      utm_campaign: searchParams.get("utm_campaign"),
      utm_term: searchParams.get("utm_term"),
      utm_content: searchParams.get("utm_content"),
    };

    // Atualizar UTMs se presentes (prioriza os mais recentes se o usuário entrar de novo por campanha)
    Object.entries(utms).forEach(([key, value]) => {
      if (value) data[key as keyof TrackingData] = value as any;
    });

    // 3. Páginas visitadas
    const currentPath = location.pathname;
    if (!data.primeira_pagina_visitada) {
      data.primeira_pagina_visitada = currentPath;
    }
    data.ultima_pagina_visitada = currentPath;

    // 4. Contador de visitas (baseado em sessões simples ou apenas navegação)
    // Para simplificar, incrementamos se a última visita foi há mais de 30 min ou se não existe
    const now = Date.now();
    const lastVisitKey = "cet_last_visit_time";
    const lastVisit = localStorage.getItem(lastVisitKey);
    
    if (!lastVisit || now - parseInt(lastVisit) > 30 * 60 * 1000) {
      data.quantidade_visitas = (data.quantidade_visitas || 0) + 1;
      localStorage.setItem(lastVisitKey, now.toString());
    }

    // 5. Dispositivo
    if (!data.dispositivo) {
      const ua = navigator.userAgent;
      if (/tablet|ipad|playbook|silk/i.test(ua)) {
        data.dispositivo = "Tablet";
      } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
        data.dispositivo = "Mobile";
      } else {
        data.dispositivo = "Desktop";
      }
    }

    // Gravar de volta
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [location.pathname]);

  return {
    getTrackingData: (): TrackingData => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
      } catch {
        return {};
      }
    }
  };
}
