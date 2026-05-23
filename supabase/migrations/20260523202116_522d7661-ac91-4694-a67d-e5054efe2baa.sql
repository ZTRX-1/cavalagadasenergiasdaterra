
ALTER TABLE public.expedicoes
  ADD COLUMN IF NOT EXISTS marca text NOT NULL DEFAULT 'cavalgadas',
  ADD COLUMN IF NOT EXISTS pais text NOT NULL DEFAULT 'brasil',
  ADD COLUMN IF NOT EXISTS moeda text NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS regiao text;

DELETE FROM public.datas;
DELETE FROM public.expedicoes;

INSERT INTO public.expedicoes (slug, nome, descricao_curta, descricao_longa, duracao, nivel, preco, moeda, marca, pais, regiao, imagem_url, galeria, inclui, requisitos, roteiro, ordem) VALUES
('serra-da-canastra','Serra da Canastra','Travessia a cavalo cruzando rios, montanhas e o Paredão da Canastra.','Uma verdadeira travessia a cavalo pela Serra da Canastra, percorrendo trilhas entre montanhas, rios e cachoeiras, com nossa manada de Mangalarga Marchadores de alta performance. Vivemos a travessia do Rio São Francisco a cavalo, almoços tropeiros em meio à natureza e noites acolhedoras na pousada. Mais do que uma cavalgada — uma travessia pela essência da Canastra.','4 dias / 3 noites','Intermediário',4900.00,'BRL','canastra-a-cavalo','brasil','Vargem Bonita · MG','expedicao-canastra',
 '["expedicao-canastra","cavalo-closeup","acampamento"]'::jsonb,
 '["Cavalos próprios Mangalarga Marchadores","Material completo de montaria","Guias experientes","Carro de apoio","Alimentação completa","Hospedagem em pousada 4 estrelas","Seguro aventura"]'::jsonb,
 '["Experiência básica de equitação","Atestado médico recente"]'::jsonb,
 '[{"dia":"Dia 1","titulo":"Boas-vindas","desc":"Recepção a partir das 14h, jantar de boas-vindas com coquetel e apresentação do grupo."},{"dia":"Dia 2","titulo":"Primeiro dia a cavalo","desc":"20 a 25 km por trilhas e rios cristalinos. Parada em queijaria artesanal, almoço à beira do rio e banho de cachoeira."},{"dia":"Dia 3","titulo":"Travessia do São Francisco","desc":"20 a 25 km de cavalgada com almoço tropeiro e travessia montados dentro do Rio São Francisco. Música ao vivo no jantar."},{"dia":"Dia 4","titulo":"Encerramento","desc":"Café da manhã especial, despedida dos cavalos e check-out até 12h."}]'::jsonb,10),

('mantiqueira-refugio','Expedição na Mantiqueira','Imersão a cavalo entre montanhas, azeitarias e pôr do sol no Refúgio Energias da Terra.','Cinco dias de imersão na Serra da Mantiqueira, entre cavalgadas pelos chapadões, visita à Fazenda de Azeite Monasto, piquenique ao pôr do sol e travessias mais longas. Cavalos do nosso próprio criatório Mangalarga Marchador.','5 dias / 4 noites','Iniciante a Intermediário',4200.00,'BRL','cavalgadas','brasil','Maria da Fé · MG','expedicao-cipo',
 '["expedicao-cipo","cavalo-closeup","acampamento"]'::jsonb,
 '["Cavalos e estrutura completa de montaria","Guias experientes","Hospedagem no Refúgio Energias da Terra","Alimentação completa","Transfer e apoio logístico"]'::jsonb,
 '["Experiência básica de equitação","Roupas leves e calçado fechado"]'::jsonb,
 '[{"dia":"Dia 1","titulo":"Chegada","desc":"Check-in a partir das 14h, apresentação do programa e jantar de boas-vindas."},{"dia":"Dia 2","titulo":"Adaptação","desc":"Cavalgada leve (~10 km) pela Serra da Mantiqueira em ritmo de adaptação."},{"dia":"Dia 3","titulo":"Experiência Monasto","desc":"Cavalgada até a Fazenda de azeite Monasto, almoço no local, piquenique ao pôr do sol e jantar com música ao vivo."},{"dia":"Dia 4","titulo":"Travessia","desc":"Cavalgada mais longa em novo percurso da serra, com paisagens amplas e jantar intimista."},{"dia":"Dia 5","titulo":"Encerramento","desc":"Café da manhã e check-out até 12h."}]'::jsonb,20),

