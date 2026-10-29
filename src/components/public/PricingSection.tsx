import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Users, ShieldAlert, Sparkles, ArrowRight, Calendar } from 'lucide-react';
import { gymDB } from '../../lib/database';
import { DurationType } from '../../types/database';

export const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const [selectedDuration, setSelectedDuration] = useState<DurationType>('yearly');
  const [isGroupDiscount, setIsGroupDiscount] = useState<boolean>(false);
  const [groupSize, setGroupSize] = useState<number>(3);

  const plans = gymDB.getPlans();
  const settings = gymDB.getSettings();

  const durationOptions: { id: DurationType; label: string; badge?: string }[] = [
    { id: 'monthly', label: '1 Month' },
    { id: 'quarterly', label: '3 Months (Quarterly)' },
    { id: 'half_yearly', label: '6 Months (Half-Yearly)' },
    { id: 'yearly', label: '12 Months (Yearly)', badge: 'Best Value' },
  ];

  const categories = [
    {
      id: 'strength',
      title: 'Strength Training',
      tagline: 'Pure Strength & Hypertrophy',
      highlight: false,
      features: [
        'Full access to heavy barbell & dumbbell zone',
        'Plate-loaded machines & power racks',
        'Compound movement form instruction',
        'Daily locker & changing room access',
        'General posture & mobility routines'
      ]
    },
    {
      id: 'cardio_fatloss_yoga',
      title: 'Cardio / Fat Loss / Yoga',
      tagline: 'High Calorie Burn & Recovery',
      highlight: true,
      features: [
        'Aerobic cardiovascular conditioning zone',
        'High-Intensity Interval Training (HIIT) circuits',
        'Yoga & Pranayama sessions with Coach Chitra',
        'Metabolic fat loss exercise programming',
        'Core strengthening & functional mobility'
      ]
    },
    {
      id: 'personal_training',
      title: 'Personal Training',
      tagline: '1-on-1 Elite Private Coaching',
      highlight: false,
      features: [
        'Direct 1-on-1 supervision by Head Coach Rakesh / Chitra',
        'NPC Champion competition & physique methodology',
        'Weekly body fat caliper & progress analysis',
        'Personalized daily nutrition & meal adjustments',
        'Biomechanical correction & priority slot scheduling'
      ]
    }
  ];

  const handleSelectPlan = (planId: string) => {
    const params = new URLSearchParams({
      plan: planId,
      duration: selectedDuration,
      group: isGroupDiscount ? 'true' : 'false',
      groupSize: isGroupDiscount ? String(groupSize) : '1'
    });
    navigate(`/register?${params.toString()}`);
  };

  return (
    <section id="memberships" className="py-24 bg-gym-card/50 border-y border-gym-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            <span className="w-6 h-[2px] bg-gym-red"></span>
            <span>Transparent Pricing</span>
            <span className="w-6 h-[2px] bg-gym-red"></span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight uppercase">
            Official Membership Plans
          </h2>

          <p className="text-sm sm:text-base text-gym-muted">
            Transparent pricing directly from the official gym poster. No hidden registration fees or lock-in traps.
          </p>

          {/* Poster notice banner */}
          <div className="inline-flex items-center space-x-2 bg-gym-surface/80 border border-gym-border px-3.5 py-1.5 rounded-full text-xs text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-gym-red" />
            <span>{settings.effective_date_notice}</span>
          </div>
        </div>

        {/* Duration Switcher Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1.5 rounded-lg bg-gym-dark border border-gym-border/80 flex-wrap justify-center gap-1">
            {durationOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedDuration(opt.id)}
                className={`relative px-4 sm:px-6 py-2.5 rounded-md text-xs sm:text-sm font-semibold tracking-wide transition-all ${
                  selectedDuration === opt.id
                    ? 'bg-gym-red text-white shadow-lg shadow-gym-red/25'
                    : 'text-gym-muted hover:text-white'
                }`}
              >
                {opt.label}
                {opt.badge && (
                  <span className="absolute -top-2.5 right-1 bg-amber-400 text-black text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Group Discount Interactive Widget */}
        <div className="max-w-xl mx-auto mb-14 bg-gym-dark/80 border border-gym-border rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-left">
            <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${
              isGroupDiscount ? 'bg-gym-red text-white' : 'bg-gym-surface text-gym-muted'
            }`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-display font-bold text-white uppercase flex items-center space-x-2">
                <span>Group Discount Policy</span>
                <span className="bg-gym-red/20 text-gym-red text-[10px] font-bold px-1.5 py-0.5 rounded border border-gym-red/30">
                  15% OFF
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Minimum 3 members joining together. Stated on official poster.
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            {isGroupDiscount && (
              <div className="flex items-center space-x-1.5 bg-gym-surface px-2.5 py-1 rounded border border-gym-border text-xs text-white">
                <span className="text-gym-muted">People:</span>
                <select
                  value={groupSize}
                  onChange={(e) => setGroupSize(Number(e.target.value))}
                  className="bg-transparent font-bold text-white focus:outline-none"
                >
                  <option value={3} className="bg-gym-dark">3</option>
                  <option value={4} className="bg-gym-dark">4</option>
                  <option value={5} className="bg-gym-dark">5</option>
                  <option value={6} className="bg-gym-dark">6+</option>
                </select>
              </div>
            )}

            <button
              onClick={() => setIsGroupDiscount(!isGroupDiscount)}
              className={`px-3.5 py-1.5 rounded text-xs font-bold uppercase transition ${
                isGroupDiscount
                  ? 'bg-gym-red text-white'
                  : 'bg-gym-surface hover:bg-gym-card text-gray-300 border border-gym-border'
              }`}
            >
              {isGroupDiscount ? 'Applied (15% Off)' : 'Apply Group (3+)'}
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {categories.map((cat) => {
            const plan = plans.find(
              (p) => p.category === cat.id && p.duration_type === selectedDuration
            );
            if (!plan) return null;

            const basePrice = plan.base_price;
            const discount = isGroupDiscount ? Math.round(basePrice * 0.15) : 0;
            const finalPrice = basePrice - discount;

            return (
              <div
                key={cat.id}
                className={`relative rounded-xl bg-gym-dark p-8 flex flex-col justify-between transition-all duration-300 border ${
                  cat.highlight
                    ? 'border-gym-red shadow-2xl shadow-gym-red/10 ring-1 ring-gym-red'
                    : 'border-gym-border hover:border-gray-600'
                }`}
              >
                {cat.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gym-red text-white text-[11px] font-bold font-display uppercase tracking-widest px-3.5 py-0.5 rounded-full shadow">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="border-b border-gym-border/70 pb-6 mb-6">
                    <h3 className="font-display font-extrabold text-2xl text-white uppercase tracking-wide">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {cat.tagline}
                    </p>

                    {/* Price Display */}
                    <div className="mt-5 flex items-baseline space-x-2">
                      <span className="text-sm font-semibold text-gym-muted">₹</span>
                      <span className="font-display font-extrabold text-4xl sm:text-5xl text-white tracking-tight">
                        {finalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-gym-muted">
                        / {selectedDuration === 'monthly' ? 'month' : selectedDuration === 'quarterly' ? '3 months' : selectedDuration === 'half_yearly' ? '6 months' : 'year'}
                      </span>
                    </div>

                    {isGroupDiscount && (
                      <div className="mt-2 flex items-center space-x-2 text-xs">
                        <span className="line-through text-gray-500">₹{basePrice.toLocaleString('en-IN')}</span>
                        <span className="text-emerald-400 font-medium">Saved ₹{discount.toLocaleString('en-IN')} (15% Group Discount)</span>
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-3.5 text-xs text-gray-300 mb-8">
                    {cat.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5">
                        <Check className="w-4 h-4 text-gym-red mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Action */}
                <div>
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3.5 rounded font-display font-bold text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center space-x-2 ${
                      cat.highlight
                        ? 'bg-gym-red hover:bg-gym-red-hover text-white shadow-xl shadow-gym-red/25 hover:translate-y-[-1px]'
                        : 'bg-gym-surface hover:bg-gym-red text-white border border-gym-border hover:border-gym-red'
                    }`}
                  >
                    <span>Choose Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-center text-gym-muted mt-2">
                    Direct registration • Activation confirmed upon fee receipt
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Business Rule Transparency Footnote */}
        <div className="mt-12 bg-gym-dark/60 border border-gym-border/80 rounded-lg p-4 flex items-start space-x-3 text-xs text-gray-400 max-w-3xl mx-auto">
          <ShieldAlert className="w-5 h-5 text-gym-red flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-white">Important Business Rules &amp; Transparency:</span>
            <p>
              Prices shown correspond to the official schedule effective from 1 August 2026. Selecting a plan opens the member registration process; memberships are officially activated by the front desk only upon verified payment confirmation. Current rates are not guaranteed permanently and may be revised for future purchases by gym management.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
