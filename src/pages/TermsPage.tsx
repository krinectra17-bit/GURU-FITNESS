import React from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="inline-flex items-center space-x-2 text-gym-red font-display text-xs font-bold tracking-widest uppercase">
          <ShieldCheck className="w-4 h-4" />
          <span>Gym Rules &amp; Policies</span>
        </div>
        <h1 className="text-4xl font-display font-extrabold text-white uppercase tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-gym-muted">
          Last Updated: 27 October 2026. Effective for all registered members at GURU FITNESS &amp; NUTRITIONS.
        </p>

        <div className="bg-gym-card p-8 rounded-xl border border-gym-border/80 space-y-6 text-sm text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              1. Membership Activation &amp; Payments
            </h3>
            <p>
              Online registration creates an account with status <strong>Pending Activation</strong>. Membership access is activated solely after authorized payment confirmation by the gym management. Payments are non-refundable once activated.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              2. Group Discount Policy
            </h3>
            <p>
              The 15% group discount applies exclusively when a minimum of 3 members register and complete payment together. Stacking of multiple promotional discounts is not permitted unless authorized by the gym owner.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              3. Pricing Schedule &amp; Rate Validity
            </h3>
            <p>
              The displayed pricing schedule is effective from 1 August 2026. Historical membership purchases retain their contracted rate for their purchased duration. The gym reserves the right to adjust future renewal rates.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              4. Code of Conduct &amp; Safety
            </h3>
            <p>
              All members must re-rack weights after usage, wear clean athletic footwear on the training floor, and follow instructions from Head Coach Rakesh Bagra and Coach Chitra Bagra.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
              5. Nutrition &amp; Health Disclaimer
            </h3>
            <p>
              All diet, meal, and supplement suggestions represent general athletic lifestyle guidance. Members with medical conditions must consult a registered medical practitioner.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
