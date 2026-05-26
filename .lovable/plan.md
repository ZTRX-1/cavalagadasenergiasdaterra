## 1. Página Contato — novo texto de apresentação

`src/routes/contato.tsx`, parágrafo logo abaixo do "Vamos conversar." — substituir o texto atual por:

> Atendemos pelo WhatsApp e Instagram. Nossa equipe está à disposição para esclarecer dúvidas, apresentar roteiros e auxiliar em sua reserva.

(Mantém a frase de tempo de resposta? **Será removida**, pois você pediu apenas esse texto. Se quiser preservar a frase "em geral respondemos em menos de 2 horas", me avise.)

## 2. Correção de dados das expedições (banco `datas` + `expedicoes`)

Migration/UPDATEs no Supabase:

- **Serra da Canastra 04–07/06/2026** → `preco_pix = 4900`, `preco_cartao = 5200` (estava 3.900/4.400).
- **Peru, Vale do Colca** → garantir `expedicoes.moeda = 'USD'`.
- **Patagônia Gaúcha** (ambas as datas de janeiro/2027) → garantir `expedicoes.moeda = 'USD'`.
- **Caminho de Santiago a Cavalo** → garantir `expedicoes.moeda = 'EUR'`.
- **Remover todas as tags "poucas vagas"**:
  - `UPDATE datas SET status = 'disponivel' WHERE status = 'poucas_vagas'` (afeta Mantiqueira 15–19/07 e Peru 04–07/08).
  - `data-card.tsx`: remover a entrada `poucas_vagas` dos mapas de label/cor para que nunca renderize mais, mesmo se reaparecer no banco.
- Sincronizar `src/lib/expedicoes-static.ts` (fallback) com os mesmos valores: Canastra 4–7/jun 4.900/5.200 e remover `"status": "poucas_vagas"` das duas entradas.

## 3. Página de detalhes da expedição — quadro "Condições de pagamento"

`src/routes/expedicoes.$slug.tsx`, aside (`md:col-span-5`), card "Condições de pagamento":

Reorganizar para:

```text
[eyebrow] Condições de pagamento
[valor grande]  A partir de R$ 4.900    ← novo, em destaque (formatPriceWithBRL)
  • À vista no Pix/transferência
  • Cartão de crédito em até 6x sem juros, via link de pagamento seguro
  • Parcelamento via Pix (consulte nossa equipe para conhecer as opções)
[linha única, discreta, no rodapé do card]  Valores por pessoa em acomodação dupla.
```

- Remover a linha "Valores por pessoa em acomodação dupla" do topo (logo abaixo do eyebrow).
- Adicionar logo abaixo do eyebrow o preço em destaque, usando `formatPriceWithBRL(expedicao.preco, expedicao.moeda)` (mesma fonte que o hero — assim Peru aparece "US$ 1.600 (≈ R$ 8.800)", Caminho de Santiago "€ 3.335 (≈ R$ 20.010)", etc.).
- No rodapé do card, em uma única linha pequena (`text-xs text-muted-foreground`), exibir: *"Valores por pessoa em acomodação dupla."*
- Padrão aplicado a **todas** as expedições (o componente é único, então a mudança propaga automaticamente).

## Detalhes técnicos

- Atualizações de dados em tabelas existentes (`datas`, `expedicoes`) usam a ferramenta de insert/update do Supabase, não migration (apenas DML).
- `data-card.tsx`: além de remover do mapa, manter compatibilidade caso o status venha do banco — apenas não renderiza badge para "poucas_vagas".
- Nenhuma alteração de identidade visual, tipografia ou layout além do quadro descrito.
- Nenhum impacto em rotas, loaders ou tipos.