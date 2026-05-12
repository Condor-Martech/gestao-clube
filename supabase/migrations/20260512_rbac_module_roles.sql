-- users_system is a VIEW over auth.users JOIN profiles — cannot ALTER it.
-- Create a dedicated table for per-module permissions and expose it via the view.

CREATE TABLE IF NOT EXISTS public.user_module_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  module_roles jsonb NOT NULL DEFAULT '{}'
);

COMMENT ON TABLE public.user_module_roles IS
  'Per-user, per-module role map. { "ofertas": "user"|"manager", ... }
   Rows are created on user invite and updated via the admin UI.
   Ignored when profiles.role = "admin" (full access).
   "sistemas" module is never stored here — admin-only at the app layer.';

-- Recreate the view to expose module_roles alongside existing columns.
CREATE OR REPLACE VIEW public.users_system AS
SELECT
  u.instance_id,
  u.id,
  u.aud,
  u.role,
  u.email,
  u.encrypted_password,
  u.email_confirmed_at,
  u.invited_at,
  u.confirmation_token,
  u.confirmation_sent_at,
  u.recovery_token,
  u.recovery_sent_at,
  u.email_change_token_new,
  u.email_change,
  u.email_change_sent_at,
  u.last_sign_in_at,
  u.raw_app_meta_data,
  u.raw_user_meta_data,
  u.is_super_admin,
  u.created_at,
  u.updated_at,
  u.phone,
  u.phone_confirmed_at,
  u.phone_change,
  u.phone_change_token,
  u.phone_change_sent_at,
  u.confirmed_at,
  u.email_change_token_current,
  u.email_change_confirm_status,
  u.banned_until,
  u.reauthentication_token,
  u.reauthentication_sent_at,
  u.is_sso_user,
  u.deleted_at,
  u.is_anonymous,
  p.role AS profile_role,
  p.module,
  p.created_at AS criado,
  p.status,
  COALESCE(umr.module_roles, '{}') AS module_roles
FROM users u
JOIN profiles p ON u.id = p."user"
LEFT JOIN public.user_module_roles umr ON u.id = umr.user_id;
