import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, ShieldCheck, Dumbbell, UserCheck } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center bg-gym-dark overflow-hidden pt-24 pb-16">
      {/* Cinematic Background Image with Editorial Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
          alt="Athlete training with discipline at Guru Fitness & Nutritions"
          className="w-full h-full object-cover object-center filter brightness-[0.32] contrast-125 scale-105 transform motion-safe:animate-pulse-slow"
          loading="eager"
        />
        {/* Subtle Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-gym-dark via-gym-dark/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-gym-dark/90 via-gym-dark/50 to-transparent" />
        <div className="absolute inset-0 bg-radial-vignette opacity-80" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-3xl space-y-6">
          {/* NPC Winner & Credentials Badge */}
          <div className="inline-flex items-center space-x-2 bg-gym-card/90 border border-gym-red/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white backdrop-blur shadow-lg shadow-black/50">
            <Trophy className="w-4 h-4 text-gym-red" />
            <span>FOUNDED BY NPC MR. RAJASTHAN 2022 WINNER</span>
            <span className="hidden sm:inline text-gym-muted">•</span>
            <span className="hidden sm:inline text-gray-300">10+ YEARS EXPERIENCE</span>
          </div>

          {/* Main Display Headline */}
          <div className="space-y-1">
            <h2 className="text-gym-red font-display font-bold text-lg sm:text-xl tracking-[0.2em] uppercase">
              GURU FITNESS &amp; NUTRITIONS
            </h2>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold text-white tracking-tight leading-[0.95] uppercase">
              Train with Purpose. <br />
              <span className="text-white">Transform with </span>
              <span className="text-gym-red underline decoration-gym-red/50 decoration-4 underline-offset-8">
                Discipline.
              </span>
            </h1>
          </div>

          {/* Core Values & Promise */}
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl font-normal leading-relaxed">
            Expert Training. Scientific Nutrition. Real Results. Lifetime Support. Founded by champion coach Rakesh Bagra &amp; yoga specialist Chitra Bagra.
          </p>

          {/* Key Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 pb-2">
            <div className="bg-gym-card/80 border border-gym-border/70 p-3 rounded backdrop-blur">
              <div className="font-display font-bold text-2xl sm:text-3xl text-white">10+ YEARS</div>
              <div className="text-[11px] text-gym-muted uppercase font-medium">Industry Experience</div>
            </div>
            <div className="bg-gym-card/80 border border-gym-border/70 p-3 rounded backdrop-blur">
              <div className="font-display font-bold text-2xl sm:text-3xl text-gym-red">1,000+</div>
              <div className="text-[11px] text-gym-muted uppercase font-medium">Clients Transformed</div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-gym-card/80 border border-gym-border/70 p-3 rounded backdrop-blur">
              <div className="font-display font-bold text-2xl sm:text-3xl text-white">100%</div>
              <div className="text-[11px] text-gym-muted uppercase font-medium">Certified Coaches</div>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Link
              to="/memberships"
              className="inline-flex items-center justify-center space-x-2 bg-gym-red hover:bg-gym-red-hover text-white px-7 py-3.5 rounded font-display font-bold text-base uppercase tracking-wider shadow-xl shadow-gym-red/25 transition-all hover:scale-[1.02]"
            >
              <span>Explore Memberships</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center justify-center space-x-2 bg-gym-card hover:bg-gym-surface text-white border border-gym-border hover:border-gray-500 px-7 py-3.5 rounded font-display font-bold text-base uppercase tracking-wider transition"
            >
              <Dumbbell className="w-4 h-4 text-gym-red" />
              <span>Join the Gym</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center justify-center text-xs text-gray-400 hover:text-white underline underline-offset-4 px-2 py-2 transition"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1 text-gym-muted" />
              Existing Member? Log in
            </Link>
          </div>

          {/* Clean trust note */}
          <div className="flex items-center space-x-2 text-xs text-gray-400 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Official Membership Schedule Effective 1 August 2026. Strength, Cardio, Fat Loss &amp; Personal Training.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