('berco-do-marchador','Berço do Mangalarga Marchador','Travessia pelas fazendas históricas que moldaram a raça em Cruzília.','Cinco dias de imersão pelas origens do Mangalarga Marchador, em Cruzília – sul de Minas Gerais. Três dias de cavalgadas guiadas pelos chapadões e fazendas históricas (Angaí, Campo Lindo, Traituba, Favacho) e visita ao Museu Nacional do Cavalo Mangalarga Marchador.','5 dias / 4 noites','Intermediário',5200.00,'BRL','cavalgadas','brasil','Cruzília · MG','expedicao-chapada',
 '["expedicao-chapada","cavalo-closeup","acampamento"]'::jsonb,
 '["Cavalos Mangalarga Marchador preparados","Selas e equipamentos de montaria","Guias experientes","Transfer Cruzília → Fazenda Angaí","Hospedagem durante toda a expedição","Café da manhã todos os dias e almoços nos dias de cavalgada","Visita ao Museu do Mangalarga Marchador"]'::jsonb,
 '["Cavalgadas com média de 15 a 25 km por dia"]'::jsonb,
 '[{"dia":"Dia 1","titulo":"Chegada · Fazenda Angaí","desc":"Transfer para a histórica Fazenda Angaí, ligada ao registro do primeiro Mangalarga Marchador. Jantar de boas-vindas."},{"dia":"Dia 2","titulo":"Fazenda Campo Lindo","desc":"Cavalgada pelos chapadões até a Fazenda Campo Lindo (JB), com almoço e retorno cavalgando."},{"dia":"Dia 3","titulo":"Traituba e Favacho","desc":"Percurso pelas históricas fazendas Traituba e Favacho, formadoras da genética do Marchador."},{"dia":"Dia 4","titulo":"Clube do Cavalo de Cruzília","desc":"Cavalgada final, visita ao Museu Nacional e jantar de confraternização."},{"dia":"Dia 5","titulo":"Encerramento","desc":"Café da manhã e check-out."}]'::jsonb,30),

('jericoacoara','Jericoacoara — Dunas e Lagoas','Expedição equestre rara por dunas douradas, lagoas cristalinas e o mar do Nordeste.','Quatro dias de imersão sensorial a cavalo em Jericoacoara, com grupo extremamente reduzido. Cavalgadas entre lagoas com entrada na água, dunas ao entardecer e cavalos à beira-mar acompanhando o pôr do sol.','4 dias / 3 noites','Intermediário',5800.00,'BRL','cavalgadas','brasil','Jericoacoara · CE','expedicao-aerea',
 '["expedicao-aerea","cavalo-closeup","acampamento"]'::jsonb,
 '["Hospedagem em acomodação dupla de alto padrão","Recepção exclusiva com vinhos e pizza","Kit personalizado da cavalgada","Cafés da manhã e jantares conforme programação","Cavalos selecionados","Guias bilíngues especializados","Seguro aventura"]'::jsonb,
 '["Experiência intermediária recomendada"]'::jsonb,
 '[{"dia":"Quinta","titulo":"Recepção exclusiva","desc":"Chegada, check-in e recepção com vinhos, pizza e apresentação da expedição."},{"dia":"Sexta","titulo":"Lagoas e praias com entrada na água","desc":"Cavalgada de 15 a 20 km entre lagoas e praias preservadas, com entrada na água montado."},{"dia":"Sábado","titulo":"Dunas ao entardecer","desc":"Cerca de 20 km pelas dunas douradas no fim da tarde, finalizando à beira do mar no pôr do sol."},{"dia":"Domingo","titulo":"Encerramento","desc":"Café da manhã e check-out até 12h."}]'::jsonb,40),

