-- ==============================================================================
-- GURU FITNESS & NUTRITIONS: SECURE ADMIN PROVISIONING PROCEDURE
-- ==============================================================================
--
-- This script provides the official, production-safe administrative provisioning
-- procedure for assigning the 'admin' role to gym management.
--
-- SECURITY PRINCIPLES:
-- 1. Never use public registration forms to create administrative accounts.
-- 2. Never embed administrator credentials or passwords in source control.
-- 3. Only authorized administrators with direct database/dashboard access can execute this.
-- 4. All role verification is database-backed and fails closed.
--
-- PROCEDURE:
-- Step 1: In the Supabase Dashboard, navigate to:
--         Authentication -> Users -> "Add user" -> "Create user"
--         - Enter the gym owner's email address (e.g. coach/owner's official email)
--         - Set a strong password
--         - Ensure "Auto Confirm User?" is checked (Yes)
--
-- Step 2: In the Supabase SQL Editor:
--         Execute the script below, replacing '<ADMIN_EMAIL>' with the actual email
--         provisioned in Step 1.
-- ==============================================================================

DO $$
DECLARE
    target_email CONSTANT TEXT := '<ADMIN_EMAIL>'; -- REPLACE WITH ACTUAL ADMIN EMAIL
    target_user_id UUID;
BEGIN
    -- 1. Find user in auth.users
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = LOWER(TRIM(target_email));

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User "%" not found in auth.users. Please create the user first via Supabase Dashboard -> Authentication -> Users.', target_email;
    END IF;

    -- 2. Assign or update verified 'admin' role in public.user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

    -- 3. Ensure profile exists and is marked 'active'
    INSERT INTO public.profiles (id, full_name, email, phone, status, created_at, updated_at)
    SELECT 
        target_user_id,
        COALESCE(u.raw_user_meta_data->>'full_name', 'Rakesh Bagra'),
        LOWER(TRIM(target_email)),
        COALESCE(u.raw_user_meta_data->>'phone', '9828482505'),
        'active',
        now(),
        now()
    FROM auth.users u
    WHERE u.id = target_user_id
    ON CONFLICT (id) DO UPDATE SET status = 'active', updated_at = now();

    RAISE NOTICE 'Administrator successfully provisioned for: % (User ID: %)', target_email, target_user_id;
END $$;

-- ==============================================================================
-- VERIFICATION QUERY
-- ==============================================================================
-- Run this query to verify that the admin role and profile are properly linked:

SELECT 
    u.id AS auth_user_id,
    u.email,
    u.email_confirmed_at,
    ur.role AS verified_role,
    p.status AS profile_status,
    p.full_name
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.profiles p ON p.id = u.id
WHERE ur.role = 'admin';
