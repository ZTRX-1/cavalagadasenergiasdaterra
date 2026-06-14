const MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const MONTHS_SHORT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateRange(inicio: string, fim: string): string {
  const a = parseDate(inicio);
  const b = parseDate(fim);
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const sameYear = a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${a.getDate()} a ${b.getDate()} de ${MONTHS[a.getMonth()]} de ${a.getFullYear()}`;
  }
  if (sameYear) {
    return `${a.getDate()} de ${MONTHS[a.getMonth()]} a ${b.getDate()} de ${MONTHS[b.getMonth()]} de ${a.getFullYear()}`;
  }
  return `${a.getDate()} de ${MONTHS[a.getMonth()]} de ${a.getFullYear()} a ${b.getDate()} de ${MONTHS[b.getMonth()]} de ${b.getFullYear()}`;
}

export function formatMonthYear(iso: string): string {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayShort(iso: string): { day: string; month: string } {
  const d = parseDate(iso);
  return { day: String(d.getDate()).padStart(2, "0"), month: MONTHS_SHORT[d.getMonth()] };
}

export function formatPrice(n: number, moeda: string = "BRL"): string {
  if (moeda === "USD") {
    return `US$ ${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (moeda === "EUR") {
    return `€ ${n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// IMPORTANTE: o sistema NÃO realiza conversão entre moedas em nenhuma camada.
// BRL, USD e EUR são tratados como moedas independentes. Toda agregação
// financeira deve respeitar a moeda original da operação.


