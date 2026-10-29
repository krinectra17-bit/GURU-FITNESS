import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, ShieldCheck } from 'lucide-react';

export const CTASection: React.FC = () => {
  return (
    <section className="relative py-24 bg-gym-dark overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 z-0 opacity-15">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gym-red rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center space-x-2 bg-gym-surface/80 border border-gym-red/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gym-red uppercase tracking-wider backdrop-blur">
          <ShieldCheck className="w-4 h-4" />
          <span>Commit To Your Health Today</span>
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold text-white tracking-tight uppercase leading-[0.95]">
          Your Next Chapter <br />
          <span className="text-gym-red">Starts With Consistency.</span>
        </h2>

        <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Step inside a culture founded on dedication and authentic coaching. Choose your training regimen and experience genuine transformation.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to="/memberships"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gym-surface hover:bg-gym-card text-white border border-gym-border hover:border-gray-500 px-8 py-4 rounded font-display font-bold text-base uppercase tracking-wider transition"
          >
            <span>View Memberships</span>
          </Link>

          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gym-red hover:bg-gym-red-hover text-white px-8 py-4 rounded font-display font-bold text-base uppercase tracking-wider shadow-xl shadow-gym-red/30 transition-all hover:scale-[1.02]"
          >
            <Dumbbell className="w-5 h-5" />
            <span>Register as a Member</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="text-xs text-gym-muted pt-2">
          New registrations placed in Pending Activation until front-desk fee settlement.
        </div>
      </div>
    </section>
  );
};
