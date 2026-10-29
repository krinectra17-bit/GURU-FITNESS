-- ==============================================================================
-- GURU FITNESS & NUTRITIONS — PRODUCTION DATABASE SCHEMA & SECURITY MIGRATION
-- Fully hardened against privilege escalation, search_path attacks, user enumeration, and RLS bypass.
-- Designed for BOTH fresh setups and existing databases where tables already exist.
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard/project/sbtzzuwmxwjxahvjyizt/sql
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: EXTENSIONS (Executed outside the transaction)
-- NOTE ON TRANSACTION BOUNDARIES:
-- In PostgreSQL, extension registration is a database-cluster catalog operation and runs
-- before BEGIN. If an extension is newly created, it persists even if the subsequent
-- transaction block rolls back. All operations from BEGIN to COMMIT below form an atomic
-- transaction: if any assertion fails, all schema, triggers, and data changes roll back.
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TRANSACTION START
-- All tables, constraints, functions, triggers, policies, and seed rows below
-- execute as a single atomic unit.
-- ==============================================================================
BEGIN;

-- ==============================================================================
-- SECTION 2: CREATE ALL 11 TABLES (In strict dependency order)
-- All tables are declared FIRST so subsequent statements never encounter 42P01.
-- ==============================================================================

-- 1. PROFILES TABLE (Core user profile; references auth.users)
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

-- 2. USER ROLES TABLE (Server-Authoritative Authority, Single Deterministic Role per User)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. MEMBERSHIP PLANS TABLE (Official pricing catalog)
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

-- 4. GYM SETTINGS TABLE (Single-row configuration for operating hours, phone numbers, etc.)
CREATE TABLE IF NOT EXISTS public.gym_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    gym_name TEXT NOT NULL DEFAULT 'GURU FITNESS & NUTRITIONS',
    tagline TEXT NOT NULL DEFAULT 'Transforming Bodies, Transforming Lives.',
    brand_promise TEXT NOT NULL DEFAULT 'Expert Training. Scientific Nutrition. Real Results. Lifetime Support.',
    phone_primary TEXT NOT NULL DEFAULT '9828482505',
    phone_secondary TEXT NOT NULL DEFAULT '7014838282',
    instagram_handle TEXT NOT NULL DEFAULT 'rakesh_bagra_fit',
    address TEXT DEFAULT 'Main Market Road, Jaipur, Rajasthan (Contact management for precise landmark)',
    google_maps_url TEXT DEFAULT 'https://maps.google.com',
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

-- 5. MEMBERSHIPS TABLE (Active and pending memberships linked to profiles and plans)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_code TEXT NOT NULL UNIQUE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id),
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

-- 6. PAYMENTS TABLE (Receipts and financial records)
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

-- 7. ATTENDANCE TABLE (Daily check-ins; one record per member per date)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    check_out_time TIMESTAMPTZ,
    check_in_method TEXT NOT NULL DEFAULT 'admin_manual' CHECK (check_in_method IN ('qr_code', 'admin_manual', 'kiosk')),
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused')),
    notes TEXT,
    verified_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(member_id, attendance_date)
);

-- 8. NOTIFICATIONS TABLE (Member communications and alerts)
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

-- 9. REMINDER LOGS TABLE (Automated & manual WhatsApp reminders)
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
    sent_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. REGISTRATION REQUESTS TABLE (Public online member inquiries)
