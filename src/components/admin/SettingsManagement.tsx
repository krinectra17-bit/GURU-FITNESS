import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Shield, Phone, MapPin, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { gymDB } from '../../lib/database';
import { GymSettings } from '../../types/database';

interface SettingsManagementProps {
  onUpdate: () => void;
}

export const SettingsManagement: React.FC<SettingsManagementProps> = ({ onUpdate }) => {
  const currentSettings = gymDB.getSettings();
  const [formData, setFormData] = useState<GymSettings>({ ...currentSettings });
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    gymDB.updateSettings(formData);
    setSuccess(true);
    onUpdate();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Facility Configuration
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            Gym Settings &amp; Public Details
          </h1>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-950 border border-emerald-500/50 p-4 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Gym settings updated successfully across website, receipts, and communication logs.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gym-card border border-gym-border rounded-xl p-6 sm:p-8 space-y-8 shadow-2xl">
        {/* Section 1: Business Identity */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide border-b border-gym-border/60 pb-2">
            1. Official Brand Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Gym Business Name
              </label>
              <input
                type="text"
                required
                value={formData.gym_name}
                onChange={(e) => setFormData({ ...formData, gym_name: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Brand Positioning Tagline
              </label>
              <input
                type="text"
                required
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Numbers & Social */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide border-b border-gym-border/60 pb-2">
            2. Contact Phone Numbers &amp; Instagram
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Primary Phone (Coach Rakesh) *
              </label>
              <input
                type="text"
                required
                value={formData.phone_primary}
                onChange={(e) => setFormData({ ...formData, phone_primary: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Secondary Contact Phone
              </label>
              <input
                type="text"
                required
                value={formData.phone_secondary}
                onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Instagram Handle
              </label>
              <input
                type="text"
                required
                value={formData.instagram_handle}
                onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Facility Location & Google Maps Link */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide border-b border-gym-border/60 pb-2">
            3. Address &amp; Google Maps (Editable by Owner)
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Full Facility Street Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Google Maps Direct Link / Query URL
              </label>
              <input
                type="text"
                required
                value={formData.google_maps_url}
                onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Operational Timings & Cutoff */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide border-b border-gym-border/60 pb-2">
            4. Opening Hours &amp; Attendance Policy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Weekday Hours (Mon-Sat)
              </label>
              <input
                type="text"
                required
                value={formData.opening_hours_weekdays}
                onChange={(e) => setFormData({ ...formData, opening_hours_weekdays: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Sunday Hours
              </label>
              <input
                type="text"
                required
                value={formData.opening_hours_sunday}
                onChange={(e) => setFormData({ ...formData, opening_hours_sunday: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Night Attendance Cutoff Time
              </label>
              <input
                type="text"
                required
                value={formData.attendance_cutoff_time}
                onChange={(e) => setFormData({ ...formData, attendance_cutoff_time: e.target.value })}
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Meta WhatsApp Cloud API Configuration */}
        <div className="space-y-4">
          <div className="border-b border-gym-border/60 pb-2 flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-wide flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <span>5. Meta WhatsApp Business API Credentials</span>
            </h3>
            <span className="text-[10px] text-gym-muted">Optional Automated Integration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                WhatsApp Phone Number ID
              </label>
              <input
                type="text"
                value={formData.whatsapp_phone_number_id || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp_phone_number_id: e.target.value })}
                placeholder="e.g. 109283746501928"
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                WhatsApp Business Account ID (WABA)
              </label>
              <input
                type="text"
                value={formData.whatsapp_business_account_id || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp_business_account_id: e.target.value })}
                placeholder="e.g. 892019283746152"
                className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="waConfigured"
              checked={formData.whatsapp_api_configured}
              onChange={(e) => setFormData({ ...formData, whatsapp_api_configured: e.target.checked })}
              className="w-4 h-4 rounded text-gym-red accent-gym-red"
            />
            <label htmlFor="waConfigured" className="text-xs text-gray-300 cursor-pointer">
              Enable Automated Meta WhatsApp Cloud API Delivery (Requires verified Business Account)
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-gym-border/70">
          <button
            type="submit"
            className="w-full py-3.5 rounded bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-sm uppercase tracking-wider transition shadow-lg shadow-gym-red/25 flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All Gym Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
