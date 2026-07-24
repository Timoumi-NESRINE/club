import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';

// ═══════════════════════════════════════════════
// Configuration API n8n
// ═══════════════════════════════════════════════
const API_N8N = '/api/n8n/dashboard-data';

interface DashboardData {
  crm?: any[];
  reminders?: any[];
  workflows?: Record<string, boolean>;
  proposals?: any[];
  drafts?: any[];
}

const WORKFLOWS: Record<string, string> = {
  'ag-email-t3d':  'email-agent-tacit3d',
  'ag-email-md3d': 'email-agent-mydesign3d',
  'ag-orch':       'orchestrateur-briefing',
  'ag-sales':      'sales-agent',
  'ag-dashboard':  'dashboard-api',
  'ag-marketing':  '1LgTO5DiahABrO1P',
  'ag-vendeur':    'agent-vendeur',
};

export default function AICommandCenterHub() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [syncCount, setSyncCount] = useState(0);
  const [lastSync, setLastSync] = useState('—');
  const [stats, setStats] = useState({
    totalLeads: 0,
    hotLeads: 0,
    pendingProposals: 0,
    activeAgents: 0,
    totalAgents: Object.keys(WORKFLOWS).length,
    pendingDrafts: 0,
  });
  const syncBusy = useRef(false);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial load + polling every 90s
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
      const d: DashboardData = await res.json();
      const crm = d.crm || [];
      const scored = crm.filter((r: any) => Number(r.ICP_Score || r.icp_score || 0) > 0);
      const hot = scored.filter((r: any) => Number(r.ICP_Score || r.icp_score || 0) >= 9);
      const workflows = d.workflows || {};
      const activeAgents = Object.values(WORKFLOWS).filter(id => workflows[id]).length;
      setStats({
        totalLeads: crm.length,
        hotLeads: hot.length,
        pendingProposals: (d.proposals || []).length,
        activeAgents,
        totalAgents: Object.keys(WORKFLOWS).length,
        pendingDrafts: (d.drafts || []).length,
      });
      setSystemStatus('online');
      setSyncCount(c => c + 1);
      setLastSync(new Date().toLocaleTimeString('fr-FR'));
    } catch {
      setSystemStatus('offline');
    } finally {
      syncBusy.current = false;
    }
  }

  const fmt = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();

  const subPages = [
    {
      href: '/admin/ai-command-center/agents',
      title: 'AGENTS STATUS',
      subtitle: 'État temps réel des agents IA',
      icon: '🤖',
      color: 'border-teal-500',
      accent: 'text-teal-600',
      bg: 'bg-teal-50',
      stat: `${stats.activeAgents}/${stats.totalAgents} actifs`,
      statColor: stats.activeAgents > 0 ? 'text-teal-600' : 'text-red-500',
    },
    {
      href: '/admin/ai-command-center/leads',
      title: 'LEADS & PIPELINE',
      subtitle: 'ICP scoring, Sales pipeline, Rappels',
      icon: '📊',
      color: 'border-orange-500',
      accent: 'text-orange-600',
      bg: 'bg-orange-50',
      stat: `${stats.hotLeads} 🔥 HOT / ${stats.totalLeads} total`,
      statColor: 'text-orange-600',
    },
    {
      href: '/admin/ai-command-center/proposals',
      title: 'PROPOSITIONS',
      subtitle: 'Agent Vendeur & approbation emails',
      icon: '📝',
      color: 'border-purple-500',
      accent: 'text-purple-600',
      bg: 'bg-purple-50',
      stat: `${stats.pendingProposals} en attente`,
      statColor: stats.pendingProposals > 0 ? 'text-orange-500' : 'text-gray-400',
    },
    {
      href: '/admin/ai-command-center/marketing',
      title: 'MARKETING & BLOG',
      subtitle: 'Simulation posts, Blog Agent',
      icon: '📱',
      color: 'border-blue-500',
      accent: 'text-blue-600',
      bg: 'bg-blue-50',
      stat: `${stats.pendingDrafts} draft(s) en attente`,
      statColor: stats.pendingDrafts > 0 ? 'text-blue-500' : 'text-gray-400',
    },
  ];

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* ── Header ── */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900">
                AI COMMAND CENTER
              </h1>
              <p className="text-xs text-gray-500 tracking-widest uppercase mt-0.5">
                Système d'automatisation · n8n Self-Hosted
              </p>
            </div>
            <div className="flex items-center gap-6">
              {/* Clock */}
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-600 tabular-nums">{fmt(currentTime)}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">{fmtDate(currentTime)}</div>
              </div>
              {/* Status dot */}
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  systemStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' :
                  systemStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-400'
                } ${systemStatus === 'online' ? 'animate-pulse' : ''}`} />
                <span className={systemStatus === 'online' ? 'text-emerald-600' : systemStatus === 'offline' ? 'text-red-500' : 'text-gray-400'}>
                  {systemStatus === 'online' ? 'ONLINE' : systemStatus === 'offline' ? 'OFFLINE' : 'SYNC...'}
                </span>
              </div>
              {/* Sync button */}
              <button
                onClick={loadData}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-gray-200 bg-white hover:bg-gray-50 rounded-lg shadow-sm transition-all hover:shadow"
              >
                [ SYNC ]
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* ── Status bar ── */}
          <div className="flex items-center gap-4 mb-8 text-xs text-gray-500 font-mono">
            <span>SYNC: {lastSync}</span>
            <span className="text-gray-300">·</span>
            <span>CYCLES: {syncCount}</span>
            <span className="text-gray-300">·</span>
            <span>n8n.tacit3d.com</span>
          </div>

          {/* ── Overview KPI strip ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'TOTAL LEADS', value: stats.totalLeads, color: 'text-teal-600' },
              { label: 'LEADS 🔥 HOT', value: stats.hotLeads, color: 'text-orange-600' },
              { label: 'PROPOSITIONS', value: stats.pendingProposals, color: 'text-purple-600' },
              { label: 'AGENTS ACTIFS', value: `${stats.activeAgents}/${stats.totalAgents}`, color: 'text-blue-600' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{kpi.label}</div>
                <div className={`text-4xl font-black ${kpi.color}`}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* ── Sub-page navigation cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subPages.map(page => (
              <Link key={page.href} href={page.href}>
                <div className={`group bg-white/70 backdrop-blur border-l-4 ${page.color} border border-white/80 rounded-2xl p-7 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl ${page.bg} flex items-center justify-center text-2xl`}>
                        {page.icon}
                      </div>
                      <div>
                        <div className={`text-xs font-black uppercase tracking-widest ${page.accent} mb-1`}>{page.title}</div>
                        <div className="text-sm font-medium text-gray-600">{page.subtitle}</div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 text-xl">→</div>
                  </div>
                  <div className={`mt-5 text-sm font-semibold ${page.statColor}`}>{page.stat}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* ── Footer ── */}
          <div className="mt-10 flex justify-between items-center text-[10px] text-gray-400 font-mono uppercase tracking-widest border-t border-gray-200 pt-4">
            <span>SYSTEM · AI COMMAND CENTER v2.0 · n8n SELF-HOSTED</span>
            <span>SYNC: {lastSync} · CYCLES: {syncCount}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
