
INSERT INTO public.datas (expedicao_id, data_inicio, data_fim, vagas_total, vagas_disponiveis, status)
SELECT id, DATE '2026-06-04', DATE '2026-06-07', 14, 8, 'disponivel' FROM public.expedicoes WHERE slug='serra-da-canastra'
UNION ALL SELECT id, DATE '2026-06-11', DATE '2026-06-14', 14, 14, 'disponivel' FROM public.expedicoes WHERE slug='serra-da-canastra'
UNION ALL SELECT id, DATE '2026-07-15', DATE '2026-07-19', 12, 5, 'poucas_vagas' FROM public.expedicoes WHERE slug='mantiqueira-refugio'
UNION ALL SELECT id, DATE '2026-08-19', DATE '2026-08-23', 12, 12, 'disponivel' FROM public.expedicoes WHERE slug='berco-do-marchador'
UNION ALL SELECT id, DATE '2026-10-15', DATE '2026-10-18', 8, 6, 'disponivel' FROM public.expedicoes WHERE slug='jericoacoara'
UNION ALL SELECT id, DATE '2026-08-04', DATE '2026-08-07', 10, 10, 'disponivel' FROM public.expedicoes WHERE slug='peru-vale-do-colca'
UNION ALL SELECT id, DATE '2027-01-15', DATE '2027-01-19', 10, 10, 'disponivel' FROM public.expedicoes WHERE slug='patagonia-gaucha';
