import React from 'react';
import { TrainingPrograms } from '../components/public/TrainingPrograms';
import { CTASection } from '../components/public/CTASection';

export const TrainingPage: React.FC = () => {
  return (
    <div className="pt-20">
      <div className="bg-gym-card/80 py-16 border-b border-gym-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Training Methodologies
          </span>
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight uppercase">
            Comprehensive Gym Programs
          </h1>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">
            From foundational powerlifting and bodybuilding to high-calorie metabolic cardio, restorative yoga, and 1-on-1 personal mentorship.
          </p>
        </div>
      </div>
      <TrainingPrograms />
      <CTASection />
    </div>
  );
};
