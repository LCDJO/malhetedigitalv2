
-- Tabela para controlar sessão única por usuário admin
CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  session_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ver apenas sua própria sessão
CREATE POLICY "Users can read own session"
ON public.active_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Usuários autenticados podem inserir/atualizar sua própria sessão
CREATE POLICY "Users can upsert own session"
ON public.active_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own session"
ON public.active_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_active_sessions_updated_at
BEFORE UPDATE ON public.active_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
