import React, { useState } from 'react';
import { Dumbbell, Activity, Flame, TrendingUp, UserCheck, Sparkles, Music, Heart, Utensils, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Program {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  image: string;
  tags: string[];
  focus: string;
}

export const PROGRAMS: Program[] = [
  {
    id: 'strength',
    title: 'Strength Training',
    subtitle: 'Compound Lifting & Progressive Resistance',
    description: 'Systematic barbell and dumbbell training focusing on the squat, bench press, deadlift, and overhead press. Structured progressive overload to build functional raw strength and muscular endurance.',
    icon: Dumbbell,
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
    tags: ['Barbell Fundamentals', 'Hypertrophy', 'Core Stability'],
    focus: 'Raw power, joint resilience, and neuromuscular adaptation.'
  },
  {
    id: 'cardio',
    title: 'Cardio Training',
    subtitle: 'Aerobic & High-Intensity Conditioning',
    description: 'Targeted cardiovascular workouts combining treadmill intervals, rowing conditioning, assault bikes, and steady-state Zone 2 heart rate training to expand lung capacity and cardiovascular health.',
    icon: Activity,
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0447638f?q=80&w=1000&auto=format&fit=crop',
    tags: ['HIIT Circuits', 'Zone 2 Cardio', 'Stamina'],
    focus: 'Heart conditioning, high calorie burn, and athletic endurance.'
  },
  {
    id: 'fat-loss',
    title: 'Fat Loss Program',
    subtitle: 'Caloric Deficit & Metabolic Acceleration',
    description: 'Targeted fat reduction program integrating high-density circuit training with calibrated nutritional deficit guidance to maximize subcutaneous and visceral fat reduction while protecting lean muscle tissue.',
    icon: Flame,
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1000&auto=format&fit=crop',
    tags: ['Metabolic Conditioning', 'Body Recomposition', 'Lean Muscle Retention'],
    focus: 'Rapid body fat reduction with steady metabolic preservation.'
  },
  {
    id: 'weight-gain',
    title: 'Weight Gain Program',
    subtitle: 'Hypertrophic Volume & Caloric Surplus',
    description: 'Designed for ectomorphs and hardgainers seeking to build quality lean mass. High-volume muscular tension programming paired with nutrient-dense dietary guidance and digestive optimization.',
    icon: TrendingUp,
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop',
    tags: ['Clean Bulking', 'Hypertrophy Sets', 'Anabolic Nutrition'],
    focus: 'Solid muscle gain without unwanted fat accumulation.'
  },
  {
    id: 'personal-training',
    title: 'Personal Training',
    subtitle: '1-on-1 Dedicated Elite Mentorship',
    description: 'Direct private coaching with Head Coach Rakesh Bagra (NPC Mr. Rajasthan 2022) or Coach Chitra Bagra. Biomechanical form scrutiny, personalized periodization, and daily accountability.',
    icon: UserCheck,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop',
    tags: ['1-on-1 Supervision', 'Custom Periodization', 'Form Biomechanics'],
    focus: 'Accelerated results with zero guesswork and complete safety.'
  },
  {
    id: 'body-transformation',
    title: 'Body Transformation',
    subtitle: 'Complete 90-180 Day Overhaul',
    description: 'Comprehensive physical reconstruction uniting intense training, body measurement tracking, progressive photos, and micro-calibrated nutrition. Tested on over 1,000 transformed clients.',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1000&auto=format&fit=crop',
    tags: ['Total Overhaul', 'Milestone Tracking', 'Lifestyle Habits'],
    focus: 'Drastic, measurable physique and posture transformation.'
  },
  {
    id: 'zumba-dance',
    title: 'Zumba and Dance Classes',
    subtitle: 'High-Energy Rhythmic Cardio',
    description: 'Dynamic group fitness sessions combining energetic Latin and contemporary dance rhythms with interval cardio routines. Led by certified instructors in a supportive, vibrant environment.',
    icon: Music,
    image: 'https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?q=80&w=1000&auto=format&fit=crop',
    tags: ['Group Energy', 'Endorphin Release', 'Rhythmic Cardio'],
    focus: 'Calorie burning through rhythm, coordination, and community fun.'
  },
  {
    id: 'yoga-meditation',
    title: 'Yoga and Meditation',
    subtitle: 'Mind-Body Balance & Mobility',
    description: 'Led by certified Yoga Trainer Chitra Bagra. Combines classical Hatha, Vinyasa flows, pranayama breath control, and mindfulness meditation to release joint tension, reduce cortisol, and enhance mobility.',
    icon: Heart,
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1000&auto=format&fit=crop',
    tags: ['Joint Mobility', 'Pranayama', 'Stress Reduction'],
    focus: 'Central nervous system recovery, flexibility, and mental calm.'
  },
  {
    id: 'diet-guidance',
    title: 'Diet Guidance',
    subtitle: 'Macronutrient Precision & Meal Plans',
    description: 'Practical, habit-based meal planning built around Indian domestic cuisines and member lifestyle constraints. Covers diabetic, thyroid, gluten-free, lactose-free, and high-protein requirements.',
    icon: Utensils,
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000&auto=format&fit=crop',
    tags: ['Macro Tracking', 'Indian Meal Adaptation', 'Sustainable Diet'],
    focus: 'Nutritional fuel that supports heavy training without starvation.'
  },
  {
    id: 'supplement-guidance',
    title: 'Supplement Guidance',
    subtitle: 'Evidence-Based Ergogenic Support',
    description: 'Unbiased scientific recommendations on protein powders, creatine monohydrate, multivitamins, omega-3 fatty acids, and electrolytes. We cut through marketing hype to advise what actually works.',
    icon: Pill,
    image: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?q=80&w=1000&auto=format&fit=crop',
    tags: ['Evidence-Based', 'Whey & Creatine', 'Electrolytes'],
    focus: 'Safe, genuine supplementation tailored strictly to training demands.'
  }
];

export const TrainingPrograms: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'strength' | 'cardio' | 'wellness'>('all');

  const filteredPrograms = PROGRAMS.filter(p => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'strength') return ['strength', 'weight-gain', 'personal-training', 'body-transformation'].includes(p.id);
    if (selectedCategory === 'cardio') return ['cardio', 'fat-loss', 'zumba-dance'].includes(p.id);
    if (selectedCategory === 'wellness') return ['yoga-meditation', 'diet-guidance', 'supplement-guidance'].includes(p.id);
    return true;
  });

  return (
    <section id="training" className="py-24 bg-gym-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-gym-border/60 gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
              <span className="w-6 h-[2px] bg-gym-red"></span>
              <span>Our Programs</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight uppercase">
              Engineered For Results. <br />
              <span className="text-gray-400">Tailored For You.</span>
            </h2>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Programs' },
              { id: 'strength', label: 'Strength & Muscle' },
              { id: 'cardio', label: 'Cardio & Fat Loss' },
              { id: 'wellness', label: 'Yoga & Nutrition' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition ${
                  selectedCategory === cat.id
                    ? 'bg-gym-red text-white shadow-md shadow-gym-red/20'
                    : 'bg-gym-card text-gym-muted hover:text-white border border-gym-border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((prog) => {
            const Icon = prog.icon;
            return (
              <div
                key={prog.id}
                className="group bg-gym-card rounded-lg overflow-hidden border border-gym-border/80 hover:border-gym-red/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Real Photography Header */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={prog.image}
                      alt={prog.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gym-card via-gym-card/40 to-transparent" />
                    
                    <div className="absolute top-3 left-3 bg-gym-dark/90 border border-gym-border px-2.5 py-1 rounded text-xs font-display font-bold text-white flex items-center space-x-1.5 backdrop-blur">
                      <Icon className="w-3.5 h-3.5 text-gym-red" />
                      <span>{prog.subtitle}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-3">
                    <h3 className="font-display font-bold text-2xl text-white tracking-wide group-hover:text-gym-red transition-colors">
                      {prog.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                      {prog.description}
                    </p>

                    <div className="pt-2">
                      <div className="text-[11px] font-semibold text-gym-muted uppercase tracking-wider mb-2">
                        Key Focus:
                      </div>
                      <div className="text-xs text-gray-300 italic">
                        &quot;{prog.focus}&quot;
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Tags & Link */}
                <div className="p-6 pt-0 space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {prog.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium bg-gym-dark text-gray-300 px-2 py-0.5 rounded border border-gym-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={`/register?plan=${prog.id === 'personal-training' ? 'plan-pt-1' : prog.id === 'cardio' || prog.id === 'fat-loss' || prog.id === 'yoga-meditation' ? 'plan-cardio-1' : 'plan-str-1'}`}
                    className="w-full block text-center py-2.5 rounded bg-gym-surface hover:bg-gym-red text-white text-xs font-bold uppercase tracking-wider transition duration-200 border border-gym-border hover:border-gym-red"
                  >
                    Select Plan For This Goal
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
