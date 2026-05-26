## Problema

A data **Canastra 30/10–02/11/2026** (e outros preços auditados) só foi atualizada no arquivo estático `expedicoes-static.ts`. As funções `listExpedicoes` / `listProximasDatas` leem **primeiro do banco** e só caem para o estático quando o banco falha. Como o banco respondeu normalmente (só sem essa data), o site mostra a versão antiga.

Verifiquei no banco: existem só 2 datas da Canastra (junho), além de preços desatualizados em Canastra junho 4-7, Peru, Berço e Patagônia.

## Correção

Migration de sincronização do banco com os valores auditados, mexendo apenas em `datas` (sem tocar layout/código):

1. **INSERT** Canastra 30/10–02/11/2026 — PIX R$ 4.900 / Cartão R$ 5.200, 14 vagas, status `disponivel`.
2. **UPDATE** Canastra 04–07/06/2026 → PIX R$ 3.900 / Cartão R$ 4.400 (estava R$ 4.900/5.200).
3. **UPDATE** Peru 04–07/08/2026 → `preco_pix` USD 1.600.
4. **UPDATE** Berço 19–23/08/2026 → `preco_pix` R$ 5.200.
5. **UPDATE** Patagônia 15–19/01 e 24–28/01/2027 → `preco_pix` USD 2.350, `tag` "Novo percurso".

Depois validar via `psql` que o catálogo, próximas datas e página da Canastra mostram a nova data e os preços corretos.

Nenhum arquivo de frontend será alterado — o estático já está correto e o banco passa a refletir o mesmo.