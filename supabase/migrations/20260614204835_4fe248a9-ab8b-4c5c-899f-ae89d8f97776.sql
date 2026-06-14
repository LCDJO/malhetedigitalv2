
-- Path convention: <tenant_id>/<documentos|biblioteca|pranchas>/<file>
CREATE POLICY "repo_docs_read_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'repositorio-documentos'
  AND public.is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "repo_docs_admin_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'repositorio-documentos'
  AND public.is_tenant_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "repo_docs_admin_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'repositorio-documentos'
  AND public.is_tenant_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "repo_docs_admin_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'repositorio-documentos'
  AND public.is_tenant_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- Permitir que o autor da prancha faça upload do próprio arquivo (subpasta 'pranchas')
CREATE POLICY "repo_pranchas_author_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'repositorio-documentos'
  AND (storage.foldername(name))[2] = 'pranchas'
  AND public.is_tenant_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
