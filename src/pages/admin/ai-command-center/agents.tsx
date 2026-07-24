import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import Link from 'next/link';

// ═══════════════════════════════════════════════
// Configuration API n8n
// ═══════════════════════════════════════════════
const API_N8N = '/api/n8n/dashboard-data';

const AGENTS = [
  { id: 'ag-email-t3d',  wfId: 'email-agent-tacit3d',     label: 'EMAIL · TACIT3D',     sub: 'info@tacit3d.com',                   color: 'border-orange-400' },
  { id: 'ag-email-md3d', wfId: 'email-agent-mydesign3d',  label: 'EMAIL · MYDESIGN3D',  sub: 'hello@mydesign3d.com',               color: 'border-teal-400' },
  { id: 'ag-orch',       wfId: 'orchestrateur-briefing',  label: 'ORCHESTRATEUR',        sub: 'Briefing · 07:00',                   color: 'border-purple-400' },
  { id: 'ag-sales',      wfId: 'sales-agent',             label: 'SALES AGENT',          sub: 'Relances · 08:00',                   color: 'border-blue-400' },
  { id: 'ag-dashboard',  wfId: 'dashboard-api',           label: 'DASHBOARD API',        sub: 'webhook/dashboard-data',             color: 'border-gray-400' },
  { id: 'ag-marketing',  wfId: '1LgTO5DiahABrO1P',        label: 'MARKETING AGENT',      sub: 'Publisher · créneau optimal',        color: 'border-pink-400' },
  { id: 'ag-vendeur',    wfId: 'agent-vendeur',           label: 'AGENT VENDEUR',        sub: 'webhook/vendeur-proposal',           color: 'border-emerald-400' },
];

const COMPANIES = [
  { key: 'tacit',     label: 'TACIT3D',     sub: 'BIM · ARCHITECTURE · GOLFE MENA',    color: 'text-orange-500', border: 'border-l-orange-500' },
  { key: 'mydesign',  label: 'MYDESIGN3D',  sub: 'ARCHITECTURE · IT · WEB · SUISSE',   color: 'text-teal-500',   border: 'border-l-teal-500' },
];

type CrmRow = Record<string, unknown>;
type CompanyStats = Record<string, { hi: number; med: number; tot: number }>;

function asText(value: unknown) {
  return String(value ?? '').trim();
}

function getCompany(row: CrmRow) {
  return asText(row.Compagnie || row.Company_Target || row.Company || row['Company Target']).toLowerCase();
}

function getIcpScore(row: CrmRow) {
  const score = parseFloat(asText(row.ICP_Score || row.icp_score || row['ICP Score']).replace(',', '.'));
  return Number.isFinite(score) ? score : 0;
}

