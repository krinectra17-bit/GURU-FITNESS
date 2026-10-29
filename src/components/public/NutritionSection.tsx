import React from 'react';
import { Apple, AlertTriangle, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NutritionOption {
  title: string;
  category: string;
  focus: string;
  practicalNotes: string;
}

const NUTRITION_OPTIONS: NutritionOption[] = [
  {
    title: 'High-Protein Meal Guidance',
    category: 'Hypertrophy & Satiety',
    focus: '1.6g – 2.2g per kg lean body mass',
    practicalNotes: 'Tailored protein sourcing incorporating eggs, paneer, tofu, lentils, whey, chicken/fish, and sprouts.'
  },
  {
    title: 'Low-Carb & Keto Options',
    category: 'Fat Loss & Insulin Sensitivity',
    focus: 'Controlled glycemic response',
    practicalNotes: 'Healthy fats, fibrous leafy vegetables, and minimal simple carbohydrates to stimulate sustained ketosis.'
  },
  {
    title: 'Gluten-Free Options',
    category: 'Digestive Comfort',
    focus: 'Zero wheat, rye, or barley',
    practicalNotes: 'Substitutes based on millets (bajra, jowar, ragi), brown rice, quinoa, and certified gluten-free oats.'
  },
  {
    title: 'Lactose-Free Options',
    category: 'Intolerance Management',
    focus: 'Zero dairy digestive distress',
    practicalNotes: 'Plant-based milk alternatives (almond, soy, oat), plant protein powders, and fermented curd alternatives.'
  },
  {
    title: 'Nut-Free Options',
    category: 'Allergen Safe Plans',
    focus: 'Allergy compliance without nutrient loss',
    practicalNotes: 'Seed-based essential fatty acids (flax, chia, sunflower, pumpkin) providing essential omegas.'
  },
  {
    title: 'Diabetic-Friendly Guidance',
    category: 'Blood Sugar Regulation',
    focus: 'Low Glycemic Index (GI) nutrition',
    practicalNotes: 'Complex carbohydrates, high-fiber greens, and balanced meal timing to avoid glycemic spikes.'
  },
  {
    title: 'Thyroid-Friendly Options',
    category: 'Metabolic & Hormonal Balance',
    focus: 'Micronutrient support (Zinc, Selenium, Iodine)',
    practicalNotes: 'Goitrogen management, cooked cruciferous vegetables, and metabolic-friendly thermogenic whole foods.'
  },
  {
    title: 'Heart-Healthy Options',
    category: 'Cardiovascular Support',
    focus: 'Low saturated fat & sodium moderation',
    practicalNotes: 'Soluble fiber, monounsaturated fats (olive, mustard oil in moderation), and antioxidant-rich produce.'
  },
  {
    title: 'PCOS / PCOD-Friendly Options',
    category: 'Women\'s Hormonal Wellness',
    focus: 'Anti-inflammatory and insulin-sensitizing',
    practicalNotes: 'Formulated in conjunction with Coach Chitra Bagra: anti-inflammatory herbs, inositol-rich foods, and stress-lowering diets.'
  },
  {
    title: 'Diet-Friendly Daily Meal Structure',
    category: 'General Wellness',
    focus: 'Habit-based consistency',
    practicalNotes: 'Pre-workout and post-workout nutritional timing suited for daily working hours in Jaipur.'
  }
];

export const NutritionSection: React.FC = () => {
  return (
    <section id="nutrition" className="py-24 bg-gym-card/60 border-y border-gym-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Context & Responsible Medical Notice */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
              <span className="w-6 h-[2px] bg-gym-red"></span>
              <span>Scientific Nutrition</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight uppercase">
              Fuel Your Progress. <br />
              <span className="text-gym-red">Sustain Your Results.</span>
            </h2>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
              70% of physical adaptation happens outside the gym floor. Our nutrition support is designed around practical Indian foods, everyday family cooking, and realistic dietary requirements.
            </p>

            {/* Crucial Responsible Medical Disclaimer Callout */}
            <div className="bg-gym-dark/95 border border-amber-500/40 rounded-lg p-5 space-y-3 shadow-lg">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Responsible Dietary Health Notice</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Nutrition support at GURU FITNESS &amp; NUTRITIONS is offered strictly as general fitness, sports conditioning, and lifestyle wellness guidance. We do not diagnose, treat, cure, or manage clinical medical conditions. Where chronic conditions (such as advanced diabetes, cardiovascular pathology, or clinical endocrine disorders) are present, consultation with an appropriately qualified physician or registered clinical dietitian is strongly recommended.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/register"
                className="inline-flex items-center space-x-2 bg-gym-red hover:bg-gym-red-hover text-white px-6 py-3 rounded font-display font-bold text-sm uppercase tracking-wider transition shadow-lg shadow-gym-red/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Customized Diet Guidance</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Refined Editorial List */}
          <div className="lg:col-span-7">
            <div className="bg-gym-dark rounded-xl border border-gym-border/80 divide-y divide-gym-border/70 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 bg-gym-surface/80 flex items-center justify-between">
                <span className="text-xs font-display font-bold uppercase tracking-wider text-white">
                  Available Nutrition Guidance Programs
                </span>
                <span className="text-[11px] text-gym-muted">10 Specialized Focus Areas</span>
              </div>

              {NUTRITION_OPTIONS.map((item, index) => (
                <div
                  key={index}
                  className="p-5 hover:bg-gym-surface/40 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <h3 className="font-display font-bold text-lg text-white group-hover:text-gym-red transition-colors flex items-center space-x-2">
                      <span className="text-gym-red text-xs font-mono">0{index + 1}.</span>
                      <span>{item.title}</span>
                    </h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-gym-surface text-gray-300 px-2 py-0.5 rounded border border-gym-border w-fit">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed pl-6">
                    {item.practicalNotes}
                  </p>

                  <div className="mt-2 pl-6 flex items-center space-x-2 text-[11px] text-emerald-400">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Focus: {item.focus}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
