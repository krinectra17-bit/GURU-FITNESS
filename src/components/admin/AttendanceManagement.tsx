import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Search, 
  QrCode, 
  Download, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { gymDB } from '../../lib/database';
import { Attendance, AttendanceMethod, AttendanceStatus, Profile } from '../../types/database';

interface AttendanceManagementProps {
  onUpdate: () => void;
}

export const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ onUpdate }) => {
  const settings = gymDB.getSettings();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchMember, setSearchMember] = useState('');
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [kioskToken, setKioskToken] = useState<string>('');
  const [manualMemberId, setManualMemberId] = useState('');
  const [manualMsg, setManualMsg] = useState<{ success: boolean; text: string } | null>(null);

  const attendance = gymDB.getAttendance();
  const profiles = gymDB.getProfiles().filter(p => gymDB.getUserRole(p.id) !== 'admin');

  // Filter attendance by selected date
  const dateRecords = attendance.filter(a => a.attendance_date === selectedDate);

  // Generate dynamic QR token
  useEffect(() => {
    if (showKioskModal) {
      const { token } = gymDB.generateDynamicQRToken();
      setKioskToken(token);
      const interval = setInterval(() => {
        const { token: nextToken } = gymDB.generateDynamicQRToken();
        setKioskToken(nextToken);
      }, 60000); // refresh token every 60s
      return () => clearInterval(interval);
    }
  }, [showKioskModal]);

  const handleAdminCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualMemberId) return;

    const res = gymDB.recordAttendance({
      memberId: manualMemberId,
      checkInMethod: 'admin_manual',
      status: 'present',
      notes: 'Front desk admin check-in',
      date: selectedDate
    });

    setManualMsg({
      success: res.success,
      text: res.message
    });

    if (res.success) {
      onUpdate();
    }
  };

  const handleExportCSV = () => {
    const headers = ['Attendance ID,Member ID,Member Name,Date,Check-In Time,Method,Status,Notes\n'];
    const rows = dateRecords.map(a => {
      const prof = profiles.find(p => p.id === a.member_id);
      return `"${a.id}","${a.member_id}","${prof?.full_name || 'Member'}","${a.attendance_date}","${a.check_in_time}","${a.check_in_method}","${a.status}","${a.notes || ''}"\n`;
    });

    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GuruFitness_Attendance_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Facility Access &amp; Floor Check-Ins
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            Attendance &amp; Dynamic QR Kiosk
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowKioskModal(true)}
            className="inline-flex items-center space-x-2 bg-gym-red hover:bg-gym-red-hover text-white px-4 py-2.5 rounded font-display font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-gym-red/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Launch Front Desk QR Kiosk</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 bg-gym-surface hover:bg-gym-card text-white border border-gym-border px-3.5 py-2.5 rounded text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-gym-red" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Switcher & Manual Check-In Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Date Filter */}
        <div className="lg:col-span-5 bg-gym-card border border-gym-border rounded-xl p-5 space-y-2">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Select Attendance Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-gym-surface border border-gym-border rounded px-3.5 py-2 text-sm text-white focus:outline-none focus:border-gym-red"
          />
          <span className="text-[11px] text-gym-muted block">
            Showing records for {selectedDate}. Total check-ins: <strong className="text-white">{dateRecords.length}</strong>
          </span>
        </div>

        {/* Manual Mark Present Box */}
        <div className="lg:col-span-7 bg-gym-card border border-gym-border rounded-xl p-5 space-y-3">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Admin Manual Check-In (Front Desk)
          </label>
          <form onSubmit={handleAdminCheckIn} className="flex flex-col sm:flex-row items-center gap-3">
            <select
              value={manualMemberId}
              onChange={(e) => setManualMemberId(e.target.value)}
              className="w-full sm:flex-1 bg-gym-surface border border-gym-border rounded px-3 py-2 text-xs text-white"
            >
              <option value="">-- Choose Member to Mark Present --</option>
              {profiles.filter(p => p.status === 'active').map(p => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.phone})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!manualMemberId}
              className="w-full sm:w-auto bg-gym-red hover:bg-gym-red-hover text-white px-5 py-2 rounded text-xs font-bold uppercase transition disabled:opacity-40"
            >
              Mark Present
            </button>
          </form>

          {manualMsg && (
            <div className={`p-2.5 rounded text-xs flex items-center space-x-2 ${
              manualMsg.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-red-950 text-red-300 border border-red-500/40'
            }`}>
              {manualMsg.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{manualMsg.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-gym-card border border-gym-border rounded-xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-gym-surface border-b border-gym-border flex items-center justify-between">
          <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
            Verified Check-In Log for {selectedDate}
          </span>
          <span className="text-xs text-emerald-400 font-semibold font-mono">
            {dateRecords.length} Present
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gym-dark text-gym-muted uppercase font-semibold border-b border-gym-border">
              <tr>
                <th className="px-4 py-3">Member Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Check-In Time</th>
                <th className="px-4 py-3">Verification Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Supervisor / Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border/60">
              {dateRecords.map((att) => {
                const prof = profiles.find(p => p.id === att.member_id);
                return (
                  <tr key={att.id} className="hover:bg-gym-surface/40 transition">
                    <td className="px-4 py-3 font-bold text-white text-sm">{prof?.full_name || 'Member'}</td>
                    <td className="px-4 py-3 text-gray-300 font-mono">{prof?.phone || '—'}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">
                      {new Date(att.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gym-dark px-2 py-0.5 rounded border border-gym-border font-mono text-[10px] text-gray-300">
                        {att.check_in_method === 'qr_code' ? 'Dynamic QR Scan' : 'Front Desk Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-emerald-500/30">
                        {att.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gym-muted italic">{att.notes || 'Front desk terminal'}</td>
                  </tr>
                );
              })}
              {dateRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gym-muted italic">
                    No attendance records for {selectedDate}. Use the manual check-in form above or launch the Front Desk QR Kiosk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Front Desk Dynamic QR Kiosk Display Modal */}
      {showKioskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-gym-card border-2 border-gym-red rounded-2xl max-w-lg w-full p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="space-y-1">
              <span className="bg-gym-red text-white text-[10px] font-display font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Front Desk Attendance Kiosk
              </span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-tight mt-2">
                GURU FITNESS &amp; NUTRITIONS
              </h2>
              <p className="text-xs text-gray-300">
                Scan with your phone to mark today&apos;s workout attendance.
              </p>
            </div>

            {/* High-visibility Dynamic QR Code Container */}
            <div className="bg-white p-8 rounded-xl inline-block shadow-2xl mx-auto border-4 border-gym-red">
              <div className="w-64 h-64 bg-gray-100 flex flex-col items-center justify-center text-gray-900 border border-gray-300 rounded relative">
                <QrCode className="w-52 h-52 text-black" />
                <div className="absolute bottom-2 bg-gym-red text-white text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold">
                  AUTO-REFRESHING TOKEN
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs text-gym-muted">
              <div>Cutoff Time: <strong className="text-white">{settings.attendance_cutoff_time.substring(0, 5)}</strong></div>
              <div>Prevents duplicate check-ins • Secured with cryptographic timestamp</div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowKioskModal(false)}
                className="w-full py-3 rounded bg-gym-surface hover:bg-gym-dark text-white font-display font-bold text-xs uppercase tracking-wider border border-gym-border transition"
              >
                Close Kiosk View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
