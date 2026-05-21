-- Configuração dos alertas de "produtos sensíveis" em campanhas.
-- Linha única (id = 1), consumida pelo card do dashboard e pelo cron
-- /api/cron/sensitive-products. Keywords, grupos de WhatsApp e horários do
-- resumo passam a ser editáveis pela tela /configuracoes.

CREATE TABLE IF NOT EXISTS public.alertas_config (
  id            integer     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  keywords      text[]      NOT NULL DEFAULT '{}',
  grupos        jsonb       NOT NULL DEFAULT '[]'::jsonb,
  horas_resumo  integer[]   NOT NULL DEFAULT '{}',
  ativo         boolean     NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid
);

COMMENT ON TABLE public.alertas_config IS
  'Configuração dos alertas de produtos sensíveis (linha única, id = 1).
   grupos: jsonb array de { "jid": "xxx@g.us", "label": "Nome" }.
   horas_resumo: horas (0-23, fuso America/Sao_Paulo) de envio do resumo.';

-- Seed da linha única com os defaults da aplicação.
INSERT INTO public.alertas_config (id, keywords, horas_resumo, ativo, grupos)
VALUES (
  1,
  ARRAY['leite','óleo','azeite','açúcar','arroz','feijão','café','farinha','manteiga','margarina','macarrão'],
  ARRAY[8],
  true,
  '[]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.alertas_config ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados leem/escrevem; o gating de admin é feito na camada de
-- aplicação (requireModuleWrite('sistemas')). O cron usa a service role, que
-- ignora RLS.
CREATE POLICY "alertas_config_select" ON public.alertas_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "alertas_config_insert" ON public.alertas_config
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "alertas_config_update" ON public.alertas_config
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