-- NOTE ON UNTRUSTED INPUT & PRICING INTEGRITY:
-- This table captures non-authoritative customer inquiries from public web visitors.
-- agreed_price and final_amount here represent estimated/requested values and MUST NOT
-- be treated as authoritative financial totals. When an administrator or backend service
-- creates an active membership or payment, the authoritative price MUST be computed directly
-- from public.membership_plans.base_price.
CREATE TABLE IF NOT EXISTS public.registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    plan_id UUID REFERENCES public.membership_plans(id),
    is_group_discount BOOLEAN NOT NULL DEFAULT false,
    group_member_count INT DEFAULT 1 CHECK (group_member_count >= 1),
    agreed_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (agreed_price >= 0),
    final_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (final_amount >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
    notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. AUDIT LOGS TABLE (Immutable administrative action audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- SECTION 3: COMPREHENSIVE SCHEMA COMPATIBILITY & DATA INTEGRITY VERIFICATION
-- Explicitly validates and repairs existing tables, columns, data types, foreign keys,
-- primary keys, check constraints, and non-partial unique indexes across ALL 11 tables.
-- Zero silent error suppression: If data violates constraints, halts immediately.
-- ==============================================================================
DO $$
DECLARE
    pk_cols TEXT[];
    null_count INT := 0;
    dup_count INT := 0;
    orphan_count INT := 0;
    invalid_count INT := 0;
    has_exact_fk BOOLEAN := false;
    has_exact_unique BOOLEAN := false;
    has_exact_role_check BOOLEAN := false;
    has_exact_check BOOLEAN := false;
    norm_def TEXT;
    r_con RECORD;
    role_attnum INT;
BEGIN
    -- ==========================================================================
    -- 1. TABLE: public.profiles compatibility & integrity
    -- ==========================================================================
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id UUID;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_activation';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    -- Validate data types of existing columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.profiles.id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email' AND udt_name NOT IN ('text', 'varchar', 'bpchar')) THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.profiles.email has incompatible type (must be text).';
    END IF;

    -- Backfill standard defaults for NULL rows
    UPDATE public.profiles SET full_name = '' WHERE full_name IS NULL;
    UPDATE public.profiles SET phone = '' WHERE phone IS NULL;
    UPDATE public.profiles SET status = 'pending_activation' WHERE status IS NULL;
    UPDATE public.profiles SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;
    UPDATE public.profiles SET updated_at = timezone('utc'::text, now()) WHERE updated_at IS NULL;

    -- Validate NOT NULL columns
    SELECT COUNT(*) INTO null_count FROM public.profiles WHERE id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.profiles contains % NULL id rows.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.profiles WHERE email IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.profiles contains % NULL email rows. Cannot enforce NOT NULL.', null_count; END IF;

    ALTER TABLE public.profiles ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;
    ALTER TABLE public.profiles ALTER COLUMN full_name SET DEFAULT '';
    ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
    ALTER TABLE public.profiles ALTER COLUMN phone SET NOT NULL;
    ALTER TABLE public.profiles ALTER COLUMN phone SET DEFAULT '';
    ALTER TABLE public.profiles ALTER COLUMN status SET NOT NULL;
    ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'pending_activation';
    ALTER TABLE public.profiles ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.profiles ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.profiles ALTER COLUMN updated_at SET NOT NULL;
    ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification on profiles: (id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.profiles'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.profiles has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.profiles ADD PRIMARY KEY (id);
    END IF;

    -- Exact Foreign Key verification: profiles(id) -> auth.users(id) ON DELETE CASCADE
    SELECT COUNT(*) INTO orphan_count
    FROM public.profiles p
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.profiles contains % row(s) whose id does not exist in auth.users. Cannot enforce foreign key.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'profiles'
          AND rn.nspname = 'auth' AND rc.relname = 'users'
          AND c.contype = 'f'
          AND c.confdeltype = 'c'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_id_fkey') THEN
            ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;
        END IF;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Exact Unique verification: profiles(email) - valid, non-partial
    SELECT COUNT(*) INTO dup_count
    FROM (SELECT email FROM public.profiles WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1) d;
    IF dup_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.profiles contains % duplicate email values. Cannot enforce UNIQUE.', dup_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class c ON c.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'profiles'
          AND i.indisunique = true
          AND i.indisvalid = true
          AND i.indpred IS NULL
          AND (
              SELECT ARRAY_AGG(ia.attname::TEXT ORDER BY ia.attnum)
              FROM pg_attribute ia
              WHERE ia.attrelid = i.indexrelid AND ia.attnum > 0 AND ia.attnum <= i.indnkeyatts
          ) = ARRAY['email']::TEXT[]
    ) INTO has_exact_unique;

    IF NOT has_exact_unique THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_email_key') THEN
            ALTER TABLE public.profiles DROP CONSTRAINT profiles_email_key;
        END IF;
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;

    -- Validate profiles status check constraint
    SELECT COUNT(*) INTO invalid_count FROM public.profiles WHERE status NOT IN ('pending_activation', 'active', 'inactive', 'suspended');
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.profiles contains % row(s) with invalid status values outside (pending_activation, active, inactive, suspended).', invalid_count;
    END IF;

    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.profiles'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'status' AND norm_def ~* 'pending_activation' AND norm_def ~* 'active' AND norm_def ~* 'inactive' AND norm_def ~* 'suspended' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'profiles_status_check' THEN
            EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('pending_activation', 'active', 'inactive', 'suspended'));
    END IF;

    -- Validate profiles gender check constraint
    SELECT COUNT(*) INTO invalid_count FROM public.profiles WHERE gender IS NOT NULL AND gender NOT IN ('male', 'female', 'other', 'prefer_not_to_say');
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.profiles contains % row(s) with invalid gender values.', invalid_count;
    END IF;

    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.profiles'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'gender' AND norm_def ~* 'male' AND norm_def ~* 'female' AND norm_def ~* 'other' AND norm_def ~* 'prefer_not_to_say' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'profiles_gender_check' THEN
            EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_gender_check CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
    END IF;

    -- ==========================================================================
    -- 2. TABLE: public.user_roles compatibility & integrity
    -- ==========================================================================
    ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
    ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
    ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.user_roles.id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'user_id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.user_roles.user_id has incompatible type (must be uuid).';
    END IF;

    UPDATE public.user_roles SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.user_roles SET role = 'member' WHERE role IS NULL;
    UPDATE public.user_roles SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;

    SELECT COUNT(*) INTO null_count FROM public.user_roles WHERE id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.user_roles contains % NULL id rows.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.user_roles WHERE user_id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.user_roles contains % NULL user_id rows. Cannot enforce NOT NULL.', null_count; END IF;

    ALTER TABLE public.user_roles ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.user_roles ALTER COLUMN user_id SET NOT NULL;
    ALTER TABLE public.user_roles ALTER COLUMN role SET NOT NULL;
    ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'member';
    ALTER TABLE public.user_roles ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.user_roles ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification: user_roles(id)
    SELECT COUNT(*) INTO dup_count FROM (SELECT id FROM public.user_roles GROUP BY id HAVING COUNT(*) > 1) d;
    IF dup_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.user_roles contains % duplicate id values.', dup_count; END IF;

    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.user_roles'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.user_roles has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.user_roles ADD PRIMARY KEY (id);
    END IF;

    -- Exact Foreign Key verification: user_roles(user_id) -> auth.users(id) ON DELETE CASCADE
    SELECT COUNT(*) INTO orphan_count
    FROM public.user_roles ur
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = ur.user_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.user_roles contains % row(s) with user_id not found in auth.users. Cannot enforce foreign key.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'user_roles'
          AND rn.nspname = 'auth' AND rc.relname = 'users'
          AND c.contype = 'f'
          AND c.confdeltype = 'c'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['user_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.user_roles'::regclass AND conname = 'user_roles_user_id_fkey') THEN
            ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_fkey;
        END IF;
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Exact Unique verification: user_roles(user_id) - valid, non-partial
    SELECT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class c ON c.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'user_roles'
          AND i.indisunique = true
          AND i.indisvalid = true
          AND i.indpred IS NULL
          AND (
              SELECT ARRAY_AGG(ia.attname::TEXT ORDER BY ia.attnum)
              FROM pg_attribute ia
              WHERE ia.attrelid = i.indexrelid AND ia.attnum > 0 AND ia.attnum <= i.indnkeyatts
          ) = ARRAY['user_id']::TEXT[]
    ) INTO has_exact_unique;

    IF NOT has_exact_unique THEN
        SELECT COUNT(*) INTO dup_count
        FROM (SELECT user_id FROM public.user_roles GROUP BY user_id HAVING COUNT(*) > 1) d;
        IF dup_count > 0 THEN
            RAISE EXCEPTION 'MIGRATION STOPPED: public.user_roles contains % user(s) with duplicate role rows. Resolve duplicates before applying UNIQUE(user_id).', dup_count;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.user_roles'::regclass AND conname = 'user_roles_user_id_key') THEN
            ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_key;
        END IF;
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
    END IF;

    -- Exact Role CHECK constraint validation
    -- 1. Check existing rows first before modifying constraint
    SELECT COUNT(*) INTO invalid_count FROM public.user_roles WHERE role NOT IN ('admin', 'member');
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.user_roles contains % row(s) with invalid role values outside (''admin'', ''member''). Manual data cleanup required.', invalid_count;
    END IF;

    -- 2. Inspect actual constraint definitions directly via catalog AST strings (no heuristic sample-testing)
    SELECT a.attnum INTO role_attnum FROM pg_attribute a WHERE a.attrelid = 'public.user_roles'::regclass AND a.attname = 'role';
    has_exact_role_check := false;

    FOR r_con IN
        SELECT c.oid, c.conname, pg_get_constraintdef(c.oid) AS condef, c.conkey
        FROM pg_constraint c
        WHERE c.conrelid = 'public.user_roles'::regclass AND c.contype = 'c'
    LOOP
        IF NOT (role_attnum = ANY(r_con.conkey)) THEN CONTINUE; END IF;
        IF array_length(r_con.conkey, 1) > 1 THEN CONTINUE; END IF; -- Preserve multi-column check constraints

        norm_def := lower(regexp_replace(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), 'pg_catalog\.', '', 'g'), '\s+', ' ', 'g'));

        -- Verify if definition strictly permits ONLY ('admin', 'member')
        IF norm_def IN (
            'check ((role = any (array[''admin'', ''member''])))',
            'check ((role = any (array[''member'', ''admin''])))',
            'check (((role = ''admin'') or (role = ''member'')))',
            'check (((role = ''member'') or (role = ''admin'')))',
            'check (role in (''admin'', ''member''))',
            'check (role in (''member'', ''admin''))'
        ) THEN
            has_exact_role_check := true;
        ELSIF r_con.conname = 'user_roles_role_check' THEN
            -- Known legacy constraint with incorrect set; safely replace since row check already passed
            EXECUTE format('ALTER TABLE public.user_roles DROP CONSTRAINT %I', r_con.conname);
        ELSE
            -- Unknown single-column check constraint on role that does not enforce the exact allowed set
            RAISE EXCEPTION 'MIGRATION STOPPED: Incompatible custom CHECK constraint "%" on public.user_roles (%). Cannot safely auto-migrate.', r_con.conname, r_con.condef;
        END IF;
    END LOOP;

    IF NOT has_exact_role_check THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'member'));
    END IF;

    -- ==========================================================================
    -- 3. TABLE: public.membership_plans compatibility & integrity
    -- ==========================================================================
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'strength';
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS duration_type TEXT NOT NULL DEFAULT 'monthly';
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS duration_months INT NOT NULL DEFAULT 1;
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS effective_date DATE NOT NULL DEFAULT '2026-08-01';
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.membership_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'membership_plans' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.membership_plans.id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'membership_plans' AND column_name = 'base_price' AND udt_name NOT IN ('numeric', 'float8', 'float4')) THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.membership_plans.base_price has incompatible type (must be numeric).';
    END IF;

    UPDATE public.membership_plans SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.membership_plans SET duration_months = 1 WHERE duration_months IS NULL;
    UPDATE public.membership_plans SET base_price = 0.00 WHERE base_price IS NULL;
    UPDATE public.membership_plans SET is_active = true WHERE is_active IS NULL;
    UPDATE public.membership_plans SET effective_date = '2026-08-01' WHERE effective_date IS NULL;
    UPDATE public.membership_plans SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;
    UPDATE public.membership_plans SET updated_at = timezone('utc'::text, now()) WHERE updated_at IS NULL;

    ALTER TABLE public.membership_plans ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN category SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN name SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN duration_type SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN duration_months SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN duration_months SET DEFAULT 1;
    ALTER TABLE public.membership_plans ALTER COLUMN base_price SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN base_price SET DEFAULT 0.00;
    ALTER TABLE public.membership_plans ALTER COLUMN is_active SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN is_active SET DEFAULT true;
    ALTER TABLE public.membership_plans ALTER COLUMN effective_date SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN effective_date SET DEFAULT '2026-08-01';
    ALTER TABLE public.membership_plans ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.membership_plans ALTER COLUMN updated_at SET NOT NULL;
    ALTER TABLE public.membership_plans ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification: membership_plans(id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.membership_plans'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.membership_plans has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.membership_plans ADD PRIMARY KEY (id);
    END IF;

    -- Exact Unique verification: membership_plans(category, duration_type) - valid, non-partial
    SELECT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class c ON c.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'membership_plans'
          AND i.indisunique = true
          AND i.indisvalid = true
          AND i.indpred IS NULL
          AND (
              SELECT ARRAY_AGG(ia.attname::TEXT ORDER BY ia.attnum)
              FROM pg_attribute ia
              WHERE ia.attrelid = i.indexrelid AND ia.attnum > 0 AND ia.attnum <= i.indnkeyatts
          ) = ARRAY['category', 'duration_type']::TEXT[]
    ) INTO has_exact_unique;

    IF NOT has_exact_unique THEN
        SELECT COUNT(*) INTO dup_count
        FROM (SELECT category, duration_type FROM public.membership_plans GROUP BY category, duration_type HAVING COUNT(*) > 1) d;
        IF dup_count > 0 THEN
            RAISE EXCEPTION 'MIGRATION STOPPED: public.membership_plans contains % duplicate (category, duration_type) pairs.', dup_count;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.membership_plans'::regclass AND conname = 'membership_plans_category_duration_type_key') THEN
            ALTER TABLE public.membership_plans DROP CONSTRAINT membership_plans_category_duration_type_key;
        END IF;
        ALTER TABLE public.membership_plans ADD CONSTRAINT membership_plans_category_duration_type_key UNIQUE (category, duration_type);
    END IF;

    -- Validate check constraints on membership_plans
    SELECT COUNT(*) INTO invalid_count FROM public.membership_plans WHERE category NOT IN ('strength', 'cardio_fatloss_yoga', 'personal_training');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.membership_plans contains % row(s) with invalid category.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.membership_plans'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'category' AND norm_def ~* 'strength' AND norm_def ~* 'cardio_fatloss_yoga' AND norm_def ~* 'personal_training' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'membership_plans_category_check' THEN
            EXECUTE format('ALTER TABLE public.membership_plans DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.membership_plans ADD CONSTRAINT membership_plans_category_check CHECK (category IN ('strength', 'cardio_fatloss_yoga', 'personal_training'));
    END IF;

    SELECT COUNT(*) INTO invalid_count FROM public.membership_plans WHERE duration_type NOT IN ('monthly', 'quarterly', 'half_yearly', 'yearly');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.membership_plans contains % row(s) with invalid duration_type.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.membership_plans'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'duration_type' AND norm_def ~* 'monthly' AND norm_def ~* 'quarterly' AND norm_def ~* 'half_yearly' AND norm_def ~* 'yearly' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'membership_plans_duration_type_check' THEN
            EXECUTE format('ALTER TABLE public.membership_plans DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.membership_plans ADD CONSTRAINT membership_plans_duration_type_check CHECK (duration_type IN ('monthly', 'quarterly', 'half_yearly', 'yearly'));
    END IF;

    SELECT COUNT(*) INTO invalid_count FROM public.membership_plans WHERE base_price < 0;
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.membership_plans contains % row(s) with base_price < 0.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.membership_plans'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|numeric|float8|float4)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'base_price' AND norm_def ~* '>= 0' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'membership_plans_base_price_check' THEN
            EXECUTE format('ALTER TABLE public.membership_plans DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.membership_plans ADD CONSTRAINT membership_plans_base_price_check CHECK (base_price >= 0);
    END IF;

    -- ==========================================================================
    -- 4. TABLE: public.gym_settings compatibility & integrity
    -- ==========================================================================
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS id INT DEFAULT 1;
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS gym_name TEXT NOT NULL DEFAULT 'GURU FITNESS & NUTRITIONS';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS tagline TEXT NOT NULL DEFAULT 'Transforming Bodies, Transforming Lives.';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS brand_promise TEXT NOT NULL DEFAULT 'Expert Training. Scientific Nutrition. Real Results. Lifetime Support.';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS phone_primary TEXT NOT NULL DEFAULT '9828482505';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS phone_secondary TEXT NOT NULL DEFAULT '7014838282';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS instagram_handle TEXT NOT NULL DEFAULT 'rakesh_bagra_fit';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS address TEXT DEFAULT 'Main Market Road, Jaipur, Rajasthan (Contact management for precise landmark)';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS google_maps_url TEXT DEFAULT 'https://maps.google.com';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS opening_hours_weekdays TEXT DEFAULT '5:30 AM - 10:00 PM';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS opening_hours_sunday TEXT DEFAULT '6:00 AM - 1:00 PM';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS effective_date_notice TEXT DEFAULT 'Pricing schedule effective from 1 August 2026';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS attendance_cutoff_time TIME DEFAULT '22:00:00';
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS group_discount_percent NUMERIC(5,2) DEFAULT 15.00;
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS group_discount_min_people INT DEFAULT 3;
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS whatsapp_api_configured BOOLEAN DEFAULT false;
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT;
    ALTER TABLE public.gym_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    UPDATE public.gym_settings SET id = 1 WHERE id IS NULL;
    ALTER TABLE public.gym_settings ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.gym_settings ALTER COLUMN id SET DEFAULT 1;

    -- Exact Primary Key verification: gym_settings(id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.gym_settings'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.gym_settings has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.gym_settings ADD PRIMARY KEY (id);
    END IF;

    -- Validate CHECK (id = 1)
    SELECT COUNT(*) INTO invalid_count FROM public.gym_settings WHERE id <> 1;
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.gym_settings contains row(s) with id <> 1. Singleton configuration requires id = 1.';
    END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.gym_settings'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::[a-z0-9_]+', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'id = 1' OR norm_def ~* 'id = \(1\)' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'gym_settings_id_check' THEN
            EXECUTE format('ALTER TABLE public.gym_settings DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.gym_settings ADD CONSTRAINT gym_settings_id_check CHECK (id = 1);
    END IF;

    -- ==========================================================================
    -- 5. TABLE: public.memberships compatibility & orphan checks
    -- ==========================================================================
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS membership_code TEXT;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS member_id UUID;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS plan_id UUID;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS agreed_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'none';
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS final_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS start_date DATE NOT NULL DEFAULT CURRENT_DATE;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS expiry_date DATE;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending_activation';
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.memberships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships.id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'member_id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships.member_id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'memberships' AND column_name = 'plan_id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships.plan_id has incompatible type (must be uuid).';
    END IF;

    UPDATE public.memberships SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.memberships SET agreed_price = 0.00 WHERE agreed_price IS NULL;
    UPDATE public.memberships SET discount_type = 'none' WHERE discount_type IS NULL;
    UPDATE public.memberships SET discount_amount = 0.00 WHERE discount_amount IS NULL;
    UPDATE public.memberships SET final_amount = 0.00 WHERE final_amount IS NULL;
    UPDATE public.memberships SET start_date = CURRENT_DATE WHERE start_date IS NULL;
    UPDATE public.memberships SET status = 'pending_activation' WHERE status IS NULL;
    UPDATE public.memberships SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;
    UPDATE public.memberships SET updated_at = timezone('utc'::text, now()) WHERE updated_at IS NULL;

    SELECT COUNT(*) INTO null_count FROM public.memberships WHERE id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % NULL id rows.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.memberships WHERE membership_code IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % NULL membership_code rows. Cannot set NOT NULL.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.memberships WHERE member_id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % NULL member_id rows. Cannot set NOT NULL.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.memberships WHERE plan_id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % NULL plan_id rows. Cannot set NOT NULL.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.memberships WHERE expiry_date IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % NULL expiry_date rows. Cannot set NOT NULL.', null_count; END IF;

    ALTER TABLE public.memberships ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN membership_code SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN member_id SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN plan_id SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN agreed_price SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN discount_amount SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN discount_amount SET DEFAULT 0.00;
    ALTER TABLE public.memberships ALTER COLUMN final_amount SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN start_date SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;
    ALTER TABLE public.memberships ALTER COLUMN expiry_date SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN status SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN status SET DEFAULT 'pending_activation';
    ALTER TABLE public.memberships ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.memberships ALTER COLUMN updated_at SET NOT NULL;
    ALTER TABLE public.memberships ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification: memberships(id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.memberships'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.memberships ADD PRIMARY KEY (id);
    END IF;

    -- Exact Foreign Key verification: memberships(member_id) -> profiles(id) ON DELETE RESTRICT
    SELECT COUNT(*) INTO orphan_count
    FROM public.memberships m
    WHERE m.member_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = m.member_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % row(s) referencing non-existent profiles. Cannot safely enforce foreign key.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'memberships'
          AND rn.nspname = 'public' AND rc.relname = 'profiles'
          AND c.contype = 'f'
          AND c.confdeltype = 'r'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['member_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.memberships'::regclass AND conname = 'memberships_member_id_fkey') THEN
            ALTER TABLE public.memberships DROP CONSTRAINT memberships_member_id_fkey;
        END IF;
        ALTER TABLE public.memberships ADD CONSTRAINT memberships_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;

    -- Exact Foreign Key verification: memberships(plan_id) -> membership_plans(id)
    SELECT COUNT(*) INTO orphan_count
    FROM public.memberships m
    WHERE m.plan_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.membership_plans mp WHERE mp.id = m.plan_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % row(s) referencing non-existent plans.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'memberships'
          AND rn.nspname = 'public' AND rc.relname = 'membership_plans'
          AND c.contype = 'f'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['plan_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.memberships'::regclass AND conname = 'memberships_plan_id_fkey') THEN
            ALTER TABLE public.memberships DROP CONSTRAINT memberships_plan_id_fkey;
        END IF;
        ALTER TABLE public.memberships ADD CONSTRAINT memberships_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id);
    END IF;

    -- Exact Unique verification: memberships(membership_code) - valid, non-partial
    SELECT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class c ON c.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'memberships'
          AND i.indisunique = true
          AND i.indisvalid = true
          AND i.indpred IS NULL
          AND (
              SELECT ARRAY_AGG(ia.attname::TEXT ORDER BY ia.attnum)
              FROM pg_attribute ia
              WHERE ia.attrelid = i.indexrelid AND ia.attnum > 0 AND ia.attnum <= i.indnkeyatts
          ) = ARRAY['membership_code']::TEXT[]
    ) INTO has_exact_unique;

    IF NOT has_exact_unique THEN
        SELECT COUNT(*) INTO dup_count
        FROM (SELECT membership_code FROM public.memberships WHERE membership_code IS NOT NULL GROUP BY membership_code HAVING COUNT(*) > 1) d;
        IF dup_count > 0 THEN
            RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % duplicate membership_code values.', dup_count;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.memberships'::regclass AND conname = 'memberships_membership_code_key') THEN
            ALTER TABLE public.memberships DROP CONSTRAINT memberships_membership_code_key;
        END IF;
        ALTER TABLE public.memberships ADD CONSTRAINT memberships_membership_code_key UNIQUE (membership_code);
    END IF;

    -- Validate check constraints on memberships
    SELECT COUNT(*) INTO invalid_count FROM public.memberships WHERE status NOT IN ('pending_activation', 'active', 'expired', 'suspended', 'cancelled');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % row(s) with invalid status.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.memberships'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'status' AND norm_def ~* 'pending_activation' AND norm_def ~* 'active' AND norm_def ~* 'expired' AND norm_def ~* 'suspended' AND norm_def ~* 'cancelled' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'memberships_status_check' THEN
            EXECUTE format('ALTER TABLE public.memberships DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.memberships ADD CONSTRAINT memberships_status_check CHECK (status IN ('pending_activation', 'active', 'expired', 'suspended', 'cancelled'));
    END IF;

    SELECT COUNT(*) INTO invalid_count FROM public.memberships WHERE discount_type IS NOT NULL AND discount_type NOT IN ('none', 'group_15', 'custom');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.memberships contains % row(s) with invalid discount_type.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.memberships'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'discount_type' AND norm_def ~* 'none' AND norm_def ~* 'group_15' AND norm_def ~* 'custom' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'memberships_discount_type_check' THEN
            EXECUTE format('ALTER TABLE public.memberships DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.memberships ADD CONSTRAINT memberships_discount_type_check CHECK (discount_type IN ('none', 'group_15', 'custom'));
    END IF;

    -- ==========================================================================
    -- 6. TABLE: public.payments compatibility & orphan checks
    -- ==========================================================================
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_number TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS member_id UUID;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS membership_id UUID;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_date DATE NOT NULL DEFAULT CURRENT_DATE;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS transaction_reference TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS recorded_by UUID;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.payments.id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'member_id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.payments.member_id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'membership_id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.payments.membership_id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'amount' AND udt_name NOT IN ('numeric', 'float8', 'float4')) THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.payments.amount has incompatible type (must be numeric).';
    END IF;

    UPDATE public.payments SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.payments SET payment_date = CURRENT_DATE WHERE payment_date IS NULL;
    UPDATE public.payments SET payment_method = 'cash' WHERE payment_method IS NULL;
    UPDATE public.payments SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;

    SELECT COUNT(*) INTO null_count FROM public.payments WHERE id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % NULL id rows.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.payments WHERE payment_number IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % NULL payment_number rows. Cannot set NOT NULL.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.payments WHERE member_id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % NULL member_id rows. Cannot set NOT NULL.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.payments WHERE membership_id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % NULL membership_id rows. Cannot set NOT NULL.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.payments WHERE amount IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % NULL amount rows. Cannot set NOT NULL.', null_count; END IF;

    ALTER TABLE public.payments ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.payments ALTER COLUMN payment_number SET NOT NULL;
    ALTER TABLE public.payments ALTER COLUMN member_id SET NOT NULL;
    ALTER TABLE public.payments ALTER COLUMN membership_id SET NOT NULL;
    ALTER TABLE public.payments ALTER COLUMN amount SET NOT NULL;
    ALTER TABLE public.payments ALTER COLUMN payment_date SET NOT NULL;
    ALTER TABLE public.payments ALTER COLUMN payment_date SET DEFAULT CURRENT_DATE;
    ALTER TABLE public.payments ALTER COLUMN payment_method SET NOT NULL;
    ALTER TABLE public.payments ALTER COLUMN payment_method SET DEFAULT 'cash';
    ALTER TABLE public.payments ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.payments ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification: payments(id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.payments'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.payments has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.payments ADD PRIMARY KEY (id);
    END IF;

    -- Exact Foreign Key: payments(member_id) -> profiles(id) ON DELETE RESTRICT
    SELECT COUNT(*) INTO orphan_count
    FROM public.payments py
    WHERE py.member_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = py.member_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % row(s) referencing non-existent profiles.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'payments'
          AND rn.nspname = 'public' AND rc.relname = 'profiles'
          AND c.contype = 'f'
          AND c.confdeltype = 'r'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['member_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND conname = 'payments_member_id_fkey') THEN
            ALTER TABLE public.payments DROP CONSTRAINT payments_member_id_fkey;
        END IF;
        ALTER TABLE public.payments ADD CONSTRAINT payments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
    END IF;

    -- Exact Foreign Key: payments(membership_id) -> memberships(id) ON DELETE RESTRICT
    SELECT COUNT(*) INTO orphan_count
    FROM public.payments py
    WHERE py.membership_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.memberships m WHERE m.id = py.membership_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % row(s) referencing non-existent memberships.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'payments'
          AND rn.nspname = 'public' AND rc.relname = 'memberships'
          AND c.contype = 'f'
          AND c.confdeltype = 'r'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['membership_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND conname = 'payments_membership_id_fkey') THEN
            ALTER TABLE public.payments DROP CONSTRAINT payments_membership_id_fkey;
        END IF;
        ALTER TABLE public.payments ADD CONSTRAINT payments_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE RESTRICT;
    END IF;

    -- Exact Foreign Key: payments(recorded_by) -> auth.users(id) ON DELETE SET NULL
    SELECT COUNT(*) INTO orphan_count
    FROM public.payments py
    WHERE py.recorded_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = py.recorded_by);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % row(s) with recorded_by not found in auth.users.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'payments'
          AND rn.nspname = 'auth' AND rc.relname = 'users'
          AND c.contype = 'f'
          AND c.confdeltype = 'n'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['recorded_by']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND conname = 'payments_recorded_by_fkey') THEN
            ALTER TABLE public.payments DROP CONSTRAINT payments_recorded_by_fkey;
        END IF;
        ALTER TABLE public.payments ADD CONSTRAINT payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Exact Unique verification: payments(payment_number) - valid, non-partial
    SELECT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class c ON c.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'payments'
          AND i.indisunique = true
          AND i.indisvalid = true
          AND i.indpred IS NULL
          AND (
              SELECT ARRAY_AGG(ia.attname::TEXT ORDER BY ia.attnum)
              FROM pg_attribute ia
              WHERE ia.attrelid = i.indexrelid AND ia.attnum > 0 AND ia.attnum <= i.indnkeyatts
          ) = ARRAY['payment_number']::TEXT[]
    ) INTO has_exact_unique;

    IF NOT has_exact_unique THEN
        SELECT COUNT(*) INTO dup_count
        FROM (SELECT payment_number FROM public.payments WHERE payment_number IS NOT NULL GROUP BY payment_number HAVING COUNT(*) > 1) d;
        IF dup_count > 0 THEN
            RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % duplicate payment_number values.', dup_count;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.payments'::regclass AND conname = 'payments_payment_number_key') THEN
            ALTER TABLE public.payments DROP CONSTRAINT payments_payment_number_key;
        END IF;
        ALTER TABLE public.payments ADD CONSTRAINT payments_payment_number_key UNIQUE (payment_number);
    END IF;

    -- Validate check constraints on payments
    SELECT COUNT(*) INTO invalid_count FROM public.payments WHERE amount <= 0;
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % row(s) with amount <= 0.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.payments'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::[a-z0-9_]+', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'amount > 0' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'payments_amount_check' THEN
            EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.payments ADD CONSTRAINT payments_amount_check CHECK (amount > 0);
    END IF;

    SELECT COUNT(*) INTO invalid_count FROM public.payments WHERE payment_method NOT IN ('cash', 'upi', 'bank_transfer', 'online');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.payments contains % row(s) with invalid payment_method.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.payments'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'payment_method' AND norm_def ~* 'cash' AND norm_def ~* 'upi' AND norm_def ~* 'bank_transfer' AND norm_def ~* 'online' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'payments_payment_method_check' THEN
            EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.payments ADD CONSTRAINT payments_payment_method_check CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'online'));
    END IF;

    -- ==========================================================================
    -- 7. TABLE: public.attendance compatibility & orphan checks
    -- ==========================================================================
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS member_id UUID;
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS attendance_date DATE NOT NULL DEFAULT CURRENT_DATE;
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ;
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS check_in_method TEXT NOT NULL DEFAULT 'admin_manual';
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'present';
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS verified_by UUID;
    ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance.id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'member_id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance.member_id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'attendance_date' AND udt_name <> 'date') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance.attendance_date has incompatible type (must be date).';
    END IF;

    UPDATE public.attendance SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.attendance SET attendance_date = CURRENT_DATE WHERE attendance_date IS NULL;
    UPDATE public.attendance SET check_in_time = timezone('utc'::text, now()) WHERE check_in_time IS NULL;
    UPDATE public.attendance SET check_in_method = 'admin_manual' WHERE check_in_method IS NULL;
    UPDATE public.attendance SET status = 'present' WHERE status IS NULL;
    UPDATE public.attendance SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;

    SELECT COUNT(*) INTO null_count FROM public.attendance WHERE id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance contains % NULL id rows.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.attendance WHERE member_id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance contains % NULL member_id rows. Cannot set NOT NULL.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.attendance WHERE attendance_date IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance contains % NULL attendance_date rows. Cannot set NOT NULL.', null_count; END IF;

    ALTER TABLE public.attendance ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.attendance ALTER COLUMN member_id SET NOT NULL;
    ALTER TABLE public.attendance ALTER COLUMN attendance_date SET NOT NULL;
    ALTER TABLE public.attendance ALTER COLUMN attendance_date SET DEFAULT CURRENT_DATE;
    ALTER TABLE public.attendance ALTER COLUMN check_in_time SET NOT NULL;
    ALTER TABLE public.attendance ALTER COLUMN check_in_time SET DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.attendance ALTER COLUMN check_in_method SET NOT NULL;
    ALTER TABLE public.attendance ALTER COLUMN check_in_method SET DEFAULT 'admin_manual';
    ALTER TABLE public.attendance ALTER COLUMN status SET NOT NULL;
    ALTER TABLE public.attendance ALTER COLUMN status SET DEFAULT 'present';
    ALTER TABLE public.attendance ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.attendance ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification: attendance(id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.attendance'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.attendance ADD PRIMARY KEY (id);
    END IF;

    -- Exact Foreign Key: attendance(member_id) -> profiles(id) ON DELETE CASCADE
    SELECT COUNT(*) INTO orphan_count
    FROM public.attendance a
    WHERE a.member_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = a.member_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance contains % row(s) referencing non-existent profiles.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'attendance'
          AND rn.nspname = 'public' AND rc.relname = 'profiles'
          AND c.contype = 'f'
          AND c.confdeltype = 'c'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['member_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.attendance'::regclass AND conname = 'attendance_member_id_fkey') THEN
            ALTER TABLE public.attendance DROP CONSTRAINT attendance_member_id_fkey;
        END IF;
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Exact Foreign Key: attendance(verified_by) -> auth.users(id)
    SELECT COUNT(*) INTO orphan_count
    FROM public.attendance a
    WHERE a.verified_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = a.verified_by);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance contains % row(s) with verified_by not found in auth.users.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'attendance'
          AND rn.nspname = 'auth' AND rc.relname = 'users'
          AND c.contype = 'f'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['verified_by']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.attendance'::regclass AND conname = 'attendance_verified_by_fkey') THEN
            ALTER TABLE public.attendance DROP CONSTRAINT attendance_verified_by_fkey;
        END IF;
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES auth.users(id);
    END IF;

    -- Exact Unique verification: attendance(member_id, attendance_date) - valid, non-partial
    SELECT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class c ON c.oid = i.indrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'attendance'
          AND i.indisunique = true
          AND i.indisvalid = true
          AND i.indpred IS NULL
          AND (
              SELECT ARRAY_AGG(ia.attname::TEXT ORDER BY ia.attnum)
              FROM pg_attribute ia
              WHERE ia.attrelid = i.indexrelid AND ia.attnum > 0 AND ia.attnum <= i.indnkeyatts
          ) = ARRAY['member_id', 'attendance_date']::TEXT[]
    ) INTO has_exact_unique;

    IF NOT has_exact_unique THEN
        SELECT COUNT(*) INTO dup_count
        FROM (SELECT member_id, attendance_date FROM public.attendance GROUP BY member_id, attendance_date HAVING COUNT(*) > 1) d;
        IF dup_count > 0 THEN
            RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance contains % duplicate (member_id, attendance_date) check-in pairs.', dup_count;
        END IF;

        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.attendance'::regclass AND conname = 'attendance_member_id_attendance_date_key') THEN
            ALTER TABLE public.attendance DROP CONSTRAINT attendance_member_id_attendance_date_key;
        END IF;
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_member_id_attendance_date_key UNIQUE (member_id, attendance_date);
    END IF;

    -- Validate check constraints on attendance
    SELECT COUNT(*) INTO invalid_count FROM public.attendance WHERE check_in_method NOT IN ('qr_code', 'admin_manual', 'kiosk');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance contains % row(s) with invalid check_in_method.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.attendance'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'check_in_method' AND norm_def ~* 'qr_code' AND norm_def ~* 'admin_manual' AND norm_def ~* 'kiosk' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'attendance_check_in_method_check' THEN
            EXECUTE format('ALTER TABLE public.attendance DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_check_in_method_check CHECK (check_in_method IN ('qr_code', 'admin_manual', 'kiosk'));
    END IF;

    SELECT COUNT(*) INTO invalid_count FROM public.attendance WHERE status NOT IN ('present', 'absent', 'excused');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.attendance contains % row(s) with invalid status.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.attendance'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'status' AND norm_def ~* 'present' AND norm_def ~* 'absent' AND norm_def ~* 'excused' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'attendance_status_check' THEN
            EXECUTE format('ALTER TABLE public.attendance DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.attendance ADD CONSTRAINT attendance_status_check CHECK (status IN ('present', 'absent', 'excused'));
    END IF;

    -- ==========================================================================
    -- 8. TABLE: public.notifications compatibility & orphan checks
    -- ==========================================================================
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS member_id UUID;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info';
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.notifications.id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'member_id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.notifications.member_id has incompatible type (must be uuid).';
    END IF;

    UPDATE public.notifications SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.notifications SET title = '' WHERE title IS NULL;
    UPDATE public.notifications SET message = '' WHERE message IS NULL;
    UPDATE public.notifications SET type = 'info' WHERE type IS NULL;
    UPDATE public.notifications SET is_read = false WHERE is_read IS NULL;
    UPDATE public.notifications SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;

    SELECT COUNT(*) INTO null_count FROM public.notifications WHERE id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.notifications contains % NULL id rows.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.notifications WHERE member_id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.notifications contains % NULL member_id rows. Cannot set NOT NULL.', null_count; END IF;

    ALTER TABLE public.notifications ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.notifications ALTER COLUMN member_id SET NOT NULL;
    ALTER TABLE public.notifications ALTER COLUMN title SET NOT NULL;
    ALTER TABLE public.notifications ALTER COLUMN message SET NOT NULL;
    ALTER TABLE public.notifications ALTER COLUMN type SET NOT NULL;
    ALTER TABLE public.notifications ALTER COLUMN type SET DEFAULT 'info';
    ALTER TABLE public.notifications ALTER COLUMN is_read SET NOT NULL;
    ALTER TABLE public.notifications ALTER COLUMN is_read SET DEFAULT false;
    ALTER TABLE public.notifications ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.notifications ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification: notifications(id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.notifications'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.notifications has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.notifications ADD PRIMARY KEY (id);
    END IF;

    -- Exact Foreign Key: notifications(member_id) -> profiles(id) ON DELETE CASCADE
    SELECT COUNT(*) INTO orphan_count
    FROM public.notifications n
    WHERE n.member_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = n.member_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.notifications contains % row(s) referencing non-existent profiles.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'notifications'
          AND rn.nspname = 'public' AND rc.relname = 'profiles'
          AND c.contype = 'f'
          AND c.confdeltype = 'c'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['member_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.notifications'::regclass AND conname = 'notifications_member_id_fkey') THEN
            ALTER TABLE public.notifications DROP CONSTRAINT notifications_member_id_fkey;
        END IF;
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Validate check constraint on notifications.type
    SELECT COUNT(*) INTO invalid_count FROM public.notifications WHERE type NOT IN ('info', 'payment', 'expiry', 'attendance', 'system');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.notifications contains % row(s) with invalid type.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.notifications'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'type' AND norm_def ~* 'info' AND norm_def ~* 'payment' AND norm_def ~* 'expiry' AND norm_def ~* 'attendance' AND norm_def ~* 'system' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'notifications_type_check' THEN
            EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('info', 'payment', 'expiry', 'attendance', 'system'));
    END IF;

    -- ==========================================================================
    -- 9. TABLE: public.reminder_logs compatibility & orphan checks
    -- ==========================================================================
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS member_id UUID;
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS reminder_type TEXT NOT NULL DEFAULT 'general';
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS target_phone TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS message_content TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS delivery_channel TEXT NOT NULL DEFAULT 'manual_whatsapp';
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS external_message_id TEXT;
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS sent_by UUID;
    ALTER TABLE public.reminder_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reminder_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs.id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reminder_logs' AND column_name = 'member_id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs.member_id has incompatible type (must be uuid).';
    END IF;

    UPDATE public.reminder_logs SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.reminder_logs SET reminder_type = 'general' WHERE reminder_type IS NULL;
    UPDATE public.reminder_logs SET target_phone = '' WHERE target_phone IS NULL;
    UPDATE public.reminder_logs SET message_content = '' WHERE message_content IS NULL;
    UPDATE public.reminder_logs SET delivery_channel = 'manual_whatsapp' WHERE delivery_channel IS NULL;
    UPDATE public.reminder_logs SET delivery_status = 'pending' WHERE delivery_status IS NULL;
    UPDATE public.reminder_logs SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;

    SELECT COUNT(*) INTO null_count FROM public.reminder_logs WHERE id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs contains % NULL id rows.', null_count; END IF;
    SELECT COUNT(*) INTO null_count FROM public.reminder_logs WHERE member_id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs contains % NULL member_id rows. Cannot set NOT NULL.', null_count; END IF;

    ALTER TABLE public.reminder_logs ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.reminder_logs ALTER COLUMN member_id SET NOT NULL;
    ALTER TABLE public.reminder_logs ALTER COLUMN reminder_type SET NOT NULL;
    ALTER TABLE public.reminder_logs ALTER COLUMN reminder_type SET DEFAULT 'general';
    ALTER TABLE public.reminder_logs ALTER COLUMN target_phone SET NOT NULL;
    ALTER TABLE public.reminder_logs ALTER COLUMN message_content SET NOT NULL;
    ALTER TABLE public.reminder_logs ALTER COLUMN delivery_channel SET NOT NULL;
    ALTER TABLE public.reminder_logs ALTER COLUMN delivery_channel SET DEFAULT 'manual_whatsapp';
    ALTER TABLE public.reminder_logs ALTER COLUMN delivery_status SET NOT NULL;
    ALTER TABLE public.reminder_logs ALTER COLUMN delivery_status SET DEFAULT 'pending';
    ALTER TABLE public.reminder_logs ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.reminder_logs ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification: reminder_logs(id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.reminder_logs'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.reminder_logs ADD PRIMARY KEY (id);
    END IF;

    -- Exact Foreign Key: reminder_logs(member_id) -> profiles(id) ON DELETE CASCADE
    SELECT COUNT(*) INTO orphan_count
    FROM public.reminder_logs rl
    WHERE rl.member_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = rl.member_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs contains % row(s) referencing non-existent profiles.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'reminder_logs'
          AND rn.nspname = 'public' AND rc.relname = 'profiles'
          AND c.contype = 'f'
          AND c.confdeltype = 'c'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['member_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.reminder_logs'::regclass AND conname = 'reminder_logs_member_id_fkey') THEN
            ALTER TABLE public.reminder_logs DROP CONSTRAINT reminder_logs_member_id_fkey;
        END IF;
        ALTER TABLE public.reminder_logs ADD CONSTRAINT reminder_logs_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Exact Foreign Key: reminder_logs(sent_by) -> auth.users(id)
    SELECT COUNT(*) INTO orphan_count
    FROM public.reminder_logs rl
    WHERE rl.sent_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = rl.sent_by);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs contains % row(s) with sent_by not found in auth.users.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'reminder_logs'
          AND rn.nspname = 'auth' AND rc.relname = 'users'
          AND c.contype = 'f'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['sent_by']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.reminder_logs'::regclass AND conname = 'reminder_logs_sent_by_fkey') THEN
            ALTER TABLE public.reminder_logs DROP CONSTRAINT reminder_logs_sent_by_fkey;
        END IF;
        ALTER TABLE public.reminder_logs ADD CONSTRAINT reminder_logs_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id);
    END IF;

    -- Validate check constraints on reminder_logs
    SELECT COUNT(*) INTO invalid_count FROM public.reminder_logs WHERE reminder_type NOT IN ('three_days_before_expiry', 'one_day_before_expiry', 'on_expiry_day', 'post_expiry', 'fee_due', 'general');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs contains % row(s) with invalid reminder_type.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.reminder_logs'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'reminder_type' AND norm_def ~* 'three_days_before_expiry' AND norm_def ~* 'on_expiry_day' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'reminder_logs_reminder_type_check' THEN
            EXECUTE format('ALTER TABLE public.reminder_logs DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.reminder_logs ADD CONSTRAINT reminder_logs_reminder_type_check CHECK (reminder_type IN ('three_days_before_expiry', 'one_day_before_expiry', 'on_expiry_day', 'post_expiry', 'fee_due', 'general'));
    END IF;

    SELECT COUNT(*) INTO invalid_count FROM public.reminder_logs WHERE delivery_channel NOT IN ('manual_whatsapp', 'whatsapp_api');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs contains % row(s) with invalid delivery_channel.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.reminder_logs'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'delivery_channel' AND norm_def ~* 'manual_whatsapp' AND norm_def ~* 'whatsapp_api' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'reminder_logs_delivery_channel_check' THEN
            EXECUTE format('ALTER TABLE public.reminder_logs DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.reminder_logs ADD CONSTRAINT reminder_logs_delivery_channel_check CHECK (delivery_channel IN ('manual_whatsapp', 'whatsapp_api'));
    END IF;

    SELECT COUNT(*) INTO invalid_count FROM public.reminder_logs WHERE delivery_status NOT IN ('sent', 'pending', 'failed', 'delivered');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.reminder_logs contains % row(s) with invalid delivery_status.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.reminder_logs'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'delivery_status' AND norm_def ~* 'sent' AND norm_def ~* 'pending' AND norm_def ~* 'failed' AND norm_def ~* 'delivered' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'reminder_logs_delivery_status_check' THEN
            EXECUTE format('ALTER TABLE public.reminder_logs DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.reminder_logs ADD CONSTRAINT reminder_logs_delivery_status_check CHECK (delivery_status IN ('sent', 'pending', 'failed', 'delivered'));
    END IF;

    -- ==========================================================================
    -- 10. TABLE: public.registration_requests compatibility & orphan checks
    -- ==========================================================================
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS user_id UUID;
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS plan_id UUID;
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS is_group_discount BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS group_member_count INT DEFAULT 1;
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS agreed_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS final_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS processed_by UUID;
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.registration_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registration_requests' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests.id has incompatible type (must be uuid).';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'registration_requests' AND column_name = 'agreed_price' AND udt_name NOT IN ('numeric', 'float8', 'float4')) THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests.agreed_price has incompatible type (must be numeric).';
    END IF;

    UPDATE public.registration_requests SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.registration_requests SET full_name = '' WHERE full_name IS NULL;
    UPDATE public.registration_requests SET email = '' WHERE email IS NULL;
    UPDATE public.registration_requests SET phone = '' WHERE phone IS NULL;
    UPDATE public.registration_requests SET is_group_discount = false WHERE is_group_discount IS NULL;
    UPDATE public.registration_requests SET group_member_count = 1 WHERE group_member_count IS NULL;
    UPDATE public.registration_requests SET agreed_price = 0.00 WHERE agreed_price IS NULL;
    UPDATE public.registration_requests SET final_amount = 0.00 WHERE final_amount IS NULL;
    UPDATE public.registration_requests SET status = 'pending' WHERE status IS NULL;
    UPDATE public.registration_requests SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;
    UPDATE public.registration_requests SET updated_at = timezone('utc'::text, now()) WHERE updated_at IS NULL;

    SELECT COUNT(*) INTO null_count FROM public.registration_requests WHERE id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests contains % NULL id rows.', null_count; END IF;

    ALTER TABLE public.registration_requests ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN full_name SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN email SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN phone SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN is_group_discount SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN is_group_discount SET DEFAULT false;
    ALTER TABLE public.registration_requests ALTER COLUMN agreed_price SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN final_amount SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN status SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN status SET DEFAULT 'pending';
    ALTER TABLE public.registration_requests ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
    ALTER TABLE public.registration_requests ALTER COLUMN updated_at SET NOT NULL;
    ALTER TABLE public.registration_requests ALTER COLUMN updated_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification: registration_requests(id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.registration_requests'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.registration_requests ADD PRIMARY KEY (id);
    END IF;

    -- Exact Foreign Key: registration_requests(user_id) -> auth.users(id) ON DELETE SET NULL
    SELECT COUNT(*) INTO orphan_count
    FROM public.registration_requests rr
    WHERE rr.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = rr.user_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests contains % row(s) with user_id not found in auth.users.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'registration_requests'
          AND rn.nspname = 'auth' AND rc.relname = 'users'
          AND c.contype = 'f'
          AND c.confdeltype = 'n'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['user_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.registration_requests'::regclass AND conname = 'registration_requests_user_id_fkey') THEN
            ALTER TABLE public.registration_requests DROP CONSTRAINT registration_requests_user_id_fkey;
        END IF;
        ALTER TABLE public.registration_requests ADD CONSTRAINT registration_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Exact Foreign Key: registration_requests(plan_id) -> membership_plans(id)
    SELECT COUNT(*) INTO orphan_count
    FROM public.registration_requests rr
    WHERE rr.plan_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.membership_plans mp WHERE mp.id = rr.plan_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests contains % row(s) referencing non-existent plans.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'registration_requests'
          AND rn.nspname = 'public' AND rc.relname = 'membership_plans'
          AND c.contype = 'f'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['plan_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.registration_requests'::regclass AND conname = 'registration_requests_plan_id_fkey') THEN
            ALTER TABLE public.registration_requests DROP CONSTRAINT registration_requests_plan_id_fkey;
        END IF;
        ALTER TABLE public.registration_requests ADD CONSTRAINT registration_requests_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.membership_plans(id);
    END IF;

    -- Exact Foreign Key: registration_requests(processed_by) -> auth.users(id)
    SELECT COUNT(*) INTO orphan_count
    FROM public.registration_requests rr
    WHERE rr.processed_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = rr.processed_by);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests contains % row(s) with processed_by not found in auth.users.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'registration_requests'
          AND rn.nspname = 'auth' AND rc.relname = 'users'
          AND c.contype = 'f'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['processed_by']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.registration_requests'::regclass AND conname = 'registration_requests_processed_by_fkey') THEN
            ALTER TABLE public.registration_requests DROP CONSTRAINT registration_requests_processed_by_fkey;
        END IF;
        ALTER TABLE public.registration_requests ADD CONSTRAINT registration_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES auth.users(id);
    END IF;

    -- Validate check constraints on registration_requests
    SELECT COUNT(*) INTO invalid_count FROM public.registration_requests WHERE status NOT IN ('pending', 'approved', 'rejected', 'contacted');
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests contains % row(s) with invalid status.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.registration_requests'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::(text|varchar|character varying|bpchar)', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'status' AND norm_def ~* 'pending' AND norm_def ~* 'approved' AND norm_def ~* 'rejected' AND norm_def ~* 'contacted' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'registration_requests_status_check' THEN
            EXECUTE format('ALTER TABLE public.registration_requests DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.registration_requests ADD CONSTRAINT registration_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'contacted'));
    END IF;

    -- Validate pricing check constraints on registration_requests (Untrusted input protections)
    SELECT COUNT(*) INTO invalid_count FROM public.registration_requests WHERE agreed_price < 0;
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests contains % row(s) with agreed_price < 0.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.registration_requests'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::[a-z0-9_]+', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'agreed_price' AND norm_def ~* '>= 0' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'registration_requests_agreed_price_check' THEN
            EXECUTE format('ALTER TABLE public.registration_requests DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.registration_requests ADD CONSTRAINT registration_requests_agreed_price_check CHECK (agreed_price >= 0);
    END IF;

    SELECT COUNT(*) INTO invalid_count FROM public.registration_requests WHERE final_amount < 0;
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests contains % row(s) with final_amount < 0.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.registration_requests'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::[a-z0-9_]+', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'final_amount' AND norm_def ~* '>= 0' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'registration_requests_final_amount_check' THEN
            EXECUTE format('ALTER TABLE public.registration_requests DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.registration_requests ADD CONSTRAINT registration_requests_final_amount_check CHECK (final_amount >= 0);
    END IF;

    SELECT COUNT(*) INTO invalid_count FROM public.registration_requests WHERE group_member_count < 1;
    IF invalid_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.registration_requests contains % row(s) with group_member_count < 1.', invalid_count; END IF;
    has_exact_check := false;
    FOR r_con IN SELECT c.conname, pg_get_constraintdef(c.oid) AS condef FROM pg_constraint c WHERE c.conrelid = 'public.registration_requests'::regclass AND c.contype = 'c' LOOP
        norm_def := lower(regexp_replace(regexp_replace(r_con.condef, '::[a-z0-9_]+', '', 'g'), '\s+', ' ', 'g'));
        IF norm_def ~* 'group_member_count' AND norm_def ~* '>= 1' THEN
            has_exact_check := true;
        ELSIF r_con.conname = 'registration_requests_group_count_check' THEN
            EXECUTE format('ALTER TABLE public.registration_requests DROP CONSTRAINT %I', r_con.conname);
        END IF;
    END LOOP;
    IF NOT has_exact_check THEN
        ALTER TABLE public.registration_requests ADD CONSTRAINT registration_requests_group_count_check CHECK (group_member_count >= 1);
    END IF;

    -- ==========================================================================
    -- 11. TABLE: public.audit_logs compatibility & orphan checks
    -- ==========================================================================
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_id UUID;
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_email TEXT;
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id TEXT;
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'id' AND udt_name <> 'uuid') THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.audit_logs.id has incompatible type (must be uuid).';
    END IF;

    UPDATE public.audit_logs SET id = gen_random_uuid() WHERE id IS NULL;
    UPDATE public.audit_logs SET action = '' WHERE action IS NULL;
    UPDATE public.audit_logs SET entity_type = '' WHERE entity_type IS NULL;
    UPDATE public.audit_logs SET created_at = timezone('utc'::text, now()) WHERE created_at IS NULL;

    SELECT COUNT(*) INTO null_count FROM public.audit_logs WHERE id IS NULL;
    IF null_count > 0 THEN RAISE EXCEPTION 'MIGRATION STOPPED: public.audit_logs contains % NULL id rows.', null_count; END IF;

    ALTER TABLE public.audit_logs ALTER COLUMN id SET NOT NULL;
    ALTER TABLE public.audit_logs ALTER COLUMN action SET NOT NULL;
    ALTER TABLE public.audit_logs ALTER COLUMN entity_type SET NOT NULL;
    ALTER TABLE public.audit_logs ALTER COLUMN created_at SET NOT NULL;
    ALTER TABLE public.audit_logs ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

    -- Exact Primary Key verification: audit_logs(id)
    SELECT ARRAY_AGG(a.attname::TEXT ORDER BY array_position(c.conkey, a.attnum))
    INTO pk_cols
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.audit_logs'::regclass AND c.contype = 'p';

    IF pk_cols IS NOT NULL AND pk_cols <> ARRAY['id']::TEXT[] THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.audit_logs has unexpected primary key (%). Expected (id).', array_to_string(pk_cols, ', ');
    ELSIF pk_cols IS NULL THEN
        ALTER TABLE public.audit_logs ADD PRIMARY KEY (id);
    END IF;

    -- Exact Foreign Key: audit_logs(actor_id) -> auth.users(id)
    SELECT COUNT(*) INTO orphan_count
    FROM public.audit_logs al
    WHERE al.actor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = al.actor_id);
    IF orphan_count > 0 THEN
        RAISE EXCEPTION 'MIGRATION STOPPED: public.audit_logs contains % row(s) with actor_id not found in auth.users.', orphan_count;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class sc ON sc.oid = c.conrelid
        JOIN pg_namespace sn ON sn.oid = sc.relnamespace
        JOIN pg_class rc ON rc.oid = c.confrelid
        JOIN pg_namespace rn ON rn.oid = rc.relnamespace
        WHERE sn.nspname = 'public' AND sc.relname = 'audit_logs'
          AND rn.nspname = 'auth' AND rc.relname = 'users'
          AND c.contype = 'f'
          AND (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) = ARRAY['actor_id']::TEXT[]
          AND (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) = ARRAY['id']::TEXT[]
    ) INTO has_exact_fk;

    IF NOT has_exact_fk THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.audit_logs'::regclass AND conname = 'audit_logs_actor_id_fkey') THEN
            ALTER TABLE public.audit_logs DROP CONSTRAINT audit_logs_actor_id_fkey;
        END IF;
        ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Non-partial unique index covering all rows for user_roles.user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_user_id_unique ON public.user_roles (user_id);

-- ==============================================================================
-- SECTION 4: INDEXES (Applied after all 11 tables are guaranteed to exist)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_member_id ON public.memberships(member_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON public.attendance(member_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON public.notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_member_id ON public.reminder_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON public.registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON public.registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ==============================================================================
-- SECTION 5: SECURITY DEFINER FUNCTIONS & TRIGGERS
-- Hardened against object-shadowing with SET search_path = '' and fully qualified schemas.
-- Explicit least-privilege EXECUTE grants.
-- ==============================================================================

-- Safe dependency migration for legacy is_admin(UUID):
-- Inspects every dependent object before dropping. Does NOT rely on policy name alone.
-- Migrates RLS policies to public.is_admin() preserving exact roles, command, permissive status,
-- and expression logic. Halts if non-standard arguments are found. Drops legacy function without CASCADE.
DO $$
DECLARE
    legacy_fn_oid OID;
    pol_dep RECORD;
    view_dep RECORD;
    using_expr TEXT;
    check_expr TEXT;
    cmd_str TEXT;
    roles_str TEXT;
    migrated_using TEXT;
    migrated_check TEXT;
BEGIN
    SELECT p.oid INTO legacy_fn_oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin'
      AND p.pronargs = 1;

    IF legacy_fn_oid IS NOT NULL THEN
        -- 1. Inspect any views or rules depending on legacy is_admin(UUID)
        FOR view_dep IN
            SELECT c.relname, n.nspname
            FROM pg_depend d
            JOIN pg_rewrite r ON r.oid = d.objid
            JOIN pg_class c ON c.oid = r.ev_class
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE d.refobjid = legacy_fn_oid
              AND c.relkind IN ('v', 'm')
        LOOP
            RAISE EXCEPTION 'MIGRATION STOPPED: View %.% depends on public.is_admin(UUID). Please migrate this view to zero-parameter public.is_admin() before dropping the legacy function.', view_dep.nspname, view_dep.relname;
        END LOOP;

        -- 2. Inspect every dependent RLS policy (Preserves policy roles, command, permissive status, and conditions)
        FOR pol_dep IN
            SELECT 
                pol.oid AS pol_oid,
                pol.polname AS policy_name,
                t.relname AS table_name,
                n.nspname AS schema_name,
                pol.polcmd AS cmd_char,
                pol.polpermissive AS is_permissive,
                pol.polroles AS pol_roles,
                t.oid AS table_oid
            FROM pg_depend d
            JOIN pg_policy pol ON pol.oid = d.objid
            JOIN pg_class t ON t.oid = pol.polrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE d.refobjid = legacy_fn_oid
              AND d.classid = 'pg_policy'::regclass
        LOOP
            using_expr := pg_get_expr(
                (SELECT polqual FROM pg_policy WHERE oid = pol_dep.pol_oid),
                pol_dep.table_oid
            );
            check_expr := pg_get_expr(
                (SELECT polwithcheck FROM pg_policy WHERE oid = pol_dep.pol_oid),
                pol_dep.table_oid
            );

            -- Inspect whether the call to is_admin uses anything other than auth.uid()
            -- If it calls is_admin with another column, argument, or constant, halt for manual review
            IF (using_expr IS NOT NULL AND using_expr ~* '\bis_admin\s*\(' AND using_expr !~* '\bis_admin\s*\(\s*auth\.uid\s*\(\s*\)\s*\)')
               OR (check_expr IS NOT NULL AND check_expr ~* '\bis_admin\s*\(' AND check_expr !~* '\bis_admin\s*\(\s*auth\.uid\s*\(\s*\)\s*\)') THEN
                RAISE EXCEPTION 'MIGRATION STOPPED: Policy "%" on %.% calls is_admin(UUID) with non-standard argument (USING: %, WITH CHECK: %). Cannot safely determine caller intent without manual review.', 
                    pol_dep.policy_name, pol_dep.schema_name, pol_dep.table_name, COALESCE(using_expr, 'NONE'), COALESCE(check_expr, 'NONE');
            END IF;

            -- Migrate the policy expressions by safely rewriting is_admin(auth.uid()) to public.is_admin()
            migrated_using := using_expr;
            IF migrated_using IS NOT NULL THEN
                migrated_using := regexp_replace(migrated_using, 'public\.is_admin\s*\(\s*auth\.uid\s*\(\s*\)\s*\)', 'public.is_admin()', 'gi');
                migrated_using := regexp_replace(migrated_using, '\bis_admin\s*\(\s*auth\.uid\s*\(\s*\)\s*\)', 'public.is_admin()', 'gi');
            END IF;

            migrated_check := check_expr;
            IF migrated_check IS NOT NULL THEN
                migrated_check := regexp_replace(migrated_check, 'public\.is_admin\s*\(\s*auth\.uid\s*\(\s*\)\s*\)', 'public.is_admin()', 'gi');
                migrated_check := regexp_replace(migrated_check, '\bis_admin\s*\(\s*auth\.uid\s*\(\s*\)\s*\)', 'public.is_admin()', 'gi');
            END IF;

            -- Re-extract original roles
            SELECT COALESCE(string_agg(quote_ident(rolname), ', '), 'public')
            INTO roles_str
            FROM pg_roles
            WHERE oid = ANY(pol_dep.pol_roles);

            IF roles_str IS NULL OR roles_str = '' THEN
                roles_str := 'public';
            END IF;

            cmd_str := CASE pol_dep.cmd_char
                WHEN 'r' THEN 'FOR SELECT'
                WHEN 'a' THEN 'FOR INSERT'
                WHEN 'w' THEN 'FOR UPDATE'
                WHEN 'd' THEN 'FOR DELETE'
                ELSE 'FOR ALL'
            END;

            -- Drop dependent policy so legacy function can be dropped cleanly without CASCADE
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol_dep.policy_name, pol_dep.schema_name, pol_dep.table_name);

            -- Recreate migrated policy with identical name, roles, permissive/restrictive status, command, and conditions
            EXECUTE format(
                'CREATE POLICY %I ON %I.%I AS %s %s TO %s %s %s',
                pol_dep.policy_name,
                pol_dep.schema_name,
                pol_dep.table_name,
                CASE WHEN pol_dep.is_permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
                cmd_str,
                roles_str,
                CASE WHEN migrated_using IS NOT NULL THEN 'USING (' || migrated_using || ')' ELSE '' END,
                CASE WHEN migrated_check IS NOT NULL THEN 'WITH CHECK (' || migrated_check || ')' ELSE '' END
            );
        END LOOP;

        -- 3. Safely drop legacy function without CASCADE
        DROP FUNCTION public.is_admin(UUID);
    END IF;
END $$;

-- 1. Helper to safely check if the CURRENT authenticated user is admin
-- Zero parameters = prevents user enumeration and role probing attacks
-- Hardened: SET search_path = '' completely eliminates object shadowing
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

-- 2. Helper for current authenticated user to retrieve own role
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

-- 3. Procedure to explicitly promote a user to admin
-- Scoped: Executable strictly by database superuser (postgres in SQL Editor) or service_role
-- Uses explicit, verifiable authorization checks without relying on current_user inside SECURITY DEFINER
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
    -- Extract caller JWT role and authenticated UID from the request context if invoked via API / PostgREST
    caller_jwt_role := NULLIF(pg_catalog.current_setting('request.jwt.claim.role', true), '');
    caller_uid := auth.uid();

    -- Explicit Authorization Verification:
    -- 1. If called through PostgREST/API:
    --    Only allow if caller_jwt_role is 'service_role' OR caller_uid is an existing verified admin.
    --    Reject any anonymous or unauthenticated API caller immediately.
    IF caller_jwt_role IS NOT NULL THEN
        IF caller_jwt_role = 'anon' THEN
            RAISE EXCEPTION 'Access Denied: Unauthenticated clients cannot promote users.';
        ELSIF caller_jwt_role <> 'service_role' THEN
            IF caller_uid IS NULL OR NOT public.is_admin() THEN
                RAISE EXCEPTION 'Access Denied: Only service_role or active administrators can promote users.';
            END IF;
        END IF;
    ELSE
        -- 2. If called through direct SQL connection (e.g. Supabase SQL Editor):
        --    Allow if session_user is an administrative role (postgres, supabase_admin, service_role).
        --    Otherwise, enforce verified admin check.
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

    -- Upsert verified admin role safely
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

    -- Ensure owner profile exists and is active without overwriting non-empty fields
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

-- Restrict function execution strictly to administrative roles
REVOKE ALL ON FUNCTION public.promote_user_to_admin(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.promote_user_to_admin(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.promote_user_to_admin(TEXT) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO service_role;

-- 4. Protection trigger: Prevents non-admins from altering status or verified email in profiles
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

-- 5. Protection trigger: Prevents non-admins from altering status in memberships
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

-- 6. Safe signup trigger: Ensures newly registered users get pending_activation status and member role
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
-- SECTION 6: ROW LEVEL SECURITY (RLS) ACTIVATION ON ALL 11 TABLES
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

-- ==============================================================================
-- SECTION 7: CONTROLLED RLS POLICY AUDIT & MIGRATION
-- Audits all existing policies on all 11 tables.
-- Identifies any unrecognized permissive policy that could weaken or bypass access.
-- Surgically drops and recreates only specifically identified application policies.
-- ==============================================================================

-- 0. RLS Policy Auditor: Inspects every existing policy across all 11 tables
DO $$
DECLARE
    r_pol RECORD;
    known_policies TEXT[] := ARRAY[
        -- User Roles
        'Users can view own role', 'Only admins can modify roles', 
        'Allow individual read access', 'Allow individual read', 'Enable read access for all users',
        'Only admins can insert roles', 'Only admins can update roles', 'Only admins can delete roles',
        -- Profiles
        'Users can view own profile', 'Users can update own profile', 'Users can insert own profile',
        'Public profiles are viewable by everyone.', 'Users can insert their own profile.', 'Users can update own profile.',
        -- Membership Plans
        'Public can view plans', 'Admins manage plans',
        -- Gym Settings
        'Public view settings', 'Admins update settings',
        -- Memberships
        'Members view own memberships', 'Members can insert pending membership',
        'Admins manage memberships', 'Admins delete memberships',
        -- Payments
        'Members view own payments', 'Admins manage payments',
        -- Attendance
        'Members view own attendance', 'Members check-in', 'Admins manage attendance',
        -- Notifications
        'Members view own notifications', 'Members insert own notifications',
        'Members update own notifications', 'Admins manage all notifications',
        -- Reminder Logs
        'Members view own reminder logs', 'Admins manage reminder logs',
        -- Registration Requests
        'Public and members can submit registration requests', 'Admins can insert registration requests',
        'Users view own registration requests', 'Admins manage registration requests',
        'Anyone can submit registration requests',
        -- Audit Logs
        'Admins view audit logs', 'Admins insert audit logs'
    ];
BEGIN
    FOR r_pol IN
        SELECT 
            p.polname AS policy_name,
            c.relname AS table_name,
            n.nspname AS schema_name,
            p.polcmd AS cmd_char,
            p.polpermissive AS is_permissive,
            p.polroles AS pol_roles,
            pg_get_expr(p.polqual, p.polrelid) AS using_expr,
            pg_get_expr(p.polwithcheck, p.polrelid) AS check_expr,
            (SELECT string_agg(rolname, ', ') FROM pg_roles WHERE oid = ANY(p.polroles)) AS role_names
        FROM pg_policy p
        JOIN pg_class c ON c.oid = p.polrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname IN (
            'profiles', 'user_roles', 'membership_plans', 'gym_settings', 'memberships',
            'payments', 'attendance', 'notifications', 'reminder_logs', 'registration_requests', 'audit_logs'
          )
    LOOP
        -- If policy is already in the list of recognized/reconciled policies, it will be safely replaced below
        IF r_pol.policy_name = ANY(known_policies) THEN
            CONTINUE;
        END IF;

        -- For public catalog tables, an existing SELECT policy that evaluates to true is safe to preserve
        IF r_pol.table_name IN ('membership_plans', 'gym_settings') 
            AND r_pol.cmd_char = 'r' 
            AND r_pol.using_expr = 'true' THEN
            CONTINUE;
        END IF;

        -- If an unknown policy is permissive on a sensitive table, it poses a direct privilege bypass risk!
        -- In PostgreSQL, multiple PERMISSIVE policies combine with OR, weakening security.
        -- We halt safely and report full catalog metadata without silently ignoring or blindly deleting it.
        IF r_pol.is_permissive THEN
            RAISE EXCEPTION 'MIGRATION STOPPED: Unknown permissive RLS policy "%" detected on public.% (Command: %, Roles: %, USING: %, WITH CHECK: %). Unrecognized permissive policy could bypass intended access restrictions. Please review and reconcile.',
                r_pol.policy_name, r_pol.table_name, r_pol.cmd_char, COALESCE(r_pol.role_names, 'public'), COALESCE(r_pol.using_expr, 'NONE'), COALESCE(r_pol.check_expr, 'NONE');
        ELSE
            -- Unknown restrictive policies could break expected legitimate access
            RAISE EXCEPTION 'MIGRATION STOPPED: Unknown restrictive RLS policy "%" detected on public.% (Command: %, Roles: %, USING: %, WITH CHECK: %). Please review and reconcile.',
                r_pol.policy_name, r_pol.table_name, r_pol.cmd_char, COALESCE(r_pol.role_names, 'public'), COALESCE(r_pol.using_expr, 'NONE'), COALESCE(r_pol.check_expr, 'NONE');
        END IF;
    END LOOP;
END $$;

-- 1. User Roles Policies
-- CRITICAL RLS RECURSION PREVENTION:
-- The SELECT policy on user_roles MUST NEVER evaluate public.is_admin(), because is_admin() queries user_roles!
-- Evaluating auth.uid() = user_id allows users to view their own role with zero recursive function calls.
-- Write operations (INSERT, UPDATE, DELETE) are strictly guarded by public.is_admin().
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can modify roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow individual read access" ON public.user_roles;
DROP POLICY IF EXISTS "Allow individual read" ON public.user_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_roles;
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

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

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

-- 3. Membership Plans Policies
DROP POLICY IF EXISTS "Public can view plans" ON public.membership_plans;
DROP POLICY IF EXISTS "Admins manage plans" ON public.membership_plans;

CREATE POLICY "Public can view plans"
    ON public.membership_plans FOR SELECT
    USING (true);

CREATE POLICY "Admins manage plans"
    ON public.membership_plans FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 4. Gym Settings Policies
DROP POLICY IF EXISTS "Public view settings" ON public.gym_settings;
DROP POLICY IF EXISTS "Admins update settings" ON public.gym_settings;

CREATE POLICY "Public view settings"
    ON public.gym_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins update settings"
    ON public.gym_settings FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 5. Memberships Policies
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

-- 6. Payments Policies
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

-- 7. Attendance Policies
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

-- 8. Notifications Policies
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

-- 9. Reminder Logs Policies
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

-- 10. Registration Requests Policies
-- Split into Policy A (Public/Anon submission without calling is_admin) and Policy B (Admins)
DROP POLICY IF EXISTS "Public and members can submit registration requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Admins can insert registration requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Users view own registration requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Admins manage registration requests" ON public.registration_requests;
DROP POLICY IF EXISTS "Anyone can submit registration requests" ON public.registration_requests;

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
    WITH CHECK (
        public.is_admin()
    );

CREATE POLICY "Users view own registration requests"
    ON public.registration_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins manage registration requests"
    ON public.registration_requests FOR ALL
    TO authenticated
    USING (public.is_admin());

-- 11. Audit Logs Policies
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
-- SECTION 8: INITIAL SEED (Official schedule effective 1 August 2026)
-- PRESERVATION POLICY: ON CONFLICT (category, duration_type) DO NOTHING
-- This ensures that any existing custom pricing, duration, or descriptions
-- in public.membership_plans are 100% PRESERVED and never overwritten.
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
-- SECTION 9: SAFE DEFAULT SYNC FOR EXISTING AUTH USERS
-- Preserves existing administrator (krinectra17@gmail.com) and all user_roles rows.
-- Never demotes an admin; creates active profile for admin and pending for non-admins.
-- ==============================================================================

-- 1. Create profiles for existing auth users if missing (Preserves any existing profiles)
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

-- 2. Ensure existing administrators have status = 'active' without overwriting their profile fields
UPDATE public.profiles p
SET status = 'active', updated_at = pg_catalog.now()
FROM public.user_roles ur
WHERE p.id = ur.user_id
  AND ur.role = 'admin'
  AND p.status <> 'active';

-- 3. Ensure existing auth users have the default 'member' role ONLY if they do NOT have a role yet
-- Existing admin records (like krinectra17@gmail.com) are completely untouched
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'member' 
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================================
-- COMMIT TRANSACTION
-- ==============================================================================
COMMIT;

-- ==============================================================================
-- STAGING & NON-PRODUCTION VERIFICATION TEST PLAN
-- Execute in a dedicated local Supabase environment or staging database.
-- ==============================================================================
/*
-- ------------------------------------------------------------------------------
-- SUITE A: SCHEMA MIGRATION & EXACT CATALOG INTEGRITY
-- ------------------------------------------------------------------------------
-- 1. Verify all 11 tables exist in public schema:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'user_roles', 'membership_plans', 'gym_settings', 'memberships',
    'payments', 'attendance', 'notifications', 'reminder_logs', 'registration_requests', 'audit_logs'
  )
ORDER BY table_name;
-- EXPECTED: 11 rows returned.

-- 2. Verify exact composite unique constraint on membership_plans(category, duration_type):
SELECT 
    c.relname AS table_name,
    ARRAY_AGG(ia.attname::TEXT ORDER BY ia.attnum) AS indexed_columns,
    i.indisunique,
    i.indisvalid,
    i.indpred IS NULL AS is_non_partial
FROM pg_index i
JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_attribute ia ON ia.attrelid = i.indexrelid AND ia.attnum > 0 AND ia.attnum <= i.indnkeyatts
WHERE c.relname = 'membership_plans' AND i.indisunique = true
GROUP BY c.relname, i.indexrelid, i.indisunique, i.indisvalid, i.indpred;
-- EXPECTED: indexed_columns = {category, duration_type}, indisunique = true, indisvalid = true, is_non_partial = true.

-- 3. Verify exact composite unique constraint on attendance(member_id, attendance_date):
SELECT 
    c.relname AS table_name,
    ARRAY_AGG(ia.attname::TEXT ORDER BY ia.attnum) AS indexed_columns,
    i.indisunique,
    i.indisvalid,
    i.indpred IS NULL AS is_non_partial
FROM pg_index i
JOIN pg_class c ON c.oid = i.indrelid
JOIN pg_attribute ia ON ia.attrelid = i.indexrelid AND ia.attnum > 0 AND ia.attnum <= i.indnkeyatts
WHERE c.relname = 'attendance' AND i.indisunique = true
GROUP BY c.relname, i.indexrelid, i.indisunique, i.indisvalid, i.indpred;
-- EXPECTED: indexed_columns contains member_id and attendance_date, indisunique = true, is_non_partial = true.

-- 4. Verify exact Foreign Keys and ON DELETE actions:
SELECT 
    sc.relname AS source_table,
    rc.relname AS referenced_table,
    c.confdeltype,
    (SELECT ARRAY_AGG(sa.attname::TEXT ORDER BY array_position(c.conkey, sa.attnum)) FROM pg_attribute sa WHERE sa.attrelid = c.conrelid AND sa.attnum = ANY(c.conkey)) AS src_cols,
    (SELECT ARRAY_AGG(ra.attname::TEXT ORDER BY array_position(c.confkey, ra.attnum)) FROM pg_attribute ra WHERE ra.attrelid = c.confrelid AND ra.attnum = ANY(c.confkey)) AS ref_cols
FROM pg_constraint c
JOIN pg_class sc ON sc.oid = c.conrelid
JOIN pg_class rc ON rc.oid = c.confrelid
WHERE sc.relnamespace = 'public'::regnamespace AND c.contype = 'f'
ORDER BY sc.relname, rc.relname;

-- ------------------------------------------------------------------------------
-- SUITE B: RLS POLICIES & AUTHORIZATION PRIVILEGES
-- ------------------------------------------------------------------------------
-- Test B1: Anonymous caller cannot promote users via RPC
BEGIN;
SET LOCAL ROLE anon;
SELECT public.promote_user_to_admin('someone@example.com');
-- EXPECTED: ERROR 42501 (permission denied for function promote_user_to_admin)
ROLLBACK;

-- Test B2: Authenticated non-admin cannot promote users via RPC
BEGIN;
SET LOCAL ROLE authenticated;
SELECT public.promote_user_to_admin('someone@example.com');
-- EXPECTED: ERROR 42501 (permission denied for function promote_user_to_admin)
ROLLBACK;

-- Test B3: Anonymous visitor CAN insert registration request with status = 'pending'
BEGIN;
SET LOCAL ROLE anon;
INSERT INTO public.registration_requests (full_name, email, phone, agreed_price, final_amount, status)
VALUES ('Test Visitor', 'visitor@example.com', '9876543210', 800.00, 800.00, 'pending');
-- EXPECTED: 1 row inserted.
ROLLBACK;

-- Test B4: Anonymous visitor CANNOT forge status = 'approved' or set processed_by
BEGIN;
SET LOCAL ROLE anon;
INSERT INTO public.registration_requests (full_name, email, phone, agreed_price, final_amount, status)
VALUES ('Hacker Visitor', 'hacker@example.com', '9876543210', 800.00, 800.00, 'approved');
-- EXPECTED: ERROR 42501 (new row violates row-level security policy)
ROLLBACK;

-- Test B5: Staging verification of public.promote_user_to_admin() under the current privileged database session
-- Note: Uses the actual session connection (no invalid 'SET LOCAL session_user' assumption).
-- An isolated mock user is inserted into auth.users (with standard aud and role columns), promoted, verified, and cleanly rolled back.
-- Zero production or existing accounts (such as krinectra17@gmail.com) are modified.
BEGIN;
-- 0. Ensure no conflicting test state from previous aborted attempts
DELETE FROM public.user_roles WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid OR email = 'staging_test_promotee@gurufitness.test';

-- 1. Create temporary mock user in auth.users inside this transaction
INSERT INTO auth.users (id, aud, role, email, raw_user_meta_data)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'authenticated',
    'authenticated',
    'staging_test_promotee@gurufitness.test',
    '{"full_name": "Staging Candidate", "phone": "9999999999"}'::jsonb
);

-- 2. Call the promotion function under the actual session
SELECT public.promote_user_to_admin('staging_test_promotee@gurufitness.test');

-- 3. Verify the role was assigned and profile was activated
DO $$
DECLARE
    assigned_role TEXT;
    prof_status TEXT;
BEGIN
    SELECT role INTO assigned_role
    FROM public.user_roles
    WHERE user_id = '00000000-0000-0000-0000-000000000001'::uuid;

    SELECT status INTO prof_status
    FROM public.profiles
    WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

    IF assigned_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'TEST B5 FAILED: Expected role "admin", got "%"', COALESCE(assigned_role, 'NULL');
    END IF;

    IF prof_status IS DISTINCT FROM 'active' THEN
        RAISE EXCEPTION 'TEST B5 FAILED: Expected profile status "active", got "%"', COALESCE(prof_status, 'NULL');
    END IF;
END $$;

-- 4. Rollback guarantees that the test user, role, and profile are completely discarded
ROLLBACK;

-- Test B6: Financial History Protection (RESTRICT constraint verification)
-- Explicitly verifies that attempting to delete a profile with payment history is blocked by PostgreSQL.
-- Deterministic and reliable whether the payments table is currently empty or populated.
-- Creates an isolated mock member, membership, and payment, tests RESTRICT enforcement, and rolls back cleanly.
BEGIN;
DO $$
DECLARE
    test_user_id CONSTANT UUID := '00000000-0000-0000-0000-0000000000b6'::uuid;
    test_email CONSTANT TEXT := 'staging_b6_restrict_test@gurufitness.test';
    test_membership_id CONSTANT UUID := gen_random_uuid();
    test_payment_id CONSTANT UUID := gen_random_uuid();
    test_plan_id UUID;
    blocked_by_restrict BOOLEAN := false;
BEGIN
    -- 0. Clean up any leftover artifacts from prior aborted runs
    DELETE FROM public.payments WHERE id = test_payment_id;
    DELETE FROM public.memberships WHERE id = test_membership_id;
    DELETE FROM public.profiles WHERE id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id OR email = test_email;

    -- 1. Create temporary mock user in auth.users
    INSERT INTO auth.users (id, aud, role, email, raw_user_meta_data)
    VALUES (
        test_user_id,
        'authenticated',
        'authenticated',
        test_email,
        '{"full_name": "RESTRICT Test User", "phone": "8888888888"}'::jsonb
    );

    -- Ensure profile exists and is active (handle_new_user trigger creates profile, but ensure active)
    INSERT INTO public.profiles (id, full_name, email, phone, status)
    VALUES (test_user_id, 'RESTRICT Test User', test_email, '8888888888', 'active')
    ON CONFLICT (id) DO UPDATE SET status = 'active';

    -- 2. Obtain an existing plan_id from membership_plans to satisfy foreign key
    SELECT id INTO test_plan_id FROM public.membership_plans LIMIT 1;
    IF test_plan_id IS NULL THEN
        RAISE EXCEPTION 'TEST B6 FAILED: No membership_plans found to associate test membership.';
    END IF;

    -- 3. Create mock membership linked to the test profile
    INSERT INTO public.memberships (
        id, membership_code, member_id, plan_id, agreed_price, final_amount, start_date, expiry_date, status
    )
    VALUES (
        test_membership_id,
        'MEM-TEST-B6-' || substr(gen_random_uuid()::text, 1, 8),
        test_user_id,
        test_plan_id,
        1000.00,
        1000.00,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'active'
    );

    -- 4. Create mock payment record referencing the test profile and membership
    INSERT INTO public.payments (
        id, payment_number, member_id, membership_id, amount, payment_date, payment_method
    )
    VALUES (
        test_payment_id,
        'PAY-TEST-B6-' || substr(gen_random_uuid()::text, 1, 8),
        test_user_id,
        test_membership_id,
        1000.00,
        CURRENT_DATE,
        'cash'
    );

    -- 5. Attempt to delete the profile: MUST be blocked by payments_member_id_fkey (ON DELETE RESTRICT)
    BEGIN
        DELETE FROM public.profiles WHERE id = test_user_id;
        -- If execution continues here, the profile was erroneously deleted!
        RAISE EXCEPTION 'TEST B6 FAILED: Profile was deleted despite existing payment records! ON DELETE RESTRICT was not enforced.';
    EXCEPTION
        WHEN foreign_key_violation THEN
            -- Expected behavior: deletion blocked by payments_member_id_fkey
            blocked_by_restrict := true;
    END;

    IF NOT blocked_by_restrict THEN
        RAISE EXCEPTION 'TEST B6 FAILED: foreign_key_violation was not raised when deleting profile with payment history.';
    END IF;
END $$;
ROLLBACK;

-- ------------------------------------------------------------------------------
-- SUITE C: EXISTING DATA & ASSET PRESERVATION
-- ------------------------------------------------------------------------------
-- 1. Verify krinectra17@gmail.com has 'admin' role:
SELECT u.email, ur.role, p.status 
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'krinectra17@gmail.com';
-- EXPECTED: role = 'admin', status = 'active'.

-- 2. Verify membership catalog prices match official schedule:
SELECT category, duration_type, base_price, is_active 
FROM public.membership_plans 
ORDER BY category, duration_months;
-- EXPECTED: 12 official plans preserved.

-- ------------------------------------------------------------------------------
-- SUITE D: MIGRATION IDEMPOTENCE (Rerun Safety)
-- ------------------------------------------------------------------------------
-- Run complete_setup.sql a second time on the same database.
-- EXPECTED: Transaction completes successfully with COMMIT.
-- No duplicate constraint errors (42710) or duplicate object errors (42723).
*/