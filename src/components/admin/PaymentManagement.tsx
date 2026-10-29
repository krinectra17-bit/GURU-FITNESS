import React, { useState } from 'react';
import { CreditCard, Plus, Printer, Search, Download, DollarSign, CheckCircle } from 'lucide-react';
import { gymDB } from '../../lib/database';
import { Payment } from '../../types/database';
import { ReceiptModal } from '../dashboard/ReceiptModal';

interface PaymentManagementProps {
  onUpdate: () => void;
}

export const PaymentManagement: React.FC<PaymentManagementProps> = ({ onUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Form states
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'online'>('upi');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const payments = gymDB.getPayments();
  const profiles = gymDB.getProfiles().filter(p => gymDB.getUserRole(p.id) !== 'admin');

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const prof = profiles.find(pr => pr.id === p.member_id);
    const searchStr = `${p.payment_number} ${prof?.full_name || ''} ${p.transaction_reference || ''} ${p.payment_method}`.toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || amount <= 0) return;

    const mem = gymDB.getMemberActiveMembership(memberId);
    if (!mem) {
      alert('Selected member has no registered membership record.');
      return;
    }

    gymDB.recordPayment({
      memberId,
      membershipId: mem.id,
      amount,
      method,
      reference: reference || undefined,
      notes: notes || undefined
    });

    setShowAddModal(false);
    setAmount(1000);
    setReference('');
    setNotes('');
    onUpdate();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Ledger &amp; Revenue Transactions
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            Fee Collections &amp; Receipts
          </h1>
        </div>

        <button
          onClick={() => {
            if (profiles[0]) setMemberId(profiles[0].id);
            setReference('UPI/' + Date.now().toString().slice(-6));
            setShowAddModal(true);
          }}
          className="inline-flex items-center space-x-2 bg-gym-red hover:bg-gym-red-hover text-white px-4 py-2.5 rounded font-display font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-gym-red/25"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Fee Payment</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gym-muted absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by receipt number, member name, payment method, or transaction reference..."
          className="w-full bg-gym-card border border-gym-border rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gym-red transition"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-gym-card border border-gym-border rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gym-surface text-gym-muted uppercase font-semibold border-b border-gym-border">
              <tr>
                <th className="px-4 py-3.5">Receipt #</th>
                <th className="px-4 py-3.5">Member Name</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Method</th>
                <th className="px-4 py-3.5">Amount (INR)</th>
                <th className="px-4 py-3.5">Transaction Reference</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-4 py-3.5 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border/60">
              {filteredPayments.map((p) => {
                const prof = profiles.find(pr => pr.id === p.member_id);
                return (
                  <tr key={p.id} className="hover:bg-gym-surface/40 transition">
                    <td className="px-4 py-3.5 font-mono text-white font-medium">{p.payment_number}</td>
                    <td className="px-4 py-3.5 font-bold text-white">{prof?.full_name || 'Member'}</td>
                    <td className="px-4 py-3.5 text-gray-300">{p.payment_date}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-gym-dark px-2 py-0.5 rounded border border-gym-border font-mono text-[10px] text-gray-300 uppercase">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-display font-bold text-base text-white">
                      ₹{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-gray-400 text-[11px]">
                      {p.transaction_reference || 'CASH-SETTLEMENT'}
                    </td>
                    <td className="px-4 py-3.5 text-gym-muted italic max-w-xs truncate">{p.notes || '—'}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="inline-flex items-center space-x-1 bg-gym-surface hover:bg-gym-dark text-white px-2.5 py-1 rounded text-xs border border-gym-border transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-gym-red" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gym-card border border-gym-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="border-b border-gym-border/70 pb-3">
              <span className="text-[10px] font-bold text-gym-red uppercase tracking-widest">
                Authorized Fee Entry
              </span>
              <h3 className="font-display font-extrabold text-2xl text-white uppercase">
                Record Member Payment
              </h3>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Select Member *
                </label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
                >
                  {profiles.map(p => {
                    const sum = gymDB.getMemberSummary(p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.full_name} ({p.phone}) — Due: ₹{sum?.outstandingBalance || 0}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Amount Received (₹) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-display text-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Payment Method *
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
                >
                  <option value="upi">UPI (GPay, PhonePe, Paytm, BHIM)</option>
                  <option value="cash">Cash In Hand</option>
                  <option value="bank_transfer">Direct Bank Transfer (IMPS/NEFT)</option>
                  <option value="online">Online Payment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Transaction Reference / UTR
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UPI/2610271299/GURU"
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Second installment paid at front desk"
                  className="w-full bg-gym-surface border border-gym-border rounded px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded bg-gym-red hover:bg-gym-red-hover text-white font-display font-bold text-xs uppercase tracking-wider transition"
                >
                  Record Payment &amp; Issue Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-3 px-4 rounded bg-gym-surface text-gray-400 text-xs border border-gym-border"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          member={profiles.find(p => p.id === selectedReceipt.member_id)!}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
