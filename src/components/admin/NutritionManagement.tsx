import React from 'react';
import { Utensils, AlertTriangle, Check, BookOpen } from 'lucide-react';

export const NutritionManagement: React.FC = () => {
  const nutritionGuidanceList = [
    { name: 'High-Protein Hypertrophy Guide', tag: 'Muscle Building', cal: '2200-2600 kcal', desc: 'Focus on 1.6-2.2g/kg protein, whey timing, eggs, paneer, and lentils.' },
    { name: 'Low-Carb Metabolic Fat Loss', tag: 'Caloric Deficit', cal: '1500-1800 kcal', desc: 'Reduced starch intake, high leafy cruciferous greens, healthy fats, and timed carbs.' },
    { name: 'Diabetic-Friendly Low-GI Protocol', tag: 'Blood Sugar Care', cal: 'Tailored', desc: 'Complex millets (jowar, bajra), balanced fiber, cinnamon, zero refined sugars.' },
    { name: 'Thyroid & Metabolic Harmony', tag: 'Endocrine Support', cal: 'Nutrient Dense', desc: 'Selenium, zinc, cooked cruciferous vegetables, and regular iodine-balanced meals.' },
    { name: 'PCOS / PCOD Hormonal Balance', tag: 'Women\'s Health', cal: 'Anti-Inflammatory', desc: 'Spearmint, flaxseeds, healthy fats, low glycemic index, and strength training sync.' },
    { name: 'Gluten-Free Digestive Comfort', tag: 'Allergen Safe', cal: 'Digestive', desc: 'Brown rice, quinoa, millets, certified gluten-free oats, and fresh produce.' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Client Dietary Frameworks
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            Nutrition Programs &amp; Protocols
          </h1>
        </div>
      </div>

      <div className="bg-amber-950/40 border border-amber-500/50 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Guidance policies reminder: All dietary suggestions provided by GURU FITNESS &amp; NUTRITIONS represent general fitness advice. Coaches must not claim to diagnose, treat, or cure clinical diseases. Members with acute or chronic pathologies must be referred to a medical doctor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nutritionGuidanceList.map((prog, idx) => (
          <div key={idx} className="bg-gym-card rounded-xl border border-gym-border p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-gym-surface text-gym-red px-2 py-0.5 rounded border border-gym-border">
                  {prog.tag}
                </span>
                <span className="text-xs text-gym-muted font-mono">{prog.cal}</span>
              </div>
              <h3 className="font-display font-bold text-xl text-white uppercase">
                {prog.name}
              </h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                {prog.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-gym-border/60 flex items-center justify-between text-xs">
              <span className="text-emerald-400 flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" /> Approved Template
              </span>
              <button 
                onClick={() => alert(`Printing/Viewing guidance document for: ${prog.name}`)}
                className="text-gym-red hover:underline font-semibold"
              >
                View Protocol Sheet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
