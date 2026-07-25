
CREATE SCHEMA IF NOT EXISTS backup_calendario_publico_20260725;

CREATE TABLE backup_calendario_publico_20260725.datas AS
SELECT * FROM public.datas;

GRANT USAGE ON SCHEMA backup_calendario_publico_20260725 TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA backup_calendario_publico_20260725 TO service_role;

UPDATE public.datas SET status='cancelada'
WHERE id IN (
  '1a03a74c-ee16-4d77-8c77-725aed1656c9',
  '4aca7149-4283-47e2-b4fd-b692a878592e',
  '3564ec8c-4161-4e71-8346-78213a14285a',
  'a0bc0300-227a-4a73-8899-ffffbb83099c',
  '52f37a43-3776-4165-a76c-e31536236c52',
  'e9a8d76c-4bd1-4b74-b8de-8e814bddab94',
  '70aba363-4ed4-4595-8825-41a55e06d2d1'
);
