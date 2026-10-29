import React from 'react';
import { Award, Trophy, Users, ShieldCheck, Dumbbell } from 'lucide-react';

export const ResultsSection: React.FC = () => {
  return (
    <section className="py-24 bg-gym-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            <span className="w-6 h-[2px] bg-gym-red"></span>
            <span>Proven Track Record</span>
            <span className="w-6 h-[2px] bg-gym-red"></span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight uppercase">
            Experience, Accolades &amp; Real Proof
          </h2>

          <p className="text-sm sm:text-base text-gym-muted">
            We let authentic accomplishments speak. No fabricated reviews or stock transformation claims—strictly verified milestones from the official gym credentials.
          </p>
        </div>

        {/* 4-Stat Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="bg-gym-card p-8 rounded-xl border border-gym-border/80 hover:border-gym-red/50 transition-all flex flex-col justify-between space-y-4 group">
            <div className="w-12 h-12 rounded bg-gym-red/10 text-gym-red flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight">
                NPC 2022
              </div>
              <div className="font-display font-bold text-sm text-gym-red uppercase tracking-wider mt-1">
                Mr. Rajasthan Winner
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Senior Category championship victory by Founder &amp; Head Coach Rakesh Bagra.
              </p>
            </div>
            <div className="text-[10px] text-gym-muted border-t border-gym-border/60 pt-3">
              Official State Titleholder
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-gym-card p-8 rounded-xl border border-gym-border/80 hover:border-gym-red/50 transition-all flex flex-col justify-between space-y-4 group">
            <div className="w-12 h-12 rounded bg-gym-red/10 text-gym-red flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight">
                10+ YRS
              </div>
              <div className="font-display font-bold text-sm text-gym-red uppercase tracking-wider mt-1">
                Industry Experience
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Over a decade of coaching athletes, working professionals, and beginners.
              </p>
            </div>
            <div className="text-[10px] text-gym-muted border-t border-gym-border/60 pt-3">
              Continuous Coaching Practice
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-gym-card p-8 rounded-xl border border-gym-border/80 hover:border-gym-red/50 transition-all flex flex-col justify-between space-y-4 group">
            <div className="w-12 h-12 rounded bg-gym-red/10 text-gym-red flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight">
                1,000+
              </div>
              <div className="font-display font-bold text-sm text-gym-red uppercase tracking-wider mt-1">
                Clients Transformed
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Measurable physical transformations documented across strength, fat loss &amp; health.
              </p>
            </div>
            <div className="text-[10px] text-gym-muted border-t border-gym-border/60 pt-3">
              As Stated on Official Gym Poster
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-gym-card p-8 rounded-xl border border-gym-border/80 hover:border-gym-red/50 transition-all flex flex-col justify-between space-y-4 group">
            <div className="w-12 h-12 rounded bg-gym-red/10 text-gym-red flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight">
                100%
              </div>
              <div className="font-display font-bold text-sm text-gym-red uppercase tracking-wider mt-1">
                Certified Instruction
              </div>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Certified Personal Trainer &amp; Certified Yoga Trainer directing every floor session.
              </p>
            </div>
            <div className="text-[10px] text-gym-muted border-t border-gym-border/60 pt-3">
              No Unqualified Floor Trainees
            </div>
          </div>
        </div>

        {/* Editorial Quote Box */}
        <div className="mt-16 bg-gym-card/40 border border-gym-border/70 p-8 rounded-xl max-w-4xl mx-auto text-center space-y-4">
          <p className="font-display font-semibold text-xl sm:text-2xl text-gray-200 tracking-wide">
            &ldquo;Discipline is choosing between what you want now and what you want most. At Guru Fitness, our mission is to build lasting strength that serves your everyday life.&rdquo;
          </p>
          <div className="text-xs text-gym-red font-display uppercase tracking-widest font-bold">
            — Rakesh Bagra, Founder &amp; NPC Mr. Rajasthan 2022 Winner
          </div>
        </div>
      </div>
    </section>
  );
};
