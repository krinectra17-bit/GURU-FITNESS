import React from 'react';
import { Award, CheckCircle2, Instagram, Shield, Phone, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CoachesSection: React.FC = () => {
  return (
    <section id="coaches" className="py-24 bg-gym-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            <span className="w-6 h-[2px] bg-gym-red"></span>
            <span>Leadership &amp; Coaching</span>
            <span className="w-6 h-[2px] bg-gym-red"></span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight uppercase">
            Meet the Founders &amp; Head Coaches
          </h2>

          <p className="text-sm sm:text-base text-gym-muted">
            Direct mentorship from an NPC State Champion and Certified Yoga Trainer. Real industry credentials with over a decade of hands-on coaching.
          </p>
        </div>

        {/* Coaches Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Coach 1: Rakesh Bagra */}
          <div className="bg-gym-card rounded-xl border border-gym-border/80 overflow-hidden flex flex-col md:flex-row group hover:border-gym-red/50 transition-all duration-300">
            {/* Photographic portrait panel */}
            <div className="md:w-5/12 relative min-h-[360px] bg-gym-surface overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1567013127542-490d757e51fc?q=80&w=800&auto=format&fit=crop"
                alt="Head Coach Rakesh Bagra - NPC Mr. Rajasthan 2022 Winner"
                className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gym-card md:from-transparent md:bg-gradient-to-r md:from-transparent md:to-gym-card opacity-90" />

              {/* Champion Badge */}
              <div className="absolute top-4 left-4 bg-gym-red text-white text-[10px] font-display font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-lg flex items-center space-x-1">
                <Award className="w-3.5 h-3.5" />
                <span>NPC Mr. Rajasthan 2022</span>
              </div>
            </div>

            {/* Content panel */}
            <div className="p-6 md:p-8 md:w-7/12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-display font-bold text-gym-red uppercase tracking-widest block">
                    Founder &amp; Head Coach
                  </span>
                  <h3 className="font-display font-extrabold text-3xl text-white uppercase tracking-wide">
                    Rakesh Bagra
                  </h3>
                  <div className="text-xs text-gray-400 mt-1">
                    Certified Personal Trainer • Senior Category Winner
                  </div>
                </div>

                {/* Verified facts list */}
                <div className="space-y-2.5 text-xs text-gray-300">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-gym-red mt-0.5 flex-shrink-0" />
                    <span><strong>NPC Mr. Rajasthan 2022 Winner</strong> — Senior Category bodybuilding champion.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-gym-red mt-0.5 flex-shrink-0" />
                    <span><strong>10+ Years Industry Experience</strong> in progressive resistance &amp; physique conditioning.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-gym-red mt-0.5 flex-shrink-0" />
                    <span><strong>1,000+ Client Transformations</strong> across fat loss, muscle hypertrophy, and lifestyle restoration.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-gym-red mt-0.5 flex-shrink-0" />
                    <span>Specializes in 1-on-1 personal training, body transformations, and scientific nutrition coaching.</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-gym-border/70 flex flex-wrap items-center gap-3">
                <a
                  href="https://instagram.com/rakesh_bagra_fit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 bg-gym-surface hover:bg-gym-dark text-white px-3 py-2 rounded text-xs font-semibold border border-gym-border hover:border-gym-red transition"
                >
                  <Instagram className="w-3.5 h-3.5 text-gym-red" />
                  <span>@rakesh_bagra_fit</span>
                </a>

                <Link
                  to="/register?plan=plan-pt-1"
                  className="inline-flex items-center space-x-1.5 bg-gym-red hover:bg-gym-red-hover text-white px-4 py-2 rounded text-xs font-bold font-display uppercase tracking-wider transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Train with Rakesh</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Coach 2: Chitra Bagra */}
          <div className="bg-gym-card rounded-xl border border-gym-border/80 overflow-hidden flex flex-col md:flex-row group hover:border-gym-red/50 transition-all duration-300">
            {/* Photographic portrait panel */}
            <div className="md:w-5/12 relative min-h-[360px] bg-gym-surface overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop"
                alt="Coach Chitra Bagra - Certified Yoga Trainer & Women's Specialist"
                className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gym-card md:from-transparent md:bg-gradient-to-r md:from-transparent md:to-gym-card opacity-90" />

              {/* Specialist Badge */}
              <div className="absolute top-4 left-4 bg-emerald-600 text-white text-[10px] font-display font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-lg flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Certified Yoga Trainer</span>
              </div>
            </div>

            {/* Content panel */}
            <div className="p-6 md:p-8 md:w-7/12 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-display font-bold text-emerald-400 uppercase tracking-widest block">
                    Yoga &amp; Fitness Coach
                  </span>
                  <h3 className="font-display font-extrabold text-3xl text-white uppercase tracking-wide">
                    Chitra Bagra
                  </h3>
                  <div className="text-xs text-gray-400 mt-1">
                    Certified Yoga Specialist • Women&apos;s Fitness Expert
                  </div>
                </div>

                {/* Verified facts list */}
                <div className="space-y-2.5 text-xs text-gray-300">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Certified Yoga Trainer</strong> combining Classical Asanas, Vinyasa flows, and Pranayama breathwork.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Women&apos;s Fitness Specialist</strong> tailored for hormonal balance, PCOS/PCOD recovery, and postpartum conditioning.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Holistic Mobility &amp; Stress Relief</strong> to regulate nervous system function and core biomechanics.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Personalized guidance for beginners and advanced practitioners in a secure, disciplined environment.</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-gym-border/70 flex flex-wrap items-center gap-3">
                <a
                  href="tel:7014838282"
                  className="inline-flex items-center space-x-1.5 bg-gym-surface hover:bg-gym-dark text-white px-3 py-2 rounded text-xs font-semibold border border-gym-border hover:border-emerald-500 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call: 7014838282</span>
                </a>

                <Link
                  to="/register?plan=plan-cardio-1"
                  className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-xs font-bold font-display uppercase tracking-wider transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Join Yoga Sessions</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
