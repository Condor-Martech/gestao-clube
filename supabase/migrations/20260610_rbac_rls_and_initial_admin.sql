-- Hardening for the RBAC system:
--   1. Row-Level Security on user_module_roles so a leaked anon/authenticated
--      client can never read or modify another user's module assignments.
--   2. A BEFORE INSERT trigger on profiles that auto-promotes the very first
--      account whose email matches app.initial_admin_email to role = 'admin'.
--      Configure once per environment with:
--        ALTER DATABASE postgres SET app.initial_admin_email = 'admin@example.com';
--      (replace postgres with the actual database name if different).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. RLS on user_module_roles
-- ─────────────────────────────────────────────────────────────────────────────

-- SECURITY DEFINER helper. Lets policies ask "is the current user an admin?"
-- without triggering RLS recursion on profiles. STABLE so Postgres can cache
-- the result inside a single statement.
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE "user" = check_user_id
      AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin(uuid) IS
  'Returns true if the given user_id has profiles.role = ''admin''.
   Used by RLS policies on user_module_roles to avoid recursive policy checks.';

ALTER TABLE public.user_module_roles ENABLE ROW LEVEL SECURITY;

-- Users may read their OWN module roles (the app needs this to render the UI).
CREATE POLICY user_module_roles_select_own
ON public.user_module_roles
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Admins may read EVERYONE's module roles (admin UI lists all users).
CREATE POLICY user_module_roles_select_admin
ON public.user_module_roles
FOR SELECT
TO authenticated
USING (public.is_admin((SELECT auth.uid())));

-- Only admins may create module role rows.
CREATE POLICY user_module_roles_insert_admin
ON public.user_module_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin((SELECT auth.uid())));

-- Only admins may update existing module role rows.
CREATE POLICY user_module_roles_update_admin
ON public.user_module_roles
FOR UPDATE
TO authenticated
USING (public.is_admin((SELECT auth.uid())))
WITH CHECK (public.is_admin((SELECT auth.uid())));

-- Only admins may delete module role rows.
CREATE POLICY user_module_roles_delete_admin
ON public.user_module_roles
FOR DELETE
TO authenticated
USING (public.is_admin((SELECT auth.uid())));

-- Note: the service_role key bypasses RLS entirely, so the admin client
-- (lib/supabase/admin.ts) is unaffected and continues to work in
-- Server Actions that create/update users.

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Initial admin trigger
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.promote_initial_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  configured_email text;
  signup_email text;
BEGIN
  -- Read the configured admin email from the DB-level GUC.
  -- Returns NULL (not error) if the setting was never set.
  configured_email := nullif(current_setting('app.initial_admin_email', true), '');
  IF configured_email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT email INTO signup_email
  FROM auth.users
  WHERE id = NEW."user";

  IF signup_email IS NOT NULL
     AND lower(signup_email) = lower(configured_email) THEN
    NEW.role := 'admin';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.promote_initial_admin() IS
  'BEFORE INSERT trigger on profiles. If the new profile belongs to the email
   stored in the app.initial_admin_email GUC, force role = ''admin''.
   Set the GUC once per environment via:
     ALTER DATABASE postgres SET app.initial_admin_email = ''you@example.com'';
   Then reconnect (or restart) so the new sessions see the value.';

DROP TRIGGER IF EXISTS promote_initial_admin_trigger ON public.profiles;
CREATE TRIGGER promote_initial_admin_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_initial_admin();
