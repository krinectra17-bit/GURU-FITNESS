import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Instagram, MapPin, Clock, Award, ShieldCheck } from 'lucide-react';
import { gymDB } from '../../lib/database';

export const Footer: React.FC = () => {
  const settings = gymDB.getSettings();

  return (
    <footer className="bg-[#07090D] border-t border-gym-border/80 text-gym-muted pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-gym-border/60">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-gym-red flex items-center justify-center font-display font-bold text-2xl text-white">
                G
              </div>
              <div>
                <span className="font-display font-bold text-xl text-white tracking-wider block leading-none">
                  GURU FITNESS
                </span>
                <span className="text-[9px] tracking-[0.2em] text-gym-muted uppercase font-medium block">
                  &amp; NUTRITIONS
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Transforming Bodies, Transforming Lives. Training built around dedication, discipline, and sustainable progress.
            </p>

            <div className="flex items-center space-x-2 text-xs text-amber-400/90 pt-1">
              <Award className="w-4 h-4 flex-shrink-0" />
              <span>Founded by NPC Mr. Rajasthan 2022 Winner Rakesh Bagra</span>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href={`https://instagram.com/${settings.instagram_handle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded bg-gym-surface border border-gym-border hover:border-gym-red hover:text-white flex items-center justify-center transition"
                aria-label="Instagram profile"
              >
                <Instagram className="w-4 h-4 text-gym-red" />
              </a>
              <a
                href={`tel:${settings.phone_primary}`}
                className="w-8 h-8 rounded bg-gym-surface border border-gym-border hover:border-gym-red hover:text-white flex items-center justify-center transition"
                aria-label="Primary phone contact"
              >
                <Phone className="w-4 h-4 text-gym-red" />
              </a>
            </div>
          </div>

          {/* Training & Services */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-white">
              Training Programs
            </h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/training" className="hover:text-white transition">Strength Training</Link></li>
              <li><Link to="/training" className="hover:text-white transition">Cardio &amp; Fat Loss Conditioning</Link></li>
              <li><Link to="/training" className="hover:text-white transition">Weight Gain &amp; Hypertrophy</Link></li>
              <li><Link to="/training" className="hover:text-white transition">1-on-1 Personal Training</Link></li>
              <li><Link to="/training" className="hover:text-white transition">Yoga &amp; Restorative Meditation</Link></li>
              <li><Link to="/training" className="hover:text-white transition">Zumba &amp; High-Energy Dance</Link></li>
              <li><Link to="/nutrition" className="hover:text-white transition">Scientific Nutrition Guidance</Link></li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-white">
              Contact &amp; Schedule
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-gym-red mt-0.5 flex-shrink-0" />
                <div>
                  <a href={`tel:${settings.phone_primary}`} className="text-white hover:text-gym-red transition block">
                    +91 {settings.phone_primary} (Primary)
                  </a>
                  <a href={`tel:${settings.phone_secondary}`} className="text-gray-300 hover:text-gym-red transition block">
                    +91 {settings.phone_secondary} (Alternate)
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-gym-red mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-300 block">Mon – Sat: {settings.opening_hours_weekdays}</span>
                  <span className="text-gray-300 block">Sunday: {settings.opening_hours_sunday}</span>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gym-red mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">
                  {settings.address}
                </span>
              </li>
            </ul>
          </div>

          {/* Quick Access & Notice */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-white">
              Member Access &amp; Policies
            </h4>
            <div className="bg-gym-card/80 p-3 rounded border border-gym-border/80 text-[11px] leading-relaxed text-gray-400 space-y-2">
              <div className="flex items-center text-white font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-gym-red mr-1.5" />
                <span>Notice on Pricing Schedule</span>
              </div>
              <p>
                {settings.effective_date_notice}. Current rates are subject to updates per gym management policy.
              </p>
            </div>
            <div className="pt-2 flex flex-col space-y-1.5 text-xs">
              <Link to="/login" className="text-gray-300 hover:text-white transition">Member Portal Login</Link>
              <Link to="/register" className="text-gym-red hover:underline transition font-medium">New Member Registration</Link>
              <Link to="/terms" className="hover:text-white transition">Terms &amp; Gym Rules</Link>
              <Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>
            &copy; {new Date().getFullYear()} GURU FITNESS &amp; NUTRITIONS. All rights reserved.
          </p>
          <div className="text-[11px] text-gray-500 max-w-xl text-center md:text-right">
            Disclaimer: Nutrition and diet guidance is provided for general health, lifestyle, and fitness support. For medical conditions or chronic diseases, consultation with an appropriately qualified physician is required.
          </div>
        </div>
      </div>
    </footer>
  );
};
