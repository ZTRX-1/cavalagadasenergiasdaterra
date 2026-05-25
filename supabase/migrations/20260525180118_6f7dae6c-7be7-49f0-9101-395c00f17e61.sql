ALTER TABLE public.datas ADD COLUMN IF NOT EXISTS tag text;
UPDATE public.expedicoes SET nome='Serra da Mantiqueira' WHERE id='9dd91b11-3ce3-4368-ab3c-4d441da8d34d';
UPDATE public.datas SET tag='Novo percurso' WHERE expedicao_id='b72305d1-223e-4835-b87b-ff97d3229429';
INSERT INTO public.datas (id, expedicao_id, data_inicio, data_fim, vagas_total, vagas_disponiveis, status, tag)
VALUES ('f1b3c2d4-7a8b-4c5d-9e0f-2a1b3c4d5e6f','b72305d1-223e-4835-b87b-ff97d3229429','2027-01-24','2027-01-28',10,10,'disponivel','Novo percurso')
ON CONFLICT (id) DO UPDATE SET tag=EXCLUDED.tag, data_inicio=EXCLUDED.data_inicio, data_fim=EXCLUDED.data_fim;