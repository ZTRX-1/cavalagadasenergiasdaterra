import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface FluxoPoint {
  dia: string;
  entrada: number;
  saida: number;
}

interface Props {
  data: FluxoPoint[];
  fmtBRL: (v: number) => string;
}

/**
 * Gráfico de fluxo de caixa diário.
 * Isolado do `routes/admin.financeiro.tsx` para permitir `React.lazy` e
 * tirar o recharts (~300KB) do bundle inicial do admin.
 */
export default function FluxoCaixaChart({ data, fmtBRL }: Props) {
  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.7 0.14 150)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="oklch(0.7 0.14 150)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.65 0.16 25)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="oklch(0.65 0.16 25)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="dia" stroke="oklch(0.5 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="oklch(0.5 0.012 240)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: "oklch(0.13 0.012 240)", border: "1px solid oklch(0.28 0.018 220 / 0.6)", borderRadius: 8, fontSize: 12, color: "oklch(0.95 0.005 240)" }}
            formatter={(v: number) => fmtBRL(v)}
          />
          <Area type="monotone" dataKey="entrada" name="Entradas" stroke="oklch(0.7 0.14 150)" strokeWidth={2} fill="url(#gIn)" />
          <Area type="monotone" dataKey="saida" name="Saídas" stroke="oklch(0.65 0.16 25)" strokeWidth={2} fill="url(#gOut)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
