## Ajustes pontuais — site público

### 1. Header / Logo (`src/components/site-header.tsx`)
- Aumentar tamanho do logo (de `h-11/h-12` para ~`h-14 md:h-16`) e do container circular.
- Aumentar gap entre logo e textos (`gap-3.5` → `gap-5`) e aumentar `leading`/espaçamento vertical entre "Cavalgadas" e "Energias da Terra" para evitar sobreposição visual.
- Ajustar altura do header se necessário para acomodar logo maior.

### 2. Card de marcas no mobile ("Três caminhos, uma mesma essência")
- Em `src/components/marca-cross-nav.tsx` (e/ou onde os cards das marcas são renderizados no mobile, possivelmente `index.tsx` seção marcas), forçar "Cavalgadas Energias da Terra" em uma única linha (`whitespace-nowrap`, ajustar font-size responsivo).

### 3. Cards de "Próximas Datas" (Peru e Mantiqueira)
- Em `src/routes/index.tsx` (seção próximas datas) e/ou `src/lib/expedicoes-static.ts`:
  - Padronizar visual do card do Peru igual ao da Mantiqueira.
  - Trocar "Expedição na Mantiqueira" → "Serra da Mantiqueira" em todas as ocorrências do site.
  - Peru / Vale do Colca: badge "poucas vagas" (já está `poucas_vagas` no static, garantir que o componente renderiza esse rótulo).

### 4. Reserva — botão Voltar (`src/routes/reserva.$slug.tsx`)
- Etapa 1: botão "Voltar" → navega para `/expedicoes` (ou menu/home).
- Etapa 2+: botão "Voltar" → volta para etapa anterior (`step - 1`).

### 5. Footer (`src/components/site-footer.tsx` + i18n PT/EN/ES)
- Substituir tagline pelo novo texto:
  > "Expedições a cavalo pelo Brasil e pelo mundo. As melhores histórias da sua vida ainda estão esperando por você. Pequenos grupos, cavalos selecionados e roteiros autorais criados por quem vive a paixão pelos cavalos e acredita que algumas jornadas têm o poder de nos transformar para sempre."
- "Base de Operações": endereço → "Serra da Mantiqueira, Maria da Fé, MG".

### 6. FAQ (`src/routes/index.tsx`)
- "Como funciona a hospedagem?" → novo texto:
  > "Trabalhamos com pousadas selecionadas de três a quatro estrelas, conforme o roteiro e a região, todas escolhidas por nossa curadoria, garantindo conforto, autenticidade e qualidade em cada experiência."
- Remover pergunta "E em caso de chuva?".

### 7. Marca Canastra
- Em `src/routes/marcas.canastra-a-cavalo.tsx`:
  - Trocar "Expedições a cavalo pela Serra da Canastra" → "Explore a Serra da Canastra a cavalo por rotas cuidadosamente selecionadas".
  - Substituir bloco "Onde tudo começa, nossa casa..." pelo novo texto fornecido sobre Canastra ser ponto de origem e parceiros locais.

### 8. Terminologia global
- Substituir "cavaleiras" → "amazonas" em todo `src/**` e `src/i18n/locales/**`.
- Substituir "Travessias Premium" / "travessias premium" → "Expedição a cavalo" em todas as ocorrências restantes.
- Reforçar "Expedição na Mantiqueira" → "Serra da Mantiqueira" em qualquer arquivo remanescente.

### 9. Elas na Sela (`src/routes/marcas.elas-na-sela.tsx` + `src/lib/expedicao-images.ts`)
- Auditar imagens usadas; remover qualquer foto que contenha homens montando cavalo, mantendo apenas mulheres. Substituir slots por imagens femininas já existentes no acervo.

### 10. Reserva — quantidade padrão (`src/routes/reserva.$slug.tsx`)
- Confirmar default = 1 participante (já foi feito anteriormente; revalidar). Manter opções casal/grupo intactas.

### 11. Nova expedição Patagônia
- Em `src/lib/expedicoes-static.ts`: adicionar expedição "Patagônia" com tag `novo-percurso`.
- Datas:
  - 15–19 de janeiro de 2027 (tag "Novo percurso").
  - 24–28 de janeiro de 2027 (tag "Novo percurso").
- Adicionar entrada em `src/lib/expedicao-images.ts` (galeria placeholder vazia ou reaproveitar) e em `src/lib/expedicao-slugs.ts` se necessário.
- Garantir que aparece em `/expedicoes`, `/datas` e seções da home.

### Arquivos previstos
- `src/components/site-header.tsx`
- `src/components/site-footer.tsx`
- `src/components/marca-cross-nav.tsx`
- `src/routes/index.tsx`
- `src/routes/reserva.$slug.tsx`
- `src/routes/marcas.canastra-a-cavalo.tsx`
- `src/routes/marcas.elas-na-sela.tsx`
- `src/lib/expedicoes-static.ts`
- `src/lib/expedicao-images.ts`
- `src/lib/expedicao-slugs.ts` (se necessário p/ Patagônia)
- `src/i18n/locales/pt|en|es/common.json`

### Fora de escopo
- Sem mudanças de backend, schema ou painel admin.
- Sem nova arquitetura visual — apenas refinamento.