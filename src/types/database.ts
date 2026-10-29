export type RoleType = 'admin' | 'member';

export type UserStatus = 'pending_activation' | 'active' | 'inactive' | 'suspended';

export type MembershipCategory = 'strength' | 'cardio_fatloss_yoga' | 'personal_training';

export type DurationType = 'monthly' | 'quarterly' | 'half_yearly' | 'yearly';

export type MembershipStatus = 'pending_activation' | 'active' | 'expired' | 'suspended' | 'cancelled';

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'online';

export type AttendanceMethod = 'qr_code' | 'admin_manual' | 'kiosk';

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export type NotificationType = 'info' | 'payment' | 'expiry' | 'attendance' | 'system';

export type ReminderType = 
  | 'three_days_before_expiry' 
  | 'one_day_before_expiry' 
  | 'on_expiry_day' 
  | 'post_expiry' 
  | 'fee_due' 
  | 'general';

export type DeliveryChannel = 'manual_whatsapp' | 'whatsapp_api';

export type DeliveryStatus = 'sent' | 'pending' | 'failed' | 'delivered';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  address?: string | null;
  profile_image?: string | null;
  emergency_contact?: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: RoleType;
  created_at: string;
}

export interface MembershipPlan {
  id: string;
  category: MembershipCategory;
  name: string;
  duration_type: DurationType;
  duration_months: number;
  base_price: number;
  description: string;
  is_active: boolean;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  membership_code: string;
  member_id: string;
  plan_id: string;
  agreed_price: number;
  discount_type: 'none' | 'group_15' | 'custom';
  discount_amount: number;
  final_amount: number;
  start_date: string;
  expiry_date: string;
  status: MembershipStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Optional joined plan
  plan?: MembershipPlan;
}

export interface Payment {
  id: string;
  payment_number: string;
  member_id: string;
  membership_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_reference?: string | null;
  notes?: string | null;
  recorded_by?: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  attendance_date: string; // YYYY-MM-DD
  check_in_time: string; // ISO
  check_out_time?: string | null;
  check_in_method: AttendanceMethod;
  status: AttendanceStatus;
  notes?: string | null;
  verified_by?: string | null;
  created_at: string;
  // Optional joined profile
  member?: Profile;
}

export interface Notification {
  id: string;
  member_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export interface ReminderLog {
  id: string;
  member_id: string;
  reminder_type: ReminderType;
  target_phone: string;
  message_content: string;
  delivery_channel: DeliveryChannel;
  delivery_status: DeliveryStatus;
  external_message_id?: string | null;
  error_message?: string | null;
  sent_by?: string | null;
  created_at: string;
  member?: Profile;
}

export interface GymSettings {
  id: number;
  gym_name: string;
  tagline: string;
  brand_promise: string;
  phone_primary: string;
  phone_secondary: string;
  instagram_handle: string;
  address: string;
  google_maps_url: string;
  opening_hours_weekdays: string;
  opening_hours_sunday: string;
  effective_date_notice: string;
  attendance_cutoff_time: string;
  group_discount_percent: number;
  group_discount_min_people: number;
  whatsapp_api_configured: boolean;
  whatsapp_phone_number_id?: string | null;
  whatsapp_business_account_id?: string | null;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, any> | null;
  created_at: string;
}

export interface RegistrationRequest {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone: string;
  plan_id?: string | null;
  is_group_discount: boolean;
  group_member_count: number;
  agreed_price: number;
  final_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'contacted';
  notes?: string | null;
  processed_by?: string | null;
  processed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberSummary {
  profile: Profile;
  role: RoleType;
  activeMembership?: Membership & { plan?: MembershipPlan } | null;
  memberships: Membership[];
  payments: Payment[];
  totalAgreed: number;
  totalPaid: number;
  outstandingBalance: number;
  attendanceRecords: Attendance[];
  attendanceRate: number; // percentage this month
  daysAttendedThisMonth: number;
}