('peru-vale-do-colca','Peru — Vale do Colca','Travessia andina a cavalo pelo Vale do Colca, ruínas pré-incas e o voo do condor.','Quatro dias de expedição a cavalo pelas paisagens místicas do Vale do Colca, no Peru. Montanhas imponentes, cânions profundos, ruínas pré-incas, termas e o voo sagrado do condor.','4 dias / 3 noites','Intermediário a Avançado',1600.00,'USD','cavalgadas','peru','Vale do Colca · Peru','expedicao-chapada',
 '["expedicao-chapada","cavalo-closeup","acampamento"]'::jsonb,
 '["Transporte privativo durante 4 dias","3 noites de hospedagem","Alimentação completa","Entradas turísticas (Cruz do Condor, Uyo Uyo, Termas de Puye)","Guia profissional em espanhol"]'::jsonb,
 '["Boa condição física para altitude","Seguro viagem internacional"]'::jsonb,
 '[{"dia":"Dia 1","titulo":"Chegada ao Vale do Colca","desc":"Saída de Arequipa, observação de vicunhas e alpacas, parada em Patapampa (4.910 m), check-in em Yanque."},{"dia":"Dia 2","titulo":"Ruínas pré-incas e Termas de Puye","desc":"Cavalgada por Coporaque, visita às ruínas de Uyo Uyo e banho nas termas."},{"dia":"Dia 3","titulo":"Mirante de Achomani","desc":"Cavalgada com vista para os terraços agrícolas pré-incas e jantar com música ao vivo."},{"dia":"Dia 4","titulo":"Cruz do Condor","desc":"Observação do voo dos condores e retorno a Arequipa."}]'::jsonb,50),

('patagonia-gaucha','Patagônia Gaúcha Experience','Cinco dias a cavalo entre estepes, cordilheiras nevadas e lagos glaciais.','Experiência autêntica e exclusiva pela região de El Calafate e San Martín. Cavalgadas pelas estepes patagônicas, vivência de doma gaúcha, pesca em lagos glaciais e o icônico assado de cordeiro patagônico.','5 dias / 4 noites','Intermediário a Avançado',2350.00,'USD','cavalgadas','argentina','El Calafate · Patagônia','expedicao-aerea',
 '["expedicao-aerea","cavalo-closeup","acampamento"]'::jsonb,
 '["Transfers de El Calafate até a estância","Hospedagem em base dupla","Refeições preparadas por chef local","Bebidas","Cavalos crioulos e equipamentos","Vivência gaúcha","Pesca de trutas e salmões","Assado de cordeiro patagônico"]'::jsonb,
 '["Experiência intermediária de equitação","Seguro viagem internacional"]'::jsonb,
 '[{"dia":"Dia 1","titulo":"Chegada","desc":"Recepção em El Calafate e transfer até a estância. Boas-vindas e jantar com chef local."},{"dia":"Dia 2","titulo":"Estepes e cultura gaúcha","desc":"Cavalgada pelas estepes, doma tradicional gaúcha e trabalho com cães pastores."},{"dia":"Dia 3","titulo":"Altitude e lagos glaciais","desc":"Cavalgada em altitude com vista dos Andes e pesca no Lago San Martín."},{"dia":"Dia 4","titulo":"Expedição real","desc":"Cavalgada por regiões remotas e assado de cordeiro patagônico."},{"dia":"Dia 5","titulo":"Despedida","desc":"Café da manhã e retorno para El Calafate."}]'::jsonb,60);

INSERT INTO public.datas (expedicao_id, data_inicio, data_fim, vagas_total, vagas_disponiveis, status)
SELECT id, DATE '2026-06-04', DATE '2026-06-07', 14, 8, 'disponivel' FROM public.expedicoes WHERE slug='serra-da-canastra'
UNION ALL SELECT id, DATE '2026-06-11', DATE '2026-06-14', 14, 14, 'disponivel' FROM public.expedicoes WHERE slug='serra-da-canastra'
UNION ALL SELECT id, DATE '2026-07-15', DATE '2026-07-19', 12, 5, 'poucas_vagas' FROM public.expedicoes WHERE slug='mantiqueira-refugio'
UNION ALL SELECT id, DATE '2026-08-19', DATE '2026-08-23', 12, 12, 'disponivel' FROM public.expedicoes WHERE slug='berco-do-marchador'
UNION ALL SELECT id, DATE '2026-10-15', DATE '2026-10-18', 8, 6, 'disponivel' FROM public.expedicoes WHERE slug='jericoacoara'
UNION ALL SELECT id, DATE '2026-08-04', DATE '2026-08-07', 10, 10, 'disponivel' FROM public.expedicoes WHERE slug='peru-vale-do-colca'
UNION ALL SELECT id, DATE '2027-01-15', DATE '2027-01-19', 10, 10, 'disponivel' FROM public.expedicoes WHERE slug='patagonia-gaucha';
