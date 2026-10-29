import React from 'react';
import { Hero } from '../components/public/Hero';
import { BrandStory } from '../components/public/BrandStory';
import { TrainingPrograms } from '../components/public/TrainingPrograms';
import { PricingSection } from '../components/public/PricingSection';
import { CoachesSection } from '../components/public/CoachesSection';
import { NutritionSection } from '../components/public/NutritionSection';
import { ResultsSection } from '../components/public/ResultsSection';
import { CTASection } from '../components/public/CTASection';
import { ContactSection } from '../components/public/ContactSection';

export const Home: React.FC = () => {
  return (
    <main>
      <Hero />
      <BrandStory />
      <TrainingPrograms />
      <PricingSection />
      <CoachesSection />
      <NutritionSection />
      <ResultsSection />
      <CTASection />
      <ContactSection />
    </main>
  );
};
