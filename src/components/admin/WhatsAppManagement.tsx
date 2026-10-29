import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  Phone, 
  RefreshCw,
  Copy,
  Settings
} from 'lucide-react';
import { gymDB } from '../../lib/database';
import { Profile, ReminderType, ReminderLog } from '../../types/database';

interface WhatsAppManagementProps {
  onUpdate: () => void;
}

export const WhatsAppManagement: React.FC<WhatsAppManagementProps> = ({ onUpdate }) => {
  const settings = gymDB.getSettings();
  const profiles = gymDB.getProfiles().filter(p => gymDB.getUserRole(p.id) !== 'admin');
  const reminderLogs = gymDB.getReminderLogs();

  // Selected member for manual reminder
  const [selectedMemberId, setSelectedMemberId] = useState<string>(profiles[0]?.id || '');
  const [selectedTemplateType, setSelectedTemplateType] = useState<ReminderType>('three_days_before_expiry');
  const [customNotes, setCustomNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  // Automated trigger simulation state
  const [isAutomating, setIsAutomating] = useState(false);
  const [automatedSummary, setAutomatedSummary] = useState<string | null>(null);

  const selectedProfile = profiles.find(p => p.id === selectedMemberId) || profiles[0];
  const selectedMembership = selectedProfile ? gymDB.getMemberActiveMembership(selectedProfile.id) : undefined;
  const selectedSummary = selectedProfile ? gymDB.getMemberSummary(selectedProfile.id) : undefined;

  // Generate templated text
  const generateMessage = (type: ReminderType, prof?: Profile): string => {
    const memberName = prof?.full_name || selectedProfile?.full_name || 'Member';
    const expiryDate = selectedMembership?.expiry_date || '30/10/2026';
    const gymName = settings.gym_name;
    const phone = settings.phone_primary;
    const balance = selectedSummary?.outstandingBalance || 0;

    switch (type) {
      case 'three_days_before_expiry':
        return `Hello ${memberName}, your membership at ${gymName} is expiring in 3 days on ${expiryDate}. Renew your plan today to keep your workout streak uninterrupted! For queries or renewal assistance, call ${phone}.`;
      case 'one_day_before_expiry':
        return `Hello ${memberName}, reminder: your membership at ${gymName} expires tomorrow (${expiryDate}). Please visit the front desk to renew your subscription. Helpline: ${phone}.`;
      case 'on_expiry_day':
        return `Hello ${memberName}, your membership at ${gymName} expires TODAY (${expiryDate}). Please contact us to complete your renewal. Call ${phone} or visit the gym floor.`;
      case 'post_expiry':
        return `Hello ${memberName}, your membership at ${gymName} has expired. We miss seeing you in the gym! Reach out to Head Coach Rakesh at ${phone} to reactivate your training.`;
      case 'fee_due':
        return `Hello ${memberName}, this is a gentle reminder from ${gymName} regarding your pending fee balance of ₹${balance.toLocaleString('en-IN')}. Please settle your balance at your next visit or via UPI. Helpline: ${phone}.`;
      case 'general':
      default:
        return `Hello ${memberName}, greetings from ${gymName}! Dedicated training and consistent nutrition are the keys to long-term health. Call us anytime at ${phone}.`;
    }
  };

  const currentMessage = generateMessage(selectedTemplateType, selectedProfile);

  const handleOpenWhatsAppManual = () => {
    if (!selectedProfile) return;
    
    // Log reminder in database
    gymDB.logReminder({
      memberId: selectedProfile.id,
      reminderType: selectedTemplateType,
      targetPhone: selectedProfile.phone,
      messageContent: currentMessage,
      channel: 'manual_whatsapp',
      status: 'sent'
    });

    onUpdate();

    // Format Indian mobile number for WhatsApp link
    let cleanPhone = selectedProfile.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const encodedText = encodeURIComponent(currentMessage);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');

    setLastActionStatus(`Manual WhatsApp opened for ${selectedProfile.full_name} (+${cleanPhone}) and recorded in audit log.`);
  };

  const handleTriggerAutomatedQueue = () => {
    setIsAutomating(true);
    setAutomatedSummary(null);

    // Scan all members with upcoming expirations or dues
    const eligibleMembers = profiles.filter(p => {
      const sum = gymDB.getMemberSummary(p.id);
      const mem = sum?.activeMembership;
      if (!mem) return false;
      return mem.status === 'expired' || sum.outstandingBalance > 0 || mem.status === 'active';
    });

    let sentCount = 0;
    eligibleMembers.slice(0, 3).forEach(p => {
      const sum = gymDB.getMemberSummary(p.id);
      const reminderType: ReminderType = sum?.activeMembership?.status === 'expired' ? 'post_expiry' : sum && sum.outstandingBalance > 0 ? 'fee_due' : 'three_days_before_expiry';
      const msg = generateMessage(reminderType, p);

      gymDB.logReminder({
        memberId: p.id,
        reminderType,
        targetPhone: p.phone,
        messageContent: msg,
        channel: 'whatsapp_api',
        status: settings.whatsapp_api_configured ? 'sent' : 'failed',
        errorMessage: settings.whatsapp_api_configured ? undefined : 'Meta WhatsApp Cloud API credentials not configured in settings.'
      });
      sentCount++;
    });

    setTimeout(() => {
      setIsAutomating(false);
      setAutomatedSummary(
        settings.whatsapp_api_configured
          ? `Dispatched ${sentCount} reminders via Meta WhatsApp Cloud API with delivery receipts.`
          : `Processed ${sentCount} reminders. (Logged with status 'failed' because Meta Cloud API token is not yet configured in Settings).`
      );
      onUpdate();
    }, 1200);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Communication &amp; Retention Hub
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            WhatsApp Reminders &amp; Messaging
          </h1>
        </div>

        {/* Integration Status Badge */}
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold border ${
            settings.whatsapp_api_configured
              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-950 text-amber-300 border-amber-500/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${settings.whatsapp_api_configured ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span>{settings.whatsapp_api_configured ? 'Meta WhatsApp Cloud API: Active' : 'Meta API: Unconfigured (Manual Click-To-Chat Enabled)'}</span>
          </span>
        </div>
      </div>

      {lastActionStatus && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{lastActionStatus}</span>
          </div>
          <button onClick={() => setLastActionStatus(null)} className="text-emerald-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Split: Manual 1-Click vs Automated API Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Manual 1-Click WhatsApp Composer */}
        <div className="lg:col-span-7 bg-gym-card border border-gym-border rounded-xl p-6 space-y-5 shadow-2xl">
          <div className="border-b border-gym-border/70 pb-3 flex items-center justify-between">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-gym-red" />
              <span>Manual 1-Click WhatsApp Dispatch</span>
            </h3>
            <span className="text-[10px] bg-gym-dark text-gym-muted px-2 py-0.5 rounded border border-gym-border">
              Click-to-Chat
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Member Selector */}
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Select Member to Message
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2.5 text-white"
              >
                {profiles.map(p => {
                  const m = gymDB.getMemberActiveMembership(p.id);
                  const sum = gymDB.getMemberSummary(p.id);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.full_name} (+91 {p.phone}) — {m?.status.toUpperCase()} — Dues: ₹{sum?.outstandingBalance || 0}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Choose Official Message Template
              </label>
              <select
                value={selectedTemplateType}
                onChange={(e) => setSelectedTemplateType(e.target.value as any)}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2.5 text-white"
              >
                <option value="three_days_before_expiry">3 Days Before Expiry Reminder</option>
                <option value="one_day_before_expiry">1 Day Before Expiry Urgent Notice</option>
                <option value="on_expiry_day">On Expiry Day Warning</option>
                <option value="post_expiry">Post-Expiry Reactivation Follow Up</option>
                <option value="fee_due">Outstanding Fee Balance Reminder</option>
                <option value="general">General Coaching Encouragement</option>
              </select>
            </div>

            {/* Generated Message Preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-gray-300 uppercase tracking-wider">
                  Live Message Preview
                </label>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-xs text-gym-red hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>
              <div className="bg-gym-dark p-4 rounded-lg border border-gym-border/80 text-white font-sans text-xs leading-relaxed whitespace-pre-wrap">
                {currentMessage}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenWhatsAppManual}
                className="w-full py-3.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-display font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30"
              >
                <Send className="w-4 h-4" />
                <span>Open WhatsApp Web / App &amp; Record Log</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Automated WhatsApp Engine Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gym-card border border-gym-border rounded-xl p-6 space-y-4 shadow-2xl">
            <div className="border-b border-gym-border/70 pb-3">
              <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gym-red" />
                <span>Automated Meta API Scheduled Runner</span>
              </h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              The automated background daemon evaluates membership expiry dates every morning and triggers compliant template messages via Meta WhatsApp Cloud API.
            </p>

            <div className="space-y-2 text-xs bg-gym-dark p-4 rounded-lg border border-gym-border">
              <div className="text-white font-semibold flex items-center">
                <ShieldCheck className="w-4 h-4 text-gym-red mr-1.5" />
                <span>Standard Compliance Rules:</span>
              </div>
              <ul className="list-disc list-inside text-gym-muted space-y-1 text-[11px]">
                <li>Idempotent check prevents sending duplicate reminders within 24 hours.</li>
                <li>Uses Meta-approved utility templates with member name variables.</li>
                <li>Every API request is audited with provider message IDs.</li>
              </ul>
            </div>

            {automatedSummary && (
              <div className="bg-gym-surface p-3.5 rounded-lg border border-gym-border text-xs text-gray-200">
                {automatedSummary}
              </div>
            )}

            <button
              onClick={handleTriggerAutomatedQueue}
              disabled={isAutomating}
              className="w-full py-3 rounded bg-gym-surface hover:bg-gym-dark text-white border border-gym-border hover:border-gym-red font-display font-bold text-xs uppercase tracking-wider transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gym-red ${isAutomating ? 'animate-spin' : ''}`} />
              <span>{isAutomating ? 'Executing Batch Scan...' : 'Trigger Automated Reminder Batch Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reminder Audit Log Table */}
      <div className="bg-gym-card border border-gym-border rounded-xl overflow-hidden shadow-2xl">
        <div className="px-5 py-3.5 bg-gym-surface border-b border-gym-border flex items-center justify-between">
          <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
            WhatsApp Delivery Audit History ({reminderLogs.length})
          </span>
          <span className="text-xs text-gym-muted">Audit trail of all dispatched messages</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gym-dark text-gym-muted uppercase font-semibold border-b border-gym-border">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Message Excerpt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border/60">
              {reminderLogs.map((log) => {
                const prof = profiles.find(p => p.id === log.member_id);
                return (
                  <tr key={log.id} className="hover:bg-gym-surface/40 transition">
                    <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 font-bold text-white">{prof?.full_name || 'Member'}</td>
                    <td className="px-4 py-3 font-mono text-gray-300">{log.target_phone}</td>
                    <td className="px-4 py-3 uppercase text-[10px] text-gym-muted">
                      {log.reminder_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gym-dark px-2 py-0.5 rounded border border-gym-border text-[10px] font-mono text-gray-300">
                        {log.delivery_channel === 'manual_whatsapp' ? 'Manual Click' : 'Cloud API'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        log.delivery_status === 'sent' || log.delivery_status === 'delivered'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-950 text-amber-300 border-amber-500/30'
                      }`}>
                        {log.delivery_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 italic max-w-xs truncate">
                      {log.message_content}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
