import { getCanonicalExpedicaoSlug } from "@/lib/expedicao-slugs";

export interface Expedicao {
  id: string;
  slug: string;
  nome: string;
  descricao_curta: string;
  descricao_longa: string;
  duracao: string;
  nivel: string;
  preco: number;
  moeda: string;
  marca: string;
  pais: string;
  regiao: string | null;
  imagem_url: string | null;
  galeria: string[];
  inclui: string[];
  requisitos: string[];
  roteiro: { dia: string; titulo: string; desc: string }[];
}

export interface DataExpedicao {
  id: string;
  expedicao_id: string;
  expedicao_nome?: string;
  expedicao_slug?: string;
  data_inicio: string;
  data_fim: string;
  vagas_total: number;
  vagas_disponiveis: number;
  status: string;
  preco_pix?: number | null;
  preco_cartao?: number | null;
  tag?: string | null;
}

const EXPEDICOES: Expedicao[] = [
    {
        "id": "c9e9f1dd-039d-4301-9181-ab26b30b9f2f",
        "nome": "Serra da Canastra",
        "pais": "brasil",
        "slug": "serra-da-canastra",
        "marca": "canastra-a-cavalo",
        "moeda": "BRL",
        "nivel": "Intermediário",
        "preco": 3900.00,
        "inclui": [
            "Cavalos próprios Mangalarga Marchador",
            "Material completo de montaria (selas, cabeçadas, mantas e alforjes)",
            "Guias experientes",
            "Carro de apoio",
            "Café da manhã, almoço e jantar (exceto almoço do último dia)",
            "Hospedagem em pousada padrão 4 estrelas, acomodação dupla",
            "Seguro aventura"
        ],
        "regiao": "Vargem Bonita, MG",
        "duracao": "4 dias / 3 noites",
        "galeria": [
            "expedicao-canastra",
            "cavalo-closeup",
            "acampamento"
        ],
        "roteiro": [
            {
                "dia": "Dia 1",
                "desc": "Recepção na pousada a partir das 14h. Jantar de boas-vindas com coquetel, apresentação dos participantes e orientações iniciais.",
                "titulo": "Boas-vindas à travessia"
            },
            {
                "dia": "Dia 2",
                "desc": "De 20 a 25 km por campos abertos, rios cristalinos e o Paredão da Canastra. Parada em queijaria artesanal, almoço à beira do rio e banho em cachoeira. Retorno para jantar na pousada.",
                "titulo": "Primeira cavalgada"
            },
            {
                "dia": "Dia 3",
                "desc": "De 20 a 25 km por campos e morros. Almoço tropeiro em plena natureza e travessia a cavalo dentro do Rio São Francisco. Jantar com música ao vivo.",
                "titulo": "O dia mais intenso"
            },
            {
                "dia": "Dia 4",
                "desc": "Café da manhã especial de despedida, últimas fotos e check-out até as 12h.",
                "titulo": "Encerramento"
            }
        ],
        "imagem_url": "expedicao-canastra",
        "requisitos": [
            "Experiência mínima em montaria recomendada",
            "Bebidas não incluídas",
            "Acomodação single com tarifa adicional de 40%",
            "Quem vem sozinho pode dividir o quarto com outro participante"
        ],
        "descricao_curta": "Explore a Serra da Canastra a cavalo, por rotas cuidadosamente selecionadas.",
        "descricao_longa": "A Canastra é nosso ponto de origem. Conhecemos cada trilha, cada paisagem e cada história que fazem desta região um dos destinos equestres mais especiais do Brasil. Trabalhamos ao lado de parceiros locais selecionados, que compartilham dos mesmos valores de cuidado, autenticidade e respeito à cultura da Serra da Canastra."
    },
    {
        "id": "9dd91b11-3ce3-4368-ab3c-4d441da8d34d",
        "nome": "Serra da Mantiqueira",
        "pais": "brasil",
        "slug": "mantiqueira-refugio",
        "marca": "cavalgadas",
        "moeda": "BRL",
        "nivel": "Iniciante a intermediário",
        "preco": 4200.00,
        "inclui": [
            "Cavalos próprios Mangalarga Marchador e toda a estrutura de montaria",
            "Guias experientes",
            "Hospedagem no Refúgio Energias da Terra",
            "Alimentação completa",
            "Logística e transfers internos"
        ],
        "regiao": "Maria da Fé, MG",
        "duracao": "5 dias / 4 noites",
        "galeria": [
            "expedicao-cipo",
            "cavalo-closeup",
            "acampamento"
        ],
        "roteiro": [
            {
                "dia": "Dia 1",
                "desc": "Check-in a partir das 14h. Recepção, acomodação, apresentação do programa e jantar de boas-vindas.",
                "titulo": "Chegada"
            },
            {
                "dia": "Dia 2",
                "desc": "Cavalgada leve de cerca de 10 km por trilhas da Mantiqueira, ritmo tranquilo para adaptação. Almoço e jantar inclusos.",
                "titulo": "Adaptação"
            },
            {
                "dia": "Dia 3",
                "desc": "Cavalgada passando pelo centro de Maria da Fé até a fazenda de azeite Monasto. Almoço no local, piquenique ao pôr do sol e coquetel. Jantar com música ao vivo.",
                "titulo": "Experiência Monasto"
            },
            {
                "dia": "Dia 4",
                "desc": "Cavalgada mais longa por novo percurso na serra, com paisagens amplas e marcantes. Almoço e jantar na pousada.",
                "titulo": "Travessia"
            },
            {
                "dia": "Dia 5",
                "desc": "Café da manhã e check-out até as 12h.",
                "titulo": "Encerramento"
            }
        ],
        "imagem_url": "expedicao-cipo",
        "requisitos": [
            "Bebidas não incluídas",
            "Deslocamento até a pousada não incluído",
            "Crianças até 10 anos têm 20% de desconto; acima de 10 anos pagam valor integral"
        ],
        "descricao_curta": "Expedição a cavalo entre montanhas, natureza e conexão. Para quem busca desacelerar, viver o presente e se reconectar.",
        "descricao_longa": "Cinco dias no Refúgio Energias da Terra, em Maria da Fé (MG), no coração da Serra da Mantiqueira. Cavalgadas leves de adaptação, travessias mais longas, vivência na fazenda de azeite Monasto e piquenique ao pôr do sol.\n\nCavalos do nosso próprio criatório Mangalarga Marchador, hospedagem premium no refúgio e gastronomia regional cuidada."
    },
    {
        "id": "aa0ddccc-6b9a-4c84-99c7-69b722b8cd6f",
        "nome": "Berço do Mangalarga Marchador",
        "pais": "brasil",
        "slug": "berco-do-marchador",
        "marca": "cavalgadas",
        "moeda": "BRL",
        "nivel": "Intermediário",
        "preco": 5200.00,
        "inclui": [
            "Cavalos Mangalarga Marchador preparados",
            "Selas e equipamentos de montaria",
            "Guias experientes durante toda a expedição",
            "Transfer Cruzília até Fazenda Angaí",
            "Transporte logístico e apoio durante os percursos",
            "Hospedagem em Fazenda Angaí, Pousada Cruzília ou similares",
            "Café da manhã todos os dias",
            "Almoços nos dias de cavalgada e jantares conforme programação",
            "Visita ao Museu do Mangalarga Marchador",
            "Seguro aventura"
        ],
        "regiao": "Cruzília, MG",
        "duracao": "5 dias / 4 noites",
        "galeria": [
            "expedicao-chapada",
            "cavalo-closeup",
            "acampamento"
        ],
        "roteiro": [
            {
                "dia": "Dia 1",
                "desc": "Encontro em Cruzília, transfer às 16h até a histórica Fazenda Angaí (registro do primeiro Mangalarga Marchador). Apresentação do grupo e jantar de boas-vindas.",
                "titulo": "Chegada e Fazenda Angaí"
            },
            {
                "dia": "Dia 2",
                "desc": "Cavalgada pelos chapadões até a Fazenda Campo Lindo (JB), um dos criatórios tradicionais. Parada para almoço e retorno cavalgando.",
                "titulo": "1º dia de cavalgada"
            },
            {
                "dia": "Dia 3",
                "desc": "Percurso pelas históricas fazendas Traituba e Favacho, ambas de grande influência na formação genética da raça. Retorno dos cavalos por caminhão e dos participantes por transfer.",
                "titulo": "2º dia de cavalgada"
            },
            {
                "dia": "Dia 4",
                "desc": "Cavalgada final até o Clube do Cavalo de Cruzília. Visita ao Museu Nacional do Cavalo Mangalarga Marchador. Jantar de confraternização.",
                "titulo": "3º dia de cavalgada"
            },
            {
                "dia": "Dia 5",
                "desc": "Café da manhã e check-out.",
                "titulo": "Encerramento"
            }
        ],
        "imagem_url": "expedicao-chapada",
        "requisitos": [
            "Distância média de 15 a 25 km por dia",
            "Hospedagens previstas: Fazenda Angaí, Pousada Cruzília ou similares",
            "Bebidas durante refeições não incluídas",
            "Transporte até Cruzília não incluído",
            "Despesas pessoais não inclusas",
            "Seguro pessoal de viagem não incluso",
            "Itens não mencionados como inclusos não fazem parte do pacote",
            "Programação sujeita a alterações por condições climáticas ou logísticas"
        ],

        "descricao_curta": "Expedição a cavalo por Cruzília (MG), o berço da raça Mangalarga Marchador, visitando fazendas históricas que moldaram a genética do cavalo.",
        "descricao_longa": "Cruzília, no sul de Minas Gerais, é reconhecida como o berço do cavalo Mangalarga Marchador. Entre chapadões, antigas fazendas e paisagens rurais que guardam séculos de tradição, nasceu uma das raças de sela mais admiradas do Brasil.\n\nEsta expedição é uma jornada pelas origens do Marchador, com cinco dias na cultura equestre mineira e três dias de cavalgadas guiadas por paisagens marcantes da região."

    },
    {
        "id": "4f698388-a443-406c-a76d-a409fb794fa1",
        "nome": "Jericoacoara, Dunas e Lagoas",
        "pais": "brasil",
        "slug": "jericoacoara",
        "marca": "cavalgadas",
        "moeda": "BRL",
        "nivel": "Intermediário",
        "preco": 5800.00,
        "inclui": [
            "Hospedagem de quinta a domingo em acomodação dupla de alto padrão",
            "Recepção de boas-vindas com vinhos e pizza",
            "Cafés da manhã na sexta, sábado e domingo",
            "Jantares na sexta-feira e sábado",
            "Cavalos selecionados conforme o perfil do cavaleiro",
            "Guias bilíngues especializados",
            "Seguro aventura",
            "Kit exclusivo da expedição (boné e camiseta personalizados)"
        ],
        "regiao": "Jericoacoara, CE",
        "duracao": "4 dias / 3 noites",
        "galeria": [
            "expedicao-aerea",
            "cavalo-closeup",
            "acampamento"
        ],
        "roteiro": [
            {
                "dia": "Dia 1",
                "desc": "Chegada na quinta-feira, recepção à noite com vinhos, pizza, apresentação da expedição e entrega do kit personalizado.",
                "titulo": "Recepção exclusiva"
            },
            {
                "dia": "Dia 2",
                "desc": "De 15 a 20 km cavalgando entre lagoas cristalinas e praias preservadas, com banho com os cavalos e travessias dentro da água.",
                "titulo": "Lagoas e praias com entrada na água"
            },
            {
                "dia": "Dia 3",
                "desc": "Cerca de 20 km por dunas douradas no fim da tarde, finalizando à beira-mar acompanhando o pôr do sol.",
                "titulo": "Dunas ao entardecer"
            },
            {
                "dia": "Dia 4",
                "desc": "Tour de buggy privativo, almoço na Lagoa Azul (à parte), visita à Pedra Furada e à vila de Jericoacoara. Check-out até 12h.",
                "titulo": "Buggy e despedida"
            }
        ],
        "imagem_url": "expedicao-aerea",
        "requisitos": [
            "Passagem aérea não incluída",
            "Almoços e bebidas não incluídos (exceto cafés da manhã)",
            "Transfer aeroporto até a pousada não incluído",
            "Vagas extremamente limitadas, sem turmas extras"
        ],
        "descricao_curta": "Expedição equestre em Jericoacoara, com cavalgadas entre lagoas cristalinas, dunas douradas e o mar do Nordeste.",
        "descricao_longa": "Uma experiência equestre desenhada para grupo extremamente reduzido. Durante quatro dias, você vive Jericoacoara de uma forma reservada a poucos: a cavalo, em paisagens intocadas, com ritmo desacelerado e atenção individual.\n\nCavalos criteriosamente selecionados entre mestiços nordestinos e Mangalarga Marchador, guias bilíngues especializados e hospedagem de alto padrão."
    },
    {
        "id": "5b8124d0-20f1-416a-8dd9-3ab0b17a0f6b",
        "nome": "Peru, Vale do Colca",
        "pais": "peru",
        "slug": "peru-vale-do-colca",
        "marca": "cavalgadas",
        "moeda": "USD",
        "nivel": "Intermediário",
        "preco": 1600.00,
        "inclui": [
            "Transporte privativo durante os 4 dias",
            "3 noites de hospedagem (2 no Miskiwasi e 1 no Colca Trek Lodge)",
            "Alimentação completa (3 cafés, 3 almoços e 3 jantares)",
            "Entradas turísticas (Cruz do Condor, Uyo Uyo, Termas de Puye)",
            "Guia profissional em espanhol",
            "Jantar especial com música instrumental ao vivo"
        ],
        "regiao": "Vale do Colca, Peru",
        "duracao": "4 dias / 3 noites",
        "galeria": [
            "expedicao-chapada",
            "cavalo-closeup",
            "acampamento"
        ],
        "roteiro": [
            {
                "dia": "Dia 1",
                "desc": "Saída de Arequipa em transporte privativo (cerca de 3h). Observação de vicunhas, alpacas e lhamas. Parada no mirante dos vulcões em Patapampa (4.910 m). Chegada a Yanque, almoço buffet, check-in e jantar.",
                "titulo": "Chegada ao Vale do Colca"
            },
            {
                "dia": "Dia 2",
                "desc": "Cavalgada pelos caminhos históricos de Coporaque. Visita às ruínas arqueológicas de Uyo Uyo e tumbas pré-incas. Almoço em Coporaque e banho nas águas termais de Puye.",
                "titulo": "Ruínas pré-incas e Termas de Puye"
            },
            {
                "dia": "Dia 3",
                "desc": "Cavalgada até o mirante de Achomani com vista para os terraços agrícolas pré-incas. Almoço piquenique e pernoite no Colca Trek Lodge. Jantar especial com música ao vivo.",
                "titulo": "Mirante de Achomani"
            },
            {
                "dia": "Dia 4",
                "desc": "Visita ao mirante natural da Cruz do Condor, observação do voo dos condores e do cânion. Paradas nos mirantes de Choquetico e Antahuilque. Almoço buffet em Yanque e retorno a Arequipa.",
                "titulo": "Cruz do Condor e retorno"
            }
        ],
        "imagem_url": "expedicao-chapada",
        "requisitos": [
            "Acomodação single com tarifa adicional de 40%",
            "Conversão pelo dólar turismo do dia",
            "Bebidas e extras pessoais não incluídos",
            "Seguro viagem por conta do participante"
        ],
        "descricao_curta": "Expedição a cavalo pelas paisagens místicas do Vale do Colca, com cânions profundos, cultura andina e o voo sagrado do condor.",
        "descricao_longa": "Uma expedição inesquecível a cavalo pelas paisagens místicas do Vale do Colca, no Peru.\n\nMontanhas imponentes, cânions profundos, ruínas pré-incas e o voo sagrado do condor fazem parte dessa jornada de pura conexão com a natureza e com a história andina."
    },
    {
        "id": "b72305d1-223e-4835-b87b-ff97d3229429",
        "nome": "Patagônia Gaúcha Experience",
        "pais": "argentina",
        "slug": "patagonia-gaucha",
        "marca": "cavalgadas",
        "moeda": "USD",
        "nivel": "Intermediário a avançado",
        "preco": 2350.00,
        "inclui": [
            "Transfers a partir de El Calafate",
            "Hospedagem em base dupla",
            "Refeições com chef local",
            "Bebidas",
            "Cavalgadas guiadas com cavalos crioulos e equipamentos",
            "Vivência gaúcha (doma, cães pastores)",
            "Pesca de trutas e salmões",
            "Assado de cordeiro patagônico"
        ],
        "regiao": "El Calafate e San Martín, Argentina",
        "duracao": "5 dias / 4 noites",
        "galeria": [
            "expedicao-aerea",
            "cavalo-closeup",
            "acampamento"
        ],
        "roteiro": [
            {
                "dia": "Dia 1",
                "desc": "Recepção em El Calafate e transfer até a estância (3 a 4h). Check-in em base dupla, apresentação do grupo e jantar especial preparado por chef local.",
                "titulo": "Chegada"
            },
            {
                "dia": "Dia 2",
                "desc": "Cavalgada pelas estepes patagônicas com possibilidade de avistar guanacos e condores. À tarde, vivência cultural: doma tradicional, trabalho com cães pastores e rotina real do campo.",
                "titulo": "Estepes e cultura gaúcha"
            },
            {
                "dia": "Dia 3",
                "desc": "Cavalgada em altitude com vista da Cordilheira dos Andes. Pesca no Lago San Martín, com águas cristalinas de degelo glacial. Trutas, salmões e neve compondo o cenário.",
                "titulo": "Altitude, silêncio e lagos glaciais"
            },
            {
                "dia": "Dia 4",
                "desc": "Dia completo de cavalgada por regiões remotas, com mudança constante de paisagens. Experiência gastronômica especial: assado de cordeiro patagônico. Jantar de encerramento.",
                "titulo": "Expedição real"
            },
            {
                "dia": "Dia 5",
                "desc": "Café da manhã e retorno para El Calafate.",
                "titulo": "Despedida"
            }
        ],
        "imagem_url": "expedicao-aerea",
        "requisitos": [
            "Passagens aéreas e despesas pessoais não incluídas",
            "Conversão baseada no dólar turismo do dia",
            "Grupo reduzido para garantir exclusividade"
        ],
        "descricao_curta": "Uma coisa é cavalgar. Outra é cavalgar na Patagônia. Experiência autêntica entre estepes patagônicas, cordilheira nevada e cultura gaúcha real.",
        "descricao_longa": "Uma experiência autêntica e exclusiva entre El Calafate e a região de San Martín. Cavalgadas pelas estepes patagônicas com cordilheira dos Andes ao fundo, doma tradicional gaúcha, trabalho com cães pastores, pesca de trutas e salmões em lagos glaciais e assado de cordeiro patagônico.\n\nGrupo reduzido para garantir exclusividade, segurança e conexão real com a experiência."
    },
    {
        "id": "d8d1aa29-4a71-4a43-bf15-f7c7c43e6271",
        "nome": "Caminho de Santiago a Cavalo",
        "pais": "espanha",
        "slug": "caminho-de-santiago",
        "marca": "cavalgadas",
        "moeda": "EUR",
        "nivel": "Intermediário a avançado",
        "preco": 3335.00,
        "inclui": [
            "Acompanhamento por guias experientes durante todo o percurso",
            "Equipe de apoio diária para cuidado dos cavalos e equipamentos",
            "Cavalos experientes selecionados conforme o perfil do cavaleiro",
            "Alforjes para itens pessoais essenciais",
            "Transporte de bagagem entre os alojamentos",
            "Hospedagem em hotéis rurais, casas típicas galegas ou pousadas",
            "Alimentação completa (café da manhã, almoço e jantar)",
            "Capas de chuva e material de proteção disponíveis",
            "Credencial do peregrino para emissão da Compostela"
        ],
        "regiao": "Galícia, Espanha",
        "duracao": "7 dias / 6 noites",
        "galeria": [
        ],
        "roteiro": [
            {
                "dia": "Dia 1",
                "desc": "Traslado a partir das 16h (aeroporto ou estação de Santiago ou Vigo). Recepção, acomodação e jantar de boas-vindas.",
                "titulo": "Chegada"
            },
            {
                "dia": "Dias 2 a 6",
                "desc": "Café da manhã às 08h, início da cavalgada às 09h. Pausas para bebidas e almoço durante o percurso. Chegada ao alojamento por volta das 18h30, jantar às 20h e descanso. Cidades percorridas: Sarria, Portomarín, Palas de Rei, O Coto, Arzúa, Salceda, Monte do Gozo.",
                "titulo": "Jornada a cavalo"
            },
            {
                "dia": "Dia 7",
                "desc": "Entrada triunfal a cavalo na Plaza do Obradoiro às 07h. Entrega dos cavalos, café da manhã, missa do peregrino e entrega da Compostela. Traslado de retorno para quem viaja no mesmo dia.",
                "titulo": "Chegada a Santiago"
            }
        ],
        "imagem_url": null,
        "requisitos": [
            "Peso máximo: 110 kg",
            "Experiência mínima em montaria obrigatória",
            "Informar previamente: nome, altura, peso, idade, eventuais lesões e nível de equitação",
            "Selas inglesas (principalmente) e algumas brasileiras/endurance, adaptáveis com gel ou lã",
            "Suplemento quarto individual: € 300 (6 noites)"
        ],
        "descricao_curta": "Sete dias percorrendo a Rota Francesa do Caminho de Santiago a cavalo, de O Cebreiro até a Plaza do Obradoiro em Santiago de Compostela.",
        "descricao_longa": "Uma travessia de aproximadamente 135 km pelo Caminho de Santiago a cavalo, na Galícia. Sete dias percorrendo a histórica Rota Francesa, de O Cebreiro (Triscastela) até a entrada triunfal na Plaza do Obradoiro, em frente à Catedral de Santiago de Compostela.\n\nEtapas diárias entre 22 e 30 km, com cavalos experientes, hospedagem em hotéis rurais e casas típicas galegas, equipe de apoio diária e transporte de bagagem entre os alojamentos."
    }
];

