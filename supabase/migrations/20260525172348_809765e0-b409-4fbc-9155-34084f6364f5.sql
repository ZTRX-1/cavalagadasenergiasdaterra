
-- =========================================================
-- SEED: 7 expedições reais + 8 datas
-- Idempotente (ON CONFLICT DO NOTHING por slug / id)
-- =========================================================

INSERT INTO public.expedicoes (
  id, slug, nome, marca, pais, regiao, moeda, nivel, duracao, preco,
  descricao_curta, descricao_longa, inclui, requisitos, roteiro, galeria,
  status, ativo, ordem, vagas_total_padrao, parcelamento_max
) VALUES
(
  'c9e9f1dd-039d-4301-9181-ab26b30b9f2f', 'serra-da-canastra', 'Serra da Canastra',
  'canastra-a-cavalo', 'brasil', 'Vargem Bonita, MG', 'BRL', 'Intermediário', '4 dias / 3 noites', 3900,
  'Uma verdadeira travessia a cavalo pela Serra da Canastra, cruzando rios, montanhas e trilhas que poucos cavaleiros têm a oportunidade de conhecer.',
  E'Uma verdadeira travessia a cavalo pela Serra da Canastra, percorrendo trilhas entre montanhas, rios e cachoeiras, com nossa manada de Mangalarga Marchador de alta performance e equipe experiente acompanhando todo o percurso.\n\nVivemos momentos marcantes como a travessia do Rio São Francisco a cavalo, almoços especiais em meio à natureza e noites acolhedoras na pousada.\n\nMais do que uma cavalgada, esta é uma verdadeira travessia pela essência da Serra da Canastra.',
  '["Cavalos próprios Mangalarga Marchador","Material completo de montaria (selas, cabeçadas, mantas e alforjes)","Guias experientes","Carro de apoio","Café da manhã, almoço e jantar (exceto almoço do último dia)","Hospedagem em pousada padrão 4 estrelas, acomodação dupla","Seguro aventura"]'::jsonb,
  '["Experiência mínima em montaria recomendada","Bebidas não incluídas","Acomodação single com tarifa adicional de 40%","Quem vem sozinho pode dividir o quarto com outro participante"]'::jsonb,
  '[{"dia":"Dia 1","titulo":"Boas-vindas à travessia","desc":"Recepção na pousada a partir das 14h. Jantar de boas-vindas com coquetel, apresentação dos participantes e orientações iniciais."},{"dia":"Dia 2","titulo":"Primeira cavalgada","desc":"De 20 a 25 km por campos abertos, rios cristalinos e o Paredão da Canastra. Parada em queijaria artesanal, almoço à beira do rio e banho em cachoeira."},{"dia":"Dia 3","titulo":"O dia mais intenso","desc":"De 20 a 25 km por campos e morros. Almoço tropeiro em plena natureza e travessia a cavalo dentro do Rio São Francisco. Jantar com música ao vivo."},{"dia":"Dia 4","titulo":"Encerramento","desc":"Café da manhã especial de despedida, últimas fotos e check-out até as 12h."}]'::jsonb,
  '[]'::jsonb, 'publicado', true, 1, 14, 6
),
(
  '9dd91b11-3ce3-4368-ab3c-4d441da8d34d', 'mantiqueira-refugio', 'Expedição na Mantiqueira',
  'cavalgadas', 'brasil', 'Maria da Fé, MG', 'BRL', 'Iniciante a intermediário', '5 dias / 4 noites', 4200,
  'Imersão a cavalo entre montanhas, natureza e conexão. Para quem busca desacelerar, viver o presente e se reconectar.',
  E'Cinco dias no Refúgio Energias da Terra, no coração da Serra da Mantiqueira. Cavalgadas leves de adaptação, travessias mais longas, vivência na fazenda de azeite Monasto e piquenique ao pôr do sol.\n\nCavalos do nosso próprio criatório Mangalarga Marchador, hospedagem premium no refúgio e gastronomia regional cuidada.',
  '["Cavalos próprios Mangalarga Marchador e toda a estrutura de montaria","Guias experientes","Hospedagem no Refúgio Energias da Terra","Alimentação completa","Logística e transfers internos"]'::jsonb,
  '["Bebidas não incluídas","Deslocamento até a pousada não incluído","Crianças até 10 anos têm 20% de desconto; acima de 10 anos pagam valor integral"]'::jsonb,
  '[{"dia":"Dia 1","titulo":"Chegada","desc":"Check-in a partir das 14h. Recepção, acomodação, apresentação do programa e jantar de boas-vindas."},{"dia":"Dia 2","titulo":"Adaptação","desc":"Cavalgada leve de cerca de 10 km por trilhas da Mantiqueira, ritmo tranquilo para adaptação."},{"dia":"Dia 3","titulo":"Experiência Monasto","desc":"Cavalgada passando pelo centro de Maria da Fé até a fazenda de azeite Monasto. Almoço no local, piquenique ao pôr do sol e coquetel."},{"dia":"Dia 4","titulo":"Travessia","desc":"Cavalgada mais longa por novo percurso na serra, com paisagens amplas e marcantes."},{"dia":"Dia 5","titulo":"Encerramento","desc":"Café da manhã e check-out até as 12h."}]'::jsonb,
  '[]'::jsonb, 'publicado', true, 2, 12, 6
),
(
  'aa0ddccc-6b9a-4c84-99c7-69b722b8cd6f', 'berco-do-marchador', 'Berço do Mangalarga Marchador',
  'cavalgadas', 'brasil', 'Cruzília, MG', 'BRL', 'Intermediário', '5 dias / 4 noites', 5200,
  'Travessia a cavalo por Cruzília (MG), o berço da raça Mangalarga Marchador, visitando fazendas históricas que moldaram a genética do cavalo.',
  E'Cruzília, no sul de Minas Gerais, é reconhecida como o berço do cavalo Mangalarga Marchador. Entre chapadões, antigas fazendas e paisagens rurais que guardam séculos de tradição, nasceu uma das raças de sela mais admiradas do Brasil.\n\nEsta travessia é uma jornada pelas origens do Marchador, com cinco dias de imersão na cultura equestre mineira e três dias de cavalgadas guiadas por paisagens marcantes da região.',
  '["Cavalos Mangalarga Marchador preparados","Selas e equipamentos de montaria","Guias experientes durante toda a travessia","Transfer Cruzília até Fazenda Angaí","Transporte logístico e apoio durante os percursos","Hospedagem durante toda a expedição","Café da manhã todos os dias","Almoços nos dias de cavalgada e jantares conforme programação","Visita ao Museu do Mangalarga Marchador"]'::jsonb,
  '["Distância média de 15 a 25 km por dia","Bebidas durante refeições não incluídas","Transporte até Cruzília não incluído","Vagas limitadas a 12 participantes"]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, 'publicado', true, 3, 12, 6
),
(
  '4f698388-a443-406c-a76d-a409fb794fa1', 'jericoacoara', 'Jericoacoara, Dunas e Lagoas',
  'cavalgadas', 'brasil', 'Jericoacoara, CE', 'BRL', 'Intermediário', '4 dias / 3 noites', 5800,
  'Imersão equestre rara em Jericoacoara, com cavalgadas entre lagoas cristalinas, dunas douradas e o mar do Nordeste.',
  E'Uma experiência equestre desenhada para grupo extremamente reduzido. Durante quatro dias, você vive Jericoacoara de uma forma reservada a poucos: a cavalo, em paisagens intocadas, com ritmo desacelerado e atenção individual.\n\nCavalos criteriosamente selecionados entre mestiços nordestinos e Mangalarga Marchador, guias bilíngues especializados e hospedagem de alto padrão.',
  '["Hospedagem de quinta a domingo em acomodação dupla de alto padrão","Recepção de boas-vindas com vinhos e pizza","Cafés da manhã na sexta, sábado e domingo","Jantares na sexta-feira e sábado","Cavalos selecionados conforme o perfil do cavaleiro","Guias bilíngues especializados","Seguro aventura","Kit exclusivo da expedição (boné e camiseta personalizados)"]'::jsonb,
  '["Passagem aérea não incluída","Almoços e bebidas não incluídos (exceto cafés da manhã)","Transfer aeroporto até a pousada não incluído","Vagas extremamente limitadas, sem turmas extras"]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, 'publicado', true, 4, 8, 6
),
(
  '5b8124d0-20f1-416a-8dd9-3ab0b17a0f6b', 'peru-vale-do-colca', 'Peru, Vale do Colca',
  'cavalgadas', 'peru', 'Vale do Colca, Peru', 'USD', 'Intermediário', '4 dias / 3 noites', 1600,
  'Expedição a cavalo pelas paisagens místicas do Vale do Colca, com cânions profundos, cultura andina e o voo sagrado do condor.',
  E'Uma expedição inesquecível a cavalo pelas paisagens místicas do Vale do Colca, no Peru.\n\nMontanhas imponentes, cânions profundos, ruínas pré-incas e o voo sagrado do condor fazem parte dessa jornada de pura conexão com a natureza e com a história andina.',
  '["Transporte privativo durante os 4 dias","3 noites de hospedagem (2 no Miskiwasi e 1 no Colca Trek Lodge)","Alimentação completa (3 cafés, 3 almoços e 3 jantares)","Entradas turísticas (Cruz do Condor, Uyo Uyo, Termas de Puye)","Guia profissional em espanhol","Jantar especial com música instrumental ao vivo"]'::jsonb,
  '["Acomodação single com tarifa adicional de 40%","Pagamento via PIX em reais com conversão pelo dólar turismo do dia","25% no ato, saldo em parcelas iguais com quitação até 30 dias antes","Bebidas e extras pessoais não incluídos","Seguro viagem por conta do participante"]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, 'publicado', true, 5, 10, 4
),
(
  'b72305d1-223e-4835-b87b-ff97d3229429', 'patagonia-gaucha', 'Patagônia Gaúcha Experience',
  'cavalgadas', 'argentina', 'El Calafate e San Martín, Argentina', 'USD', 'Intermediário a avançado', '5 dias / 4 noites', 2350,
  'Uma coisa é cavalgar. Outra é cavalgar na Patagônia. Experiência autêntica entre estepes patagônicas, cordilheira nevada e cultura gaúcha real.',
  E'Uma experiência autêntica e exclusiva entre El Calafate e a região de San Martín. Cavalgadas pelas estepes patagônicas com cordilheira dos Andes ao fundo, doma tradicional gaúcha, trabalho com cães pastores, pesca de trutas e salmões em lagos glaciais e assado de cordeiro patagônico.\n\nGrupo reduzido para garantir exclusividade, segurança e conexão real com a experiência.',
  '["Transfers a partir de El Calafate","Hospedagem em base dupla","Refeições com chef local","Bebidas","Cavalgadas guiadas com cavalos crioulos e equipamentos","Vivência gaúcha (doma, cães pastores)","Pesca de trutas e salmões","Assado de cordeiro patagônico"]'::jsonb,
  '["Passagens aéreas e despesas pessoais não incluídas","Entrada de 15% no ato, saldo via PIX mediante contrato","Conversão baseada no dólar turismo do dia","Grupo reduzido para garantir exclusividade"]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, 'publicado', true, 6, 10, 4
),
(
  'd8d1aa29-4a71-4a43-bf15-f7c7c43e6271', 'caminho-de-santiago', 'Caminho de Santiago a Cavalo',
  'cavalgadas', 'espanha', 'Galícia, Espanha', 'EUR', 'Intermediário a avançado', '7 dias / 6 noites', 3335,
  'Sete dias percorrendo a Rota Francesa do Caminho de Santiago a cavalo, de O Cebreiro até a Plaza do Obradoiro em Santiago de Compostela.',
  E'Uma travessia de aproximadamente 135 km pelo Caminho de Santiago a cavalo, na Galícia. Sete dias percorrendo a histórica Rota Francesa, de O Cebreiro (Triscastela) até a entrada triunfal na Plaza do Obradoiro, em frente à Catedral de Santiago de Compostela.\n\nEtapas diárias entre 22 e 30 km, com cavalos experientes, hospedagem em hotéis rurais e casas típicas galegas, equipe de apoio diária e transporte de bagagem entre os alojamentos.',
  '["Acompanhamento por guias experientes durante todo o percurso","Equipe de apoio diária para cuidado dos cavalos e equipamentos","Cavalos experientes selecionados conforme o perfil do cavaleiro","Alforjes para itens pessoais essenciais","Transporte de bagagem entre os alojamentos","Hospedagem em hotéis rurais, casas típicas galegas ou pousadas","Alimentação completa (café da manhã, almoço e jantar)","Capas de chuva e material de proteção disponíveis","Credencial do peregrino para emissão da Compostela"]'::jsonb,
  '["Peso máximo: 110 kg","Experiência mínima em montaria obrigatória","Informar previamente: nome, altura, peso, idade, eventuais lesões e nível de equitação","Selas inglesas (principalmente) e algumas brasileiras/endurance, adaptáveis com gel ou lã","Suplemento quarto individual: € 300 (6 noites)","Entrada mínima de € 500 para garantir a vaga; saldo parcelado até 20 de julho de 2026"]'::jsonb,
  '[]'::jsonb, '[]'::jsonb, 'publicado', true, 7, 10, 6
)
ON CONFLICT (slug) DO NOTHING;

