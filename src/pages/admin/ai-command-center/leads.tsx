import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import Link from 'next/link';

// ═══════════════════════════════════════════════
// Config API n8n
// ═══════════════════════════════════════════════
const API_N8N = '/api/n8n/dashboard-data';
const APPROVE_NEXT = '/api/n8n/approve-next';

interface Lead {
  Date?: string;
  Lead?: string;
  'Nom Lead'?: string;
  Email?: string;
  Compagnie?: string;
  Company_Target?: string;
  ICP_Score?: string | number;
  icp_score?: string | number;
  'Priorité'?: string;
  Priorite?: string;
  Priority?: string;
  Service_Line?: string;
  service_line?: string;
  Suivi?: string;
  Raison?: string;
  Role?: string;
}

interface Reminder {
  Rappel?: string;
  DateTime?: string;
  Date?: string;
  Status?: string;
}

function getScore(r: Lead) { return parseInt(String(r.ICP_Score || r.icp_score || 0)); }
function getCoKey(r: Lead) { return (r.Company_Target || r.Compagnie || '').toLowerCase(); }
function getCoLabel(r: Lead) {
  const c = getCoKey(r);
  return c.includes('tacit') ? 'T3D' : c.includes('mydesign') ? 'MD3D' : 'SALT';
}
function getCoClass(r: Lead) {
  const c = getCoKey(r);
  return c.includes('tacit') ? 'text-orange-600 border-orange-300 bg-orange-50' : c.includes('mydesign') ? 'text-teal-600 border-teal-300 bg-teal-50' : 'text-purple-600 border-purple-300 bg-purple-50';
}
function getSuiviClass(v: string) {
  const map: Record<string, string> = { j0_sent: 'text-teal-600 bg-teal-50 border-teal-300', j1_sent: 'text-teal-600 bg-teal-50 border-teal-300', j3_sent: 'text-purple-600 bg-purple-50 border-purple-300', j7_sent: 'text-orange-600 bg-orange-50 border-orange-300', converti: 'text-emerald-600 bg-emerald-50 border-emerald-300', perdu: 'text-gray-600 bg-gray-50 border-gray-300', nurturing: 'text-gray-500 bg-gray-50 border-gray-200' };
  return map[v.toLowerCase()] || '';
}
function getPriorityClass(p: string) {
  const lower = p.toLowerCase();
  if (lower === 'hot') return 'text-orange-600 border-orange-300';
  if (lower === 'warm') return 'text-yellow-600 border-yellow-300';
  if (lower === 'cold') return 'text-teal-600 border-teal-300';
  return 'text-gray-500 border-gray-300';
}
function getScoreClass(s: number) {
  if (s >= 9) return 'text-orange-600 border-orange-300 bg-orange-50';
  if (s >= 7) return 'text-yellow-600 border-yellow-300 bg-yellow-50';
  if (s >= 5) return 'text-teal-600 border-teal-300 bg-teal-50';
  return 'text-gray-500 border-gray-200 bg-gray-50';
}