const DATAS: DataExpedicao[] = [
    {
        "id": "9e910682-0ce1-4ebe-b6f4-306814ef32c9",
        "status": "disponivel",
        "data_fim": "2026-06-07",
        "preco_pix": 4900,
        "data_inicio": "2026-06-04",
        "vagas_total": 14,
        "expedicao_id": "c9e9f1dd-039d-4301-9181-ab26b30b9f2f",
        "preco_cartao": 5200,
        "expedicao_nome": "Serra da Canastra",
        "expedicao_slug": "serra-da-canastra",
        "vagas_disponiveis": 8
    },
    {
        "id": "0b742d7e-e542-4b59-9e13-ac9496a4d5f7",
        "status": "disponivel",
        "data_fim": "2026-06-14",
        "preco_pix": 3900,
        "data_inicio": "2026-06-11",
        "vagas_total": 14,
        "expedicao_id": "c9e9f1dd-039d-4301-9181-ab26b30b9f2f",
        "preco_cartao": 4400,
        "expedicao_nome": "Serra da Canastra",
        "expedicao_slug": "serra-da-canastra",
        "vagas_disponiveis": 14
    },
    {
        "id": "d0f875d2-e37e-4447-b0f6-40ba64f4aad5",
        "status": "poucas_vagas",
        "data_fim": "2026-07-19",
        "preco_pix": 4200,
        "data_inicio": "2026-07-15",
        "vagas_total": 12,
        "expedicao_id": "9dd91b11-3ce3-4368-ab3c-4d441da8d34d",
        "preco_cartao": 4600,
        "expedicao_nome": "Serra da Mantiqueira",
        "expedicao_slug": "mantiqueira-refugio",
        "vagas_disponiveis": 5
    },
    {
        "id": "696d31b1-ed97-4e5f-bf7f-3453f058dda4",
        "status": "poucas_vagas",
        "data_fim": "2026-08-07",
        "preco_pix": null,
        "data_inicio": "2026-08-04",
        "vagas_total": 10,
        "expedicao_id": "5b8124d0-20f1-416a-8dd9-3ab0b17a0f6b",
        "preco_cartao": null,
        "expedicao_nome": "Peru, Vale do Colca",
        "expedicao_slug": "peru-vale-do-colca",
        "vagas_disponiveis": 3
    },
    {
        "id": "49b808dc-aac6-401e-81c7-f4eb66853940",
        "status": "disponivel",
        "data_fim": "2026-08-23",
        "preco_pix": null,
        "data_inicio": "2026-08-19",
        "vagas_total": 12,
        "expedicao_id": "aa0ddccc-6b9a-4c84-99c7-69b722b8cd6f",
        "preco_cartao": null,
        "expedicao_nome": "Berço do Mangalarga Marchador",
        "expedicao_slug": "berco-do-marchador",
        "vagas_disponiveis": 12
    },
    {
        "id": "a075d821-29be-4073-a169-92b60358ae13",
        "status": "disponivel",
        "data_fim": "2026-09-07",
        "preco_pix": 3335,
        "data_inicio": "2026-09-01",
        "vagas_total": 10,
        "expedicao_id": "d8d1aa29-4a71-4a43-bf15-f7c7c43e6271",
        "preco_cartao": 3335,
        "expedicao_nome": "Caminho de Santiago a Cavalo",
        "expedicao_slug": "caminho-de-santiago",
        "vagas_disponiveis": 10
    },
    {
        "id": "f6459821-44ea-418b-82e8-4d37f625b3df",
        "status": "disponivel",
        "data_fim": "2026-10-18",
        "preco_pix": 5800,
        "data_inicio": "2026-10-15",
        "vagas_total": 8,
        "expedicao_id": "4f698388-a443-406c-a76d-a409fb794fa1",
        "preco_cartao": 6400,
        "expedicao_nome": "Jericoacoara, Dunas e Lagoas",
        "expedicao_slug": "jericoacoara",
        "vagas_disponiveis": 6
    },
    {
        "id": "d722b618-8af9-4c39-889e-2fdfd5139d62",
        "status": "disponivel",
        "data_fim": "2027-01-19",
        "preco_pix": null,
        "data_inicio": "2027-01-15",
        "vagas_total": 10,
        "expedicao_id": "b72305d1-223e-4835-b87b-ff97d3229429",
        "preco_cartao": null,
        "expedicao_nome": "Patagônia Gaúcha Experience",
        "expedicao_slug": "patagonia-gaucha",
        "vagas_disponiveis": 10,
        "tag": "Novo percurso"
    },
    {
        "id": "f1b3c2d4-7a8b-4c5d-9e0f-2a1b3c4d5e6f",
        "status": "disponivel",
        "data_fim": "2027-01-28",
        "preco_pix": null,
        "data_inicio": "2027-01-24",
        "vagas_total": 10,
        "expedicao_id": "b72305d1-223e-4835-b87b-ff97d3229429",
        "preco_cartao": null,
        "expedicao_nome": "Patagônia Gaúcha Experience",
        "expedicao_slug": "patagonia-gaucha",
        "vagas_disponiveis": 10,
        "tag": "Novo percurso"
    }
];

export async function listExpedicoes(): Promise<Expedicao[]> {
  return EXPEDICOES;
}

export async function getExpedicaoBySlug(input: { data: { slug: string } }): Promise<{ expedicao: Expedicao; datas: DataExpedicao[] } | null> {
  const canonicalSlug = getCanonicalExpedicaoSlug(input.data.slug);
  const expedicao = EXPEDICOES.find((item) => item.slug === canonicalSlug);
  if (!expedicao) return null;
  return {
    expedicao,
    datas: DATAS.filter((data) => data.expedicao_id === expedicao.id),
  };
}

export async function listProximasDatas(): Promise<DataExpedicao[]> {
  return DATAS;
}
