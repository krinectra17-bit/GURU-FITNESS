import { 
  Profile, 
  UserRole, 
  MembershipPlan, 
  Membership, 
  Payment, 
  Attendance, 
  Notification, 
  ReminderLog, 
  GymSettings, 
  AuditLog,
  MemberSummary,
  DurationType,
  MembershipCategory,
  RoleType
} from '../types/database';
import { isSupabaseConfigured, supabase } from './supabase';

export interface DatabaseOperationResult {
  success: boolean;
  error?: string;
  table?: string;
  code?: string;
  details?: string;
}

const STORAGE_PREFIX = 'gfn_prod_';

// Official Pricing Data from the Gym Poster (Effective 1 August 2026)
export const OFFICIAL_PLANS: MembershipPlan[] = [
  // STRENGTH TRAINING
  {
    id: 'plan-str-1',
    category: 'strength',
    name: 'Strength Training - Monthly',
    duration_type: 'monthly',
    duration_months: 1,
    base_price: 800,
    description: 'Full gym floor and strength training equipment access with form coaching.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'plan-str-3',
    category: 'strength',
    name: 'Strength Training - Quarterly (3 Months)',
    duration_type: 'quarterly',
    duration_months: 3,
    base_price: 2000,
    description: '3 months structured strength development & progressive resistance training.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'plan-str-6',
    category: 'strength',
    name: 'Strength Training - Half-Yearly (6 Months)',
    duration_type: 'half_yearly',
    duration_months: 6,
    base_price: 3500,
    description: '6 months dedicated strength foundation, powerlifting & hypertrophy conditioning.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'plan-str-12',
    category: 'strength',
    name: 'Strength Training - Yearly (12 Months)',
    duration_type: 'yearly',
    duration_months: 12,
    base_price: 5000,
    description: 'Annual complete gym access with seasonal training cycles and continuous support.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },

  // CARDIO / FAT LOSS / YOGA
  {
    id: 'plan-cardio-1',
    category: 'cardio_fatloss_yoga',
    name: 'Cardio / Fat Loss / Yoga - Monthly',
    duration_type: 'monthly',
    duration_months: 1,
    base_price: 1200,
    description: 'Cardiovascular conditioning, HIIT fat loss circuits, and restorative yoga sessions.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'plan-cardio-3',
    category: 'cardio_fatloss_yoga',
    name: 'Cardio / Fat Loss / Yoga - Quarterly (3 Months)',
    duration_type: 'quarterly',
    duration_months: 3,
    base_price: 3000,
    description: 'Intense metabolic conditioning, calorie expenditure optimization, and flexibility.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'plan-cardio-6',
    category: 'cardio_fatloss_yoga',
    name: 'Cardio / Fat Loss / Yoga - Half-Yearly (6 Months)',
    duration_type: 'half_yearly',
    duration_months: 6,
    base_price: 5000,
    description: 'Sustainable body fat reduction, cardiovascular health, and stress relief through yoga.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'plan-cardio-12',
    category: 'cardio_fatloss_yoga',
    name: 'Cardio / Fat Loss / Yoga - Yearly (12 Months)',
    duration_type: 'yearly',
    duration_months: 12,
    base_price: 8000,
    description: 'Year-round cardiovascular wellness, fat loss management, and mental equilibrium.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },

  // PERSONAL TRAINING
  {
    id: 'plan-pt-1',
    category: 'personal_training',
    name: 'Personal Training - Monthly',
    duration_type: 'monthly',
    duration_months: 1,
    base_price: 4000,
    description: '1-on-1 private coaching sessions with NPC Champion Rakesh Bagra / Coach Chitra Bagra.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'plan-pt-3',
    category: 'personal_training',
    name: 'Personal Training - Quarterly (3 Months)',
    duration_type: 'quarterly',
    duration_months: 3,
    base_price: 9000,
    description: 'Tailored 90-day periodized physique transformation with nutrition monitoring.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'plan-pt-6',
    category: 'personal_training',
    name: 'Personal Training - Half-Yearly (6 Months)',
    duration_type: 'half_yearly',
    duration_months: 6,
    base_price: 15000,
    description: 'Elite 6-month body recomposition, biomechanics analysis, and physique competition prep.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  },
  {
    id: 'plan-pt-12',
    category: 'personal_training',
    name: 'Personal Training - Yearly (12 Months)',
    duration_type: 'yearly',
    duration_months: 12,
    base_price: 21000,
    description: 'Comprehensive 365-day mentorship, total body transformation, and lifetime athletic habits.',
    is_active: true,
    effective_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z'
  }
];

export const OFFICIAL_GYM_SETTINGS: GymSettings = {
  id: 1,
  gym_name: 'GURU FITNESS & NUTRITIONS',
  tagline: 'Transforming Bodies, Transforming Lives.',
  brand_promise: 'Expert Training. Scientific Nutrition. Real Results. Lifetime Support.',
  phone_primary: '9828482505',
  phone_secondary: '7014838282',
  instagram_handle: 'rakesh_bagra_fit',
  address: 'Commercial Complex, Main Market, Jaipur, Rajasthan (Contact management for landmark)',
  google_maps_url: 'https://maps.google.com/?q=Guru+Fitness+Jaipur',
  opening_hours_weekdays: '5:30 AM – 10:00 PM (Monday to Saturday)',
  opening_hours_sunday: '6:00 AM – 1:00 PM (Sunday Recovery)',
  effective_date_notice: 'Pricing schedule effective from 1 August 2026 as per official poster.',
  attendance_cutoff_time: '22:00:00',
  group_discount_percent: 15.00,
  group_discount_min_people: 3,
  whatsapp_api_configured: false,
  whatsapp_phone_number_id: '',
  whatsapp_business_account_id: '',
  updated_at: '2026-08-01T00:00:00Z'
};

class GymDatabaseService {
  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + key);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return defaultVal;
  }

  private setStorage<T>(key: string, val: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
    } catch {
      // fallback
    }
  }

  // Settings
  getSettings(): GymSettings {
    return this.getStorage<GymSettings>('settings', OFFICIAL_GYM_SETTINGS);
  }

  updateSettings(updates: Partial<GymSettings>): GymSettings {
    const current = this.getSettings();
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    this.setStorage('settings', updated);
    if (isSupabaseConfigured && supabase) {
      supabase.from('gym_settings').upsert({ ...updated, id: 1 });
    }
    this.addAuditLog(null, 'admin', 'SETTINGS_UPDATED', 'gym_settings', '1', updates);
    return updated;
  }

  // Plans
  getPlans(): MembershipPlan[] {
    return this.getStorage<MembershipPlan[]>('plans', OFFICIAL_PLANS);
  }

  async getActivePlansAsync(): Promise<MembershipPlan[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
          .order('category')
          .order('duration_months');

        if (!error && data && data.length > 0) {
          this.setStorage('plans', data);
          return data;
        }
      } catch (err) {
        console.warn('[Guru Fitness DB] Failed to fetch plans from Supabase:', err);
      }
    }
    return this.getPlans();
  }

  async syncMembersDirectoryAsync(): Promise<{ profiles: Profile[]; memberships: Membership[] }> {
    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Fetch active membership plans with real database UUIDs
        const { data: plansData } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
          .order('category')
          .order('duration_months');

        if (plansData && plansData.length > 0) {
          this.setStorage('plans', plansData);
        }

        // 2. Fetch profiles directly from public.profiles
        const { data: profilesData, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!profErr && profilesData) {
          this.setStorage('profiles', profilesData);
        }

        // 3. Fetch memberships directly from public.memberships
        const { data: membershipsData, error: memErr } = await supabase
          .from('memberships')
          .select('*');

        if (!memErr && membershipsData) {
          this.setStorage('memberships', membershipsData);
        }

        return {
          profiles: this.getProfiles(),
          memberships: this.getMemberships()
        };
      } catch (err) {
        console.warn('[Guru Fitness DB] Error syncing members directory from Supabase:', err);
      }
    }

    return {
      profiles: this.getProfiles(),
      memberships: this.getMemberships()
    };
  }

  updatePlanPrice(planId: string, newPrice: number): MembershipPlan {
    const plans = this.getPlans();
    const updated = plans.map(p => p.id === planId ? { ...p, base_price: newPrice, updated_at: new Date().toISOString() } : p);
    this.setStorage('plans', updated);
    if (isSupabaseConfigured && supabase) {
      supabase.from('membership_plans').update({ base_price: newPrice, updated_at: new Date().toISOString() }).eq('id', planId);
    }
    this.addAuditLog(null, 'admin', 'PLAN_PRICE_UPDATED', 'membership_plans', planId, { newPrice });
    return updated.find(p => p.id === planId)!;
  }

  // Profiles (Real profiles only - no mock customer preloads!)
  getProfiles(): Profile[] {
    return this.getStorage<Profile[]>('profiles', []);
  }

  getProfile(id: string): Profile | undefined {
    return this.getProfiles().find(p => p.id === id);
  }

  saveProfile(profile: Profile): void {
    const profiles = this.getProfiles();
    const idx = profiles.findIndex(p => p.id === profile.id);
    if (idx >= 0) {
      profiles[idx] = profile;
    } else {
      profiles.unshift(profile);
    }
    this.setStorage('profiles', profiles);
  }

  updateProfile(id: string, updates: Partial<Profile>): Profile {
    const profiles = this.getProfiles();
    const updated = profiles.map(p => p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p);
    this.setStorage('profiles', updated);
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .then(({ error }: { error: any }) => {
          if (error) {
            console.warn(`[Guru Fitness DB] Background update to public.profiles failed: ${error.message} (Code: ${error.code})`);
          }
        })
        .catch((err: any) => {
          console.warn('[Guru Fitness DB] Background update to public.profiles error:', err);
        });
    }
    return updated.find(p => p.id === id)!;
  }

  async updateProfileAsync(id: string, updates: Partial<Profile>): Promise<DatabaseOperationResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) {
          const errMsg = `Supabase [public.profiles] Error: ${error.message || error.details} (Code: ${error.code || 'UNKNOWN'})`;
          console.error('[Guru Fitness DB] updateProfileAsync failed:', errMsg);
          return {
            success: false,
            error: errMsg,
            table: 'profiles',
            code: error.code,
            details: error.details
          };
        }
      } catch (err: any) {
        return {
          success: false,
          error: `Database exception on public.profiles: ${err.message || String(err)}`,
          table: 'profiles'
        };
      }
    }

    this.updateProfile(id, updates);
    return { success: true };
  }

  // Roles
  getRoles(): UserRole[] {
    return this.getStorage<UserRole[]>('roles', []);
  }

  getUserRole(userId: string): RoleType {
    const roles = this.getRoles();
    const match = roles.find(r => r.user_id === userId);
    return match ? match.role : 'member';
  }

  setUserRole(userId: string, role: RoleType): void {
    const roles = this.getRoles();
    const existing = roles.find(r => r.user_id === userId);
    if (existing) {
      existing.role = role;
    } else {
      roles.push({
        id: 'role-' + Date.now(),
        user_id: userId,
        role,
        created_at: new Date().toISOString()
      });
    }
    this.setStorage('roles', roles);
  }

  // Memberships
  getMemberships(): Membership[] {
    return this.getStorage<Membership[]>('memberships', []);
  }

  getMemberActiveMembership(memberId: string): (Membership & { plan?: MembershipPlan }) | undefined {
    const memberships = this.getMemberships().filter(m => m.member_id === memberId);
    const plans = this.getPlans();
    const current = memberships.find(m => m.status === 'active') || memberships.find(m => m.status === 'pending_activation') || memberships[0];
    if (!current) return undefined;
    return {
      ...current,
      plan: plans.find(p => p.id === current.plan_id)
    };
  }

  saveMembership(membership: Membership): void {
    const list = this.getMemberships();
    const idx = list.findIndex(m => m.id === membership.id);
    if (idx >= 0) {
      list[idx] = membership;
    } else {
      list.unshift(membership);
    }
    this.setStorage('memberships', list);
  }

  // Admin Member Actions
  async approveAndActivateMember(
    memberId: string, 
    membershipId: string, 
    paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'online', 
    initialAmountPaid: number, 
    referenceNumber?: string
  ): Promise<DatabaseOperationResult> {
    console.log(`[Guru Fitness DB] Initiating member approval: memberId=${memberId}, membershipId=${membershipId}`);

    // If Supabase is configured, execute the atomic PostgreSQL RPC function
    if (isSupabaseConfigured && supabase) {
      try {
        console.log(`[Guru Fitness DB] Invoking atomic RPC admin_approve_and_activate_member for member ${memberId}...`);
        const { data: rpcResult, error: rpcError } = await (supabase as any).rpc('admin_approve_and_activate_member', {
          target_member_id: memberId,
          target_membership_id: membershipId,
          initial_payment_amount: initialAmountPaid || 0,
          payment_method: paymentMethod || 'cash',
          payment_reference: referenceNumber || null,
          admin_notes: 'Initial fee payment during activation.'
        });

        const isRpcMissing = rpcError && (
          rpcError.code === '42883' || 
          rpcError.code === 'PGRST202' ||
          rpcError.message?.includes('does not exist') ||
          rpcError.details?.includes('does not exist')
        );

        if (isRpcMissing) {
          console.warn('[Guru Fitness DB] admin_approve_and_activate_member RPC not in database yet. Executing direct database table updates...');
          
          // Step 1: Update public.memberships status = 'active'
          const { error: memErr } = await supabase
            .from('memberships')
            .update({ 
              status: 'active', 
              updated_at: new Date().toISOString() 
            })
            .eq('id', membershipId)
            .eq('member_id', memberId);

          if (memErr) {
            const formattedMsg = `Supabase [public.memberships] Update Error: ${memErr.message || memErr.details} (Code: ${memErr.code || 'UNKNOWN'})`;
            console.error('[Guru Fitness DB]', formattedMsg);
            return {
              success: false,
              error: formattedMsg,
              table: 'memberships'
            };
          }

          // Step 2: Update public.profiles status = 'active'
          const { error: profErr } = await supabase
            .from('profiles')
            .update({ 
              status: 'active', 
              updated_at: new Date().toISOString() 
            })
            .eq('id', memberId);

          if (profErr) {
            const formattedMsg = `Supabase [public.profiles] Update Error: ${profErr.message || profErr.details} (Code: ${profErr.code || 'UNKNOWN'})`;
            console.error('[Guru Fitness DB]', formattedMsg);
            return {
              success: false,
              error: formattedMsg,
              table: 'profiles'
            };
          }

          // Step 3: Record payment in public.payments if initialAmountPaid > 0
          if (initialAmountPaid > 0) {
            const pNumber = `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            await supabase.from('payments').insert({
              payment_number: pNumber,
              member_id: memberId,
              membership_id: membershipId,
              amount: initialAmountPaid,
              payment_date: new Date().toISOString().split('T')[0],
              payment_method: paymentMethod,
              transaction_reference: referenceNumber || null,
              notes: 'Initial fee settlement during membership activation.'
            });
          }

          // Step 4: Notification
          await supabase.from('notifications').insert({
            member_id: memberId,
            title: 'Membership Activated!',
            message: 'Your membership at GURU FITNESS & NUTRITIONS has been approved and activated. You can now use your QR check-in at the front desk.',
            type: 'payment',
            link: '/dashboard/membership'
          });

          // Step 5: Audit log
          await supabase.from('audit_logs').insert({
            action: 'MEMBERSHIP_ACTIVATED_DIRECT',
            entity_type: 'memberships',
            entity_id: membershipId,
            details: { member_id: memberId, initialAmountPaid, paymentMethod }
          });
        } else if (rpcError) {
          const formattedMsg = `Supabase Database Error: ${rpcError.message || rpcError.details || JSON.stringify(rpcError)} (Code: ${rpcError.code || 'UNKNOWN'})`;
          console.error('[Guru Fitness DB] Member activation aborted due to database transaction failure:', formattedMsg);
          return {
            success: false,
            error: formattedMsg,
            code: rpcError.code,
            details: rpcError.details
          };
        } else if (!rpcResult || !rpcResult.success) {
          const formattedMsg = rpcResult?.message || 'Database rejected approval. Atomic transaction rolled back.';
          console.error('[Guru Fitness DB] Member activation failed:', formattedMsg);
          return {
            success: false,
            error: formattedMsg
          };
        } else {
          console.log('[Guru Fitness DB] Atomic RPC execution succeeded:', rpcResult);
        }
      } catch (err: any) {
        console.error('[Guru Fitness DB] Unexpected exception during Supabase approval RPC:', err);
        return {
          success: false,
          error: `Database connection error: ${err.message || String(err)}`
        };
      }
    }

    // ONLY reach here if the database update succeeded (or offline)
    // 1. Update Profile to active in local store
    const profiles = this.getProfiles();
    const updatedProfiles = profiles.map(p => p.id === memberId ? { ...p, status: 'active' as const, updated_at: new Date().toISOString() } : p);
    this.setStorage('profiles', updatedProfiles);

    // 2. Update Membership to active in local store
    const memberships = this.getMemberships();
    const updatedMemberships = memberships.map(m => {
      if (m.id === membershipId) {
        return {
          ...m,
          status: 'active' as const,
          updated_at: new Date().toISOString()
        };
      }
      return m;
    });
    this.setStorage('memberships', updatedMemberships);

    // 3. Record Payment in local store (skipRemoteSync=true because atomic RPC already recorded it in Supabase)
    if (initialAmountPaid > 0) {
      this.recordPayment({
        memberId,
        membershipId,
        amount: initialAmountPaid,
        method: paymentMethod,
        reference: referenceNumber || 'PAID-ON-ACTIVATION',
        notes: 'Initial fee payment during activation.'
      }, true);
    }

    // 4. Send Notification in local store
    this.addNotification(
      memberId,
      'Membership Activated!',
      'Your membership at GURU FITNESS & NUTRITIONS has been approved and activated. You can now use your QR check-in at the front desk.',
      'payment',
      '/dashboard/membership'
    );

    this.addAuditLog(null, 'admin', 'MEMBERSHIP_ACTIVATED', 'memberships', membershipId, {
      memberId,
      initialAmountPaid
    });

    console.log(`[Guru Fitness DB] Member ${memberId} successfully approved and activated.`);
    return { success: true };
  }

  async suspendMember(memberId: string, reason?: string): Promise<DatabaseOperationResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'suspended', updated_at: new Date().toISOString() })
          .eq('id', memberId);

        if (error) {
          const errMsg = `Supabase [public.profiles] Error: ${error.message} (Code: ${error.code})`;
          console.error('[Guru Fitness DB] suspendMember failed:', errMsg);
          return {
            success: false,
            error: errMsg,
            table: 'profiles',
            code: error.code
          };
        }
      } catch (err: any) {
        return { success: false, error: err.message || String(err), table: 'profiles' };
      }
    }

    const profiles = this.getProfiles().map(p => p.id === memberId ? { ...p, status: 'suspended' as const, updated_at: new Date().toISOString() } : p);
    this.setStorage('profiles', profiles);

    const memberships = this.getMemberships().map(m => m.member_id === memberId ? { ...m, status: 'suspended' as const } : m);
    this.setStorage('memberships', memberships);

    this.addNotification(memberId, 'Membership Suspended', `Your account has been temporarily suspended. Please contact gym administration: 9828482505. ${reason ? 'Reason: ' + reason : ''}`, 'system');
    this.addAuditLog(null, 'admin', 'MEMBER_SUSPENDED', 'profiles', memberId, { reason });
    return { success: true };
  }

  async reactivateMember(memberId: string): Promise<DatabaseOperationResult> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', memberId);

        if (error) {
          const errMsg = `Supabase [public.profiles] Error: ${error.message} (Code: ${error.code})`;
          console.error('[Guru Fitness DB] reactivateMember failed:', errMsg);
          return {
            success: false,
            error: errMsg,
            table: 'profiles',
            code: error.code
          };
        }
      } catch (err: any) {
        return { success: false, error: err.message || String(err), table: 'profiles' };
      }
    }

    const profiles = this.getProfiles().map(p => p.id === memberId ? { ...p, status: 'active' as const, updated_at: new Date().toISOString() } : p);
    this.setStorage('profiles', profiles);
    return { success: true };
  }

  renewMembership(memberId: string, planId: string, agreedPrice: number, discountType: 'none' | 'group_15' | 'custom', discountAmount: number, notes?: string): Membership {
    const plan = this.getPlans().find(p => p.id === planId)!;
    const finalAmount = Math.max(0, agreedPrice - discountAmount);
    
    const currentActive = this.getMemberActiveMembership(memberId);
    let startDate = new Date();
    if (currentActive && currentActive.status === 'active' && new Date(currentActive.expiry_date) > new Date()) {
      startDate = new Date(currentActive.expiry_date);
      startDate.setDate(startDate.getDate() + 1);
    }
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + plan.duration_months);

    const membership: Membership = {
      id: 'm-' + Date.now(),
      membership_code: `GFN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      member_id: memberId,
      plan_id: plan.id,
      agreed_price: agreedPrice,
      discount_type: discountType,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      start_date: startDate.toISOString().split('T')[0],
      expiry_date: expiryDate.toISOString().split('T')[0],
      status: 'active',
      notes: notes || 'Membership renewal processed.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const memberships = this.getMemberships();
    memberships.unshift(membership);
    this.setStorage('memberships', memberships);

    this.updateProfile(memberId, { status: 'active' });

    if (isSupabaseConfigured && supabase) {
      supabase.from('memberships').insert(membership);
    }

    this.addNotification(
      memberId,
      'Membership Renewed',
      `Your membership has been renewed for ${plan.name} through ${membership.expiry_date}.`,
      'payment'
    );

    this.addAuditLog(null, 'admin', 'MEMBERSHIP_RENEWED', 'memberships', membership.id, {
      memberId,
      plan: plan.name,
      finalAmount
    });

    return membership;
  }

  // Payments
  getPayments(): Payment[] {
    return this.getStorage<Payment[]>('payments', []);
  }

  async createMemberMembershipAsync(data: {
    memberId: string;
    planId: string;
    agreedPrice: number;
    discountType?: 'none' | 'group_15' | 'custom';
    discountAmount?: number;
    finalAmount: number;
    startDate?: string;
    expiryDate?: string;
    notes?: string;
  }): Promise<{ success: boolean; membership?: Membership; error?: string }> {
    let dbPlanId = data.planId;
    let durationMonths = 1;

    // Check if data.planId is already a valid UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.planId);

    if (isSupabaseConfigured && supabase) {
      try {
        if (isUUID) {
          const { data: pRow } = await supabase
            .from('membership_plans')
            .select('id, duration_months, base_price, name')
            .eq('id', data.planId)
            .maybeSingle();

          if (pRow) {
            dbPlanId = pRow.id;
            durationMonths = pRow.duration_months || 1;
          }
        } else {
          // Resolve legacy slug to real active plan in public.membership_plans
          const legacyMap: Record<string, { category: string; duration_months: number }> = {
            'plan-str-1': { category: 'strength', duration_months: 1 },
            'plan-str-3': { category: 'strength', duration_months: 3 },
            'plan-str-6': { category: 'strength', duration_months: 6 },
            'plan-str-12': { category: 'strength', duration_months: 12 },
            'plan-car-1': { category: 'cardio_fatloss_yoga', duration_months: 1 },
            'plan-car-3': { category: 'cardio_fatloss_yoga', duration_months: 3 },
            'plan-car-6': { category: 'cardio_fatloss_yoga', duration_months: 6 },
            'plan-car-12': { category: 'cardio_fatloss_yoga', duration_months: 12 },
            'plan-pt-1': { category: 'personal_training', duration_months: 1 },
            'plan-pt-3': { category: 'personal_training', duration_months: 3 },
            'plan-pt-6': { category: 'personal_training', duration_months: 6 },
            'plan-pt-12': { category: 'personal_training', duration_months: 12 },
          };

          const target = legacyMap[data.planId];
          let query = supabase.from('membership_plans').select('id, duration_months, base_price, name').eq('is_active', true);
          if (target) {
            query = query.eq('category', target.category).eq('duration_months', target.duration_months);
          }

          const { data: matchedPlans } = await query.limit(1);
          if (matchedPlans && matchedPlans.length > 0) {
            dbPlanId = matchedPlans[0].id;
            durationMonths = matchedPlans[0].duration_months || 1;
            console.log(`[Guru Fitness DB] Resolved legacy plan ID "${data.planId}" to Supabase UUID "${dbPlanId}" (${matchedPlans[0].name})`);
          } else {
            const { data: anyPlan } = await supabase.from('membership_plans').select('id, duration_months').eq('is_active', true).limit(1);
            if (anyPlan && anyPlan.length > 0) {
              dbPlanId = anyPlan[0].id;
              durationMonths = anyPlan[0].duration_months || 1;
            }
          }
        }
      } catch (err) {
        console.warn('[Guru Fitness DB] Error resolving plan in Supabase:', err);
      }
    }

    const startDate = data.startDate || new Date().toISOString().split('T')[0];
    
    let expiryDate = data.expiryDate;
    if (!expiryDate) {
      const exp = new Date(startDate);
      exp.setMonth(exp.getMonth() + durationMonths);
      expiryDate = exp.toISOString().split('T')[0];
    }

    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'm-' + Date.now();
    const membership: Membership = {
      id: uuid,
      membership_code: `GFN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      member_id: data.memberId,
      plan_id: dbPlanId,
      agreed_price: data.agreedPrice,
      discount_type: data.discountType || 'none',
      discount_amount: data.discountAmount || 0,
      final_amount: data.finalAmount,
      start_date: startDate,
      expiry_date: expiryDate,
      status: 'pending_activation',
      notes: data.notes || 'Created via admin dossier assignment.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = uuid.startsWith('m-') ? { ...membership, id: undefined } : membership;
        const { data: inserted, error } = await supabase
          .from('memberships')
          .insert(dbPayload)
          .select('*')
          .single();

        if (error) {
          const msg = `Supabase [public.memberships] Insert Error: ${error.message} (Code: ${error.code})`;
          console.error('[Guru Fitness DB]', msg);
          return { success: false, error: msg };
        }

        if (inserted) {
          membership.id = inserted.id;
          membership.membership_code = inserted.membership_code;
        }
      } catch (err: any) {
        return { success: false, error: `Failed to insert membership in database: ${err.message || String(err)}` };
      }
    }

    this.saveMembership(membership);
    const plans = this.getPlans();
    const plan = plans.find(p => p.id === dbPlanId) || plans.find(p => p.id === data.planId);
    return { success: true, membership: { ...membership, plan } };
  }

  getMemberPayments(memberId: string): Payment[] {
    return this.getPayments().filter(p => p.member_id === memberId);
  }

  recordPayment(data: {
    memberId: string;
    membershipId: string;
    amount: number;
    method: 'cash' | 'upi' | 'bank_transfer' | 'online';
    reference?: string;
    notes?: string;
  }, skipRemoteSync = false): Payment {
    const payments = this.getPayments();

    // Idempotency check: prevent duplicate payments during retries
    if (data.reference && data.reference !== 'PAID-ON-ACTIVATION') {
      const existing = payments.find(p => 
        p.membership_id === data.membershipId && 
        p.transaction_reference === data.reference &&
        p.amount === data.amount
      );
      if (existing) {
        console.log(`[Guru Fitness DB] Idempotent payment detected for reference ${data.reference}. Returning existing payment.`);
        return existing;
      }
    }

    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'pay-' + Date.now();
    const payment: Payment = {
      id: uuid,
      payment_number: `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      member_id: data.memberId,
      membership_id: data.membershipId,
      amount: data.amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: data.method,
      transaction_reference: data.reference || null,
      notes: data.notes || null,
      recorded_by: null,
      created_at: new Date().toISOString()
    };

    payments.unshift(payment);
    this.setStorage('payments', payments);

    if (!skipRemoteSync && isSupabaseConfigured && supabase) {
      const dbPayment = uuid.startsWith('pay-') ? { ...payment, id: undefined } : payment;
      supabase.from('payments').insert(dbPayment).then(({ error }: { error: any }) => {
        if (error) {
          console.warn('[Guru Fitness DB] Background payment insertion failed:', error.message);
        }
      }).catch((err: any) => {
        console.warn('[Guru Fitness DB] Background payment insertion error:', err);
      });
    }

    this.addNotification(
      data.memberId,
      'Payment Received',
      `Payment of ₹${data.amount.toLocaleString('en-IN')} via ${data.method.toUpperCase()} confirmed. Receipt: ${payment.payment_number}.`,
      'payment',
      '/dashboard/payments'
    );

    this.addAuditLog(null, 'admin', 'PAYMENT_RECORDED', 'payments', payment.id, {
      memberId: data.memberId,
      amount: data.amount,
      method: data.method
    });

    return payment;
  }

  // Attendance
  getAttendance(): Attendance[] {
    return this.getStorage<Attendance[]>('attendance', []);
  }

  getMemberAttendance(memberId: string): Attendance[] {
    return this.getAttendance().filter(a => a.member_id === memberId);
  }

  getTodayAttendance(): Attendance[] {
    const today = new Date().toISOString().split('T')[0];
    return this.getAttendance().filter(a => a.attendance_date === today);
  }

  recordAttendance(data: {
    memberId: string;
    checkInMethod: 'qr_code' | 'admin_manual' | 'kiosk';
    status?: 'present' | 'absent' | 'excused';
    notes?: string;
    date?: string;
  }): { success: boolean; message: string; record?: Attendance } {
    const dateStr = data.date || new Date().toISOString().split('T')[0];
    const all = this.getAttendance();

    const existing = all.find(a => a.member_id === data.memberId && a.attendance_date === dateStr);
    if (existing) {
      return {
        success: false,
        message: `Attendance has already been recorded for ${dateStr} at ${new Date(existing.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      };
    }

    const profile = this.getProfile(data.memberId);
    if (!profile) {
      return { success: false, message: 'Member record not found.' };
    }

    if (profile.status !== 'active') {
      return { success: false, message: `Member account is currently ${profile.status.replace('_', ' ').toUpperCase()}. Access requires verified active status.` };
    }

    const record: Attendance = {
      id: 'att-' + Date.now(),
      member_id: data.memberId,
      attendance_date: dateStr,
      check_in_time: new Date().toISOString(),
      check_out_time: null,
      check_in_method: data.checkInMethod,
      status: data.status || 'present',
      notes: data.notes || (data.checkInMethod === 'qr_code' ? 'Verified Dynamic QR Check-In' : 'Front desk manual entry'),
      verified_by: null,
      created_at: new Date().toISOString()
    };

    all.unshift(record);
    this.setStorage('attendance', all);

    if (isSupabaseConfigured && supabase) {
      supabase.from('attendance').insert(record);
    }

    return {
      success: true,
      message: `Check-in recorded for ${profile.full_name} (${data.checkInMethod === 'qr_code' ? 'QR Scan' : 'Front Desk'}).`,
      record
    };
  }

  // Dynamic QR
  generateDynamicQRToken(): { token: string; expiresAt: number; gymName: string } {
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000;
    const token = btoa(JSON.stringify({
      facility: 'GURU_FITNESS',
      timestamp: now,
      expiresAt,
      salt: 'gfn_sec_2026'
    }));
    return { token, expiresAt, gymName: 'GURU FITNESS & NUTRITIONS' };
  }

  validateDynamicQRToken(token: string): { valid: boolean; reason?: string } {
    try {
      const decoded = JSON.parse(atob(token));
      if (decoded.facility !== 'GURU_FITNESS') {
        return { valid: false, reason: 'Invalid signature: not a Guru Fitness terminal token.' };
      }
      if (Date.now() > decoded.expiresAt) {
        return { valid: false, reason: 'This QR code token has expired. Please refresh the terminal display.' };
      }
      return { valid: true };
    } catch {
      return { valid: false, reason: 'Malformed QR payload.' };
    }
  }

  // Notifications
  getNotifications(memberId: string): Notification[] {
    const all = this.getStorage<Notification[]>('notifications', []);
    return all.filter(n => n.member_id === memberId);
  }

  addNotification(memberId: string, title: string, message: string, type: 'info' | 'payment' | 'expiry' | 'attendance' | 'system', link?: string): Notification {
    const notif: Notification = {
      id: 'notif-' + Date.now(),
      member_id: memberId,
      title,
      message,
      type,
      is_read: false,
      link: link || null,
      created_at: new Date().toISOString()
    };
    const all = this.getStorage<Notification[]>('notifications', []);
    all.unshift(notif);
    this.setStorage('notifications', all);

    if (isSupabaseConfigured && supabase) {
      supabase.from('notifications').insert(notif);
    }
    return notif;
  }

  markNotificationAsRead(id: string): void {
    const all = this.getStorage<Notification[]>('notifications', []);
    const updated = all.map(n => n.id === id ? { ...n, is_read: true } : n);
    this.setStorage('notifications', updated);

    if (isSupabaseConfigured && supabase) {
      supabase.from('notifications').update({ is_read: true }).eq('id', id);
    }
  }

  // WhatsApp Reminder Logs
  getReminderLogs(): ReminderLog[] {
    return this.getStorage<ReminderLog[]>('reminders', []);
  }

  logReminder(data: {
    memberId: string;
    reminderType: 'three_days_before_expiry' | 'one_day_before_expiry' | 'on_expiry_day' | 'post_expiry' | 'fee_due' | 'general';
    targetPhone: string;
    messageContent: string;
    channel: 'manual_whatsapp' | 'whatsapp_api';
    status: 'sent' | 'pending' | 'failed' | 'delivered';
    errorMessage?: string;
  }): ReminderLog {
    const log: ReminderLog = {
      id: 'rem-' + Date.now(),
      member_id: data.memberId,
      reminder_type: data.reminderType,
      target_phone: data.targetPhone,
      message_content: data.messageContent,
      delivery_channel: data.channel,
      delivery_status: data.status,
      external_message_id: data.channel === 'whatsapp_api' ? `WAMID.${Date.now()}` : null,
      error_message: data.errorMessage || null,
      sent_by: null,
      created_at: new Date().toISOString()
    };
    const all = this.getReminderLogs();
    all.unshift(log);
    this.setStorage('reminders', all);

    if (isSupabaseConfigured && supabase) {
      supabase.from('reminder_logs').insert(log);
    }
    return log;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.getStorage<AuditLog[]>('audit_logs', []);
  }

  addAuditLog(actorId: string | null, actorEmail: string, action: string, entityType: string, entityId: string, details?: any): void {
    const log: AuditLog = {
      id: 'audit-' + Date.now(),
      actor_id: actorId,
      actor_email: actorEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || null,
      created_at: new Date().toISOString()
    };
    const logs = this.getAuditLogs();
    logs.unshift(log);
    this.setStorage('audit_logs', logs.slice(0, 200));

    if (isSupabaseConfigured && supabase) {
      supabase.from('audit_logs').insert(log);
    }
  }

  // Member Summary
  getMemberSummary(memberId: string): MemberSummary | null {
    const profile = this.getProfile(memberId);
    if (!profile) return null;

    const role = this.getUserRole(memberId);
    const plans = this.getPlans();
    const memberships = this.getMemberships().filter(m => m.member_id === memberId);
    const payments = this.getMemberPayments(memberId);
    const attendance = this.getMemberAttendance(memberId);

    const activeM = memberships.find(m => m.status === 'active') || memberships.find(m => m.status === 'pending_activation') || memberships[0] || null;
    const activeWithPlan = activeM ? {
      ...activeM,
      plan: plans.find(p => p.id === activeM.plan_id)
    } : null;

    const totalAgreed = memberships.reduce((sum, m) => sum + (m.final_amount || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const outstandingBalance = Math.max(0, totalAgreed - totalPaid);

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const currentMonthRecords = attendance.filter(a => {
      const d = new Date(a.attendance_date);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    });

    const daysAttendedThisMonth = currentMonthRecords.filter(a => a.status === 'present').length;
    let openDaysElapsed = 0;
    for (let day = 1; day <= now.getDate(); day++) {
      const checkDay = new Date(curYear, curMonth, day);
      if (checkDay.getDay() !== 0) {
        openDaysElapsed++;
      }
    }
    const attendanceRate = openDaysElapsed > 0 ? Math.min(100, Math.round((daysAttendedThisMonth / openDaysElapsed) * 100)) : 0;

    return {
      profile,
      role,
      activeMembership: activeWithPlan,
      memberships,
      payments,
      totalAgreed,
      totalPaid,
      outstandingBalance,
      attendanceRecords: attendance,
      attendanceRate,
      daysAttendedThisMonth
    };
  }

  // Admin Dashboard Statistics (From genuine stored records)
  getAdminStats() {
    const profiles = this.getProfiles().filter(p => this.getUserRole(p.id) !== 'admin');
    const memberships = this.getMemberships();
    const payments = this.getPayments();
    const attendance = this.getAttendance();
    const today = new Date().toISOString().split('T')[0];

    const totalRegistered = profiles.length;
    const activeMembers = profiles.filter(p => p.status === 'active').length;
    const pendingActivations = profiles.filter(p => p.status === 'pending_activation').length;
    const suspendedMembers = profiles.filter(p => p.status === 'suspended').length;
    const expiredMemberships = memberships.filter(m => m.status === 'expired').length;

    const totalAgreedAll = memberships.reduce((sum, m) => sum + (m.final_amount || 0), 0);
    const totalCollectedAll = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOutstandingDues = Math.max(0, totalAgreedAll - totalCollectedAll);

    const now = new Date();
    const curMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyCollections = payments
      .filter(p => p.payment_date.startsWith(curMonthPrefix))
      .reduce((sum, p) => sum + p.amount, 0);

    const todayAttendance = attendance.filter(a => a.attendance_date === today);
    const todayCheckInsCount = todayAttendance.filter(a => a.status === 'present').length;

    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    const upcomingExpirations = memberships.filter(m => {
      if (m.status !== 'active') return false;
      const exp = new Date(m.expiry_date);
      return exp >= now && exp <= next7Days;
    });

    return {
      totalRegistered,
      activeMembers,
      pendingActivations,
      suspendedMembers,
      expiredMemberships,
      totalCollectedAll,
      monthlyCollections,
      totalOutstandingDues,
      todayCheckInsCount,
      upcomingExpirationsCount: upcomingExpirations.length,
      upcomingExpirations
    };
  }
}

export const gymDB = new GymDatabaseService();
