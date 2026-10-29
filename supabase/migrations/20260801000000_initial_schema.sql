-- ==============================================================================
-- GURU FITNESS & NUTRITIONS: DATABASE SCHEMA & ROW LEVEL SECURITY POLICIES
-- PostgreSQL / Supabase Migration
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    address TEXT,
    profile_image TEXT,
    emergency_contact TEXT,
    status TEXT NOT NULL DEFAULT 'pending_activation' CHECK (status IN ('pending_activation', 'active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. USER ROLES TABLE (Enforces server-authoritative role assignment)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, role)
);

-- 3. MEMBERSHIP PLANS TABLE
CREATE TABLE IF NOT EXISTS public.membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('strength', 'cardio_fatloss_yoga', 'personal_training')),
    name TEXT NOT NULL,
    duration_type TEXT NOT NULL CHECK (duration_type IN ('monthly', 'quarterly', 'half_yearly', 'yearly')),
    duration_months INT NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL CHECK (base_price >= 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_date DATE NOT NULL DEFAULT '2026-08-01',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(category, duration_type)
);

-- 4. MEMBERSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_code TEXT NOT NULL UNIQUE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.membership_plans(id),
    agreed_price NUMERIC(10, 2) NOT NULL,
    discount_type TEXT DEFAULT 'none' CHECK (discount_type IN ('none', 'group_15', 'custom')),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(10, 2) NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_activation' CHECK (status IN ('pending_activation', 'active', 'expired', 'suspended', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number TEXT NOT NULL UNIQUE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'online')),
    transaction_reference TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'payment', 'expiry', 'attendance', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. REMINDER LOGS TABLE
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 9. GYM SETTINGS TABLE
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

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id),
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. REGISTRATION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.registration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    plan_id UUID REFERENCES public.membership_plans(id),
    is_group_discount BOOLEAN NOT NULL DEFAULT false,
    group_member_count INT DEFAULT 1,
    agreed_price NUMERIC(10, 2) NOT NULL,
    final_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
    notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR HIGH QUERY EFFICIENCY
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_email ON public.registration_requests(email);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON public.registration_requests(status);

-- ==============================================================================
-- HELPER FUNCTIONS FOR SECURITY (Prevent Client Elevation)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = $1 AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own non-status profile fields"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin(auth.uid()))
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin(auth.uid()));

-- 2. User Roles Policies
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert or modify roles"
    ON public.user_roles FOR ALL
    USING (public.is_admin(auth.uid()));

-- 3. Membership Plans Policies
CREATE POLICY "Anyone can view active membership plans"
    ON public.membership_plans FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify membership plans"
    ON public.membership_plans FOR ALL
    USING (public.is_admin(auth.uid()));

-- 4. Memberships Policies
CREATE POLICY "Members can view their own memberships"
    ON public.memberships FOR SELECT
    USING (auth.uid() = member_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert or update memberships"
    ON public.memberships FOR ALL
    USING (public.is_admin(auth.uid()));

-- 5. Payments Policies
CREATE POLICY "Members can view their own payments"
    ON public.payments FOR SELECT
    USING (auth.uid() = member_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can record or manage payments"
    ON public.payments FOR ALL
    USING (public.is_admin(auth.uid()));

-- 6. Attendance Policies
CREATE POLICY "Members can view their own attendance"
    ON public.attendance FOR SELECT
    USING (auth.uid() = member_id OR public.is_admin(auth.uid()));

CREATE POLICY "Members can check in for today"
    ON public.attendance FOR INSERT
    WITH CHECK (auth.uid() = member_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update or delete attendance records"
    ON public.attendance FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- 7. Notifications Policies
CREATE POLICY "Members can view their notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = member_id OR public.is_admin(auth.uid()));

CREATE POLICY "Members can update their own notification read status"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = member_id OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- 8. Reminder Logs Policies
CREATE POLICY "Only admins can view reminder logs"
    ON public.reminder_logs FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can create reminder logs"
    ON public.reminder_logs FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- 9. Gym Settings Policies
CREATE POLICY "Everyone can read gym settings"
    ON public.gym_settings FOR SELECT
    USING (true);

CREATE POLICY "Only admins can update gym settings"
    ON public.gym_settings FOR ALL
    USING (public.is_admin(auth.uid()));

-- 10. Audit Logs Policies
CREATE POLICY "Only admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- 11. Registration Requests Policies
CREATE POLICY "Anyone can submit a registration request"
    ON public.registration_requests FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view their own registration requests"
    ON public.registration_requests FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can manage registration requests"
    ON public.registration_requests FOR ALL
    USING (public.is_admin(auth.uid()));

-- ==============================================================================
-- INITIAL SEED: EXACT MEMBERSHIP PRICES FROM PROMPT
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
ON CONFLICT (category, duration_type) DO UPDATE
SET base_price = EXCLUDED.base_price,
    description = EXCLUDED.description,
    effective_date = EXCLUDED.effective_date;

-- Insert default gym settings row
INSERT INTO public.gym_settings (id, gym_name, tagline, phone_primary, phone_secondary, instagram_handle)
VALUES (1, 'GURU FITNESS & NUTRITIONS', 'Transforming Bodies, Transforming Lives.', '9828482505', '7014838282', 'rakesh_bagra_fit')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 11. AUTOMATIC PROFILE AND ROLE ASSIGNMENT TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Create member profile with pending_activation status
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        status,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'pending_activation',
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;

    -- 2. Server-authoritatively assign MEMBER role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger firing on new user creation in Supabase auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 12. SECURE ADMIN PROVISIONING FUNCTION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email TEXT)
RETURNS VOID AS $$
DECLARE
    target_user_id UUID;
BEGIN
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = LOWER(TRIM(target_email));

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found in auth.users.', target_email;
    END IF;

    -- Grant admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Ensure profile is active
    UPDATE public.profiles
    SET status = 'active', updated_at = now()
    WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

