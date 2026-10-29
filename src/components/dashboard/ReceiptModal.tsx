import React from 'react';
import { Payment, Profile, Membership } from '../../types/database';
import { X, Printer, Download, CheckCircle, Shield } from 'lucide-react';
import { gymDB } from '../../lib/database';

interface ReceiptModalProps {
  payment: Payment;
  member: Profile;
  membership?: Membership;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  member,
  membership,
  onClose
}) => {
  const settings = gymDB.getSettings();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gym-card border border-gym-border rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Modal Top Actions (Hidden in print) */}
        <div className="no-print bg-gym-surface px-6 py-3 border-b border-gym-border flex items-center justify-between">
          <span className="text-xs font-semibold text-white uppercase tracking-wider flex items-center">
            <Shield className="w-3.5 h-3.5 text-gym-red mr-1.5" />
            Official Gym Payment Receipt
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1 bg-gym-dark hover:bg-gym-card text-white px-3 py-1.5 rounded text-xs border border-gym-border transition"
            >
              <Printer className="w-3.5 h-3.5 text-gym-red" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-gym-muted hover:text-white hover:bg-gym-card"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 bg-white text-gray-900 space-y-6">
          {/* Gym Header */}
          <div className="border-b-2 border-red-600 pb-4 flex justify-between items-start">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-red-600 tracking-wider uppercase leading-none">
                GURU FITNESS &amp; NUTRITIONS
              </h2>
              <p className="text-[10px] tracking-widest text-gray-500 uppercase font-semibold mt-1">
                Transforming Bodies, Transforming Lives
              </p>
              <p className="text-xs text-gray-600 mt-2">
                Helpline: +91 {settings.phone_primary} / {settings.phone_secondary}
              </p>
              <p className="text-[11px] text-gray-500">
                {settings.address}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-300">
                PAID &amp; VERIFIED
              </span>
              <div className="text-xs text-gray-500 mt-2 font-mono">
                {payment.payment_number}
              </div>
              <div className="text-xs text-gray-500">
                Date: {payment.payment_date}
              </div>
            </div>
          </div>

          {/* Member & Plan Details */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded border border-gray-200">
            <div>
              <span className="text-gray-500 block uppercase font-semibold text-[10px]">Billed To Member:</span>
              <span className="font-bold text-gray-900 text-sm">{member.full_name}</span>
              <span className="block text-gray-600 mt-0.5">{member.phone}</span>
              <span className="block text-gray-600">{member.email}</span>
            </div>
            <div>
              <span className="text-gray-500 block uppercase font-semibold text-[10px]">Membership Reference:</span>
              <span className="font-bold text-gray-900 text-sm">
                {membership?.membership_code || 'GFN-ACTIVE'}
              </span>
              <span className="block text-gray-600 mt-0.5">
                Method: <strong>{payment.payment_method.toUpperCase()}</strong>
              </span>
              {payment.transaction_reference && (
                <span className="block text-gray-600 font-mono text-[10px]">
                  Ref: {payment.transaction_reference}
                </span>
              )}
            </div>
          </div>

          {/* Line Item Table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300 text-gray-600 text-left">
                <th className="py-2">Item Description</th>
                <th className="py-2 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-3">
                  <div className="font-bold text-gray-900">
                    Gym Membership Fee Installment
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    {payment.notes || 'Official membership subscription fee collection.'}
                  </div>
                </td>
                <td className="py-3 text-right font-bold text-gray-900 text-sm font-mono">
                  ₹{payment.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-3 text-right font-bold text-gray-700">Total Paid:</td>
                <td className="pt-3 text-right font-display font-extrabold text-xl text-red-600">
                  ₹{payment.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Footer Notes & Signatures */}
          <div className="pt-4 border-t border-gray-200 flex justify-between items-end text-[11px] text-gray-500">
            <div>
              <p className="font-semibold text-gray-700">Authorized Front Desk Signature</p>
              <p className="italic text-[10px] mt-1">GURU FITNESS &amp; NUTRITIONS Management</p>
            </div>
            <div className="text-right text-[10px] text-gray-400">
              Computer Generated Receipt • No Physical Signature Required
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
