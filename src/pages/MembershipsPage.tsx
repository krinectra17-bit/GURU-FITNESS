import React from 'react';
import { PricingSection } from '../components/public/PricingSection';
import { CTASection } from '../components/public/CTASection';

export const MembershipsPage: React.FC = () => {
  return (
    <div className="pt-20">
      <div className="bg-gym-card/80 py-16 border-b border-gym-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Official Pricing
          </span>
          <h1 className="text-4xl sm:text-6xl font-display font-extrabold text-white tracking-tight uppercase">
            Gym Memberships &amp; Group Discounts
          </h1>
          <p className="text-base text-gray-400 max-w-2xl mx-auto">
            Choose your membership category. Enjoy 15% group discounts when joining with 3 or more people.
          </p>
        </div>
      </div>
      <PricingSection />
      <CTASection />
    </div>
  );
};
