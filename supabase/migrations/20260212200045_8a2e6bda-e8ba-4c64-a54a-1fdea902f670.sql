
-- Tabela: Termos de Uso
CREATE TABLE public.termos_uso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  versao text NOT NULL,
  conteudo text NOT NULL,
  data_publicacao timestamp with time zone NOT NULL DEFAULT now(),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.termos_uso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active terms" ON public.termos_uso
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage terms" ON public.termos_uso
  FOR ALL USING (is_admin(auth.uid()));

-- Tabela: Política de Privacidade
CREATE TABLE public.politicas_privacidade (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  versao text NOT NULL,
  conteudo text NOT NULL,
  data_publicacao timestamp with time zone NOT NULL DEFAULT now(),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.politicas_privacidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view policies" ON public.politicas_privacidade
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage policies" ON public.politicas_privacidade
  FOR ALL USING (is_admin(auth.uid()));

-- Tabela: Aceite de Termo (relacionada ao usuário e ao termo)
CREATE TABLE public.aceites_termos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  termo_id uuid NOT NULL REFERENCES public.termos_uso(id) ON DELETE CASCADE,
  data_hora_aceite timestamp with time zone NOT NULL DEFAULT now(),
  ip text
);

ALTER TABLE public.aceites_termos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptances" ON public.aceites_termos
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own acceptance" ON public.aceites_termos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins can view all acceptances" ON public.aceites_termos
  FOR SELECT USING (is_admin(auth.uid()));

-- Tipo enum para solicitações do titular
CREATE TYPE public.tipo_solicitacao_titular AS ENUM ('correcao', 'exclusao', 'exportacao');
CREATE TYPE public.status_solicitacao AS ENUM ('pendente', 'em_andamento', 'concluida', 'rejeitada');

-- Tabela: Solicitações do Titular (LGPD)
CREATE TABLE public.solicitacoes_titular (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_solicitacao_titular NOT NULL,
  solicitante_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_solicitacao timestamp with time zone NOT NULL DEFAULT now(),
  status status_solicitacao NOT NULL DEFAULT 'pendente',
  descricao text,
  resposta text,
  respondido_por uuid REFERENCES auth.users(id),
  respondido_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes_titular ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.solicitacoes_titular
  FOR SELECT USING (auth.uid() = solicitante_id);

CREATE POLICY "Users can create own requests" ON public.solicitacoes_titular
  FOR INSERT WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Admins can manage all requests" ON public.solicitacoes_titular
  FOR ALL USING (is_admin(auth.uid()));

-- Índices para performance
CREATE INDEX idx_aceites_usuario ON public.aceites_termos(usuario_id);
CREATE INDEX idx_aceites_termo ON public.aceites_termos(termo_id);
CREATE INDEX idx_solicitacoes_solicitante ON public.solicitacoes_titular(solicitante_id);
CREATE INDEX idx_solicitacoes_status ON public.solicitacoes_titular(status);
CREATE INDEX idx_termos_ativo ON public.termos_uso(ativo);
CREATE INDEX idx_politicas_ativo ON public.politicas_privacidade(ativo);
