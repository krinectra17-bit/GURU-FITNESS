import React, { useState } from 'react';
import { Attendance, Profile, Membership } from '../../types/database';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  QrCode, 
  Clock, 
  AlertCircle, 
  Check, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { gymDB } from '../../lib/database';

interface AttendanceCalendarProps {
  member: Profile;
  membership?: Membership;
  attendance: Attendance[];
  onAttendanceUpdated: () => void;
}

export const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  member,
  membership,
  attendance,
  onAttendanceUpdated
}) => {
  const settings = gymDB.getSettings();
  const [showQRModal, setShowQRModal] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState<{ success: boolean; text: string } | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayStr = now.toISOString().split('T')[0];

  // Number of days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = now.toLocaleString('default', { month: 'long' });

  // Today's attendance status
  const todayRecord = attendance.find(a => a.attendance_date === todayStr);

  const handleSelfCheckIn = (method: 'qr_code' | 'admin_manual' = 'qr_code') => {
    setCheckInMsg(null);
    const res = gymDB.recordAttendance({
      memberId: member.id,
      checkInMethod: method,
      status: 'present',
      notes: 'Self QR Check-In via Member Portal'
    });

    setCheckInMsg({
      success: res.success,
      text: res.message
    });

    if (res.success) {
      onAttendanceUpdated();
      setTimeout(() => setShowQRModal(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Check In Action Banner */}
      <div className="bg-gym-surface border border-gym-border rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2">
            <span className="font-display font-bold text-xl text-white uppercase">
              Today&apos;s Workout Attendance
            </span>
            {todayRecord ? (
              <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-xs font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Checked In
              </span>
            ) : (
              <span className="bg-amber-950 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-xs font-semibold">
                Not Checked In Yet
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {todayRecord
              ? `Check-in recorded at ${new Date(todayRecord.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} via ${todayRecord.check_in_method === 'qr_code' ? 'QR Code' : 'Front Desk'}.`
              : `Front desk cutoff time is ${settings.attendance_cutoff_time.substring(0, 5)}. Present your QR code or check in below.`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {todayRecord ? (
            <div className="bg-emerald-900/30 border border-emerald-500/30 px-4 py-2.5 rounded-lg text-emerald-300 text-xs font-semibold flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>Attendance Verified for Today</span>
            </div>
          ) : (
            <button
              onClick={() => setShowQRModal(true)}
              disabled={member.status !== 'active'}
              className="bg-gym-red hover:bg-gym-red-hover text-white px-5 py-2.5 rounded-lg font-display font-bold text-xs uppercase tracking-wider shadow-lg shadow-gym-red/20 flex items-center space-x-2 transition disabled:opacity-40"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Attendance Check-In</span>
            </button>
          )}
        </div>
      </div>

      {member.status !== 'active' && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-lg flex items-start space-x-3 text-xs text-amber-200">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            Your membership is currently <strong>{member.status.replace('_', ' ').toUpperCase()}</strong>. Attendance check-ins are enabled once your membership fee is verified and activated by the gym owner.
          </span>
        </div>
      )}

      {/* Calendar Grid View */}
      <div className="bg-gym-card border border-gym-border rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gym-border/70 pb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-gym-red" />
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              {monthName} {currentYear} Attendance Grid
            </h3>
          </div>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
              <span className="text-gray-300">Present</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-gym-surface inline-block border border-gym-border"></span>
              <span className="text-gray-400">Not Checked In</span>
            </div>
          </div>
        </div>

        {/* Calendar Day Tiles */}
        <div className="grid grid-cols-7 gap-2 pt-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-display font-bold text-xs text-gym-muted uppercase py-1">
              {day}
            </div>
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const dayNum = i + 1;
            const dayDate = new Date(currentYear, currentMonth, dayNum);
            const dateStr = dayDate.toISOString().split('T')[0];
            const isSunday = dayDate.getDay() === 0;
            const isPast = dayDate <= now;
            const isToday = dateStr === todayStr;

            const rec = attendance.find(a => a.attendance_date === dateStr);
            const isPresent = rec?.status === 'present';

            return (
              <div
                key={dayNum}
                className={`min-h-[58px] p-1.5 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                  isToday
                    ? 'border-gym-red ring-1 ring-gym-red bg-gym-surface/80'
                    : 'border-gym-border/60 bg-gym-dark/60'
                } ${isPresent ? 'bg-emerald-950/30 border-emerald-500/40' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-xs font-semibold ${isToday ? 'text-gym-red font-bold' : 'text-gray-300'}`}>
                    {dayNum}
                  </span>
                  {isSunday && (
                    <span className="text-[9px] text-gym-muted uppercase">Sun</span>
                  )}
                </div>

                <div className="mt-1">
                  {isPresent ? (
                    <div className="flex items-center text-[10px] text-emerald-400 font-semibold space-x-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="truncate">
                        {rec?.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Present'}
                      </span>
                    </div>
                  ) : isSunday ? (
                    <span className="text-[9px] text-gray-500 italic">Recovery</span>
                  ) : isPast ? (
                    <span className="text-[9px] text-gray-500">Rest</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic QR Check-in Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gym-card border border-gym-border rounded-xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="space-y-1">
              <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
                Attendance Verification
              </span>
              <h3 className="font-display font-extrabold text-2xl text-white uppercase">
                QR Attendance Pass
              </h3>
              <p className="text-xs text-gray-400">
                Member: <strong className="text-white">{member.full_name}</strong>
              </p>
            </div>

            {/* Generated QR Code Box */}
            <div className="bg-white p-6 rounded-lg inline-block shadow-inner mx-auto border-4 border-gym-red/30">
              <div className="w-48 h-48 bg-gray-100 flex flex-col items-center justify-center text-gray-900 border border-gray-300 rounded relative">
                <QrCode className="w-32 h-32 text-gray-900" />
                <span className="text-[10px] font-mono text-gray-600 mt-1 uppercase">
                  TOKEN: GFN-{member.id.substring(4, 9).toUpperCase()}
                </span>
                <span className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">
                  Valid For Today
                </span>
              </div>
            </div>

            {checkInMsg && (
              <div className={`p-3 rounded text-xs flex items-center justify-center space-x-2 ${
                checkInMsg.success
                  ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950 border border-red-500/50 text-red-300'
              }`}>
                {checkInMsg.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{checkInMsg.text}</span>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => handleSelfCheckIn('qr_code')}
                className="w-full py-3 rounded bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-gym-red/25"
              >
                Simulate Front Desk QR Scan
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-2 text-xs text-gym-muted hover:text-white transition"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
