import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Dumbbell, 
  Calendar, 
  CreditCard, 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  QrCode, 
  ArrowRight, 
  Printer, 
  CheckCircle2, 
  ShieldAlert,
  Sparkles,
  Phone,
  RefreshCw,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { AttendanceCalendar } from '../components/dashboard/AttendanceCalendar';
import { ReceiptModal } from '../components/dashboard/ReceiptModal';
import { gymDB } from '../lib/database';
import { Payment } from '../types/database';
import { Link, useNavigate, Navigate } from 'react-router-dom';

export const MemberDashboard: React.FC = () => {
  const { user, profile, role, summary, isLoading, refreshData, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'membership' | 'attendance' | 'payments' | 'profile' | 'notifications'>('overview');
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Profile edit states
  const [editPhone, setEditPhone] = useState(profile?.phone || '');
  const [editAddress, setEditAddress] = useState(profile?.address || '');
  const [editEmergency, setEditEmergency] = useState(profile?.emergency_contact || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // Renewal request state
  const [renewalRequested, setRenewalRequested] = useState(false);

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  if (isLoading || (user && (!profile || !summary))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gym-dark text-white space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-gym-red border-t-transparent animate-spin flex items-center justify-center">
          <Dumbbell className="w-5 h-5 text-gym-red" />
        </div>
        <p className="text-xs uppercase tracking-widest text-gym-muted font-display font-semibold">
          Loading Member Portal...
        </p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login?redirect=%2Fdashboard" replace />;
  }
  if (!profile || !summary) {
    return null;
  }

  const activeMembership = summary.activeMembership;
  const isPending = profile.status === 'pending_activation';
  const isExpired = activeMembership?.status === 'expired' || profile.status === 'inactive';
  const isActive = profile.status === 'active' && activeMembership?.status === 'active';
  const notifications = gymDB.getNotifications(profile.id);

  // Calculate days left in membership
  let daysLeft = 0;
  if (activeMembership?.expiry_date) {
    const exp = new Date(activeMembership.expiry_date);
    const diff = exp.getTime() - new Date().getTime();
    daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    gymDB.updateProfile(profile.id, {
      phone: editPhone,
      address: editAddress,
      emergency_contact: editEmergency
    });
    refreshData();
    setProfileSuccessMsg(true);
    setTimeout(() => setProfileSuccessMsg(false), 3000);
  };

  const handleRequestRenewal = () => {
    gymDB.addNotification(
      profile.id,
      'Renewal Request Logged',
      'Your renewal inquiry has been sent to Coach Rakesh Bagra. The front desk will follow up to finalize payment and extend your term.',
      'expiry'
    );
    setRenewalRequested(true);
    refreshData();
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gym-dark text-gym-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header / Welcome Banner */}
        <div className="bg-gym-card border border-gym-border rounded-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gym-surface border-2 border-gym-red flex items-center justify-center font-display font-bold text-2xl text-white shadow-lg shadow-gym-red/20">
              {profile.full_name.charAt(0)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-tight">
                  {profile.full_name}
                </h1>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isActive
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                    : isPending
                    ? 'bg-blue-950 text-blue-300 border-blue-500/50'
                    : 'bg-rose-950 text-rose-300 border-rose-500/50'
                }`}>
                  {profile.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Member ID: <span className="font-mono text-gray-300">{activeMembership?.membership_code || `GFN-PENDING-${profile.id.substring(4, 8)}`}</span> • Registered: {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('attendance')}
              className="inline-flex items-center space-x-1.5 bg-gym-red hover:bg-gym-red-hover text-white px-4 py-2.5 rounded font-display font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-gym-red/20"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Check-In</span>
            </button>

            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="inline-flex items-center space-x-1.5 bg-gym-surface hover:bg-gym-card text-gray-300 hover:text-white px-3.5 py-2.5 rounded text-xs border border-gym-border transition"
            >
              <LogOut className="w-4 h-4 text-gym-muted" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Pending Activation Banner Alert */}
        {isPending && (
          <div className="bg-blue-950/40 border border-blue-500/50 rounded-xl p-5 flex items-start space-x-4 shadow-lg animate-in fade-in">
            <ShieldAlert className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-gray-300 leading-relaxed">
              <span className="font-bold text-white uppercase text-sm block">
                Account Status: Pending Membership Activation
              </span>
              <p>
                Your registration has been submitted. Please complete your fee payment at the front desk or via UPI to activate your gym attendance privileges. Contact Coach Rakesh at <strong>9828482505</strong> for instant assistance.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gym-border flex items-center space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'overview', label: 'Overview', icon: Dumbbell },
            { id: 'membership', label: 'My Membership', icon: Calendar },
            { id: 'attendance', label: 'My Attendance', icon: QrCode },
            { id: 'payments', label: 'My Payments & Fees', icon: CreditCard },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'notifications', label: `Notifications (${notifications.filter(n => !n.is_read).length})`, icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-display text-xs sm:text-sm font-bold uppercase tracking-wider transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-gym-red text-white bg-gym-card/50'
                    : 'border-transparent text-gym-muted hover:text-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-gym-red' : 'text-gym-muted'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Active Plan */}
              <div className="bg-gym-card p-5 rounded-xl border border-gym-border/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-xs text-gym-muted uppercase font-semibold">
                  <span>Selected Program</span>
                  <Dumbbell className="w-4 h-4 text-gym-red" />
                </div>
                <div>
                  <div className="font-display font-extrabold text-xl text-white">
                    {activeMembership?.plan?.name || 'Strength Training'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {activeMembership ? `Valid through ${activeMembership.expiry_date}` : 'Awaiting payment confirmation'}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-emerald-400">
                  {daysLeft > 0 ? `${daysLeft} days remaining` : isPending ? 'Pending Approval' : 'Term Expired'}
                </div>
              </div>

              {/* Card 2: Fee Balance */}
              <div className="bg-gym-card p-5 rounded-xl border border-gym-border/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-xs text-gym-muted uppercase font-semibold">
                  <span>Fee Balance</span>
                  <CreditCard className="w-4 h-4 text-gym-red" />
                </div>
                <div>
                  <div className={`font-display font-extrabold text-2xl ${summary.outstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ₹{summary.outstandingBalance.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Agreed: ₹{summary.totalAgreed.toLocaleString('en-IN')} • Paid: ₹{summary.totalPaid.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-[11px] text-gym-muted">
                  {summary.outstandingBalance === 0 ? 'Fully Cleared' : 'Outstanding dues payable'}
                </div>
              </div>

              {/* Card 3: Attendance Consistency */}
              <div className="bg-gym-card p-5 rounded-xl border border-gym-border/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-xs text-gym-muted uppercase font-semibold">
                  <span>Attendance Rate</span>
                  <Calendar className="w-4 h-4 text-gym-red" />
                </div>
                <div>
                  <div className="font-display font-extrabold text-2xl text-white">
                    {summary.attendanceRate}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {summary.daysAttendedThisMonth} days attended this month
                  </div>
                </div>
                <div className="w-full bg-gym-dark h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gym-red h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, summary.attendanceRate)}%` }}
                  />
                </div>
              </div>

              {/* Card 4: Latest Payment Receipt */}
              <div className="bg-gym-card p-5 rounded-xl border border-gym-border/80 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between text-xs text-gym-muted uppercase font-semibold">
                  <span>Latest Payment</span>
                  <Printer className="w-4 h-4 text-gym-red" />
                </div>
                <div>
                  {summary.payments[0] ? (
                    <>
                      <div className="font-display font-extrabold text-2xl text-white">
                        ₹{summary.payments[0].amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Paid on {summary.payments[0].payment_date} ({summary.payments[0].payment_method.toUpperCase()})
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-400 italic">No payments logged yet</div>
                  )}
                </div>
                {summary.payments[0] && (
                  <button
                    onClick={() => setSelectedReceipt(summary.payments[0])}
                    className="text-xs text-gym-red hover:underline text-left font-semibold flex items-center"
                  >
                    <span>View Official Receipt</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Attendance Calendar Snapshot */}
            <AttendanceCalendar
              member={profile}
              membership={activeMembership || undefined}
              attendance={summary.attendanceRecords}
              onAttendanceUpdated={refreshData}
            />
          </div>
        )}

        {/* TAB 2: MY MEMBERSHIP */}
        {activeTab === 'membership' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-gym-card border border-gym-border rounded-xl p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gym-border/70 pb-4 gap-4">
                <div>
                  <span className="text-xs font-display font-bold uppercase text-gym-red tracking-wider">
                    Membership Overview
                  </span>
                  <h3 className="font-display font-bold text-2xl text-white uppercase mt-0.5">
                    {activeMembership?.plan?.name || 'Strength Training Program'}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${
                    isActive
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-amber-950 text-amber-300 border-amber-500/50'
                  }`}>
                    {activeMembership?.status || 'Pending Activation'}
                  </span>
                </div>
              </div>

              {/* Data Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="bg-gym-dark/80 p-5 rounded-lg border border-gym-border/70 space-y-3">
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Contract Terms &amp; Pricing Snapshot
                  </h4>
                  <div className="flex justify-between py-1 border-b border-gym-border/40">
                    <span className="text-gym-muted">Membership Code:</span>
                    <span className="font-mono text-white">{activeMembership?.membership_code || 'Pending Code'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gym-border/40">
                    <span className="text-gym-muted">Standard Base Price:</span>
                    <span className="text-white">₹{activeMembership?.agreed_price?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gym-border/40">
                    <span className="text-gym-muted">Group Discount (15%):</span>
                    <span className="text-emerald-400">
                      {activeMembership?.discount_amount ? `- ₹${activeMembership.discount_amount.toLocaleString('en-IN')}` : 'None Applied'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 pt-2">
                    <span className="font-bold text-white uppercase">Final Agreed Amount:</span>
                    <span className="font-display font-bold text-base text-gym-red">
                      ₹{activeMembership?.final_amount?.toLocaleString('en-IN') || '0'}
                    </span>
                  </div>
                </div>

                <div className="bg-gym-dark/80 p-5 rounded-lg border border-gym-border/70 space-y-3">
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Validity &amp; Access Timeline
                  </h4>
                  <div className="flex justify-between py-1 border-b border-gym-border/40">
                    <span className="text-gym-muted">Start Date:</span>
                    <span className="text-white">{activeMembership?.start_date || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gym-border/40">
                    <span className="text-gym-muted">Expiry Date:</span>
                    <span className="text-white">{activeMembership?.expiry_date || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gym-border/40">
                    <span className="text-gym-muted">Access Category:</span>
                    <span className="text-white uppercase font-mono">{activeMembership?.plan?.category || 'Strength'}</span>
                  </div>
                  <div className="flex justify-between py-1 pt-2">
                    <span className="font-bold text-white uppercase">Status Verification:</span>
                    <span className="text-gray-300">{activeMembership?.notes || 'Direct member registration.'}</span>
                  </div>
                </div>
              </div>

              {/* Renewal Action */}
              <div className="bg-gym-surface/80 p-6 rounded-lg border border-gym-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-display font-bold text-base text-white uppercase">
                    Need To Extend Or Renew Your Plan?
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Request a renewal online. The front desk will hold your training slot and verify renewal fees.
                  </p>
                </div>

                {renewalRequested ? (
                  <div className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-4 py-2 rounded text-xs font-semibold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Renewal Request Submitted</span>
                  </div>
                ) : (
                  <button
                    onClick={handleRequestRenewal}
                    className="bg-gym-red hover:bg-gym-red-hover text-white px-5 py-2.5 rounded font-display font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-gym-red/20"
                  >
                    Request Renewal
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MY ATTENDANCE */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <AttendanceCalendar
              member={profile}
              membership={activeMembership || undefined}
              attendance={summary.attendanceRecords}
              onAttendanceUpdated={refreshData}
            />

            {/* Attendance History Table */}
            <div className="bg-gym-card border border-gym-border rounded-xl p-6 shadow-xl">
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide mb-4">
                Attendance Check-In Log
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gym-surface text-gym-muted uppercase font-semibold border-b border-gym-border">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Check-In Time</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gym-border/60">
                    {summary.attendanceRecords.slice(0, 15).map((att) => (
                      <tr key={att.id} className="hover:bg-gym-surface/40 transition">
                        <td className="px-4 py-3 font-mono text-white font-medium">{att.attendance_date}</td>
                        <td className="px-4 py-3 text-gray-300">
                          {new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-gym-dark px-2 py-0.5 rounded border border-gym-border font-mono text-[10px] text-gray-300">
                            {att.check_in_method === 'qr_code' ? 'QR Code Pass' : 'Front Desk Manual'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-500/30">
                            {att.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gym-muted italic">{att.notes || '—'}</td>
                      </tr>
                    ))}
                    {summary.attendanceRecords.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gym-muted italic">
                          No attendance check-ins recorded yet. Use the QR Check-In button when you arrive at the gym.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MY PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Fee Balance Callout */}
            <div className="bg-gym-card border border-gym-border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-xs font-display font-bold text-gym-muted uppercase tracking-wider">
                  Financial Balance Summary
                </span>
                <div className="flex items-baseline space-x-3">
                  <span className="font-display font-extrabold text-3xl text-white">
                    Total Paid: ₹{summary.totalPaid.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-gym-muted">/ Agreed ₹{summary.totalAgreed.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {summary.outstandingBalance > 0
                    ? `Pending dues of ₹${summary.outstandingBalance.toLocaleString('en-IN')} due. Please pay via UPI or cash at the desk.`
                    : 'All fees for your current membership term are fully settled.'}
                </p>
              </div>

              <div className="bg-gym-dark p-4 rounded-lg border border-gym-border text-center min-w-[200px]">
                <div className="text-[11px] font-semibold text-gym-muted uppercase">Outstanding Balance</div>
                <div className={`font-display font-bold text-2xl mt-0.5 ${summary.outstandingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ₹{summary.outstandingBalance.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Payments Table */}
            <div className="bg-gym-card border border-gym-border rounded-xl p-6 shadow-xl">
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide mb-4">
                Payment History &amp; Official Invoices
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gym-surface text-gym-muted uppercase font-semibold border-b border-gym-border">
                    <tr>
                      <th className="px-4 py-3">Receipt No.</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Transaction Reference</th>
                      <th className="px-4 py-3 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gym-border/60">
                    {summary.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gym-surface/40 transition">
                        <td className="px-4 py-3 font-mono text-white font-medium">{p.payment_number}</td>
                        <td className="px-4 py-3 text-gray-300">{p.payment_date}</td>
                        <td className="px-4 py-3">
                          <span className="bg-gym-dark px-2 py-0.5 rounded border border-gym-border font-mono text-[10px] text-gray-300 uppercase">
                            {p.payment_method}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-display font-bold text-base text-white">
                          ₹{p.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">{p.transaction_reference || 'CASH-SETTLEMENT'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="inline-flex items-center space-x-1 text-gym-red hover:underline font-semibold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {summary.payments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gym-muted italic">
                          No payments recorded yet. Visit the front desk to settle fees and activate your account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MY PROFILE */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-gym-card border border-gym-border rounded-xl p-8 max-w-2xl">
              <h3 className="font-display font-bold text-2xl text-white uppercase tracking-wide mb-6">
                Personal Information &amp; Contacts
              </h3>

              {profileSuccessMsg && (
                <div className="mb-4 bg-emerald-950 border border-emerald-500/50 p-3 rounded text-xs text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Profile updated successfully.</span>
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gym-muted uppercase tracking-wider mb-1">
                    Full Name (Permanent)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={profile.full_name}
                    className="w-full bg-gym-dark border border-gym-border rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gym-muted uppercase tracking-wider mb-1">
                    Email Address (Account ID)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full bg-gym-dark border border-gym-border rounded px-3 py-2 text-gray-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Mobile Number (WhatsApp Notifications) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white focus:outline-none focus:border-gym-red"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white focus:outline-none focus:border-gym-red"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                    Emergency Contact Number
                  </label>
                  <input
                    type="tel"
                    value={editEmergency}
                    onChange={(e) => setEditEmergency(e.target.value)}
                    className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white focus:outline-none focus:border-gym-red"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded transition shadow-lg shadow-gym-red/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 6: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-in fade-in duration-200 max-w-3xl">
            <h3 className="font-display font-bold text-2xl text-white uppercase tracking-wide mb-4">
              Member Notifications &amp; System Alerts
            </h3>
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border flex items-start justify-between space-x-4 transition ${
                    notif.is_read
                      ? 'bg-gym-card/60 border-gym-border/70 text-gray-400'
                      : 'bg-gym-surface border-gym-red/40 shadow-lg text-white'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded bg-gym-dark flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-4 h-4 text-gym-red" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-display font-bold text-base text-white uppercase">
                        {notif.title}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="text-[10px] text-gym-muted">
                        {new Date(notif.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <button
                      onClick={() => {
                        gymDB.markNotificationAsRead(notif.id);
                        refreshData();
                      }}
                      className="text-xs text-gym-red hover:underline whitespace-nowrap font-medium"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="bg-gym-card p-8 rounded-xl border border-gym-border text-center text-xs text-gym-muted italic">
                  No notifications currently.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Printable Official Receipt Modal */}
        {selectedReceipt && (
          <ReceiptModal
            payment={selectedReceipt}
            member={profile}
            membership={activeMembership || undefined}
            onClose={() => setSelectedReceipt(null)}
          />
        )}
      </div>
    </div>
  );
};

