DELETE FROM expedicao_assets WHERE expedicao_id = 'c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c';

INSERT INTO expedicao_assets (expedicao_id, tipo, url, titulo, ordem, is_capa) VALUES
('c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c','imagem','/__l5e/assets-v1/a6061a1c-aab4-4f32-94f4-90462d2722d8/travessia-1.jpg','Onde nasce o Velho Chico, começam experiências que ficam para sempre.',1,true),
('c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c','imagem','/__l5e/assets-v1/29d740f1-ddda-472d-9d93-22e84905e1c4/travessia-2.jpg','Entre montanhas, fazendas históricas e estradas de terra, seguimos rumo às águas que dão vida ao Rio São Francisco.',2,false),
('c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c','imagem','/__l5e/assets-v1/2bb16bb1-a1ba-4cb4-90ac-fdf529c0a8c2/travessia-3.jpg','Atravessar o Rio São Francisco a cavalo é um daqueles momentos que ficam para sempre na memória.',3,false),
('c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c','imagem','/__l5e/assets-v1/264d6932-8b8a-4996-a324-64d1ef72aceb/travessia-4.jpg','Nas águas cristalinas do Velho Chico, natureza, aventura e liberdade se encontram.',4,false),
('c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c','imagem','/__l5e/assets-v1/43e4914e-3bf2-4cde-bd46-407d66d02ccd/travessia-5.jpg','Poucos lugares permitem viver o Rio São Francisco de forma tão próxima e autêntica.',5,false),
('c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c','imagem','/__l5e/assets-v1/ae09eb06-470c-423d-aa02-8d9636f22a61/travessia-6.jpg','Às margens do Velho Chico, tradição e sabores que fazem da Canastra um destino único.',6,false),
('c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c','imagem','/__l5e/assets-v1/5a8a92f7-7a7b-49e3-9852-6d0021308ae9/travessia-7.jpg','Paradas especiais para compartilhar histórias, contemplar a paisagem e celebrar o caminho percorrido.',7,false),
('c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c','imagem','/__l5e/assets-v1/bbcaf1d6-0b62-4d55-979e-942afb2d8b1e/travessia-8.jpg','Da nascente do Rio São Francisco aos horizontes infinitos da Canastra, uma experiência que vai muito além da cavalgada.',8,false);

UPDATE expedicoes SET capa_url = '/__l5e/assets-v1/a6061a1c-aab4-4f32-94f4-90462d2722d8/travessia-1.jpg' WHERE id = 'c8adbc0a-a96d-4c6c-8d55-bfc640a31a7c';