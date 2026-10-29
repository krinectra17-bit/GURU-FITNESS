import React from 'react';
import { 
  Users, 
  CreditCard, 
  CalendarCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight,
  Shield,
  MessageSquare,
  QrCode,
  DollarSign
} from 'lucide-react';
import { gymDB } from '../../lib/database';
import { AdminTab } from './AdminSidebar';

interface AdminOverviewProps {
  onNavigateTab: (tab: AdminTab) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateTab }) => {
  const stats = gymDB.getAdminStats();
  const settings = gymDB.getSettings();

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Title & Quick Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Executive Summary
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            Gym Management Overview
          </h1>
          <p className="text-xs text-gym-muted mt-0.5">
            Real-time metrics calculated directly from database records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('attendance')}
            className="inline-flex items-center space-x-1.5 bg-gym-red hover:bg-gym-red-hover text-white px-3.5 py-2 rounded text-xs font-display font-bold uppercase tracking-wider transition shadow-lg shadow-gym-red/20"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Open QR Kiosk</span>
          </button>
          <button
            onClick={() => onNavigateTab('payments')}
            className="inline-flex items-center space-x-1.5 bg-gym-surface hover:bg-gym-card text-white border border-gym-border px-3.5 py-2 rounded text-xs font-display font-bold uppercase tracking-wider transition"
          >
            <DollarSign className="w-3.5 h-3.5 text-gym-red" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 8 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Registered */}
        <div 
          onClick={() => onNavigateTab('members')}
          className="bg-gym-card p-5 rounded-xl border border-gym-border/80 hover:border-gym-red/60 transition cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gym-muted uppercase">Total Registered</span>
            <Users className="w-4 h-4 text-gym-red" />
          </div>
          <div className="font-display font-extrabold text-3xl text-white">
            {stats.totalRegistered}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Members on file</span>
            <span className="text-gym-red font-semibold group-hover:underline flex items-center">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 2: Active Memberships */}
        <div 
          onClick={() => onNavigateTab('members')}
          className="bg-gym-card p-5 rounded-xl border border-gym-border/80 hover:border-emerald-500/60 transition cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gym-muted uppercase">Active Members</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-extrabold text-3xl text-emerald-400">
            {stats.activeMembers}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Currently training</span>
            <span className="text-emerald-400 font-semibold group-hover:underline flex items-center">
              Filter <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 3: Pending Activations */}
        <div 
          onClick={() => onNavigateTab('members')}
          className="bg-gym-card p-5 rounded-xl border border-gym-border/80 hover:border-blue-500/60 transition cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gym-muted uppercase">Pending Activations</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-display font-extrabold text-3xl text-blue-400">
            {stats.pendingActivations}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Requires fee approval</span>
            <span className="text-blue-400 font-semibold group-hover:underline flex items-center">
              Review <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 4: Expired Memberships */}
        <div 
          onClick={() => onNavigateTab('memberships')}
          className="bg-gym-card p-5 rounded-xl border border-gym-border/80 hover:border-rose-500/60 transition cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gym-muted uppercase">Expired Memberships</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-display font-extrabold text-3xl text-rose-400">
            {stats.expiredMemberships}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Eligible for renewal</span>
            <span className="text-rose-400 font-semibold group-hover:underline flex items-center">
              Renew <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 5: Monthly Collections */}
        <div 
          onClick={() => onNavigateTab('reports')}
          className="bg-gym-card p-5 rounded-xl border border-gym-border/80 hover:border-gym-red/60 transition cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gym-muted uppercase">Monthly Collections</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-extrabold text-3xl text-white">
            ₹{stats.monthlyCollections.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Current month fee receipts</span>
            <span className="text-emerald-400 font-semibold group-hover:underline flex items-center">
              Report <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 6: Outstanding Dues */}
        <div 
          onClick={() => onNavigateTab('payments')}
          className="bg-gym-card p-5 rounded-xl border border-gym-border/80 hover:border-amber-500/60 transition cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gym-muted uppercase">Outstanding Dues</span>
            <CreditCard className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display font-extrabold text-3xl text-amber-400">
            ₹{stats.totalOutstandingDues.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Pending member balances</span>
            <span className="text-amber-400 font-semibold group-hover:underline flex items-center">
              Collect <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 7: Today's Attendance */}
        <div 
          onClick={() => onNavigateTab('attendance')}
          className="bg-gym-card p-5 rounded-xl border border-gym-border/80 hover:border-gym-red/60 transition cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gym-muted uppercase">Today&apos;s Check-Ins</span>
            <CalendarCheck className="w-4 h-4 text-gym-red" />
          </div>
          <div className="font-display font-extrabold text-3xl text-white">
            {stats.todayCheckInsCount}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Verified entries today</span>
            <span className="text-gym-red font-semibold group-hover:underline flex items-center">
              Log <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 8: Upcoming Expirations */}
        <div 
          onClick={() => onNavigateTab('whatsapp')}
          className="bg-gym-card p-5 rounded-xl border border-gym-border/80 hover:border-gym-red/60 transition cursor-pointer group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gym-muted uppercase">Expiring (7 Days)</span>
            <MessageSquare className="w-4 h-4 text-gym-red" />
          </div>
          <div className="font-display font-extrabold text-3xl text-amber-300">
            {stats.upcomingExpirationsCount}
          </div>
          <div className="text-[11px] text-gray-400 flex items-center justify-between">
            <span>Send WhatsApp reminders</span>
            <span className="text-gym-red font-semibold group-hover:underline flex items-center">
              Remind <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Operational Highlights Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Member Registrations Review Card */}
        <div className="bg-gym-card border border-gym-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gym-border/70 pb-3">
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Pending Registrations Requiring Review</span>
            </h3>
            <button
              onClick={() => onNavigateTab('members')}
              className="text-xs text-gym-red hover:underline font-semibold"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {gymDB.getProfiles().filter(p => p.status === 'pending_activation').map(p => {
              const m = gymDB.getMemberActiveMembership(p.id);
              return (
                <div
                  key={p.id}
                  className="bg-gym-dark/70 border border-gym-border/60 p-3.5 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{p.full_name}</div>
                    <div className="text-xs text-gym-muted">
                      {p.phone} • {m?.plan?.name || 'Strength Training'}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('members')}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold uppercase transition"
                  >
                    Review &amp; Activate
                  </button>
                </div>
              );
            })}
            {gymDB.getProfiles().filter(p => p.status === 'pending_activation').length === 0 && (
              <div className="text-center py-6 text-xs text-gym-muted italic">
                No pending registrations. All accounts are up to date.
              </div>
            )}
          </div>
        </div>

        {/* Expiring Memberships & WhatsApp Reminders */}
        <div className="bg-gym-card border border-gym-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gym-border/70 pb-3">
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-gym-red" />
              <span>Upcoming Expirations (Next 7 Days)</span>
            </h3>
            <button
              onClick={() => onNavigateTab('whatsapp')}
              className="text-xs text-gym-red hover:underline font-semibold"
            >
              Manage Reminders
            </button>
          </div>

          <div className="space-y-3">
            {stats.upcomingExpirations.slice(0, 3).map(m => {
              const prof = gymDB.getProfile(m.member_id);
              return (
                <div
                  key={m.id}
                  className="bg-gym-dark/70 border border-gym-border/60 p-3.5 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white text-sm">{prof?.full_name || 'Member'}</div>
                    <div className="text-xs text-gym-muted">
                      Expires: <strong className="text-amber-400">{m.expiry_date}</strong> • {prof?.phone}
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigateTab('whatsapp')}
                    className="bg-gym-surface hover:bg-gym-card text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded text-xs font-bold uppercase transition"
                  >
                    WhatsApp Notice
                  </button>
                </div>
              );
            })}
            {stats.upcomingExpirations.length === 0 && (
              <div className="text-center py-6 text-xs text-gym-muted italic">
                No memberships expiring in the next 7 days.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
