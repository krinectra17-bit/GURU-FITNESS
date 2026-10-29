import React from 'react';
import { Target, Flame, HeartHandshake, Award } from 'lucide-react';

export const BrandStory: React.FC = () => {
  return (
    <section className="py-20 bg-gym-card/60 border-y border-gym-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Editorial Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
              <span className="w-6 h-[2px] bg-gym-red"></span>
              <span>Our Philosophy</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight leading-tight uppercase">
              Transforming Bodies, <br />
              <span className="text-gym-red">Transforming Lives.</span>
            </h2>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed font-normal">
              Training built around discipline, consistency, and sustainable progress. At GURU FITNESS &amp; NUTRITIONS, we do not believe in temporary shortcuts, unrealistic crash diets, or generic machine routines.
            </p>

            <p className="text-sm sm:text-base text-gym-muted leading-relaxed">
              Founded by NPC Mr. Rajasthan 2022 Winner Rakesh Bagra alongside certified yoga and women&apos;s fitness specialist Chitra Bagra, our facility combines competitive strength standards with scientific dietary guidance and holistic physical wellness. Over 10+ years in the industry and more than 1,000 successful client transformations stand behind our proven training methodology.
            </p>

            {/* Core Values 3-col */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded bg-gym-dark/80 border border-gym-border/80">
                <div className="w-8 h-8 rounded bg-gym-red/20 text-gym-red flex items-center justify-center mb-3">
                  <Flame className="w-4 h-4" />
                </div>
                <h4 className="font-display font-bold text-base text-white uppercase">Dedication</h4>
                <p className="text-xs text-gym-muted mt-1 leading-relaxed">
                  Every rep, every meal, and every recovery session executed with clear intent.
                </p>
              </div>

              <div className="p-4 rounded bg-gym-dark/80 border border-gym-border/80">
                <div className="w-8 h-8 rounded bg-gym-red/20 text-gym-red flex items-center justify-center mb-3">
                  <Target className="w-4 h-4" />
                </div>
                <h4 className="font-display font-bold text-base text-white uppercase">Discipline</h4>
                <p className="text-xs text-gym-muted mt-1 leading-relaxed">
                  Showing up and executing your prescribed programming even when motivation wanes.
                </p>
              </div>

              <div className="p-4 rounded bg-gym-dark/80 border border-gym-border/80">
                <div className="w-8 h-8 rounded bg-gym-red/20 text-gym-red flex items-center justify-center mb-3">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h4 className="font-display font-bold text-base text-white uppercase">Consistency</h4>
                <p className="text-xs text-gym-muted mt-1 leading-relaxed">
                  Sustainable physical progress built over months and years of structured lifestyle habits.
                </p>
              </div>
            </div>
          </div>

          {/* Right Image Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-lg overflow-hidden border border-gym-border/80 shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop"
                alt="Gym coaching floor and disciplined training at Guru Fitness"
                className="w-full h-[440px] object-cover object-center filter brightness-90 contrast-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gym-dark via-transparent to-transparent opacity-80" />

              {/* Float Card */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded bg-gym-card/95 border border-gym-red/30 backdrop-blur shadow-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded bg-gym-red flex items-center justify-center text-white flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-display font-bold text-sm text-white uppercase tracking-wide">
                      Our Brand Promise
                    </h5>
                    <p className="text-xs text-gray-300">
                      Expert Training • Scientific Nutrition • Real Results • Lifetime Support
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