-- Datas de turma
INSERT INTO public.datas (id, expedicao_id, data_inicio, data_fim, vagas_total, vagas_disponiveis, status, preco_pix, preco_cartao) VALUES
('9e910682-0ce1-4ebe-b6f4-306814ef32c9','c9e9f1dd-039d-4301-9181-ab26b30b9f2f','2026-06-04','2026-06-07',14,8,'disponivel',4900,5200),
('0b742d7e-e542-4b59-9e13-ac9496a4d5f7','c9e9f1dd-039d-4301-9181-ab26b30b9f2f','2026-06-11','2026-06-14',14,14,'disponivel',3900,4400),
('d0f875d2-e37e-4447-b0f6-40ba64f4aad5','9dd91b11-3ce3-4368-ab3c-4d441da8d34d','2026-07-15','2026-07-19',12,5,'poucas_vagas',4200,4600),
('696d31b1-ed97-4e5f-bf7f-3453f058dda4','5b8124d0-20f1-416a-8dd9-3ab0b17a0f6b','2026-08-04','2026-08-07',10,10,'disponivel',NULL,NULL),
('49b808dc-aac6-401e-81c7-f4eb66853940','aa0ddccc-6b9a-4c84-99c7-69b722b8cd6f','2026-08-19','2026-08-23',12,12,'disponivel',NULL,NULL),
('a075d821-29be-4073-a169-92b60358ae13','d8d1aa29-4a71-4a43-bf15-f7c7c43e6271','2026-09-01','2026-09-07',10,10,'disponivel',3335,3335),
('f6459821-44ea-418b-82e8-4d37f625b3df','4f698388-a443-406c-a76d-a409fb794fa1','2026-10-15','2026-10-18',8,6,'disponivel',5800,6400),
('d722b618-8af9-4c39-889e-2fdfd5139d62','b72305d1-223e-4835-b87b-ff97d3229429','2027-01-15','2027-01-19',10,10,'disponivel',NULL,NULL)
ON CONFLICT (id) DO NOTHING;
