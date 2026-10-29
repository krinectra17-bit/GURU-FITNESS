import React from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { gymDB } from '../../lib/database';

export const AuditManagement: React.FC = () => {
  const auditLogs = gymDB.getAuditLogs();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gym-border/80 gap-4">
        <div>
          <span className="text-gym-red font-display text-xs font-bold tracking-widest uppercase">
            Security &amp; Operational Governance
          </span>
          <h1 className="text-3xl font-display font-extrabold text-white uppercase tracking-tight">
            System Audit Trail ({auditLogs.length})
          </h1>
          <p className="text-xs text-gym-muted mt-0.5">
            Immutable log of all administrative actions, fee modifications, and membership changes.
          </p>
        </div>
      </div>

      <div className="bg-gym-card border border-gym-border rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gym-surface text-gym-muted uppercase font-semibold border-b border-gym-border">
              <tr>
                <th className="px-4 py-3">Timestamp (UTC)</th>
                <th className="px-4 py-3">Actor Email</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">Metadata / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border/60">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gym-surface/40 transition">
                  <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">{log.actor_email || 'System'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gym-dark px-2 py-0.5 rounded border border-gym-border font-mono text-[10px] text-gym-red font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-300 capitalize">{log.entity_type}</td>
                  <td className="px-4 py-3 font-mono text-gray-400 text-[11px]">{log.entity_id || '—'}</td>
                  <td className="px-4 py-3 text-gym-muted font-mono text-[10px] max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gym-muted italic">
                    No audit records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
