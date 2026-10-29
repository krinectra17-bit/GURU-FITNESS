import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gymDB } from '../lib/database';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  ShieldAlert, 
  ArrowRight, 
  AlertCircle, 
  AlertTriangle,
  Check, 
  Users,
  Dumbbell,
  Lock
} from 'lucide-react';
import { DurationType, MembershipCategory } from '../types/database';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register, configError } = useAuth();

  const plans = gymDB.getPlans();
  const settings = gymDB.getSettings();

  // URL query params pre-fill
  const preselectedPlanId = searchParams.get('plan') || 'plan-str-1';
  const preselectedGroup = searchParams.get('group') === 'true';
  const preselectedGroupSize = Number(searchParams.get('groupSize')) || 3;

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(preselectedPlanId);
  const [isGroupDiscount, setIsGroupDiscount] = useState(preselectedGroup);
  const [groupSize, setGroupSize] = useState(preselectedGroupSize);
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  // Selected plan calculation
  const currentPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const basePrice = currentPlan.base_price;
  const isGroupEligible = isGroupDiscount && groupSize >= 3;
  const discountAmount = isGroupEligible ? Math.round(basePrice * 0.15) : 0;
  const finalPrice = basePrice - discountAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError('You must accept the gym terms and activation conditions to register.');
      return;
    }

    if (!phone || phone.length < 10) {
      setError('Please provide a valid 10-digit mobile number for WhatsApp updates.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Please choose a secure account password with at least 6 characters.');
      return;
    }

    if (isGroupDiscount && groupSize < 3) {
      setError('The 15% group discount policy requires a minimum of 3 joining members.');
      return;
    }

    setIsSubmitting(true);

    const result = await register({
      fullName,
      email,
      phone,
      dateOfBirth: dateOfBirth || undefined,
      gender,
      address: address || undefined,
      emergencyContact: emergencyContact || undefined,
      planId: currentPlan.id,
      isGroupDiscount: isGroupEligible,
      groupMemberCount: groupSize,
      password: password
    });

    setIsSubmitting(false);

    if (result.success) {
      if (result.needsEmailConfirmation) {
        setEmailConfirmationRequired(true);
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  if (emailConfirmationRequired) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-20 px-4">
        <div className="bg-gym-card border border-emerald-500/50 rounded-xl p-8 max-w-lg w-full text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-950/70 border border-emerald-500/60 flex items-center justify-center mx-auto text-emerald-400">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-tight">
            Registration Received
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-gray-300 leading-relaxed text-left bg-gym-surface p-4 rounded-lg border border-gym-border">
            <p>
              Your account has been created for <strong className="text-white">{email}</strong> with status <strong className="text-amber-400">PENDING ACTIVATION</strong>.
            </p>
            <p>
              📧 <strong>Email Verification:</strong> If email verification is enabled on the gym project, a confirmation link has been dispatched to your inbox. Please open it to verify your email.
            </p>
            <p>
              Once verified, you can sign in to your dashboard to view your assigned membership program and payment details.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-gym-red hover:bg-gym-red-hover text-white px-6 py-3 rounded font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-gym-red/25 transition"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            <span className="w-6 h-[2px] bg-gym-red"></span>
            <span>New Member Portal</span>
            <span className="w-6 h-[2px] bg-gym-red"></span>
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white uppercase tracking-tight">
            Register As A Gym Member
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
            Create your member account to access the workout portal, track fees, view attendance records, and utilize QR check-in.
          </p>
        </div>

        {/* Clear Activation Notice (As requested in prompt) */}
        <div className="bg-gym-surface border border-gym-border rounded-xl p-5 flex items-start space-x-4 shadow-lg">
          <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-gray-300 leading-relaxed">
            <span className="font-bold text-white uppercase tracking-wider text-sm block">
              Important: Registration &amp; Membership Activation Notice
            </span>
            <p>
              Submitting this registration form creates your authenticated account and sets your status to <strong>PENDING ACTIVATION</strong>. You can immediately log into your member dashboard to review your assigned plan and details. However, gym floor access and active status are confirmed by the gym owner only after payment verification at the front desk or via authorized UPI transfer.
            </p>
          </div>
        </div>

        {/* Backend Configuration Notice */}
        {configError && (
          <div className="bg-amber-950/60 border border-amber-500/50 rounded-lg p-4 text-xs text-amber-200 space-y-1">
            <div className="flex items-center space-x-2 font-bold text-amber-300 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Production Setup Notice</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              Live registration requires Supabase configuration. To connect a live database, set{' '}
              <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> and{' '}
              <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code>{' '}
              in your environment or <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">.env</code> file.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-950/60 border border-red-500/60 p-4 rounded-lg text-xs text-red-200 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-gym-card border border-gym-border rounded-xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Step 1: Personal Details */}
          <div className="space-y-4">
            <div className="border-b border-gym-border/70 pb-3 flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide flex items-center space-x-2">
                <span className="text-gym-red">01.</span>
                <span>Personal Information</span>
              </h3>
              <span className="text-[11px] text-gym-muted">* Required fields</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gym-muted absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-gym-surface border border-gym-border rounded pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gym-red transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gym-muted absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@example.com"
                    className="w-full bg-gym-surface border border-gym-border rounded pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gym-red transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Mobile Number (WhatsApp) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gym-muted absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full bg-gym-surface border border-gym-border rounded pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gym-red transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Account Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gym-muted absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create password (min 6 chars)"
                    autoComplete="new-password"
                    className="w-full bg-gym-surface border border-gym-border rounded pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gym-red transition"
                  />
                </div>
                <span className="text-[10px] text-gym-muted mt-1 block">Used to sign in to your dashboard</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Gender (Optional)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-gym-surface border border-gym-border rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gym-red transition"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Date of Birth (Optional)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gym-muted absolute left-3.5 top-3" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-gym-surface border border-gym-border rounded pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gym-red transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Emergency Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Parent / Guardian / Spouse Phone"
                  className="w-full bg-gym-surface border border-gym-border rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gym-red transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                  Residential Address (Optional)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Area / Locality in Jaipur"
                  className="w-full bg-gym-surface border border-gym-border rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gym-red transition"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Membership Plan Selection */}
          <div className="space-y-4">
            <div className="border-b border-gym-border/70 pb-3">
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide flex items-center space-x-2">
                <span className="text-gym-red">02.</span>
                <span>Select Membership Program</span>
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                Select Your Plan &amp; Duration
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-3.5 rounded-lg cursor-pointer border transition-all ${
                      selectedPlanId === p.id
                        ? 'bg-gym-surface border-gym-red shadow-lg ring-1 ring-gym-red'
                        : 'bg-gym-dark/70 border-gym-border hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gym-muted">
                        {p.category === 'strength' ? 'Strength' : p.category === 'personal_training' ? 'Personal Tr.' : 'Cardio / Yoga'}
                      </span>
                      <span className="text-xs font-bold font-display text-gym-red">
                        ₹{p.base_price.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-white mt-1">
                      {p.name.split('-')[1]?.trim() || p.name}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                      {p.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Group Discount Toggle */}
            <div className="bg-gym-surface/80 border border-gym-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="groupToggle"
                    checked={isGroupDiscount}
                    onChange={(e) => setIsGroupDiscount(e.target.checked)}
                    className="w-4 h-4 rounded text-gym-red accent-gym-red cursor-pointer"
                  />
                  <label htmlFor="groupToggle" className="text-xs font-bold text-white uppercase cursor-pointer flex items-center">
                    <Users className="w-4 h-4 text-gym-red mr-1.5" />
                    Apply 15% Group Discount (Min 3 Members)
                  </label>
                </div>
                <span className="text-[10px] bg-gym-red/20 text-gym-red font-bold px-2 py-0.5 rounded border border-gym-red/30">
                  15% OFF
                </span>
              </div>

              {isGroupDiscount && (
                <div className="pl-6 pt-1 flex items-center space-x-3 text-xs text-gray-300">
                  <span>Number of people in group:</span>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value))}
                    className="bg-gym-dark border border-gym-border rounded px-2.5 py-1 text-white font-semibold"
                  >
                    <option value={3}>3 People (15% applied)</option>
                    <option value={4}>4 People (15% applied)</option>
                    <option value={5}>5 People (15% applied)</option>
                    <option value={6}>6+ People (15% applied)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Price Summary Calculation Card */}
            <div className="bg-gym-dark border border-gym-border rounded-lg p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-gym-muted">
                <span>Selected Plan:</span>
                <span className="text-white font-medium">{currentPlan.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gym-muted">
                <span>Standard Base Price:</span>
                <span className="text-white font-medium">₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              {isGroupEligible && (
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span>Group Discount (15% for {groupSize} people):</span>
                  <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gym-border flex items-center justify-between">
                <span className="font-display font-bold text-sm text-white uppercase">
                  Agreed Fee Payable On Activation:
                </span>
                <span className="font-display font-extrabold text-2xl text-gym-red">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Submit */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-gym-red accent-gym-red cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-gray-300 leading-relaxed cursor-pointer">
                I understand that this registration creates my account with status <strong>Pending Activation</strong>, and that gym access is authorized once the fee is confirmed by the front desk. I agree to abide by the gym rules and attendance policies.
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-base uppercase tracking-wider shadow-xl shadow-gym-red/25 transition-all hover:scale-[1.01] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Dumbbell className="w-5 h-5" />
              <span>{isSubmitting ? 'Registering Account...' : 'Complete Registration & Open Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs text-gym-muted pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-white hover:text-gym-red font-semibold transition">
                Sign In Instead
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
