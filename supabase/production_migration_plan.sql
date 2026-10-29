-- ==============================================================================
-- GURU FITNESS & NUTRITIONS: PRODUCTION DATABASE SCHEMA MIGRATION PLAN
-- Target: LIVE PRODUCTION ONLY (Project ID: sbtzzuwmxwjxahvjyizt)
-- URL: https://sbtzzuwmxwjxahvjyizt.supabase.co
--
-- STRICT DIRECTIVE:
-- DO NOT EXECUTE ON STAGING (Project ID: bvlbadqvbwanaugxyfof).
--
-- PURPOSE:
-- Deploys the missing 10 application tables, security functions, status protection
-- triggers, RLS policies, official pricing plans, and backfills profiles for existing
-- auth users while strictly preserving existing admins (krinectra17@gmail.com and
-- krishna.pvt0011@gmail.com), custom pricing, and current role assignments.
--
-- ==============================================================================
-- SECTION A: PRE-MIGRATION READ-ONLY INSPECTION QUERIES
-- (Execute these queries first in SQL Editor before running the atomic migration)
-- ==============================================================================

-- PRE-CHECK 1: Confirm connected database identity and environment
SELECT current_database(), current_user, inet_server_addr(), now();

-- PRE-CHECK 2: Confirm existing public tables (expect only user_roles)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- PRE-CHECK 3: Inspect existing auth users
SELECT id, email, created_at, raw_user_meta_data
FROM auth.users
WHERE email IN ('krinectra17@gmail.com', 'krishna.pvt0011@gmail.com', 'ks9530398@gmail.com')
ORDER BY email;

-- PRE-CHECK 4: Inspect existing user_roles (confirm admin roles for both accounts)
SELECT ur.id, ur.user_id, u.email, ur.role, ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY u.email;

-- PRE-CHECK 5: Check for any duplicate user_ids in user_roles (must return 0)
SELECT user_id, COUNT(*) AS duplicate_count
FROM public.user_roles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- PRE-CHECK 6: Confirm public.profiles does not exist yet (must return false)
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
) AS profiles_already_exists;

-- ==============================================================================
-- SECTION B: ATOMIC DDL & DATA MIGRATION (TRANSACTION BLOCK)
-- ==============================================================================

-- Prerequisite extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

-- ==============================================================================
-- 1. TABLES CREATION (Strict Dependency Order)
-- ==============================================================================

