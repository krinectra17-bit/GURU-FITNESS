import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Check, 
  MoreVertical, 
  CreditCard, 
  Calendar, 
  Eye, 
  Phone, 
  Mail, 
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { gymDB } from '../../lib/database';
import { Profile, Membership, Payment, UserStatus, MembershipPlan } from '../../types/database';

interface MemberManagementProps {
  onUpdate: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({ onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);

  // Directory and plans state synced from Supabase
  const [plans, setPlans] = useState<MembershipPlan[]>(() => gymDB.getPlans());
  const [profilesList, setProfilesList] = useState<Profile[]>(() => {
    return gymDB.getProfiles().filter(p => gymDB.getUserRole(p.id) !== 'admin');
  });

  // Action status state
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Activation modal state
  const [activationMember, setActivationMember] = useState<{ profile: Profile; membership: Membership | null } | null>(null);
  const [hasExistingMembership, setHasExistingMembership] = useState<boolean>(true);
  const [assignPlanId, setAssignPlanId] = useState<string>('');
  const [agreedPrice, setAgreedPrice] = useState<number>(800);
  const [discountType, setDiscountType] = useState<'none' | 'group_15' | 'custom'>('none');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(800);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number>(800);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'online'>('upi');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Edit details modal state
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editEmergency, setEditEmergency] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const computeExpiryDate = (start: string, durationMonths: number) => {
    try {
      const parts = start.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        d.setMonth(d.getMonth() + durationMonths);
        return d.toISOString().split('T')[0];
      }
    } catch {
      // fallback
    }
    const d = new Date(start);
    d.setMonth(d.getMonth() + durationMonths);
    return d.toISOString().split('T')[0];
  };

  const loadDirectoryData = async () => {
    try {
      const [directory, activePlans] = await Promise.all([
        gymDB.syncMembersDirectoryAsync(),
        gymDB.getActivePlansAsync()
      ]);
      if (activePlans && activePlans.length > 0) {
        setPlans(activePlans);
      }
      if (directory && directory.profiles) {
        const filtered = directory.profiles.filter(p => gymDB.getUserRole(p.id) !== 'admin');
        setProfilesList(filtered);
      }
    } catch (err) {
      console.warn('[Guru Fitness Admin] Error loading directory data from Supabase:', err);
    }
  };

  useEffect(() => {
    loadDirectoryData();
  }, []);

  // Filter profiles
  const filteredProfiles = profilesList.filter((p) => {
    const matchesSearch = 
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  const handleOpenActivation = (prof: Profile) => {
    setActionError(null);
    setActionSuccess(null);

    const mem = gymDB.getMemberActiveMembership(prof.id);
    const availablePlans = plans.length > 0 ? plans : gymDB.getPlans();
    const today = new Date().toISOString().split('T')[0];

    if (mem) {
      setHasExistingMembership(true);
      setActivationMember({ profile: prof, membership: mem });
      setAgreedPrice(mem.agreed_price);
      setDiscountType(mem.discount_type || 'none');
      setDiscountAmount(mem.discount_amount || 0);
      setFinalAmount(mem.final_amount);
      setStartDate(mem.start_date || today);
      setExpiryDate(mem.expiry_date);
      setInitialPaymentAmount(mem.final_amount);
      setPaymentRef('UPI/' + Date.now().toString().slice(-6));
      setNotes(mem.notes || '');
    } else {
      setHasExistingMembership(false);
      const defaultPlan = availablePlans[0];
      const planId = defaultPlan ? defaultPlan.id : '';
      const baseFee = defaultPlan ? defaultPlan.base_price : 800;
      const duration = defaultPlan ? defaultPlan.duration_months : 1;
      const exp = computeExpiryDate(today, duration);

      setAssignPlanId(planId);
      setAgreedPrice(baseFee);
      setDiscountType('none');
      setDiscountAmount(0);
      setFinalAmount(baseFee);
      setStartDate(today);
      setExpiryDate(exp);
      setInitialPaymentAmount(baseFee);
      setPaymentRef('UPI/' + Date.now().toString().slice(-6));
      setNotes('Assigned and activated via admin management.');
      setActivationMember({ profile: prof, membership: null });
    }
  };

  const handlePlanChange = (newPlanId: string) => {
    setAssignPlanId(newPlanId);
    const availablePlans = plans.length > 0 ? plans : gymDB.getPlans();
    const sel = availablePlans.find(p => p.id === newPlanId);
    if (!sel) return;

    const base = sel.base_price;
    setAgreedPrice(base);

    let disc = 0;
    if (discountType === 'group_15') {
      disc = Math.round(base * 0.15);
    } else if (discountType === 'custom') {
      disc = discountAmount;
    }
    setDiscountAmount(disc);
    const fin = Math.max(0, base - disc);
    setFinalAmount(fin);
    setInitialPaymentAmount(fin);
    setExpiryDate(computeExpiryDate(startDate, sel.duration_months || 1));
  };

  const handleAgreedPriceChange = (val: number) => {
    const price = Math.max(0, val);
    setAgreedPrice(price);

    let disc = 0;
    if (discountType === 'group_15') {
      disc = Math.round(price * 0.15);
    } else if (discountType === 'custom') {
      disc = discountAmount;
    }
    setDiscountAmount(disc);
    const fin = Math.max(0, price - disc);
    setFinalAmount(fin);
    setInitialPaymentAmount(fin);
  };

  const handleDiscountTypeChange = (type: 'none' | 'group_15' | 'custom') => {
    setDiscountType(type);
    let disc = 0;
    if (type === 'group_15') {
      disc = Math.round(agreedPrice * 0.15);
    } else if (type === 'custom') {
      disc = discountAmount;
    }
    setDiscountAmount(disc);
    const fin = Math.max(0, agreedPrice - disc);
    setFinalAmount(fin);
    setInitialPaymentAmount(fin);
  };

  const handleCustomDiscountChange = (val: number) => {
    const disc = Math.max(0, Math.min(val, agreedPrice));
    setDiscountAmount(disc);
    const fin = Math.max(0, agreedPrice - disc);
    setFinalAmount(fin);
    setInitialPaymentAmount(fin);
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    const availablePlans = plans.length > 0 ? plans : gymDB.getPlans();
    const sel = availablePlans.find(p => p.id === assignPlanId) || availablePlans[0];
    if (sel) {
      setExpiryDate(computeExpiryDate(val, sel.duration_months || 1));
    }
  };

  const handleConfirmActivation = async () => {
    if (!activationMember || isProcessing) return;
    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    let activeMembershipId = activationMember.membership?.id;

    // If member has no existing contract in database, administrator must first create it
    if (!hasExistingMembership || !activeMembershipId) {
      const availablePlans = plans.length > 0 ? plans : gymDB.getPlans();
      const selectedPlan = availablePlans.find(p => p.id === assignPlanId) || availablePlans[0];

      if (!selectedPlan) {
        setIsProcessing(false);
        setActionError('No valid training program selected.');
        return;
      }

      const createRes = await gymDB.createMemberMembershipAsync({
        memberId: activationMember.profile.id,
        planId: selectedPlan.id,
        agreedPrice: agreedPrice,
        discountType: discountType,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        startDate: startDate,
        expiryDate: expiryDate,
        notes: notes || 'Assigned and confirmed by administrator during front-desk approval.'
      });

      if (!createRes.success || !createRes.membership) {
        setIsProcessing(false);
        setActionError(createRes.error || 'Failed to create membership in database.');
        return;
      }

      activeMembershipId = createRes.membership.id;
    }

    const result = await gymDB.approveAndActivateMember(
      activationMember.profile.id,
      activeMembershipId,
      paymentMethod,
      initialPaymentAmount,
      paymentRef
    );

    setIsProcessing(false);

    if (!result.success) {
      // Display the actual Supabase error message to the admin
      setActionError(result.error || 'Database operation failed');
      // DO NOT close the modal and DO NOT update UI state on failure
      return;
    }

    // UI updates ONLY after database update succeeds
    const selectedPlanName = activationMember.membership?.plan?.name || (plans.find(p => p.id === assignPlanId)?.name) || 'Training Program';
    setActionSuccess(`Successfully approved and activated ${activationMember.profile.full_name} for ${selectedPlanName}!`);
    setActivationMember(null);
    await loadDirectoryData();
    onUpdate();
  };

  const handleDirectApprove = async (prof: Profile) => {
    if (isProcessing) return;
    setActionError(null);
    setActionSuccess(null);

    let mem = gymDB.getMemberActiveMembership(prof.id);
    if (!mem) {
      // Direct approval cannot proceed without a valid membership contract. Route to selection modal.
      handleOpenActivation(prof);
      return;
    }

    setIsProcessing(true);
    const result = await gymDB.approveAndActivateMember(
      prof.id,
      mem.id,
      'cash',
      0,
      'DIRECT-APPROVAL'
    );

    setIsProcessing(false);

    if (!result.success) {
      setActionError(result.error || 'Database operation failed');
      return;
    }

    setActionSuccess(`Successfully approved and activated ${prof.full_name}!`);
    await loadDirectoryData();
    onUpdate();
  };

  const handleSuspend = async (memberId: string) => {
    if (window.confirm('Are you sure you want to suspend this member account? They will not be able to check in until reactivated.')) {
      setIsProcessing(true);
      setActionError(null);
      setActionSuccess(null);
      const res = await gymDB.suspendMember(memberId, 'Suspended by admin');
      setIsProcessing(false);
      if (!res.success) {
        setActionError(res.error || 'Failed to suspend member');
        return;
      }
      onUpdate();
    }
  };

  const handleReactivate = async (memberId: string) => {
    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    const res = await gymDB.reactivateMember(memberId);
    setIsProcessing(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to reactivate member');
      return;
    }
    onUpdate();
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || isProcessing) return;
    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);

    const res = await gymDB.updateProfileAsync(editingMember.id, {
      phone: editPhone,
      emergency_contact: editEmergency,
      address: editAddress
    });
    setIsProcessing(false);
    if (!res.success) {
      setActionError(res.error || 'Failed to save member details');
      return;
    }

    setEditingMember(null);
    onUpdate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Real-time Database Error & Status Banners */}
      {actionError && (
        <div className="bg-red-950/90 border border-red-500/80 text-red-200 p-4 rounded-xl text-xs space-y-2 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="font-bold flex items-center space-x-2 text-red-400 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 text-gym-red shrink-0" />
              <span>Database Update Failed — UI Status Kept Unchanged</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-gray-400 hover:text-white text-xs p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-black/60 border border-red-500/40 p-3 rounded font-mono text-xs text-red-300 break-words leading-relaxed">
            {actionError}
          </div>
          <div className="text-[11px] text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 border-t border-red-500/20">
            <span>Attempted Table: <code className="text-white bg-black/40 px-1 py-0.5 rounded">public.profiles</code></span>
            <span>Target Columns: <code className="text-white bg-black/40 px-1 py-0.5 rounded">status = 'active', updated_at</code></span>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-500/80 text-emerald-200 p-4 rounded-xl text-xs flex items-center justify-between shadow-2xl animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-gray-400 hover:text-white text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Directory &amp; Access Controls
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            Member Management ({profilesList.length})
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'active', 'pending_activation', 'suspended'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === st
                  ? 'bg-gym-red text-white'
                  : 'bg-gym-card text-gym-muted hover:text-white border border-gym-border'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gym-muted absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search member by full name, mobile number, or email..."
          className="w-full bg-gym-card border border-gym-border rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gym-red transition"
        />
      </div>

      {/* Members Table */}
      <div className="bg-gym-card border border-gym-border rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gym-surface text-gym-muted uppercase font-semibold border-b border-gym-border">
              <tr>
                <th className="px-4 py-3.5">Member Name</th>
                <th className="px-4 py-3.5">Phone (WhatsApp)</th>
                <th className="px-4 py-3.5">Active Program</th>
                <th className="px-4 py-3.5">Fee Status</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border/60">
              {filteredProfiles.map((prof) => {
                const summary = gymDB.getMemberSummary(prof.id);
                const mem = summary?.activeMembership;

                return (
                  <tr key={prof.id} className="hover:bg-gym-surface/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-white text-sm">{prof.full_name}</div>
                      <div className="text-[11px] text-gym-muted">{prof.email}</div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-gray-300">
                      <a href={`tel:${prof.phone}`} className="hover:text-gym-red">
                        {prof.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-gray-200 font-medium">
                        {mem?.plan?.name || (prof.status === 'pending_activation' ? 'No Program Assigned' : 'Strength Training')}
                      </div>
                      <div className="text-[10px] text-gym-muted">
                        {mem?.expiry_date ? `Expires: ${mem.expiry_date}` : 'Awaiting plan assignment & activation'}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {summary && summary.outstandingBalance > 0 ? (
                        <span className="text-amber-400 font-semibold font-mono">
                          ₹{summary.outstandingBalance.toLocaleString('en-IN')} Due
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Cleared</span>
                      )}
                      <div className="text-[10px] text-gym-muted">
                        Paid: ₹{summary?.totalPaid.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        prof.status === 'active'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : prof.status === 'pending_activation'
                          ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                          : 'bg-rose-950 text-rose-300 border-rose-500/40'
                      }`}>
                        {prof.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      {prof.status === 'pending_activation' ? (
                        <div className="inline-flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenActivation(prof)}
                            disabled={isProcessing}
                            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-2.5 py-1 rounded text-xs font-bold uppercase transition"
                            title={mem ? "Open payment settlement & activation modal" : "Assign training program & activate"}
                          >
                            {mem ? 'Approve' : 'Assign Plan'}
                          </button>
                          {mem && (
                            <button
                              onClick={() => handleDirectApprove(prof)}
                              disabled={isProcessing}
                              className="bg-gym-surface hover:bg-gym-dark border border-blue-500/50 text-blue-300 hover:text-white px-2 py-1 rounded text-[11px] font-semibold transition"
                              title="Directly activate in database"
                            >
                              Quick
                            </button>
                          )}
                        </div>
                      ) : prof.status === 'suspended' ? (
                        <button
                          onClick={() => handleReactivate(prof.id)}
                          disabled={isProcessing}
                          className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-2.5 py-1 rounded text-xs font-bold uppercase transition"
                        >
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(prof.id)}
                          disabled={isProcessing}
                          className="text-gray-400 hover:text-rose-400 disabled:opacity-50 px-2 py-1 text-[11px] transition"
                        >
                          Suspend
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedMember(prof)}
                        className="bg-gym-surface hover:bg-gym-dark text-white border border-gym-border px-2.5 py-1 rounded text-xs transition"
                      >
                        Profile
                      </button>

                      <button
                        onClick={() => {
                          setEditingMember(prof);
                          setEditPhone(prof.phone);
                          setEditEmergency(prof.emergency_contact || '');
                          setEditAddress(prof.address || '');
                        }}
                        className="text-gym-muted hover:text-white px-1.5 py-1 text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Profile Details Drawer/Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gym-card border border-gym-border rounded-xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gym-border/70 pb-3">
              <div>
                <span className="text-[10px] font-bold text-gym-red uppercase tracking-widest">
                  Member Dossier
                </span>
                <h3 className="font-display font-extrabold text-2xl text-white uppercase">
                  {selectedMember.full_name}
                </h3>
              </div>
              <button onClick={() => setSelectedMember(null)} className="text-gym-muted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gym-dark p-4 rounded-lg border border-gym-border">
                <div>
                  <span className="text-gym-muted block uppercase text-[10px]">Mobile Number:</span>
                  <span className="text-white font-mono">{selectedMember.phone}</span>
                </div>
                <div>
                  <span className="text-gym-muted block uppercase text-[10px]">Email Address:</span>
                  <span className="text-white">{selectedMember.email}</span>
                </div>
                <div>
                  <span className="text-gym-muted block uppercase text-[10px]">Gender:</span>
                  <span className="text-white capitalize">{selectedMember.gender || 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-gym-muted block uppercase text-[10px]">Date of Birth:</span>
                  <span className="text-white">{selectedMember.date_of_birth || 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-gym-muted block uppercase text-[10px]">Emergency Phone:</span>
                  <span className="text-white">{selectedMember.emergency_contact || 'None Provided'}</span>
                </div>
                <div>
                  <span className="text-gym-muted block uppercase text-[10px]">Residential Address:</span>
                  <span className="text-white">{selectedMember.address || 'Jaipur'}</span>
                </div>
              </div>

              {/* Attendance and Payment Stats */}
              {(() => {
                const summary = gymDB.getMemberSummary(selectedMember.id);
                return (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gym-surface p-3 rounded border border-gym-border">
                      <div className="text-[10px] text-gym-muted uppercase">Attendance</div>
                      <div className="font-display font-bold text-lg text-white">
                        {summary?.daysAttendedThisMonth || 0} days
                      </div>
                    </div>
                    <div className="bg-gym-surface p-3 rounded border border-gym-border">
                      <div className="text-[10px] text-gym-muted uppercase">Total Paid</div>
                      <div className="font-display font-bold text-lg text-emerald-400">
                        ₹{summary?.totalPaid.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="bg-gym-surface p-3 rounded border border-gym-border">
                      <div className="text-[10px] text-gym-muted uppercase">Balance Due</div>
                      <div className="font-display font-bold text-lg text-amber-400">
                        ₹{summary?.outstandingBalance.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedMember(null)}
                className="w-full py-2.5 rounded bg-gym-surface hover:bg-gym-dark text-white text-xs font-semibold border border-gym-border"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve & Activate Modal */}
      {activationMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gym-card border border-gym-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="border-b border-gym-border/70 pb-3">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                Membership Approval
              </span>
              <h3 className="font-display font-extrabold text-2xl text-white uppercase">
                Activate {activationMember.profile.full_name}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {hasExistingMembership ? (
                  <>Program: <strong className="text-white">{activationMember.membership?.plan?.name || 'Strength Training'}</strong></>
                ) : (
                  <span className="text-amber-400 font-semibold">Action Required: Assign Official Program</span>
                )}
              </p>
            </div>

            {/* Error inside modal */}
            {actionError && (
              <div className="bg-red-950/90 border border-red-500 text-red-200 p-3 rounded-lg text-xs space-y-1.5 shadow-lg animate-in fade-in">
                <div className="font-bold flex items-center space-x-1.5 text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Database Error Returned from Supabase</span>
                </div>
                <div className="bg-black/60 p-2.5 rounded font-mono text-[11px] text-red-300 break-words leading-relaxed">
                  {actionError}
                </div>
                <div className="text-[10px] text-gray-400">
                  Status remains <strong>pending activation</strong> because the database update did not succeed.
                </div>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {!hasExistingMembership ? (
                <>
                  <div>
                    <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                      Select Training Program *
                    </label>
                    <select
                      value={assignPlanId}
                      onChange={(e) => handlePlanChange(e.target.value)}
                      className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-medium focus:outline-none focus:border-gym-red"
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.duration_months} Month{p.duration_months > 1 ? 's' : ''}) — Base: ₹{p.base_price.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                        Agreed Price (₹) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={agreedPrice}
                        onChange={(e) => handleAgreedPriceChange(Number(e.target.value))}
                        className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                        Discount Policy
                      </label>
                      <select
                        value={discountType}
                        onChange={(e) => handleDiscountTypeChange(e.target.value as any)}
                        className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
                      >
                        <option value="none">Standard / None (₹0)</option>
                        <option value="group_15">Group Discount (15% Off)</option>
                        <option value="custom">Custom Discount (₹)</option>
                      </select>
                    </div>
                  </div>

                  {discountType === 'custom' && (
                    <div>
                      <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                        Custom Discount Amount (₹) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={agreedPrice}
                        value={discountAmount}
                        onChange={(e) => handleCustomDiscountChange(Number(e.target.value))}
                        className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-amber-300 font-mono font-bold"
                      />
                    </div>
                  )}

                  <div className="bg-gym-dark/80 border border-gym-border p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Contract Settlement Amount</span>
                      <span className="text-xs text-gray-400">
                        {discountAmount > 0 ? `₹${agreedPrice.toLocaleString('en-IN')} - ₹${discountAmount.toLocaleString('en-IN')} discount` : 'Full agreed fee'}
                      </span>
                    </div>
                    <div className="font-display font-extrabold text-xl text-emerald-400">
                      ₹{finalAmount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                        className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                        Calculated Expiry Date
                      </label>
                      <div className="w-full bg-gym-surface/50 border border-gym-border rounded px-3 py-2 text-gray-300 font-mono text-xs flex items-center justify-between">
                        <span>{expiryDate || 'N/A'}</span>
                        <Calendar className="w-3.5 h-3.5 text-gym-muted" />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Agreed Fee Payable
                  </label>
                  <div className="font-display font-bold text-xl text-emerald-400">
                    ₹{activationMember.membership?.final_amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    Contract Code: <code className="text-white font-mono">{activationMember.membership?.membership_code}</code>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Initial Paid Now (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={finalAmount}
                    value={initialPaymentAmount}
                    onChange={(e) => setInitialPaymentAmount(Number(e.target.value))}
                    className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-display text-lg focus:outline-none focus:border-gym-red"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2.5 text-white"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="cash">Cash Settlement</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="online">Online Gateway</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Transaction Reference / UTR
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UPI/2610271299/GURU"
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Internal Notes / Remarks
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Confirmed with coach at reception"
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={handleConfirmActivation}
                disabled={isProcessing}
                className="w-full py-3 rounded bg-gym-red hover:bg-gym-red-hover disabled:opacity-50 text-white font-display font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-gym-red/25 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing Database Request...</span>
                  </>
                ) : (
                  <span>{hasExistingMembership ? 'Confirm Payment & Activate Member' : 'Create Contract & Activate Member'}</span>
                )}
              </button>
              <button
                onClick={() => {
                  setActivationMember(null);
                  setActionError(null);
                }}
                disabled={isProcessing}
                className="py-3 px-4 rounded bg-gym-surface text-gray-400 hover:text-white text-xs border border-gym-border disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Details Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gym-card border border-gym-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="border-b border-gym-border/70 pb-3">
              <h3 className="font-display font-extrabold text-2xl text-white uppercase">
                Edit Member Details
              </h3>
              <p className="text-xs text-gray-400">
                Editing: {editingMember.full_name}
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Phone (WhatsApp)
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  value={editEmergency}
                  onChange={(e) => setEditEmergency(e.target.value)}
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded bg-gym-red hover:bg-gym-red-hover disabled:opacity-50 text-white font-display font-bold text-xs uppercase"
                >
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingMember(null);
                    setActionError(null);
                  }}
                  disabled={isProcessing}
                  className="py-2.5 px-4 rounded bg-gym-surface text-gray-400 hover:text-white text-xs border border-gym-border disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
