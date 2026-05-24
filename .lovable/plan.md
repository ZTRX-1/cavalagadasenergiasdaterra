## Auditoria dos PDFs vs banco de dados

| PDF | No banco? | Ação |
|---|---|---|
| Canastra 04–07 jun (R$ 4.900) | sim (data já existe) | preço específico desta data |
| Canastra 11–14 jun (R$ 3.900) | sim (data já existe) | preço específico desta data (mais barato!) |
| Mantiqueira 15–19 jul (R$ 4.200 PIX / R$ 4.600 cartão) | sim | atualizar copy + roteiro completo |
| Peru Vale do Colca 04–07 ago (USD 1.600) | sim | atualizar roteiro + mostrar valor em BRL |
| Berço do Mangalarga 19–23 ago (R$ 5.200) | sim | atualizar copy/roteiro |
| Jericoacoara 15–18 out (R$ 5.800 PIX / R$ 6.400 cartão) | sim | atualizar copy/roteiro |
| Patagônia 15–19 jan/2027 (USD 2.350) | sim | atualizar copy + BRL |
| **Caminho de Santiago 01–07 set (€ 3.335)** | **NÃO** | **criar expedição + data nova** |

## Mudanças a fazer

### 1. Banco de dados (1 migração + 1 inserts)
- **Migração**: adicionar `preco_pix numeric` e `preco_cartao numeric` (nulláveis) na tabela `datas` — para Canastra ter preços diferentes entre as duas edições, e para Mantiqueira/Jeri mostrarem PIX vs cartão.
- **Inserts/updates**:
  - `UPDATE expedicoes` para cada expedição: `descricao_curta`, `descricao_longa`, `roteiro` (jsonb dia-a-dia conforme PDF), `inclui` (jsonb), `requisitos` (jsonb), `duracao`, `regiao`.
  - `UPDATE datas` Canastra 04–07 → `preco_pix=4900, preco_cartao=5200`; Canastra 11–14 → `preco_pix=3900, preco_cartao=4400`.
  - `INSERT` nova expedição **Caminho de Santiago** (slug `caminho-de-santiago`, marca `cavalgadas`, pais `espanha`, moeda `EUR`, preço 3335) + `INSERT` data 01–07 set/2026.

### 2. Conversão de moeda (USD/EUR → BRL)
- Adicionar helper `formatPriceWithBRL(valor, moeda)` em `src/lib/format.ts` com taxas estáticas (`USD_BRL = 5.50`, `EUR_BRL = 6.00`, constantes editáveis) e label "≈ R$ X (cotação turismo)".
- Aplicar em `ExpedicaoCard`, `DataCard`, página de detalhe e reserva.

### 3. Hero e header
- Trocar texto eyebrow `"Energias da Terra · Expedições imersivas"` por `"Cavalgadas Energias da Terra"` (nome correto da marca).
- Trocar imagem hero da home: usar foto real de cavaleiro/cavalo (ex.: `canastra/02.jpg` ou `mantiqueira/05.jpg`) — escolho a com melhor enquadramento cinematográfico após preview.

### 4. Página da expedição Caminho de Santiago
- Sem fotos reais ainda → usar fotos genéricas de Mantiqueira/Canastra como placeholder + aviso interno (você pode mandar fotos da Espanha depois).
- Card e detalhe seguem mesmo padrão das demais.

### 5. Limpeza de hifens/em-dashes
- Substituir `" — "` e `" – "` por vírgulas/pontos onde aparecem como separadores estilísticos em todas as rotas (`src/routes/*.tsx`) e componentes.
- Manter hifens legítimos (Mangalarga-Marchador, etc.).

### 6. "Quem somos" / Manifesto
- Atualizar bloco manifesto da home + texto da página `marcas/cavalgadas.tsx` para refletir o tom dos PDFs (manada própria Mangalarga, curadoria cinematográfica, grupos reduzidos, Brasil + Espanha + Peru + Patagônia).

### 7. Refino editorial das páginas de detalhe
- Onde o PDF traz roteiro dia-a-dia (Canastra, Mantiqueira, Peru, Patagônia, Berço, Santiago), garantir que o componente `ExpedicaoDetalhe` renderize todos os dias corretamente a partir do `roteiro` jsonb.

## Ordem de execução
1. Migração `datas.preco_pix/preco_cartao` (aguarda aprovação).
2. Inserts/updates dos 6 UPDATEs + 1 INSERT expedição + 1 INSERT data.
3. Código: helper de moeda, hero, header, copy, limpeza de hifens.
4. QA visual nas páginas /, /expedicoes, /expedicoes/$slug e /datas.

## Pendências / suposições
- **Taxas de câmbio estáticas** (USD 5,50 / EUR 6,00). Se preferir cotação ao vivo, posso adicionar fetch via API depois.
- **Fotos do Caminho de Santiago**: usarei placeholders da galeria existente até você enviar fotos reais.
- **Canastra com 2 preços**: o site exibirá o preço de cada data individualmente (correto) e o card geral mostrará "a partir de R$ 3.900".
