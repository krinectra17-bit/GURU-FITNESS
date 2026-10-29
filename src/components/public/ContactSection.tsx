import React, { useState } from 'react';
import { Phone, Instagram, MapPin, Clock, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { gymDB } from '../../lib/database';

export const ContactSection: React.FC = () => {
  const settings = gymDB.getSettings();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    programInterest: 'strength',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-24 bg-gym-card/60 border-t border-gym-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Official Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
                <span className="w-6 h-[2px] bg-gym-red"></span>
                <span>Get In Touch</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight uppercase">
                Visit the Gym or Call Our Coaches
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed">
                Have questions regarding training schedules, personal mentorship with Coach Rakesh, or women&apos;s yoga batches with Coach Chitra? Reach out directly.
              </p>
            </div>

            {/* Official Contact Cards */}
            <div className="space-y-4">
              {/* Phone Card */}
              <div className="bg-gym-dark p-5 rounded-lg border border-gym-border/80 flex items-start space-x-4">
                <div className="w-10 h-10 rounded bg-gym-red/10 text-gym-red flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Direct Phone Numbers
                  </h4>
                  <div className="mt-1 space-y-0.5 text-sm">
                    <div>
                      <a href={`tel:${settings.phone_primary}`} className="text-white hover:text-gym-red font-semibold transition">
                        +91 {settings.phone_primary}
                      </a>
                      <span className="text-xs text-gym-muted ml-2">(Primary / Coach Rakesh)</span>
                    </div>
                    <div>
                      <a href={`tel:${settings.phone_secondary}`} className="text-white hover:text-gym-red font-semibold transition">
                        +91 {settings.phone_secondary}
                      </a>
                      <span className="text-xs text-gym-muted ml-2">(Alternate / Front Desk)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instagram Card */}
              <div className="bg-gym-dark p-5 rounded-lg border border-gym-border/80 flex items-start space-x-4">
                <div className="w-10 h-10 rounded bg-gym-red/10 text-gym-red flex items-center justify-center flex-shrink-0">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Official Instagram
                  </h4>
                  <a
                    href={`https://instagram.com/${settings.instagram_handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white hover:text-gym-red font-semibold transition mt-0.5 block"
                  >
                    @{settings.instagram_handle.replace('@', '')}
                  </a>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Daily training clips, form tutorials, and athlete updates.
                  </p>
                </div>
              </div>

              {/* Address & Hours */}
              <div className="bg-gym-dark p-5 rounded-lg border border-gym-border/80 flex items-start space-x-4">
                <div className="w-10 h-10 rounded bg-gym-red/10 text-gym-red flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Operating Schedule
                  </h4>
                  <p className="text-xs text-gray-300 mt-1">
                    Monday to Saturday: <strong className="text-white">{settings.opening_hours_weekdays}</strong>
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Sunday: <strong className="text-white">{settings.opening_hours_sunday}</strong>
                  </p>
                </div>
              </div>

              {/* Facility Address */}
              <div className="bg-gym-dark p-5 rounded-lg border border-gym-border/80 flex items-start space-x-4">
                <div className="w-10 h-10 rounded bg-gym-red/10 text-gym-red flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Facility Location
                  </h4>
                  <p className="text-xs text-gray-300 mt-1">
                    {settings.address}
                  </p>
                  <div className="mt-2">
                    <a
                      href={settings.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs text-gym-red hover:underline font-semibold"
                    >
                      <span>Open in Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Quick Inquiry & Location Map Preview */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-gym-dark rounded-xl border border-gym-border p-8 shadow-2xl">
              <h3 className="font-display font-bold text-2xl text-white uppercase tracking-wide mb-2 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-gym-red" />
                <span>Quick Inquiry Form</span>
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Send a quick question to the front desk. We respond promptly via phone or WhatsApp.
              </p>

              {submitted ? (
                <div className="bg-emerald-950/40 border border-emerald-500/50 p-6 rounded-lg text-center space-y-3 animate-in fade-in">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="font-display font-bold text-xl text-white uppercase">Inquiry Received</h4>
                  <p className="text-xs text-gray-300 max-w-md mx-auto">
                    Thank you, {formData.name}. Our front desk coach will contact you at <strong>{formData.phone}</strong> shortly. You may also call us directly at 9828482505.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', phone: '', programInterest: 'strength', message: '' });
                    }}
                    className="text-xs text-emerald-400 underline underline-offset-4 pt-2"
                  >
                    Send another inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Vikram Singh"
                        className="w-full bg-gym-surface border border-gym-border rounded px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gym-red transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full bg-gym-surface border border-gym-border rounded px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gym-red transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Program of Interest
                    </label>
                    <select
                      value={formData.programInterest}
                      onChange={(e) => setFormData({ ...formData, programInterest: e.target.value })}
                      className="w-full bg-gym-surface border border-gym-border rounded px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gym-red transition"
                    >
                      <option value="strength">Strength Training (₹800/mo)</option>
                      <option value="cardio_fatloss_yoga">Cardio / Fat Loss / Yoga (₹1,200/mo)</option>
                      <option value="personal_training">1-on-1 Personal Training (₹4,000/mo)</option>
                      <option value="group_joining">Group Joining (3+ people, 15% discount)</option>
                      <option value="diet_guidance">Scientific Nutrition &amp; Diet Support</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Your Question or Message
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Ask about batch timings, equipment, personal training slots, etc."
                      className="w-full bg-gym-surface border border-gym-border rounded px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gym-red transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-sm uppercase tracking-wider shadow-lg shadow-gym-red/20 transition flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Inquiry</span>
                  </button>
                </form>
              )}
            </div>

            {/* Configurable Map Container */}
            <div className="bg-gym-dark rounded-xl border border-gym-border overflow-hidden">
              <div className="px-5 py-3 bg-gym-surface flex items-center justify-between text-xs border-b border-gym-border">
                <span className="font-semibold text-white flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-gym-red mr-1.5" />
                  Gym Location &amp; Directions
                </span>
                <span className="text-gym-muted">Jaipur, Rajasthan</span>
              </div>
              <div className="p-6 text-center space-y-3 bg-gradient-to-b from-gym-surface/30 to-gym-dark">
                <div className="text-xs text-gray-300">
                  Address details are configurable by the gym owner in the admin panel.
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {settings.address}
                </div>
                <a
                  href={settings.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gym-card hover:bg-gym-surface border border-gym-border px-4 py-2 rounded text-xs text-white transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-gym-red" />
                  <span>Navigate with Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
