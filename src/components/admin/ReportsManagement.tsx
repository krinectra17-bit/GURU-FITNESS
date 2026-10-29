import React, { useState } from 'react';
import { BarChart3, Download, TrendingUp, Calendar, Users, DollarSign, ShieldCheck } from 'lucide-react';
import { gymDB } from '../../lib/database';

export const ReportsManagement: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<'collections' | 'outstanding' | 'attendance' | 'plans'>('collections');

  const payments = gymDB.getPayments();
  const memberships = gymDB.getMemberships();
  const profiles = gymDB.getProfiles().filter(p => gymDB.getUserRole(p.id) !== 'admin');
  const attendance = gymDB.getAttendance();
  const plans = gymDB.getPlans();
  const stats = gymDB.getAdminStats();

  const handleExportCurrentReport = () => {
    let filename = `GuruFitness_${selectedReportType}_Report.csv`;
    let csvContent = '';

    if (selectedReportType === 'collections') {
      csvContent = 'Receipt Number,Member Name,Date,Amount (INR),Method,Reference,Notes\n' +
        payments.map(p => {
          const prof = profiles.find(pr => pr.id === p.member_id);
          return `"${p.payment_number}","${prof?.full_name || 'Member'}","${p.payment_date}","${p.amount}","${p.payment_method}","${p.transaction_reference || ''}","${p.notes || ''}"\n`;
        }).join('');
    } else if (selectedReportType === 'outstanding') {
      csvContent = 'Member ID,Full Name,Phone,Email,Status,Agreed Total,Paid Total,Balance Due\n' +
        profiles.map(p => {
          const sum = gymDB.getMemberSummary(p.id);
          return `"${p.id}","${p.full_name}","${p.phone}","${p.email}","${p.status}","${sum?.totalAgreed || 0}","${sum?.totalPaid || 0}","${sum?.outstandingBalance || 0}"\n`;
        }).join('');
    } else if (selectedReportType === 'attendance') {
      csvContent = 'Attendance ID,Member Name,Date,Check-In Time,Method,Status\n' +
        attendance.map(a => {
          const prof = profiles.find(pr => pr.id === a.member_id);
          return `"${a.id}","${prof?.full_name || 'Member'}","${a.attendance_date}","${a.check_in_time}","${a.check_in_method}","${a.status}"\n`;
        }).join('');
    } else {
      csvContent = 'Plan ID,Category,Name,Duration Months,Base Price (INR),Is Active\n' +
        plans.map(p => `"${p.id}","${p.category}","${p.name}","${p.duration_months}","${p.base_price}","${p.is_active}"\n`).join('');
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Data Analytics &amp; Ledger Auditing
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            Financial &amp; Operational Reports
          </h1>
        </div>

        <button
          onClick={handleExportCurrentReport}
          className="inline-flex items-center space-x-2 bg-gym-red hover:bg-gym-red-hover text-white px-4 py-2.5 rounded font-display font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-gym-red/20"
        >
          <Download className="w-4 h-4" />
          <span>Export {selectedReportType.toUpperCase()} To CSV</span>
        </button>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'collections', label: 'Revenue & Collections' },
          { id: 'outstanding', label: 'Outstanding Dues Ledger' },
          { id: 'attendance', label: 'Attendance Records' },
          { id: 'plans', label: 'Plan Catalog & Pricing' },
        ].map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedReportType(r.id as any)}
            className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition ${
              selectedReportType === r.id
                ? 'bg-gym-surface text-white border border-gym-red'
                : 'bg-gym-card text-gym-muted hover:text-white border border-gym-border'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Report Content View */}
      {selectedReportType === 'collections' && (
        <div className="bg-gym-card border border-gym-border rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-gym-border/70 pb-3">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              All Fee Collections ({payments.length} Transactions)
            </h3>
            <span className="font-display font-extrabold text-xl text-emerald-400">
              Total Collected: ₹{stats.totalCollectedAll.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gym-surface text-gym-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Receipt Number</th>
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Payment Method</th>
                  <th className="px-4 py-3">Amount (INR)</th>
                  <th className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border/60">
                {payments.map(p => {
                  const prof = profiles.find(pr => pr.id === p.member_id);
                  return (
                    <tr key={p.id} className="hover:bg-gym-surface/40 transition">
                      <td className="px-4 py-3 font-mono text-white font-medium">{p.payment_number}</td>
                      <td className="px-4 py-3 font-bold text-white">{prof?.full_name || 'Member'}</td>
                      <td className="px-4 py-3 text-gray-300">{p.payment_date}</td>
                      <td className="px-4 py-3 uppercase font-mono text-[10px] text-gray-300">{p.payment_method}</td>
                      <td className="px-4 py-3 font-display font-bold text-white text-base">₹{p.amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 font-mono text-gray-400 text-[10px]">{p.transaction_reference || 'CASH'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReportType === 'outstanding' && (
        <div className="bg-gym-card border border-gym-border rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-gym-border/70 pb-3">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              Outstanding Dues Breakdown
            </h3>
            <span className="font-display font-extrabold text-xl text-amber-400">
              Total Outstanding: ₹{stats.totalOutstandingDues.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gym-surface text-gym-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Agreed Fee</th>
                  <th className="px-4 py-3">Amount Paid</th>
                  <th className="px-4 py-3">Balance Due</th>
                  <th className="px-4 py-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border/60">
                {profiles.map(p => {
                  const sum = gymDB.getMemberSummary(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-gym-surface/40 transition">
                      <td className="px-4 py-3 font-bold text-white">{p.full_name}</td>
                      <td className="px-4 py-3 font-mono text-gray-300">{p.phone}</td>
                      <td className="px-4 py-3 text-gray-300">₹{sum?.totalAgreed.toLocaleString('en-IN') || 0}</td>
                      <td className="px-4 py-3 text-emerald-400">₹{sum?.totalPaid.toLocaleString('en-IN') || 0}</td>
                      <td className="px-4 py-3 font-display font-bold text-sm text-amber-400">
                        ₹{sum?.outstandingBalance.toLocaleString('en-IN') || 0}
                      </td>
                      <td className="px-4 py-3 uppercase text-[10px] text-gym-muted">{p.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReportType === 'attendance' && (
        <div className="bg-gym-card border border-gym-border rounded-xl p-6 space-y-4 shadow-xl">
          <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
            Attendance Records Log ({attendance.length} Entries)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gym-surface text-gym-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">Check-In Time</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border/60">
                {attendance.slice(0, 30).map(a => {
                  const prof = profiles.find(pr => pr.id === a.member_id);
                  return (
                    <tr key={a.id} className="hover:bg-gym-surface/40 transition">
                      <td className="px-4 py-3 font-mono text-white">{a.attendance_date}</td>
                      <td className="px-4 py-3 font-bold text-white">{prof?.full_name || 'Member'}</td>
                      <td className="px-4 py-3 text-gray-300">{new Date(a.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 uppercase text-[10px] text-gym-muted">{a.check_in_method}</td>
                      <td className="px-4 py-3 text-emerald-400 font-bold uppercase text-[10px]">{a.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReportType === 'plans' && (
        <div className="bg-gym-card border border-gym-border rounded-xl p-6 space-y-4 shadow-xl">
          <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
            Membership Plan Catalog ({plans.length} Standard Plans)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gym-surface text-gym-muted uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Plan Name</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Base Price</th>
                  <th className="px-4 py-3">Effective Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border/60">
                {plans.map(p => (
                  <tr key={p.id} className="hover:bg-gym-surface/40 transition">
                    <td className="px-4 py-3 uppercase text-[10px] text-gym-red font-bold font-mono">{p.category}</td>
                    <td className="px-4 py-3 font-bold text-white">{p.name}</td>
                    <td className="px-4 py-3 text-gray-300">{p.duration_months} Month(s)</td>
                    <td className="px-4 py-3 font-display font-bold text-white text-base">₹{p.base_price.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-gym-muted">{p.effective_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
