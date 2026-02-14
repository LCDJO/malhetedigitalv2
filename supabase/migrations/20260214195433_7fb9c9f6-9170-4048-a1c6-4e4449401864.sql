
-- Tabela de notificações
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'geral',
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_notifications_member ON public.notifications(member_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id, created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Membros podem ver suas próprias notificações
CREATE POLICY "Members can view own notifications"
  ON public.notifications FOR SELECT
  USING (
    member_id IN (
      SELECT m.id FROM public.members m
      WHERE m.email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
      AND m.tenant_id = notifications.tenant_id
    )
  );

-- Membros podem marcar como lida
CREATE POLICY "Members can update own notifications"
  ON public.notifications FOR UPDATE
  USING (
    member_id IN (
      SELECT m.id FROM public.members m
      WHERE m.email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
      AND m.tenant_id = notifications.tenant_id
    )
  );

-- Admins/sistema podem inserir notificações
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (is_tenant_member(auth.uid(), tenant_id) AND is_admin(auth.uid()));

-- Superadmins full access
CREATE POLICY "Superadmins full access"
  ON public.notifications FOR ALL
  USING (is_superadmin(auth.uid()));

-- Função para broadcast de notificação para todos os membros ativos de um tenant
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  _tenant_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'geral',
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (tenant_id, member_id, title, message, type, metadata)
  SELECT _tenant_id, m.id, _title, _message, _type, _metadata
  FROM public.members m
  WHERE m.tenant_id = _tenant_id AND m.status = 'ativo';
END;
$$;

-- Trigger: notificar membro ao receber lançamento financeiro
CREATE OR REPLACE FUNCTION public.notify_member_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _member_name text;
  _msg text;
BEGIN
  SELECT full_name INTO _member_name FROM public.members WHERE id = NEW.member_id;

  IF NEW.tipo = 'debito' THEN
    _msg := 'Um débito de R$ ' || to_char(NEW.valor, 'FM999G999D00') || ' foi lançado.';
  ELSE
    _msg := 'Um crédito de R$ ' || to_char(NEW.valor, 'FM999G999D00') || ' foi registrado.';
  END IF;

  IF NEW.descricao IS NOT NULL AND NEW.descricao <> '' THEN
    _msg := _msg || ' Descrição: ' || NEW.descricao;
  END IF;

  INSERT INTO public.notifications (tenant_id, member_id, title, message, type, metadata)
  VALUES (
    NEW.tenant_id,
    NEW.member_id,
    CASE WHEN NEW.tipo = 'debito' THEN 'Novo Débito Lançado' ELSE 'Novo Crédito Registrado' END,
    _msg,
    'financeiro',
    jsonb_build_object('transaction_id', NEW.id, 'valor', NEW.valor, 'tipo', NEW.tipo)
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_member_transaction
AFTER INSERT ON public.member_transactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_member_transaction();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
