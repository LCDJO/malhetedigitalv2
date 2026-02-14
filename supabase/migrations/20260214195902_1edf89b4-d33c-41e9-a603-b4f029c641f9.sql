
-- 1) Trigger: notificar todos os membros do tenant quando uma mensalidade vence (status muda para vencido/inadimplente)
--    Isso dispara quando um admin atualiza o status de uma transação ou quando ela é inserida já vencida.

-- Notificação de vencimento: dispara para o membro específico quando uma transação com data_vencimento no passado é inserida
CREATE OR REPLACE FUNCTION public.notify_overdue_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Apenas débitos pendentes com vencimento passado
  IF NEW.tipo = 'debito' AND NEW.status = 'pendente' AND NEW.data_vencimento IS NOT NULL AND NEW.data_vencimento < CURRENT_DATE THEN
    INSERT INTO public.notifications (tenant_id, member_id, title, message, type, metadata)
    VALUES (
      NEW.tenant_id,
      NEW.member_id,
      'Mensalidade Vencida',
      'Você possui uma mensalidade vencida em ' || to_char(NEW.data_vencimento, 'DD/MM/YYYY') || ' no valor de R$ ' || to_char(NEW.valor, 'FM999G999D00') || '. Regularize sua situação.',
      'financeiro',
      jsonb_build_object('transaction_id', NEW.id, 'data_vencimento', NEW.data_vencimento, 'valor', NEW.valor)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_overdue_transaction
AFTER INSERT ON public.member_transactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_overdue_transaction();

-- 2) Trigger: notificar todos os membros do tenant quando um incidente LGPD é cadastrado
CREATE OR REPLACE FUNCTION public.notify_lgpd_incident()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.tenant_id IS NOT NULL THEN
    PERFORM public.broadcast_notification(
      NEW.tenant_id,
      'Incidente de Segurança Registrado',
      'Um incidente de segurança de dados foi registrado em ' || to_char(NEW.data_incidente, 'DD/MM/YYYY') || '. A Loja está tomando as providências necessárias conforme a LGPD. Descrição: ' || LEFT(NEW.descricao, 200),
      'lgpd',
      jsonb_build_object('incidente_id', NEW.id, 'data_incidente', NEW.data_incidente)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_lgpd_incident
AFTER INSERT ON public.incidentes
FOR EACH ROW
EXECUTE FUNCTION public.notify_lgpd_incident();
