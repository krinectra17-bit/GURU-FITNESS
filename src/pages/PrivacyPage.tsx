import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
          <Lock className="w-4 h-4" />
          <span>Data Protection</span>
        </div>
        <h1 className="text-4xl font-display font-extrabold text-white uppercase tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-gym-muted">
          Your personal records, check-in history, and payment transactions are strictly protected.
        </p>

        <div className="bg-gym-card p-8 rounded-xl border border-gym-border/80 space-y-6 text-sm text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              1. Information We Collect
            </h3>
            <p>
              We collect your full name, email address, phone number, optional date of birth, emergency contact, selected membership plan, and attendance check-in timestamps.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              2. How Your Data Is Used
            </h3>
            <p>
              Your information is used solely for managing gym facility access, attendance auditing, recording authorized fee receipts, and sending automated or manual WhatsApp renewal reminders.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              3. Data Security &amp; Row Level Security
            </h3>
            <p>
              All member records in our database are isolated using PostgreSQL Row Level Security (RLS). Members cannot view other members&apos; personal data or financial history.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              4. WhatsApp Communications &amp; Consent
            </h3>
            <p>
              By registering, you agree to receive essential membership notifications, such as expiry reminders (3 days, 1 day, and on expiry day) and payment receipts via WhatsApp. You can opt out at the front desk at any time.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