-- 1.1 PROFILES TABLE (Core user profile; references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL DEFAULT '',
    date_of_birth DATE,
    gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    address TEXT,
    profile_image TEXT,
    emergency_contact TEXT,
    status TEXT NOT NULL DEFAULT 'pending_activation' CHECK (status IN ('pending_activation', 'active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.2 USER ROLES TABLE (Already exists in production; ensured with constraints)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure user_roles has unique constraint on user_id to prevent conflicting roles
DO $$
DECLARE
    dup_count INT;
BEGIN
    -- Check if any duplicate user_id exists in user_roles before adding unique constraint
    SELECT COUNT(*) INTO dup_count
    FROM (
        SELECT user_id FROM public.user_roles GROUP BY user_id HAVING COUNT(*) > 1
    ) sub;

    IF dup_count > 0 THEN
        RAISE EXCEPTION 'Cannot add unique constraint user_roles_user_id_key: % duplicate user_ids found in public.user_roles.', dup_count;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_roles_user_id_key' AND conrelid = 'public.user_roles'::regclass
    ) THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 1.3 MEMBERSHIP PLANS TABLE (Official pricing catalog)
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('strength', 'cardio_fatloss_yoga', 'personal_training')),
    name TEXT NOT NULL,
    duration_type TEXT NOT NULL CHECK (duration_type IN ('monthly', 'quarterly', 'half_yearly', 'yearly')),
    duration_months INT NOT NULL DEFAULT 1,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (base_price >= 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE NOT NULL DEFAULT '2026-08-01',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(category, duration_type)
);

-- 1.4 GYM SETTINGS TABLE (Single-row configuration for operating hours, phone numbers)
CREATE TABLE IF NOT EXISTS public.gym_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    gym_name TEXT NOT NULL DEFAULT 'GURU FITNESS & NUTRITIONS',
    tagline TEXT NOT NULL DEFAULT 'Transforming Bodies, Transforming Lives.',
    brand_promise TEXT NOT NULL DEFAULT 'Expert Training. Scientific Nutrition. Real Results. Lifetime Support.',
    phone_primary TEXT NOT NULL DEFAULT '9828482505',
    phone_secondary TEXT NOT NULL DEFAULT '7014838282',
    instagram_handle TEXT NOT NULL DEFAULT 'rakesh_bagra_fit',
    address TEXT DEFAULT 'Commercial Complex, Main Market Road, Jaipur, Rajasthan (Contact management for landmark)',
    google_maps_url TEXT DEFAULT 'https://maps.google.com/?q=Guru+Fitness+Jaipur',
    opening_hours_weekdays TEXT DEFAULT '5:30 AM - 10:00 PM',
    opening_hours_sunday TEXT DEFAULT '6:00 AM - 1:00 PM',
    effective_date_notice TEXT DEFAULT 'Pricing schedule effective from 1 August 2026',
    attendance_cutoff_time TIME DEFAULT '22:00:00',
    group_discount_percent NUMERIC(5,2) DEFAULT 15.00,
    group_discount_min_people INT DEFAULT 3,
    whatsapp_api_configured BOOLEAN DEFAULT false,
    whatsapp_phone_number_id TEXT,
    whatsapp_business_account_id TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.5 MEMBERSHIPS TABLE (Active & pending member contracts)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_code TEXT NOT NULL UNIQUE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
    agreed_price NUMERIC(10, 2) NOT NULL,
    discount_type TEXT DEFAULT 'none' CHECK (discount_type IN ('none', 'group_15', 'custom')),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(10, 2) NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_activation' CHECK (status IN ('pending_activation', 'active', 'expired', 'suspended', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.6 PAYMENTS TABLE (Receipts & fee settlement records)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number TEXT NOT NULL UNIQUE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'online')),
    transaction_reference TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.7 ATTENDANCE TABLE (Daily check-ins)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    check_out_time TIMESTAMPTZ,
    check_in_method TEXT NOT NULL DEFAULT 'admin_manual' CHECK (check_in_method IN ('qr_code', 'admin_manual', 'kiosk')),
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
    notes TEXT,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(member_id, attendance_date)
);