export default function AgentsPage() {
  const [agentStatus, setAgentStatus] = useState<Record<string, boolean>>({});
  const [companyStats, setCompanyStats] = useState<CompanyStats>({});
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [lastSync, setLastSync] = useState('—');
  const [currentTime, setCurrentTime] = useState(new Date());
  const syncBusy = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 90000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    if (syncBusy.current) return;
    syncBusy.current = true;
    try {
      const res = await fetch(API_N8N);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();
      const crm: CrmRow[] = Array.isArray(d.crm) ? d.crm : [];
      const workflows: Record<string, boolean> = d.workflows || {};

      // Agent statuses
      const status: Record<string, boolean> = {};
      AGENTS.forEach(a => { status[a.id] = !!workflows[a.wfId]; });
      setAgentStatus(status);

      // Company stats
      const stats: Record<string, { hi: number; med: number; tot: number }> = {};
      COMPANIES.forEach(c => {
        const rows = crm.filter((r: CrmRow) => getCompany(r).includes(c.key));
        const hi  = rows.filter((r: CrmRow) => getIcpScore(r) >= 9).length;
        const med = rows.filter((r: CrmRow) => {
          const score = getIcpScore(r);
          return score >= 7 && score < 9;
        }).length;
        stats[c.key] = { hi, med, tot: rows.length };
      });
      setCompanyStats(stats);

      setSystemStatus('online');
      setLastSync(new Date().toLocaleTimeString('fr-FR'));
    } catch {
      setSystemStatus('offline');
    } finally {
      syncBusy.current = false;
      setLoading(false);
    }
  }

  const maxLeads = Math.max(...COMPANIES.map(c => companyStats[c.key]?.tot || 0), 1);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/ai-command-center" className="text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors">
                ← AI Command Center
              </Link>
              <span className="text-gray-300">/</span>
              <h1 className="text-xl font-black tracking-tight text-gray-900">AGENTS STATUS</h1>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="text-lg font-bold text-orange-600 tabular-nums">
                  {currentTime.toLocaleTimeString('fr-FR')}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className={`w-2.5 h-2.5 rounded-full ${systemStatus === 'online' ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]' : systemStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-400'}`} />
                <span className={systemStatus === 'online' ? 'text-emerald-600' : 'text-red-500'}>
                  {systemStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <button onClick={loadData} className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-gray-200 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-all">
                [ SYNC ]
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto" />
                <p className="mt-3 text-sm text-gray-500 font-mono uppercase tracking-widest">Connexion à n8n…</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Agents Status Grid ── */}
              <section className="mb-8">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  AGENTS STATUS — {Object.values(agentStatus).filter(Boolean).length}/{AGENTS.length} ACTIFS
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {AGENTS.map(agent => {
                    const online = agentStatus[agent.id];
                    return (
                      <div
                        key={agent.id}
                        className={`bg-white/70 backdrop-blur border-l-4 ${agent.color} border border-white/80 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${
                          online ? '' : 'opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-black uppercase tracking-wider text-gray-800">{agent.label}</div>
                          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
                            online
                              ? 'text-emerald-600 border-emerald-200 bg-emerald-50'
                              : 'text-red-500 border-red-200 bg-red-50'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {online ? 'ONLINE' : 'OFFLINE'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{agent.sub}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Company Stats ── */}
              <section>
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">COMPANY STATS</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {COMPANIES.map(company => {
                    const s = companyStats[company.key] || { hi: 0, med: 0, tot: 0 };
                    return (
                      <div key={company.key} className={`bg-white/70 backdrop-blur border-l-4 ${company.border} border border-white/80 rounded-2xl p-7 shadow-sm hover:shadow-md transition-all`}>
                        {/* Company header */}
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{company.sub}</div>
                        <div className={`text-3xl font-black ${company.color} tracking-tight mb-4`}>{company.label}</div>

                        {/* Stats row */}
                        <div className="flex gap-8 mb-6">
                          <div>
                            <div className="text-5xl font-black text-red-500 leading-none">{s.hi}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">HIGH</div>
                          </div>
                          <div>
                            <div className="text-5xl font-black text-orange-500 leading-none">{s.med}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">MEDIUM</div>
                          </div>
                          <div>
                            <div className="text-5xl font-black text-teal-500 leading-none">{s.tot}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">TOTAL</div>
                          </div>
                        </div>

                        {/* Mini bars */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="text-[10px] font-bold uppercase text-gray-400 w-6">HI</div>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: maxLeads > 0 ? `${(s.hi / maxLeads) * 100}%` : '0%' }} />
                            </div>
                            <div className="text-[10px] text-gray-400 w-4 text-right">{s.hi}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-[10px] font-bold uppercase text-gray-400 w-6">MED</div>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: maxLeads > 0 ? `${(s.med / maxLeads) * 100}%` : '0%' }} />
                            </div>
                            <div className="text-[10px] text-gray-400 w-4 text-right">{s.med}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Footer */}
              <div className="mt-8 text-[10px] text-gray-400 font-mono uppercase tracking-widest flex justify-between border-t border-gray-200 pt-4">
                <span>AGENTS STATUS · n8n.tacit3d.com</span>
                <span>SYNC: {lastSync}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
