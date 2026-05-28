
-- Nova expedição Canastra · Elas na Sela
INSERT INTO public.expedicoes (
  id, slug, nome, subtitulo, descricao_curta, descricao_longa,
  duracao, nivel, preco, moeda, marca, pais, regiao, estado, cidade,
  imagem_url, galeria, inclui, requisitos, roteiro,
  ativo, ordem, status, vagas_total_padrao, parcelamento_max, tags
) VALUES (
  'e9a1d4f2-7c84-4d4a-9b2a-1f7c8a5b3e21',
  'canastra-elas-na-sela',
  'Canastra a Cavalo · Elas na Sela',
  'Edição especial · exclusiva para mulheres',
  'Um final de semana criado para mulheres que desejam viver a Serra da Canastra de forma leve, intensa e inesquecível.',
  E'Uma edição especial da Canastra a Cavalo, pensada exclusivamente para mulheres que querem viver a Serra da Canastra em outro ritmo — entre cavalos, natureza, rios e silêncio.\n\nTrês dias de cavalgada acolhedora pela Serra da Canastra, com paradas no Rio São Francisco, almoços ao ar livre, gastronomia mineira, música ao vivo e a companhia de uma equipe inteiramente preparada para receber também quem nunca montou.\n\nMais do que uma expedição, é um encontro: de mulheres com cavalos, com a natureza e com elas mesmas. Grupos pequenos, hospedagem confortável e curadoria delicada para que cada participante se sinta segura, livre e em casa.',
  '3 dias / 2 noites',
  'Iniciante',
  3200.00,
  'BRL',
  'elas-na-sela',
  'brasil',
  'Vargem Bonita, MG',
  'MG',
  'Vargem Bonita',
  'expedicao-canastra',
  '["expedicao-canastra"]'::jsonb,
  '[
    "Hospedagem em pousada selecionada, acomodação dupla",
    "Café da manhã todos os dias",
    "Jantar de boas-vindas",
    "Almoço durante a cavalgada",
    "Cavalos Mangalarga Marchador próprios e dóceis",
    "Material completo de montaria (selas, cabeçadas, mantas)",
    "Guias experientes e suporte dedicado para iniciantes",
    "Carro de apoio durante toda a expedição",
    "Música ao vivo em um dos jantares",
    "Seguro aventura"
  ]'::jsonb,
  '[
    "Experiência exclusiva para mulheres",
    "Perfeita para iniciantes — não é necessária experiência prévia em montaria",
    "Grupos pequenos para uma experiência mais exclusiva, segura e personalizada",
    "Acomodação dupla compartilhada; quem vem sozinha pode dividir o quarto com outra participante",
    "Acomodação single com tarifa adicional de 40%",
    "Bebidas não incluídas"
  ]'::jsonb,
  '[
    {"dia":"Dia 1","titulo":"Chegada e acolhimento","desc":"Recepção na pousada a partir da tarde, com tempo para descansar e conhecer as outras participantes. Jantar de boas-vindas em clima leve, apresentação da equipe, dos cavalos e do que vem pela frente."},
    {"dia":"Dia 2","titulo":"Cavalgada pela Serra da Canastra","desc":"Café da manhã reforçado e saída para a cavalgada principal. Trilhas tranquilas pelos campos da Canastra, parada para almoço ao ar livre, banho no Rio São Francisco e fim de tarde de volta à pousada. Jantar mineiro com música ao vivo."},
    {"dia":"Dia 3","titulo":"Despedida com gosto de quero mais","desc":"Café da manhã, última cavalgada curta pelas redondezas e despedida no início da tarde — com a sensação de já querer marcar a próxima."}
  ]'::jsonb,
  true,
  2,
  'publicado',
  8,
  6,
  ARRAY['elas-na-sela','exclusiva-mulheres','iniciantes']
)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  subtitulo = EXCLUDED.subtitulo,
  descricao_curta = EXCLUDED.descricao_curta,
  descricao_longa = EXCLUDED.descricao_longa,
  duracao = EXCLUDED.duracao,
  nivel = EXCLUDED.nivel,
  preco = EXCLUDED.preco,
  marca = EXCLUDED.marca,
  regiao = EXCLUDED.regiao,
  imagem_url = EXCLUDED.imagem_url,
  galeria = EXCLUDED.galeria,
  inclui = EXCLUDED.inclui,
  requisitos = EXCLUDED.requisitos,
  roteiro = EXCLUDED.roteiro,
  ativo = true,
  status = 'publicado',
  ordem = EXCLUDED.ordem,
  tags = EXCLUDED.tags;

-- Data oficial da edição especial
INSERT INTO public.datas (
  id, expedicao_id, data_inicio, data_fim,
  vagas_total, vagas_disponiveis, status,
  preco_pix, preco_cartao, tag
) VALUES (
  'a3f9b0c2-4d18-4e6f-8b91-2a55c7d6e042',
  'e9a1d4f2-7c84-4d4a-9b2a-1f7c8a5b3e21',
  '2026-09-25', '2026-09-27',
  8, 8, 'disponivel',
  3200, 3520, 'Exclusiva para mulheres'
)
ON CONFLICT (id) DO UPDATE SET
  data_inicio = EXCLUDED.data_inicio,
  data_fim = EXCLUDED.data_fim,
  vagas_total = EXCLUDED.vagas_total,
  vagas_disponiveis = EXCLUDED.vagas_disponiveis,
  status = EXCLUDED.status,
  preco_pix = EXCLUDED.preco_pix,
  preco_cartao = EXCLUDED.preco_cartao,
  tag = EXCLUDED.tag;