-- 1.8 NOTIFICATIONS TABLE (Member notifications & alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'payment', 'expiry', 'attendance', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.9 REMINDER LOGS TABLE (Automated & manual WhatsApp reminders)
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('three_days_before_expiry', 'one_day_before_expiry', 'on_expiry_day', 'post_expiry', 'fee_due', 'general')),
    target_phone TEXT NOT NULL,
    message_content TEXT NOT NULL,
    delivery_channel TEXT NOT NULL CHECK (delivery_channel IN ('manual_whatsapp', 'whatsapp_api')),
    delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('sent', 'pending', 'failed', 'delivered')),
    external_message_id TEXT,
    error_message TEXT,
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.10 REGISTRATION REQUESTS TABLE (Public online member inquiries)
CREATE TABLE IF NOT EXISTS public.registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL,
    is_group_discount BOOLEAN NOT NULL DEFAULT false,
    group_member_count INT DEFAULT 1 CHECK (group_member_count >= 1),
    agreed_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (agreed_price >= 0),
    final_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (final_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
    notes TEXT,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.11 AUDIT LOGS TABLE (Immutable admin action trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON public.memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_memberships_expiry_date ON public.memberships(expiry_date);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_membership_id ON public.payments(membership_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON public.attendance(member_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON public.notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_member_id ON public.reminder_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON public.registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON public.registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);

-- ==============================================================================
-- 3. SECURITY FUNCTIONS
-- ==============================================================================

-- 3.1 is_admin(): Parameterless caller check, STABLE, SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    caller_uid UUID;
BEGIN
    caller_uid := auth.uid();

    IF caller_uid IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = caller_uid AND ur.role = 'admin'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- 3.2 get_my_role(): Safe self-role lookup for client initialization
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
    caller_uid UUID;
    current_role TEXT;
BEGIN
    caller_uid := auth.uid();
    
    IF caller_uid IS NULL THEN
        RETURN 'member';
    END IF;

    SELECT ur.role INTO current_role
    FROM public.user_roles ur
    WHERE ur.user_id = caller_uid
    ORDER BY CASE WHEN ur.role = 'admin' THEN 1 ELSE 2 END
    LIMIT 1;

    RETURN COALESCE(current_role, 'member');
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_role() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO service_role;

-- 3.3 promote_user_to_admin(TEXT): Hardened promotion function
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    target_user_id UUID;
    caller_jwt_role TEXT;
    caller_uid UUID;
BEGIN
    caller_jwt_role := NULLIF(pg_catalog.current_setting('request.jwt.claim.role', true), '');
    caller_uid := auth.uid();

    IF caller_jwt_role IS NOT NULL THEN
        IF caller_jwt_role = 'anon' THEN
            RAISE EXCEPTION 'Access Denied: Unauthenticated clients cannot promote users.';
        ELSIF caller_jwt_role <> 'service_role' THEN
            IF caller_uid IS NULL OR NOT public.is_admin() THEN
                RAISE EXCEPTION 'Access Denied: Only service_role or active administrators can promote users.';
            END IF;
        END IF;
    ELSE
        IF session_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
            IF caller_uid IS NULL OR NOT public.is_admin() THEN
                RAISE EXCEPTION 'Access Denied: Direct caller does not possess administrative privileges.';
            END IF;
        END IF;
    END IF;

    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = pg_catalog.lower(pg_catalog.btrim(target_email));

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email "%" not found in auth.users. The account must be created first before promoting.', target_email;
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

    INSERT INTO public.profiles (id, full_name, email, phone, status, created_at, updated_at)
    SELECT 
        target_user_id,
        COALESCE(u.raw_user_meta_data->>'full_name', pg_catalog.split_part(target_email, '@', 1)),
        pg_catalog.lower(pg_catalog.btrim(target_email)),
        COALESCE(u.raw_user_meta_data->>'phone', ''),
        'active',
        pg_catalog.now(),
        pg_catalog.now()
    FROM auth.users u
    WHERE u.id = target_user_id
    ON CONFLICT (id) DO UPDATE SET status = 'active', updated_at = pg_catalog.now();
END;
$$;

REVOKE ALL ON FUNCTION public.promote_user_to_admin(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.promote_user_to_admin(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.promote_user_to_admin(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO service_role;

-- 3.4 admin_approve_and_activate_member: Atomic member and membership activation RPC
CREATE OR REPLACE FUNCTION public.admin_approve_and_activate_member(
    target_member_id UUID,
    target_membership_id UUID,
    initial_payment_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_method TEXT DEFAULT 'cash',
    payment_reference TEXT DEFAULT NULL,
    admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    caller_jwt_role TEXT;
    caller_uid UUID;
    caller_email TEXT;
    target_profile_record RECORD;
    target_membership_record RECORD;
    existing_payment_id UUID;
    new_payment_id UUID;
    new_payment_number TEXT;
    payment_recorded BOOLEAN := false;
    payment_status_msg TEXT := 'No payment recorded (amount was 0 or omitted).';
    clean_ref TEXT;
BEGIN
    -- 1. AUTHORIZATION CHECK
    caller_jwt_role := NULLIF(pg_catalog.current_setting('request.jwt.claim.role', true), '');
    caller_uid := auth.uid();

    IF caller_jwt_role IS NOT NULL THEN
        IF caller_jwt_role = 'anon' THEN
            RAISE EXCEPTION 'Access Denied: Unauthenticated clients cannot activate members.';
        ELSIF caller_jwt_role <> 'service_role' THEN
            IF caller_uid IS NULL OR NOT public.is_admin() THEN
                RAISE EXCEPTION 'Access Denied: Only authenticated administrators can activate members.';
            END IF;
        END IF;
    ELSE
        IF session_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
            IF caller_uid IS NULL OR NOT public.is_admin() THEN
                RAISE EXCEPTION 'Access Denied: Direct caller does not possess administrative privileges.';
            END IF;
        END IF;
    END IF;

    -- Retrieve caller email for audit logging
    IF caller_uid IS NOT NULL THEN
        SELECT email INTO caller_email FROM auth.users WHERE id = caller_uid;
    ELSE
        caller_email := session_user;
    END IF;

    -- 2. VALIDATE INPUT ARGUMENTS
    IF target_member_id IS NULL THEN
        RAISE EXCEPTION 'Invalid Argument: target_member_id cannot be NULL.';
    END IF;
    IF target_membership_id IS NULL THEN
        RAISE EXCEPTION 'Invalid Argument: target_membership_id cannot be NULL.';
    END IF;

    -- 3. VERIFY TARGET PROFILE EXISTS (Row locked FOR UPDATE to prevent race conditions)
    SELECT id, status, full_name, email INTO target_profile_record
    FROM public.profiles
    WHERE id = target_member_id
    FOR UPDATE;

    IF target_profile_record.id IS NULL THEN
        RAISE EXCEPTION 'Target member profile "%" does not exist in public.profiles.', target_member_id;
    END IF;

    -- 4. VERIFY TARGET MEMBERSHIP EXISTS AND BELONGS TO MEMBER (Row locked FOR UPDATE)
    SELECT id, member_id, plan_id, agreed_price, discount_type, discount_amount, final_amount, start_date, expiry_date, status, membership_code
    INTO target_membership_record
    FROM public.memberships
    WHERE id = target_membership_id
    FOR UPDATE;

    IF target_membership_record.id IS NULL THEN
        RAISE EXCEPTION 'Target membership "%" does not exist in public.memberships.', target_membership_id;
    END IF;

    IF target_membership_record.member_id <> target_member_id THEN
        RAISE EXCEPTION 'Integrity Failure: Membership "%" belongs to member "%", not target member "%".',
            target_membership_id, target_membership_record.member_id, target_member_id;
    END IF;

    -- 5. VERIFY ELIGIBILITY AND IDEMPOTENCY
    -- If already active, handle as an idempotent retry (prevent duplicate payment/activation)
    IF target_membership_record.status = 'active' AND target_profile_record.status = 'active' THEN
        SELECT id, payment_number INTO existing_payment_id, new_payment_number
        FROM public.payments
        WHERE membership_id = target_membership_id
        ORDER BY created_at DESC
        LIMIT 1;

        RETURN pg_catalog.jsonb_build_object(
            'success', true,
            'idempotent', true,
            'message', 'Member and membership were already active. No duplicate changes applied.',
            'member_id', target_member_id,
            'membership_id', target_membership_id,
            'profile_status', 'active',
            'membership_status', 'active',
            'payment_recorded', (existing_payment_id IS NOT NULL),
            'payment_number', new_payment_number
        );
    END IF;

    IF target_membership_record.status <> 'pending_activation' THEN
        RAISE EXCEPTION 'Membership "%" has status "%". Only memberships in "pending_activation" status can be approved.',
            target_membership_id, target_membership_record.status;
    END IF;

    -- 6. ATOMIC STATUS UPDATES
    -- Update Profile to active
    UPDATE public.profiles
    SET status = 'active',
        updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
    WHERE id = target_member_id;

    -- Update Membership to active (preserving all agreed financial terms, discount, and dates)
    UPDATE public.memberships
    SET status = 'active',
        updated_at = pg_catalog.timezone('utc'::text, pg_catalog.now())
    WHERE id = target_membership_id;

    -- 7. GENUINE PAYMENT RECORDING (NO FABRICATED RECORDS)
    IF initial_payment_amount IS NOT NULL AND initial_payment_amount > 0 THEN
        clean_ref := NULLIF(pg_catalog.btrim(payment_reference), '');

        -- Validate payment method
        IF payment_method NOT IN ('cash', 'upi', 'bank_transfer', 'online') THEN
            RAISE EXCEPTION 'Invalid payment method "%". Must be cash, upi, bank_transfer, or online.', payment_method;
        END IF;

        -- Idempotency check: verify payment was not already recorded for this reference
        IF clean_ref IS NOT NULL THEN
            SELECT id INTO existing_payment_id
            FROM public.payments
            WHERE membership_id = target_membership_id
              AND transaction_reference = clean_ref
            LIMIT 1;
        END IF;

        IF existing_payment_id IS NOT NULL THEN
            payment_recorded := false;
            payment_status_msg := 'Payment with reference ' || clean_ref || ' was already recorded (idempotent skipped).';
        ELSE
            new_payment_id := gen_random_uuid();
            new_payment_number := 'RCP-' || pg_catalog.to_char(pg_catalog.now(), 'YYYYMMDD') || '-' || pg_catalog.upper(pg_catalog.substr(gen_random_uuid()::text, 1, 6));

            INSERT INTO public.payments (
                id,
                payment_number,
                member_id,
                membership_id,
                amount,
                payment_date,
                payment_method,
                transaction_reference,
                notes,
                recorded_by,
                created_at
            )
            VALUES (
                new_payment_id,
                new_payment_number,
                target_member_id,
                target_membership_id,
                initial_payment_amount,
                pg_catalog.CURRENT_DATE,
                payment_method,
                clean_ref,
                COALESCE(admin_notes, 'Initial fee settlement during membership activation.'),
                caller_uid,
                pg_catalog.timezone('utc'::text, pg_catalog.now())
            );

            payment_recorded := true;
            payment_status_msg := 'Payment recorded with receipt number ' || new_payment_number || ' (' || payment_method || ' ₹' || initial_payment_amount::text || ').';
        END IF;
    END IF;

    -- 8. SYSTEM NOTIFICATION (Non-failing)
    INSERT INTO public.notifications (
        member_id,
        title,
        message,
        type,
        link,
        created_at
    )
    VALUES (
        target_member_id,
        'Membership Activated!',
        'Welcome to GURU FITNESS & NUTRITIONS! Your membership has been approved and activated. Your digital workout pass is ready.',
        'payment',
        '/dashboard/membership',
        pg_catalog.timezone('utc'::text, pg_catalog.now())
    );

    -- 9. AUDIT LOGGING
    INSERT INTO public.audit_logs (
        actor_id,
        actor_email,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    )
    VALUES (
        caller_uid,
        caller_email,
        'MEMBER_APPROVED_AND_ACTIVATED',
        'memberships',
        target_membership_id::text,
        pg_catalog.jsonb_build_object(
            'member_id', target_member_id,
            'membership_code', target_membership_record.membership_code,
            'agreed_price', target_membership_record.agreed_price,
            'final_amount', target_membership_record.final_amount,
            'initial_payment_amount', initial_payment_amount,
            'payment_recorded', payment_recorded,
            'payment_number', new_payment_number
        ),
        pg_catalog.timezone('utc'::text, pg_catalog.now())
    );

    -- 10. RETURN STRUCTURED RESULT
    RETURN pg_catalog.jsonb_build_object(
        'success', true,
        'idempotent', false,
        'message', 'Member profile and membership successfully activated in single atomic transaction.',
        'member_id', target_member_id,
        'membership_id', target_membership_id,
        'profile_status', 'active',
        'membership_status', 'active',
        'payment_recorded', payment_recorded,
        'payment_number', new_payment_number,
        'payment_message', payment_status_msg
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_and_activate_member(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_approve_and_activate_member(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_and_activate_member(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_and_activate_member(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_approve_and_activate_member(UUID, UUID, NUMERIC, TEXT, TEXT, TEXT) TO postgres;

-- ==============================================================================
-- 4. INTEGRITY & SECURITY TRIGGERS
-- ==============================================================================

-- 4.1 Protect Profile Status (Only Admins can change status or email)
CREATE OR REPLACE FUNCTION public.protect_profile_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
            NEW.status := 'pending_activation';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
            IF OLD.status IS DISTINCT FROM NEW.status THEN
                NEW.status := OLD.status;
            END IF;
            IF OLD.email IS DISTINCT FROM NEW.email THEN
                NEW.email := OLD.email;
            END IF;
        END IF;
    END IF;
    NEW.updated_at := pg_catalog.timezone('utc'::text, pg_catalog.now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_status ON public.profiles;
CREATE TRIGGER trg_protect_profile_status
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_profile_status();

-- 4.2 Protect Membership Status (Only Admins can approve/activate memberships)
CREATE OR REPLACE FUNCTION public.protect_membership_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
            NEW.status := 'pending_activation';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
            IF OLD.status IS DISTINCT FROM NEW.status THEN
                NEW.status := OLD.status;
            END IF;
        END IF;
    END IF;
    NEW.updated_at := pg_catalog.timezone('utc'::text, pg_catalog.now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_membership_status ON public.memberships;
CREATE TRIGGER trg_protect_membership_status
    BEFORE INSERT OR UPDATE ON public.memberships
    FOR EACH ROW EXECUTE FUNCTION public.protect_membership_status();

-- 4.3 Safe Auth Signup Trigger (Creates pending profile and member role on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (
        id, full_name, email, phone, status, created_at, updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', pg_catalog.split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'pending_activation',
        pg_catalog.now(),
        pg_catalog.now()
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 USER ROLES POLICIES (Non-recursive: auth.uid() = user_id on SELECT)
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Only admins can insert roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
    ON public.user_roles FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete roles"
    ON public.user_roles FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 5.2 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- 5.3 MEMBERSHIP PLANS POLICIES
DROP POLICY IF EXISTS "Public can view plans" ON public.membership_plans;
DROP POLICY IF EXISTS "Admins manage plans" ON public.membership_plans;

CREATE POLICY "Public can view plans"
    ON public.membership_plans FOR SELECT
    USING (true);

CREATE POLICY "Admins manage plans"
    ON public.membership_plans FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.4 GYM SETTINGS POLICIES
DROP POLICY IF EXISTS "Public view settings" ON public.gym_settings;
DROP POLICY IF EXISTS "Admins update settings" ON public.gym_settings;

CREATE POLICY "Public view settings"
    ON public.gym_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins update settings"
    ON public.gym_settings FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.5 MEMBERSHIPS POLICIES
DROP POLICY IF EXISTS "Members view own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Members can insert pending membership" ON public.memberships;
DROP POLICY IF EXISTS "Admins manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins delete memberships" ON public.memberships;

CREATE POLICY "Members view own memberships"
    ON public.memberships FOR SELECT
    TO authenticated
    USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "Members can insert pending membership"
    ON public.memberships FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.uid() = member_id AND status = 'pending_activation')
        OR public.is_admin()
    );

CREATE POLICY "Admins manage memberships"
    ON public.memberships FOR UPDATE
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins delete memberships"
    ON public.memberships FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 5.6 PAYMENTS POLICIES
DROP POLICY IF EXISTS "Members view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;

CREATE POLICY "Members view own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "Admins manage payments"
    ON public.payments FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.7 ATTENDANCE POLICIES
DROP POLICY IF EXISTS "Members view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Members check-in" ON public.attendance;
DROP POLICY IF EXISTS "Admins manage attendance" ON public.attendance;

CREATE POLICY "Members view own attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "Members check-in"
    ON public.attendance FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (
            auth.uid() = member_id 
            AND attendance_date = CURRENT_DATE
            AND EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.status = 'active'
            )
        )
    );

CREATE POLICY "Admins manage attendance"
    ON public.attendance FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.8 NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "Members view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Members insert own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Members update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins manage all notifications" ON public.notifications;

CREATE POLICY "Members view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "Members insert own notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "Members update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "Admins manage all notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.9 REMINDER LOGS POLICIES
DROP POLICY IF EXISTS "Members view own reminder logs" ON public.reminder_logs;
DROP POLICY IF EXISTS "Admins manage reminder logs" ON public.reminder_logs;

CREATE POLICY "Members view own reminder logs"
    ON public.reminder_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = member_id OR public.is_admin());

CREATE POLICY "Admins manage reminder logs"
    ON public.reminder_logs FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.10 REGISTRATION REQUESTS POLICIES
DROP POLICY IF EXISTS "Public and members can submit registration requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Admins can insert registration requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Users view own registration requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Admins manage registration requests" ON public.registration_requests;

CREATE POLICY "Public and members can submit registration requests"
    ON public.registration_requests FOR INSERT
    TO public
    WITH CHECK (
        status = 'pending'
        AND processed_by IS NULL
        AND processed_at IS NULL
        AND (
            (auth.uid() IS NULL AND user_id IS NULL)
            OR
            (auth.uid() IS NOT NULL AND user_id = auth.uid())
        )
    );

CREATE POLICY "Admins can insert registration requests"
    ON public.registration_requests FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Users view own registration requests"
    ON public.registration_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage registration requests"
    ON public.registration_requests FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5.11 AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins insert audit logs" ON public.audit_logs;

CREATE POLICY "Admins view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Admins insert audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        AND (actor_id IS NULL OR actor_id = auth.uid())
    );

-- ==============================================================================
-- 6. OFFICIAL SEED DATA (Non-Destructive & Preserves Custom Modifications)
-- ==============================================================================
INSERT INTO public.membership_plans (category, name, duration_type, duration_months, base_price, description, effective_date)
VALUES
    -- STRENGTH TRAINING
    ('strength', 'Strength Training - Monthly', 'monthly', 1, 800.00, 'Full gym floor and strength training equipment access.', '2026-08-01'),
    ('strength', 'Strength Training - Quarterly (3 Months)', 'quarterly', 3, 2000.00, '3 months comprehensive strength regimen.', '2026-08-01'),
    ('strength', 'Strength Training - Half-Yearly (6 Months)', 'half_yearly', 6, 3500.00, '6 months focused progressive overload and strength building.', '2026-08-01'),
    ('strength', 'Strength Training - Yearly (12 Months)', 'yearly', 12, 5000.00, '365 days of full gym access and strength progression.', '2026-08-01'),

    -- CARDIO / FAT LOSS / YOGA
    ('cardio_fatloss_yoga', 'Cardio / Fat Loss / Yoga - Monthly', 'monthly', 1, 1200.00, 'Aerobic conditioning, HIIT fat loss circuits, and yoga sessions.', '2026-08-01'),
    ('cardio_fatloss_yoga', 'Cardio / Fat Loss / Yoga - Quarterly (3 Months)', 'quarterly', 3, 3000.00, 'Structured fat loss conditioning and metabolic enhancement.', '2026-08-01'),
    ('cardio_fatloss_yoga', 'Cardio / Fat Loss / Yoga - Half-Yearly (6 Months)', 'half_yearly', 6, 5000.00, 'Sustainable transformation, cardio endurance, and mobility.', '2026-08-01'),
    ('cardio_fatloss_yoga', 'Cardio / Fat Loss / Yoga - Yearly (12 Months)', 'yearly', 12, 8000.00, 'Complete annual lifestyle transformation, cardio & yoga integration.', '2026-08-01'),

    -- PERSONAL TRAINING
    ('personal_training', 'Personal Training - Monthly', 'monthly', 1, 4000.00, '1-on-1 personalized coaching with Head Coach Rakesh Bagra / Chitra Bagra.', '2026-08-01'),
    ('personal_training', 'Personal Training - Quarterly (3 Months)', 'quarterly', 3, 9000.00, 'High-intensity tailored periodization, 1-on-1 supervision & bi-weekly check-ins.', '2026-08-01'),
    ('personal_training', 'Personal Training - Half-Yearly (6 Months)', 'half_yearly', 6, 15000.00, 'Complete 6-month elite body recomposition with bespoke nutrition & training.', '2026-08-01'),
    ('personal_training', 'Personal Training - Yearly (12 Months)', 'yearly', 12, 21000.00, 'Elite 365-day dedicated personal mentorship and competition/physique conditioning.', '2026-08-01')
ON CONFLICT (category, duration_type) DO NOTHING;

INSERT INTO public.gym_settings (id, gym_name, tagline, phone_primary, phone_secondary, instagram_handle)
VALUES (1, 'GURU FITNESS & NUTRITIONS', 'Transforming Bodies, Transforming Lives.', '9828482505', '7014838282', 'rakesh_bagra_fit')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 7. SAFE DATA BACKFILL FOR EXISTING USERS
-- Preserves existing administrators:
-- - krinectra17@gmail.com
-- - krishna.pvt0011@gmail.com
-- Backfills profiles for all existing auth.users without overwriting or demoting.
-- ==============================================================================

-- 7.1 Create profiles for existing auth users if missing
INSERT INTO public.profiles (id, full_name, email, phone, status, created_at, updated_at)
SELECT 
    u.id, 
    COALESCE(u.raw_user_meta_data->>'full_name', pg_catalog.split_part(u.email, '@', 1)), 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'phone', ''), 
    CASE 
        WHEN ur.role = 'admin' THEN 'active'
        ELSE 'pending_activation'
    END, 
    pg_catalog.now(), 
    pg_catalog.now()
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ON CONFLICT (id) DO NOTHING;

-- 7.2 Ensure existing administrators have status = 'active'
UPDATE public.profiles p
SET status = 'active', updated_at = pg_catalog.now()
FROM public.user_roles ur
WHERE p.id = ur.user_id
  AND ur.role = 'admin'
  AND p.status <> 'active';

-- 7.3 Assign default 'member' role ONLY to users who have no role record at all
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'member' 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================================
-- COMMIT ATOMIC TRANSACTION
-- ==============================================================================
COMMIT;

-- ==============================================================================
-- SECTION C: POST-MIGRATION READ-ONLY VERIFICATION QUERIES
-- (Execute these queries in the SQL Editor immediately following COMMIT)
-- ==============================================================================

-- 1. Verify all 11 tables exist in public schema:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'user_roles', 'membership_plans', 'gym_settings', 'memberships',
    'payments', 'attendance', 'notifications', 'reminder_logs', 'registration_requests', 'audit_logs'
  )
ORDER BY table_name;
-- Expected: Exactly 11 rows returned.

-- 2. Verify Row Level Security is enabled on all 11 tables:
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN (
    'profiles', 'user_roles', 'membership_plans', 'gym_settings', 'memberships',
    'payments', 'attendance', 'notifications', 'reminder_logs', 'registration_requests', 'audit_logs'
  )
ORDER BY relname;
-- Expected: Exactly 11 rows with rls_enabled = true.

-- 3. Verify existing admins are preserved with role = 'admin' and status = 'active':
SELECT u.email, ur.role AS verified_role, p.status AS profile_status
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.profiles p ON p.id = u.id
WHERE ur.role = 'admin'
ORDER BY u.email;
-- Expected: krinectra17@gmail.com and krishna.pvt0011@gmail.com both have role='admin' and status='active'.

-- 4. Verify existing member Krishna Soni (ks9530398@gmail.com) has profile and pending status:
SELECT u.email, ur.role, p.status
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'ks9530398@gmail.com';
-- Expected: role = 'member', status = 'pending_activation'.

-- 5. Verify NO fabricated membership records were created for Krishna Soni:
SELECT COUNT(*) AS krishna_soni_memberships_count
FROM public.memberships
WHERE member_id = (SELECT id FROM auth.users WHERE email = 'ks9530398@gmail.com');
-- Expected: 0 (No fabricated data; admin will assign program legitimately via the front-desk UI).

-- 6. Verify official pricing catalog was seeded:
SELECT category, name, duration_type, base_price, is_active
FROM public.membership_plans
ORDER BY category, duration_months;
-- Expected: 12 rows corresponding to official gym pricing schedule.

-- 7. Verify gym settings configuration row exists:
SELECT id, gym_name, phone_primary, phone_secondary, instagram_handle
FROM public.gym_settings
WHERE id = 1;
-- Expected: 1 row with 'GURU FITNESS & NUTRITIONS', '9828482505', '7014838282', 'rakesh_bagra_fit'.

-- 8. Verify security functions exist and have SECURITY DEFINER attribute:
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'is_admin', 'get_my_role', 'promote_user_to_admin', 
    'admin_approve_and_activate_member', 
    'protect_profile_status', 'protect_membership_status', 'handle_new_user'
  )
ORDER BY routine_name;
-- Expected: Exactly 7 routines, all with security_type = 'DEFINER'.

-- 9. Verify restricted permissions on admin_approve_and_activate_member:
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public' 
  AND routine_name = 'admin_approve_and_activate_member'
ORDER BY grantee;
-- Expected: postgres, service_role, and authenticated have EXECUTE. anon and PUBLIC do NOT have EXECUTE.

-- 10. Verify non-recursive user_roles RLS policies:
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_roles'
ORDER BY policyname;
-- Expected: "Users can view own role" (SELECT, auth.uid() = user_id),
-- "Only admins can insert/update/delete roles" (public.is_admin()).

-- ==============================================================================
-- SECTION D: FORWARD-RECOVERY & NON-DESTRUCTIVE SAFETY GUIDELINES
-- ==============================================================================
-- 1. TRANSACTION ATOMICITY:
--    The entire schema deployment in SECTION B runs inside an atomic BEGIN ... COMMIT block.
--    If any syntax error, constraint conflict, or permission issue occurs during execution,
--    PostgreSQL rolls back all DDL statements automatically, leaving the production database
--    completely untouched.
--
-- 2. FORBIDDEN ACTIONS - NO DESTRUCTIVE ROLLBACKS:
--    NEVER execute "DROP TABLE ... CASCADE" against the live production database once committed.
--    Dropping tables with cascade would permanently delete live member profiles, active memberships,
--    attendance logs, and financial transaction history.
--
-- 3. FORWARD FIX PROCEDURE:
--    If any schema adjustment or policy refinement is required after commit:
--    - For RLS policies: Use "DROP POLICY policy_name ON table_name;" followed by "CREATE POLICY ...".
--    - For table columns: Use "ALTER TABLE table_name ADD COLUMN / ALTER COLUMN ...".
--    - For stored procedures/triggers: Use "CREATE OR REPLACE FUNCTION ...".
-- ==============================================================================
