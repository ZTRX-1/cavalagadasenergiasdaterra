-- Atualiza edições da Canastra e Mantiqueira
-- Aplicada no Lovable Cloud pela extensão, com autorização do usuário.
-- Registrada por Gecko AI — Extensão Livre em 2026-10-30T22:31:34.778Z

UPDATE public.expedicoes
SET
  nome = 'Serra da Canastra — Entre Rios, Montanhas e Mirantes',
  duracao = '4 dias / 3 noites',
  ativo = true,
  updated_at = now()
WHERE id = '2acf15bd-5f15-43a5-b441-3e6ae7b11355'::uuid;

UPDATE public.datas
SET
  data_inicio = '2027-03-25',
  data_fim = '2027-03-28',
  status = 'disponivel',
  tag = 'Edição Especial de Páscoa',
  updated_at = now()
WHERE id = '70793002-39a7-444c-a424-9a42ea47c6ce'::uuid;

UPDATE public.expedicoes
SET
  nome = 'Serra da Mantiqueira — Elas na Sela',
  marca = 'elas-na-sela',
  duracao = '4 dias / 3 noites',
  ativo = true,
  updated_at = now()
WHERE id = '9dd91b11-3ce3-4368-ab3c-4d441da8d34d'::uuid;

UPDATE public.datas
SET
  tag = 'Elas na Sela',
  status = 'disponivel',
  updated_at = now()
WHERE id = '6539a1f4-9509-474a-9b3c-f98a54c69731'::uuid;
