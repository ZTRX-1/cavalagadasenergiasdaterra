/**
 * Regras Financeiras Oficiais da Cavalgadas Energias da Terra
 * Centraliza os cálculos para garantir consistência em todo o sistema.
 */

import { ReservaRow } from "./api";
import { Despesa } from "./financeiro-api";

export interface FinancialStats {
  receitaPrevista: number;
  receitaConfirmada: number;
  receitaPendente: number;
  lucroLiquido: number;
  margem: number;
}

/**
 * Regra: Receita Prevista = Todas as reservas ativas (não canceladas)
 * Consideramos o valor_total da reserva.
 */
export function calculateReceitaPrevista(reservas: ReservaRow[]): number {
  return reservas
    .filter(r => r.status_operacional !== "cancelada" && r.status_operacional !== "no_show")
    .reduce((acc, r) => acc + Number(r.valor_total ?? 0), 0);
}

/**
 * Regra: Receita Confirmada = reservas com pagamento confirmado
 */
export function calculateReceitaConfirmada(reservas: ReservaRow[]): number {
  return reservas
    .filter(r => r.status_pagamento === "confirmado")
    .reduce((acc, r) => acc + Number(r.valor_total ?? 0), 0);
}

/**
 * Regra: Receita Pendente = Prevista - Confirmada
 */
export function calculateReceitaPendente(prevista: number, confirmada: number): number {
  return Math.max(0, prevista - confirmada);
}

/**
 * Regra: Lucro Líquido = Receita Confirmada - Despesas Realizadas
 */
export function calculateLucroLiquido(receitaConfirmada: number, despesas: Despesa[]): number {
  const totalDespesas = despesas.reduce((acc, d) => acc + Number(d.valor ?? 0), 0);
  return receitaConfirmada - totalDespesas;
}

/**
 * Regra: Margem = Lucro Líquido / Receita Confirmada
 */
export function calculateMargem(lucroLiquido: number, receitaConfirmada: number): number {
  if (receitaConfirmada <= 0) return 0;
  return (lucroLiquido / receitaConfirmada) * 100;
}

/**
 * Consolida todas as métricas financeiras
 */
export function getFinancialSummary(reservas: ReservaRow[], despesas: Despesa[]): FinancialStats {
  const receitaPrevista = calculateReceitaPrevista(reservas);
  const receitaConfirmada = calculateReceitaConfirmada(reservas);
  const receitaPendente = calculateReceitaPendente(receitaPrevista, receitaConfirmada);
  const lucroLiquido = calculateLucroLiquido(receitaConfirmada, despesas);
  const margem = calculateMargem(lucroLiquido, receitaConfirmada);

  return {
    receitaPrevista,
    receitaConfirmada,
    receitaPendente,
    lucroLiquido,
    margem
  };
}
