import React, { useState } from 'react';
import { 
  Settings, Shield, Lock, FileText, Database, 
  CheckCircle2, RefreshCw, Key, UserCheck, AlertTriangle
} from 'lucide-react';
import { AuditLogItem } from '../types';

interface SettingsViewProps {
  auditLogs: AuditLogItem[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ auditLogs }) => {
  const [dataRetentionDays, setDataRetentionDays] = useState('90');
  const [maskPiiToggle, setMaskPiiToggle] = useState(true);
  const [doubleBlindToggle, setDoubleBlindToggle] = useState(true);
  const [stopGateEnforced, setStopGateEnforced] = useState(true);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Settings &amp; Audit Governance</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              Compliance &amp; Security
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure pilot parameters, data retention, DPDP Act privacy controls, and inspect audit trails.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>API Status: Healthy (FastAPI 0.115)</span>
          </span>
        </div>
      </div>

      {/* Governance & Privacy Configurations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Privacy & DPDP Act Data Controls (Section 16) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Privacy &amp; Data Handling Controls</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Sensitive Evidence PII Redaction</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Automatically mask phone numbers, Aadhaar, and street addresses in test UI.</p>
              </div>
              <input
                type="checkbox"
                checked={maskPiiToggle}
                onChange={(e) => setMaskPiiToggle(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Double-Blind Peer Judgment Isolation</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Hide Reviewer B's score from Reviewer A until both have submitted.</p>
              </div>
              <input
                type="checkbox"
                checked={doubleBlindToggle}
                onChange={(e) => setDoubleBlindToggle(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Enforce Critical Stop-Gate Before Sign-off</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Block final report generation if open critical safety/privacy issues exist.</p>
              </div>
              <input
                type="checkbox"
                checked={stopGateEnforced}
                onChange={(e) => setStopGateEnforced(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
            </div>

            <div className="pt-2">
              <label className="block font-semibold text-slate-700 mb-1">Audit Trail Data Retention Period</label>
              <select
                value={dataRetentionDays}
                onChange={(e) => setDataRetentionDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="30">30 Days (Pilot Evaluation Window)</option>
                <option value="90">90 Days (Enterprise Regulatory Retention)</option>
                <option value="365">1 Year (Full Audit Archival)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Evaluation Environment & Database Telemetry */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Database className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Environment Architecture &amp; Database</h2>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Backend Framework</span>
              <p className="font-semibold text-slate-800 mt-0.5">Python 3.11 / FastAPI (High Performance Async API)</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Primary Persistence Layer</span>
              <p className="font-semibold text-slate-800 mt-0.5">PostgreSQL / SQLite via SQLAlchemy 2.0 (Dual-mode resilient)</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Frontend Framework</span>
              <p className="font-semibold text-slate-800 mt-0.5">React 18 / TypeScript / Vite / Tailwind CSS / Recharts</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Cryptographic Immutability</span>
              <p className="font-semibold text-slate-800 mt-0.5">Locked Judgments with Hash Verifiable Versioned Amendments</p>
            </div>
          </div>
        </div>

      </div>

      {/* Complete Audit Log Table */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <h2 className="text-sm font-bold text-slate-900">System Audit Trail &amp; Verification Events</h2>
          </div>
          <span className="text-xs text-slate-400">{auditLogs.length} Recorded Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                <th className="py-2.5 px-3 font-semibold">User / Persona</th>
                <th className="py-2.5 px-3 font-semibold">Action</th>
                <th className="py-2.5 px-3 font-semibold">Entity Type</th>
                <th className="py-2.5 px-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    {log.user}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                    {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