export default function LeadsPage() {
  const [crm, setCrm] = useState<Lead[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [lastSync, setLastSync] = useState('—');
  const [leadsLimit, setLeadsLimit] = useState(50);
  const [approveStatus, setApproveStatus] = useState('En attente de votre action...');
  const [approveStatusColor, setApproveStatusColor] = useState('text-gray-400');
  const [approveBusy, setApproveBusy] = useState(false);
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
      setCrm(d.crm || []);
      setReminders(d.reminders || []);
      setSystemStatus('online');
      setLastSync(new Date().toLocaleTimeString('fr-FR'));
    } catch {
      setSystemStatus('offline');
    } finally {
      syncBusy.current = false;
      setLoading(false);
    }
  }

  async function approveNextLead() {
    setApproveBusy(true);
    setApproveStatus('⏳ Traitement du prochain lead...');
    setApproveStatusColor('text-gray-400');
    try {
      const res = await fetch(APPROVE_NEXT);
      const txt = await res.text();
      if (txt.startsWith('OK_SENT')) {
        const [, name, company, subject] = txt.split('|');
        setApproveStatus(`✅ Email envoyé à ${name || '?'} (${company || '?'}) — ${subject || ''}`);
        setApproveStatusColor('text-emerald-600');
      } else if (txt.includes('NO_PENDING') || txt.includes('empty') || txt.includes('vide')) {
        setApproveStatus('✅ Aucun lead en attente. File vide.');
        setApproveStatusColor('text-teal-600');
      } else {
        setApproveStatus(`⚠️ Réponse inattendue: ${txt.substring(0, 80)}`);
        setApproveStatusColor('text-orange-600');
      }
    } catch (e: any) {
      setApproveStatus(`❌ Erreur: ${e.message}`);
      setApproveStatusColor('text-red-600');
    }
    setApproveBusy(false);
  }

  async function approveAllLeads() {
    setApproveBusy(true);
    let sent = 0;
    const cap = 25;
    try {
      while (sent < cap) {
        const res = await fetch(APPROVE_NEXT);
        const txt = await res.text();
        if (txt.startsWith('OK_SENT')) {
          sent++;
          setApproveStatus(`⏳ ${sent} email(s) envoyé(s)...`);
          setApproveStatusColor('text-gray-400');
          await new Promise(r => setTimeout(r, 1500));
        } else {
          break;
        }
      }
      setApproveStatus(`✅ ${sent} email(s) envoyé(s).${sent >= cap ? ` (limite ${cap} atteinte — réappuie)` : ' File vide.'}`);
      setApproveStatusColor('text-emerald-600');
    } catch (e: any) {
      setApproveStatus(`❌ Erreur après ${sent} envoyés: ${e.message}`);
      setApproveStatusColor('text-red-600');
    }
    setApproveBusy(false);
  }

  // ── Computed data ──
  const scored = crm.filter(r => getScore(r) > 0).sort((a, b) => getScore(b) - getScore(a));
  const unscored = [...crm.filter(r => !(getScore(r) > 0))].reverse();
  const hot  = scored.filter(r => getScore(r) >= 9);
  const warm = scored.filter(r => getScore(r) >= 7 && getScore(r) < 9);
  const cold = scored.filter(r => getScore(r) >= 5 && getScore(r) < 7);
  const nurt = crm.filter(r => getScore(r) < 5 || (r.Role || '').toLowerCase().includes('nurturing'));

  const j1 = crm.filter(r => (r.Suivi || '').toLowerCase() === 'j1_sent');
  const j3 = crm.filter(r => (r.Suivi || '').toLowerCase() === 'j3_sent');
  const j7 = crm.filter(r => (r.Suivi || '').toLowerCase() === 'j7_sent');
  const j1t3d = j1.filter(r => getCoKey(r).includes('tacit'));
  const j1md  = j1.filter(r => getCoKey(r).includes('mydesign'));
  const j3t3d = j3.filter(r => getCoKey(r).includes('tacit'));
  const j3md  = j3.filter(r => getCoKey(r).includes('mydesign'));
  const j7t3d = j7.filter(r => getCoKey(r).includes('tacit'));
  const j7md  = j7.filter(r => getCoKey(r).includes('mydesign'));
  const sMax = Math.max(j1.length, j3.length, j7.length, 1);

  // Service line breakdown
  const slCounts: Record<string, { total: number; hot: number }> = {};
  scored.forEach(r => {
    const sl = r.Service_Line || r.service_line || 'unknown';
    if (!slCounts[sl]) slCounts[sl] = { total: 0, hot: 0 };
    slCounts[sl].total++;
    if (getScore(r) >= 7) slCounts[sl].hot++;
  });
  const maxSl = Math.max(...Object.values(slCounts).map(v => v.total), 1);

  const topLeads = [...warm, ...hot].sort((a, b) => getScore(b) - getScore(a)).slice(0, 5);
  const activeReminders = reminders.filter(r => (r.Status || '').toLowerCase() !== 'done').slice(-6).reverse();
  const recentLeads = [...scored, ...unscored].slice(0, leadsLimit);

  const suiviLabel = (v: string) => {
    const val = (v || '').toLowerCase();
    if (!val || val === 'nouveau') return null;
    const map: Record<string, string> = { j0_sent: 'J0', j1_sent: 'J1', j3_sent: 'J3', j7_sent: 'J7', converti: '✓', perdu: 'PERDU', nurturing: 'NURT' };
    return map[val] || val.substring(0, 6).toUpperCase();
  };

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
              <h1 className="text-xl font-black tracking-tight text-gray-900">LEADS & PIPELINE</h1>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-lg font-bold text-orange-600 tabular-nums">{currentTime.toLocaleTimeString('fr-FR')}</div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className={`w-2.5 h-2.5 rounded-full ${systemStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
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
                <p className="mt-3 text-sm text-gray-500 font-mono uppercase tracking-widest">Chargement CRM…</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-6">
              {/* ── Left column ── */}
              <div className="flex-1 min-w-0 space-y-6">

                {/* ICP Pipeline */}
                <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-sm font-black uppercase tracking-widest text-gray-900">ICP PIPELINE</div>
                    <span className="text-xs px-2.5 py-1 rounded-full border border-teal-300 text-teal-700 bg-teal-50 font-semibold">
                      {scored.length} leads scorés
                    </span>
                  </div>
                  {/* Buckets */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      { label: '🔥 HOT · 9-10',  value: hot.length,  cls: 'border-orange-300 bg-orange-50', val: 'text-orange-600' },
                      { label: '⚡ WARM · 7-8',  value: warm.length, cls: 'border-yellow-300 bg-yellow-50', val: 'text-yellow-600' },
                      { label: '❄ COLD · 5-6',   value: cold.length, cls: 'border-teal-300 bg-teal-50',    val: 'text-teal-600' },
                      { label: '💧 NURTURING',    value: nurt.length, cls: 'border-gray-200 bg-gray-50',    val: 'text-gray-500' },
                    ].map(bucket => (
                      <div key={bucket.label} className={`border rounded-xl p-3 text-center ${bucket.cls}`}>
                        <div className={`text-3xl font-black leading-none ${bucket.val}`}>{bucket.value}</div>
                        <div className="text-[10px] text-gray-500 mt-1.5 leading-tight">{bucket.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Service lines */}
                  {Object.keys(slCounts).filter(k => k !== 'unknown').length > 0 && (
                    <div className="mt-4">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">SERVICES</div>
                      <div className="space-y-1.5">
                        {Object.entries(slCounts).filter(([k]) => k !== 'unknown').sort((a, b) => b[1].total - a[1].total).map(([sl, c]) => (
                          <div key={sl} className="flex items-center gap-3">
                            <div className="text-[9px] text-gray-400 uppercase tracking-wide w-24 shrink-0">{sl.substring(0, 14)}</div>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-teal-500 rounded-full transition-all duration-700" style={{ width: `${(c.total / maxSl) * 100}%` }} />
                            </div>
                            <div className="text-xs text-gray-600 w-5 text-right font-semibold">{c.total}</div>
                            {c.hot > 0 && <span className="text-[9px] text-orange-600 border border-orange-300 px-1.5 py-0.5 rounded">{c.hot}🔥</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top priority leads */}
                  {topLeads.length > 0 && (
                    <div className="mt-5">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">TOP PRIORITAIRES</div>
                      <div className="space-y-2">
                        {topLeads.map((r, i) => {
                          const s = getScore(r);
                          return (
                            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-gray-100 last:border-0">
                              <div className={`text-base font-black w-7 text-center ${s >= 9 ? 'text-orange-600' : 'text-yellow-600'}`}>{s}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-800 truncate">{(r.Lead || r['Nom Lead'] || r.Email || '—').substring(0, 20)}</div>
                                <div className="text-[10px] text-gray-400">{(r as any).Company || (r as any).Societe || ''} · {(r.Service_Line || r.service_line || '').substring(0, 12)}</div>
                              </div>
                              <span className={`text-[9px] border px-1.5 py-0.5 rounded font-bold ${getCoClass(r)}`}>{getCoLabel(r)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sales Pipeline */}
                <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-sm font-black uppercase tracking-widest text-gray-900">SALES PIPELINE</div>
                    <span className="text-xs px-2.5 py-1 rounded-full border border-teal-300 text-teal-700 bg-teal-50 font-semibold">
                      {j1.length + j3.length + j7.length} relances
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'J+1 · CHECK-IN',     val: j1.length, cls: 'text-teal-600',   t3d: j1t3d.length, md: j1md.length, color: 'bg-teal-500' },
                      { label: 'J+3 · PRÉSENTATION', val: j3.length, cls: 'text-purple-600', t3d: j3t3d.length, md: j3md.length, color: 'bg-purple-500' },
                      { label: 'J+7 · URGENCE CTA',  val: j7.length, cls: 'text-orange-600', t3d: j7t3d.length, md: j7md.length, color: 'bg-orange-500' },
                    ].map(cell => (
                      <div key={cell.label} className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 text-center">
                        <div className={`text-4xl font-black leading-none ${cell.cls}`}>{cell.val}</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1.5 mb-3">{cell.label}</div>
                        <div className="space-y-1.5">
                          {[{ lbl: 'T3D', n: cell.t3d }, { lbl: 'MD3D', n: cell.md }].map(row => (
                            <div key={row.lbl} className="flex items-center gap-2">
                              <div className="text-[9px] font-bold text-gray-400 w-8 text-right">{row.lbl}</div>
                              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${cell.color} rounded-full transition-all`} style={{ width: `${(row.n / Math.max(cell.val, 1)) * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Approve Lead Queue */}
                <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-6 shadow-sm">
                  <div className="text-sm font-black uppercase tracking-widest text-gray-900 mb-4">
                    FILE D'APPROBATION LEADS
                    <span className="text-xs ml-3 text-gray-400 font-normal normal-case tracking-normal">CLOUD VPS</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={approveNextLead}
                      disabled={approveBusy}
                      className="flex-1 min-w-[140px] py-3 text-xs font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
                    >
                      [ APPROUVER PROCHAIN ]
                    </button>
                    <button
                      onClick={approveAllLeads}
                      disabled={approveBusy}
                      className="flex-1 min-w-[140px] py-3 text-xs font-black uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-300 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
                    >
                      [ APPROUVER TOUS ]
                    </button>
                  </div>
                  <div className={`mt-3 text-xs font-mono tracking-wide ${approveStatusColor}`}>{approveStatus}</div>
                </div>

                {/* Leads Table */}
                <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 flex items-center gap-3 border-b border-gray-100">
                    <div className="text-sm font-black uppercase tracking-widest text-gray-900">LEADS RÉCENTS</div>
                    <span className="text-xs px-2.5 py-1 rounded-full border border-teal-300 text-teal-700 bg-teal-50 font-semibold">{crm.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          {['DATE', 'CIBLE', 'NOM / EMAIL', 'SCORE', 'SERVICE', 'SUIVI', 'PRIORITÉ'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {recentLeads.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">AUCUN LEAD · EN ATTENTE</td></tr>
                        ) : recentLeads.map((r, i) => {
                          const s = getScore(r);
                          const suivi = (r.Suivi || '').toLowerCase();
                          const suiviLbl = suiviLabel(r.Suivi || '');
                          const pri = (r.Priority || r['Priorité'] || r.Priorite || '');
                          return (
                            <tr key={i} className="border-b border-gray-50 hover:bg-teal-50/30 transition-colors" title={r.Raison || ''}>
                              <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap font-mono">{r.Date || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${getCoClass(r)}`}>{getCoLabel(r)}</span>
                              </td>
                              <td className="px-4 py-3 text-xs font-medium text-gray-800">{(r.Lead || r['Nom Lead'] || r.Email || '—').substring(0, 20)}</td>
                              <td className="px-4 py-3 text-center">
                                {s > 0
                                  ? <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${getScoreClass(s)}`}>{s}</span>
                                  : <span className="text-gray-300">—</span>
                                }
                              </td>
                              <td className="px-4 py-3">
                                {(r.Service_Line || r.service_line) && (
                                  <span className="text-[10px] font-bold text-purple-600 border border-purple-200 bg-purple-50 px-1.5 py-0.5 rounded">
                                    {(r.Service_Line || r.service_line || '').substring(0, 8).toUpperCase()}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {suiviLbl && (
                                  <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${getSuiviClass(suivi)}`}>{suiviLbl}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {pri && (
                                  <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${getPriorityClass(pri)}`}>{pri.toUpperCase()}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {crm.length > leadsLimit && (
                      <div className="p-4 text-center">
                        <button
                          onClick={() => setLeadsLimit(l => l + 100)}
                          className="text-[10px] font-bold uppercase tracking-widest text-teal-600 border border-teal-300 px-4 py-1.5 rounded hover:bg-teal-50 transition-colors"
                        >
                          [ VOIR PLUS · {crm.length - leadsLimit} RESTANTS ]
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Right column: Reminders ── */}
              <div className="w-72 shrink-0">
                <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-5 shadow-sm sticky top-24">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-sm font-black uppercase tracking-widest text-gray-900">RAPPELS</div>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-teal-300 text-teal-700 bg-teal-50 font-semibold">{activeReminders.length}</span>
                  </div>
                  {activeReminders.length === 0 ? (
                    <div className="text-sm text-center text-gray-400 py-6">AUCUN RAPPEL ACTIF</div>
                  ) : (
                    <div className="space-y-3">
                      {activeReminders.map((r, i) => (
                        <div key={i} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                          <div className="text-orange-500 mt-0.5 text-sm shrink-0">⏰</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-700 leading-snug">{r.Rappel || '—'}</div>
                            <div className="text-[10px] text-gray-400 mt-1 font-mono">{r.DateTime || r.Date || '—'}</div>
                          </div>
                          <span className="text-[9px] font-bold text-yellow-600 border border-yellow-300 bg-yellow-50 px-2 py-0.5 rounded shrink-0 h-fit mt-0.5">
                            EN ATTENTE
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-[10px] text-gray-400 font-mono uppercase tracking-widest flex justify-between border-t border-gray-200 pt-4">
            <span>LEADS & PIPELINE · n8n.tacit3d.com</span>
            <span>SYNC: {lastSync}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
