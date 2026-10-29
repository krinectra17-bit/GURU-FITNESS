import React, { useState } from 'react';
import { Dumbbell, Edit3, CheckCircle, AlertTriangle, RefreshCw, Plus, Users, Calendar } from 'lucide-react';
import { gymDB } from '../../lib/database';
import { MembershipPlan, Membership } from '../../types/database';

interface MembershipManagementProps {
  onUpdate: () => void;
}

export const MembershipManagement: React.FC<MembershipManagementProps> = ({ onUpdate }) => {
  const plans = gymDB.getPlans();
  const memberships = gymDB.getMemberships();
  const profiles = gymDB.getProfiles();

  // Price editing state
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [newBasePrice, setNewBasePrice] = useState<number>(0);

  // Renewal state
  const [renewingMembership, setRenewingMembership] = useState<Membership | null>(null);
  const [renewalPlanId, setRenewalPlanId] = useState<string>('');
  const [applyGroupDiscount, setApplyGroupDiscount] = useState<boolean>(false);

  const handleOpenEditPrice = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setNewBasePrice(plan.base_price);
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    gymDB.updatePlanPrice(editingPlan.id, newBasePrice);
    setEditingPlan(null);
    onUpdate();
  };

  const handleOpenRenew = (mem: Membership) => {
    setRenewingMembership(mem);
    setRenewalPlanId(mem.plan_id);
    setApplyGroupDiscount(mem.discount_type === 'group_15');
  };

  const handleConfirmRenew = () => {
    if (!renewingMembership) return;
    const plan = plans.find(p => p.id === renewalPlanId) || plans[0];
    const discount = applyGroupDiscount ? Math.round(plan.base_price * 0.15) : 0;
    
    gymDB.renewMembership(
      renewingMembership.member_id,
      plan.id,
      plan.base_price,
      applyGroupDiscount ? 'group_15' : 'none',
      discount,
      'Renewed via admin panel.'
    );

    setRenewingMembership(null);
    onUpdate();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Product Catalog &amp; Active Contracts
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            Membership Plans &amp; Renewals
          </h1>
        </div>
      </div>

      {/* Part 1: Official Pricing Catalog (Allows owner to modify future pricing) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide flex items-center space-x-2">
            <Dumbbell className="w-5 h-5 text-gym-red" />
            <span>Official Price Schedule (Poster Standard)</span>
          </h3>
          <span className="text-xs text-gym-muted">Historical purchases retain agreed prices</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strength Category */}
          <div className="bg-gym-card rounded-xl border border-gym-border p-5 space-y-4">
            <div className="border-b border-gym-border/70 pb-3">
              <span className="text-[10px] font-bold text-gym-red uppercase tracking-widest">Category 1</span>
              <h4 className="font-display font-bold text-xl text-white uppercase">Strength Training</h4>
            </div>
            <div className="space-y-2.5">
              {plans.filter(p => p.category === 'strength').map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded bg-gym-dark border border-gym-border/60 text-xs">
                  <div>
                    <span className="font-semibold text-white block capitalize">{p.duration_type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-gym-muted">{p.duration_months} Month(s)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-display font-bold text-base text-gym-red">₹{p.base_price.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => handleOpenEditPrice(p)}
                      className="p-1 rounded text-gym-muted hover:text-white hover:bg-gym-surface"
                      title="Update future price"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cardio / Fat Loss / Yoga Category */}
          <div className="bg-gym-card rounded-xl border border-gym-border p-5 space-y-4">
            <div className="border-b border-gym-border/70 pb-3">
              <span className="text-[10px] font-bold text-gym-red uppercase tracking-widest">Category 2</span>
              <h4 className="font-display font-bold text-xl text-white uppercase">Cardio / Fat Loss / Yoga</h4>
            </div>
            <div className="space-y-2.5">
              {plans.filter(p => p.category === 'cardio_fatloss_yoga').map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded bg-gym-dark border border-gym-border/60 text-xs">
                  <div>
                    <span className="font-semibold text-white block capitalize">{p.duration_type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-gym-muted">{p.duration_months} Month(s)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-display font-bold text-base text-gym-red">₹{p.base_price.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => handleOpenEditPrice(p)}
                      className="p-1 rounded text-gym-muted hover:text-white hover:bg-gym-surface"
                      title="Update future price"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Training Category */}
          <div className="bg-gym-card rounded-xl border border-gym-border p-5 space-y-4">
            <div className="border-b border-gym-border/70 pb-3">
              <span className="text-[10px] font-bold text-gym-red uppercase tracking-widest">Category 3</span>
              <h4 className="font-display font-bold text-xl text-white uppercase">Personal Training</h4>
            </div>
            <div className="space-y-2.5">
              {plans.filter(p => p.category === 'personal_training').map(p => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded bg-gym-dark border border-gym-border/60 text-xs">
                  <div>
                    <span className="font-semibold text-white block capitalize">{p.duration_type.replace('_', ' ')}</span>
                    <span className="text-[10px] text-gym-muted">{p.duration_months} Month(s)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-display font-bold text-base text-gym-red">₹{p.base_price.toLocaleString('en-IN')}</span>
                    <button
                      onClick={() => handleOpenEditPrice(p)}
                      className="p-1 rounded text-gym-muted hover:text-white hover:bg-gym-surface"
                      title="Update future price"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: Active & Historical Membership Contracts Table */}
      <div className="bg-gym-card border border-gym-border rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
          All Member Contracts &amp; Renewals
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gym-surface text-gym-muted uppercase font-semibold border-b border-gym-border">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Agreed Fee</th>
                <th className="px-4 py-3">Group Disc.</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border/60">
              {memberships.map((m) => {
                const prof = profiles.find(p => p.id === m.member_id);
                const plan = plans.find(p => p.id === m.plan_id);

                return (
                  <tr key={m.id} className="hover:bg-gym-surface/40 transition">
                    <td className="px-4 py-3 font-mono text-white font-medium">{m.membership_code}</td>
                    <td className="px-4 py-3 font-semibold text-white">{prof?.full_name || 'Member'}</td>
                    <td className="px-4 py-3 text-gray-300">{plan?.name || 'Strength'}</td>
                    <td className="px-4 py-3 font-display font-bold text-sm text-white">
                      ₹{m.final_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      {m.discount_type === 'group_15' ? (
                        <span className="bg-gym-red/20 text-gym-red px-2 py-0.5 rounded text-[10px] font-bold border border-gym-red/30">
                          15% Group
                        </span>
                      ) : (
                        <span className="text-gym-muted text-[11px]">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 font-mono text-[11px]">{m.start_date}</td>
                    <td className="px-4 py-3 text-amber-300 font-mono text-[11px] font-semibold">{m.expiry_date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        m.status === 'active'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : m.status === 'pending_activation'
                          ? 'bg-blue-950 text-blue-300 border-blue-500/40'
                          : 'bg-rose-950 text-rose-300 border-rose-500/40'
                      }`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleOpenRenew(m)}
                        className="inline-flex items-center space-x-1 bg-gym-surface hover:bg-gym-dark text-white px-2.5 py-1 rounded text-xs border border-gym-border transition"
                      >
                        <RefreshCw className="w-3 h-3 text-gym-red" />
                        <span>Renew</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Price Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gym-card border border-gym-border rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-display font-extrabold text-2xl text-white uppercase">
              Update Plan Base Price
            </h3>
            <p className="text-xs text-gray-400">
              Editing: <strong className="text-white">{editingPlan.name}</strong>
            </p>

            <form onSubmit={handleSavePrice} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  New Base Price (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newBasePrice}
                  onChange={(e) => setNewBasePrice(Number(e.target.value))}
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-display text-xl"
                />
              </div>

              <div className="text-[10px] text-gym-muted">
                * Note: Updates will apply to future member registrations and renewals. Existing active purchases remain unchanged.
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-xs uppercase"
                >
                  Save New Rate
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="py-2.5 px-4 rounded bg-gym-surface text-gray-400 text-xs border border-gym-border"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Membership Modal */}
      {renewingMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gym-card border border-gym-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="border-b border-gym-border/70 pb-3">
              <span className="text-[10px] font-bold text-gym-red uppercase tracking-widest">
                Term Extension
              </span>
              <h3 className="font-display font-extrabold text-2xl text-white uppercase">
                Renew Membership
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Member: <strong className="text-white">{profiles.find(p => p.id === renewingMembership.member_id)?.full_name}</strong>
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Select Renewal Plan
                </label>
                <select
                  value={renewalPlanId}
                  onChange={(e) => setRenewalPlanId(e.target.value)}
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.base_price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gym-surface p-3 rounded border border-gym-border flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="renewalGroup"
                    checked={applyGroupDiscount}
                    onChange={(e) => setApplyGroupDiscount(e.target.checked)}
                    className="w-4 h-4 rounded text-gym-red accent-gym-red"
                  />
                  <label htmlFor="renewalGroup" className="text-xs font-bold text-white uppercase cursor-pointer">
                    Apply 15% Group Discount
                  </label>
                </div>
                <span className="text-[10px] text-gym-red font-bold">15% OFF</span>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                onClick={handleConfirmRenew}
                className="w-full py-3 rounded bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-xs uppercase tracking-wider transition"
              >
                Confirm Renewal &amp; Extend Expiry
              </button>
              <button
                onClick={() => setRenewingMembership(null)}
                className="py-3 px-4 rounded bg-gym-surface text-gray-400 text-xs border border-gym-border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
