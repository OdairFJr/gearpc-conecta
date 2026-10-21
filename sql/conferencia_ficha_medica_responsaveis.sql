-- Executar no Supabase antes de publicar a conferência médica no aplicativo.
-- Não altera confirmações anteriores; exige nova conferência da ficha médica.
ALTER TABLE public.responsavel_confirmacoes_jovens
  ADD COLUMN IF NOT EXISTS ficha_medica_confirmada_em timestamptz;

COMMENT ON COLUMN public.responsavel_confirmacoes_jovens.ficha_medica_confirmada_em
  IS 'Data em que o responsável revisou explicitamente a ficha médica do jovem; a validação deve ser refeita após atualizações médicas.';
