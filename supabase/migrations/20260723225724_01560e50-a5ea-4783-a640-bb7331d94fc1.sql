
-- Retirer l'accès public aux fonctions internes (triggers seulement)
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_record_client_visit() FROM PUBLIC, anon, authenticated;

-- has_role / is_staff : accessibles uniquement aux users connectés (utilisés par RLS)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

-- Restreindre la journalisation PIN aux user_id/device_id valides
DROP POLICY IF EXISTS "pin_attempts: insert" ON public.pin_attempts;
CREATE POLICY "pin_attempts: insert limited"
  ON public.pin_attempts FOR INSERT
  WITH CHECK (device_id IS NOT NULL AND length(device_id) BETWEEN 8 AND 128);
