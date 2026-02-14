
ALTER TABLE public.login_banners
ADD COLUMN pagina text NOT NULL DEFAULT 'todos';

COMMENT ON COLUMN public.login_banners.pagina IS 'Portal onde o banner será exibido: admin, loja, portal, todos';
