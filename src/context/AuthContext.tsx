import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, RoleType, MemberSummary } from '../types/database';
import { gymDB } from '../lib/database';
import { isSupabaseConfigured, supabase, SUPABASE_PROJECT_URL } from '../lib/supabase';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  role: RoleType | null;
  summary: MemberSummary | null;
  isLoading: boolean;
  configError: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: RoleType }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    emergencyContact?: string;
    planId: string;
    isGroupDiscount?: boolean;
    groupMemberCount?: number;
    password: string;
  }) => Promise<{ success: boolean; error?: string; profile?: Profile; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<RoleType | null>(null);
  const [summary, setSummary] = useState<MemberSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [configError, setConfigError] = useState<string | null>(
    !isSupabaseConfigured
      ? `Supabase publishable key is required for project ${SUPABASE_PROJECT_URL}. Please configure VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.`
      : null
  );

  /**
   * Securely and resiliently resolves the user's verified role.
   * Checks strictly trusted database & server authority sources.
   * Filters strictly by the authenticated user's actual UUID (auth.uid() / session.user.id).
   * Fails closed to 'member' if admin cannot be verified.
   *
   * NEVER grants admin based on:
   * - Email substrings or domain names
   * - User-editable user_metadata
   * - Client localStorage / cached roles
   * - URL parameters or frontend state
   */
  const resolveUserRole = async (authUser: { id: string; email?: string; app_metadata?: any; user_metadata?: any }): Promise<RoleType> => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return 'member';
      }

      // Prioritize the explicitly authenticated user UUID
      const sessionUser = (await supabase.auth.getSession()).data.session?.user;
      const targetUid = authUser?.id || sessionUser?.id;

      if (!targetUid) {
        console.warn('[Guru Fitness Auth] Role resolution skipped: no authenticated user UUID found');
        return 'member';
      }

      console.log('[Guru Fitness Auth] Resolving role for authenticated user UUID:', targetUid);

      // Check 1: Query public.user_roles table directly (database authority)
      try {
        const { data: roleRows, error: roleError } = await supabase
          .from('user_roles')
          .select('id, user_id, role')
          .eq('user_id', targetUid);

        if (roleError) {
          console.error('[Guru Fitness Auth] public.user_roles query failed:', {
            code: roleError.code,
            message: roleError.message,
            details: roleError.details,
            hint: roleError.hint,
            queriedUserId: targetUid
          });
        } else {
          console.log('[Guru Fitness Auth] public.user_roles query succeeded:', {
            queriedUserId: targetUid,
            rowCount: roleRows?.length || 0,
            rows: roleRows
          });

          if (roleRows && roleRows.length > 0) {
            const hasAdmin = roleRows.some((r: any) => String(r.role).toLowerCase().trim() === 'admin');
            if (hasAdmin) {
              console.log('[Guru Fitness Auth] Verified admin role in user_roles for UUID:', targetUid);
              return 'admin';
            }
            const hasMember = roleRows.some((r: any) => String(r.role).toLowerCase().trim() === 'member');
            if (hasMember) {
              console.log('[Guru Fitness Auth] Verified member role in user_roles for UUID:', targetUid);
              return 'member';
            }
          }
        }
      } catch (err) {
        console.warn('[Guru Fitness Auth] user_roles query threw exception:', err);
      }

      // Check 2: Call RPC get_my_role() (SECURITY DEFINER PostgreSQL function that evaluates auth.uid())
      try {
        const { data: rpcRole, error: rpcError } = await supabase.rpc('get_my_role');
        if (rpcError) {
          console.warn('[Guru Fitness Auth] get_my_role RPC check failed:', {
            code: (rpcError as any).code,
            message: rpcError.message
          });
        } else if (rpcRole) {
          const r = String(rpcRole).toLowerCase().trim();
          if (r === 'admin') {
            console.log('[Guru Fitness Auth] Verified admin role via get_my_role RPC for UUID:', targetUid);
            return 'admin';
          }
          if (r === 'member') {
            return 'member';
          }
        }
      } catch (err) {
        console.warn('[Guru Fitness Auth] get_my_role RPC call threw:', err);
      }

      // Check 3: Check Supabase Auth server-controlled metadata (app_metadata only, never user_metadata)
      const appRole = authUser?.app_metadata?.role || sessionUser?.app_metadata?.role;
      if (appRole === 'admin') {
        console.log('[Guru Fitness Auth] Verified admin role via app_metadata for UUID:', targetUid);
        return 'admin';
      }

      // Fail closed: Default to 'member' for all unverified users
      console.log('[Guru Fitness Auth] Role resolution defaulted to member for UUID:', targetUid);
      return 'member';
    } catch (err) {
      console.error('[Guru Fitness Auth] Role resolution error, failing closed to member:', err);
      return 'member';
    }
  };

  /**
   * Loads full user details and profile from Supabase.
   * Resolves and sets role immediately to prevent route redirection race conditions.
   * Does NOT assume public.profiles or public.memberships exists in production.
   */
  const loadUserDataFromSupabase = async (userId: string, email: string, authUserObj?: any): Promise<RoleType> => {
    try {
      if (!isSupabaseConfigured || !supabase) return 'member';

      // 1. Resolve role using multi-layered database verification
      const userObj = authUserObj || (await supabase.auth.getSession()).data.session?.user || { id: userId, email };
      const userRole = await resolveUserRole(userObj);

      // Set user and verified role in React state IMMEDIATELY (prevents redirection lag)
      setUser({ id: userId, email });
      setRole(userRole);
      gymDB.setUserRole(userId, userRole);

      // 2. Synthesize guaranteed non-null profile safely without assuming public.profiles exists
      let userProfile: Profile = {
        id: userId,
        full_name: (userObj.user_metadata?.full_name || email.split('@')[0] || 'User').replace(/[._]/g, ' '),
        email: email,
        phone: userObj.user_metadata?.phone || '',
        date_of_birth: null,
        gender: 'prefer_not_to_say',
        address: null,
        emergency_contact: null,
        profile_image: null,
        status: userRole === 'admin' ? 'active' : 'pending_activation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Best-effort profile fetch if public.profiles exists
      try {
        const { data: profRow } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profRow) {
          userProfile = profRow;
        }
      } catch {
        // public.profiles table does not exist in production; synthesized profile is used
      }

      // Save to local cache & update state
      gymDB.saveProfile(userProfile);
      setProfile(userProfile);

      const memSummary = gymDB.getMemberSummary(userId);
      setSummary(memSummary);

      return userRole;
    } catch (err) {
      console.error('[Guru Fitness Auth] Error loading authenticated user details:', err);
      return 'member';
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // Listen to Supabase Auth state changes (emits INITIAL_SESSION immediately on startup in @supabase/supabase-js v2)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (!isMounted) return;

      if (session?.user) {
        await loadUserDataFromSupabase(session.user.id, session.user.email || '', session.user);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setSummary(null);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshData = async () => {
    if (user && isSupabaseConfigured && supabase) {
      await loadUserDataFromSupabase(user.id, user.email);
    } else if (user) {
      const prof = gymDB.getProfile(user.id);
      const userRole = gymDB.getUserRole(user.id);
      const memberSummary = gymDB.getMemberSummary(user.id);
      setProfile(prof || null);
      setRole(userRole);
      setSummary(memberSummary);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: RoleType }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();

      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return {
          success: false,
          error: `Authentication service is not configured. Please supply VITE_SUPABASE_PUBLISHABLE_KEY for ${SUPABASE_PROJECT_URL} in .env.local.`
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error || !data.user) {
        setIsLoading(false);
        const msg = error?.message || 'Invalid email or password.';
        if (msg.toLowerCase().includes('email not confirmed')) {
          return {
            success: false,
            error: 'Your email address has not been confirmed yet. Please click the confirmation link sent to your inbox to activate your account.'
          };
        }
        return {
          success: false,
          error: msg
        };
      }

      // Fully load user details and verified role
      const verifiedRole = await loadUserDataFromSupabase(data.user.id, cleanEmail, data.user);

      setIsLoading(false);
      return { success: true, role: verifiedRole };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Authentication failed.' };
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: string;
    emergencyContact?: string;
    planId: string;
    isGroupDiscount?: boolean;
    groupMemberCount?: number;
    password: string;
  }): Promise<{ success: boolean; error?: string; profile?: Profile; needsEmailConfirmation?: boolean }> => {
    setIsLoading(true);
    try {
      const cleanEmail = data.email.toLowerCase().trim();

      if (!isSupabaseConfigured || !supabase) {
        setIsLoading(false);
        return {
          success: false,
          error: `Database service is unconfigured. Please configure VITE_SUPABASE_PUBLISHABLE_KEY in .env.local.`
        };
      }

      // 1. Sign up through Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone
          }
        }
      });

      if (authError || !authData.user) {
        setIsLoading(false);
        return { success: false, error: authError?.message || 'Registration failed.' };
      }

      const userId = authData.user.id;
      const needsEmailConfirmation = !authData.session;

      // 2. Create Profile row (status = pending_activation)
      const profileData: Profile = {
        id: userId,
        full_name: data.fullName,
        email: cleanEmail,
        phone: data.phone,
        date_of_birth: data.dateOfBirth || null,
        gender: data.gender || 'prefer_not_to_say',
        address: data.address || null,
        emergency_contact: data.emergencyContact || null,
        profile_image: null,
        status: 'pending_activation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        await supabase.from('profiles').upsert(profileData);
      } catch {
        // Table may not exist yet
      }

      // 3. Assign role 'member' in user_roles (server-authoritative)
      try {
        await supabase.from('user_roles').insert({
          user_id: userId,
          role: 'member'
        });
      } catch {
        // Ignore if error or exists
      }

      // 4. Resolve selected plan and calculate pricing
      let agreedPrice = 800;
      let durationMonths = 1;
      try {
        const { data: planData } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('id', data.planId)
          .maybeSingle();

        if (planData) {
          agreedPrice = planData.base_price || 800;
          durationMonths = planData.duration_months || 1;
        }
      } catch {
        const localPlan = gymDB.getPlans().find(p => p.id === data.planId);
        if (localPlan) {
          agreedPrice = localPlan.base_price;
          durationMonths = localPlan.duration_months;
        }
      }

      const isGroup = Boolean(data.isGroupDiscount && (data.groupMemberCount ?? 0) >= 3);
      const discountAmount = isGroup ? Math.round(agreedPrice * 0.15) : 0;
      const finalAmount = agreedPrice - discountAmount;

      const startDate = new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

      const membershipRecord = {
        membership_code: `GFN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        member_id: userId,
        plan_id: data.planId,
        agreed_price: agreedPrice,
        discount_type: isGroup ? 'group_15' : 'none',
        discount_amount: discountAmount,
        final_amount: finalAmount,
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'pending_activation' as const,
        notes: isGroup ? 'Registered online with 15% group discount policy.' : 'Registered online via member portal.'
      };

      try {
        await supabase.from('memberships').insert(membershipRecord);
      } catch {
        // Table may not exist yet
      }

      // 5. System notification
      try {
        await supabase.from('notifications').insert({
          member_id: userId,
          title: 'Registration Submitted - Pending Activation',
          message: `Welcome to GURU FITNESS & NUTRITIONS, ${data.fullName}! Your registration has been received. Your workout pass will be activated upon front-desk fee settlement.`,
          type: 'system',
          link: '/dashboard'
        });
      } catch {
        // Table may not exist yet
      }

      // 6. Registration Request Log (for owner/front-desk review)
      try {
        await supabase.from('registration_requests').insert({
          user_id: userId,
          full_name: data.fullName,
          email: cleanEmail,
          phone: data.phone,
          plan_id: data.planId,
          is_group_discount: isGroup,
          group_member_count: data.groupMemberCount || 1,
          agreed_price: agreedPrice,
          final_amount: finalAmount,
          status: 'pending',
          notes: isGroup ? 'Online portal registration with 15% group discount.' : 'Online portal registration.'
        });
      } catch {
        // Table may not exist yet
      }

      if (!needsEmailConfirmation) {
        await loadUserDataFromSupabase(userId, cleanEmail, authData.user);
      }

      setIsLoading(false);
      return { success: true, profile: profileData, needsEmailConfirmation };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setRole(null);
    setSummary(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        summary,
        isLoading,
        configError,
        login,
        register,
        logout,
        refreshData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
