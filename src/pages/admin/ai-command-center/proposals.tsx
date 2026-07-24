import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import Link from 'next/link';

// ═══════════════════════════════════════════════
// Config Webhooks n8n
// ═══════════════════════════════════════════════
const API_N8N           = '/api/n8n/dashboard-data';
const VENDEUR_WEBHOOK   = '/api/n8n/vendeur-proposal';
const PROPOSAL_WEBHOOK  = '/api/n8n/send-proposal-approved';
const MARK_POSTED       = '/api/n8n/mark-draft-posted';

interface Proposal {
  lead_name?: string;
  lead_email?: string;
  lead_company?: string;
  target_company?: string;
  score?: string;
  value?: string;
  subject?: string;
  email_text?: string;
}

export default function ProposalsPage() {
  // ── Form state ──
  const [avCo, setAvCo] = useState<'Tacit3D' | 'MyDesign3D'>('Tacit3D');
  const [avName, setAvName] = useState('');
  const [avEmail, setAvEmail] = useState('');
  const [avCompany, setAvCompany] = useState('');
  const [avService, setAvService] = useState('');
  const [avBudget, setAvBudget] = useState('');
  const [avPhone, setAvPhone] = useState('');
  const [avNotes, setAvNotes] = useState('');
  const [genStatus, setGenStatus] = useState('');
  const [genStatusColor, setGenStatusColor] = useState('text-gray-400');
  const [genBusy, setGenBusy] = useState(false);

  // ── Proposals state ──
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [rejectedEmails] = useState<Set<string>>(new Set());
  const [propStatuses, setPropStatuses] = useState<Record<number, { msg: string; color: string }>>({});
  const [propBusy, setPropBusy] = useState<Record<number, boolean>>({});
  const [editedSubjects, setEditedSubjects] = useState<Record<number, string>>({});
  const [editedBodies, setEditedBodies] = useState<Record<number, string>>({});

  // ── Sync state ──
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [lastSync, setLastSync] = useState('—');
  const [currentTime, setCurrentTime] = useState(new Date());
  const syncBusy = useRef(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

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
      const filtered = (d.proposals || []).filter((p: Proposal) => !rejectedEmails.has(p.lead_email || ''));
      setProposals(filtered);
      // Init edited states on first load
      setEditedSubjects(prev => {
        const next: Record<number, string> = { ...prev };
        filtered.forEach((p: Proposal, i: number) => { if (!(i in next)) next[i] = p.subject || ''; });
        return next;
      });
      setEditedBodies(prev => {
        const next: Record<number, string> = { ...prev };
        filtered.forEach((p: Proposal, i: number) => { if (!(i in next)) next[i] = p.email_text || ''; });
        return next;
      });
      setSystemStatus('online');
      setLastSync(new Date().toLocaleTimeString('fr-FR'));
    } catch {
      setSystemStatus('offline');
    } finally {
      syncBusy.current = false;
    }
  }

  async function genProposal() {
    if (!avName.trim() || !avEmail.trim()) {
      setGenStatus('⚠ Nom + email requis'); setGenStatusColor('text-red-600'); return;
    }
    setGenBusy(true);
    setGenStatus('⏳ Claude génère la proposition…');
    setGenStatusColor('text-gray-400');
    try {
      const res = await fetch(VENDEUR_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_name: avName, lead_email: avEmail, lead_company: avCompany,
          lead_phone: avCo === 'Tacit3D' ? avPhone : '',
          service_type: avService, budget: avBudget, notes: avNotes, target_company: avCo,
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setGenStatus('✓ Proposition générée — apparaît dans le panel ci-dessous dans quelques secondes');
      setGenStatusColor('text-emerald-600');
      setAvName(''); setAvEmail(''); setAvCompany(''); setAvService(''); setAvBudget(''); setAvNotes(''); setAvPhone('');
      // Poll to refresh
      let polls = 0;
      const poll = setInterval(async () => {
        polls++;
        await loadData();
        if (polls >= 8) clearInterval(poll);
      }, 4000);
      pollRef.current = poll;
    } catch (e: any) {
      setGenStatus(`✗ ${e.message}`); setGenStatusColor('text-red-600');
    }
    setGenBusy(false);
  }

  async function approveProposal(idx: number) {
    const p = proposals[idx];
    if (!p) return;
    setPropBusy(b => ({ ...b, [idx]: true }));
    setPropStatuses(s => ({ ...s, [idx]: { msg: '⏳ Envoi en cours...', color: 'text-gray-400' } }));
    try {
      const payload = {
        ...p,
        subject: editedSubjects[idx] || p.subject,
        email_text: editedBodies[idx] || p.email_text,
      };
      const res = await fetch(PROPOSAL_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setPropStatuses(s => ({ ...s, [idx]: { msg: `✓ Proposition envoyée à ${p.lead_email}`, color: 'text-emerald-600' } }));
      setTimeout(() => {
        setProposals(ps => ps.filter((_, i) => i !== idx));
        fetch(MARK_POSTED, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company: p.target_company, role: 'proposal_pending', email: p.lead_email }) }).catch(() => {});
      }, 2000);
    } catch (e: any) {
      setPropStatuses(s => ({ ...s, [idx]: { msg: `✗ ${e.message}`, color: 'text-red-600' } }));
      setPropBusy(b => ({ ...b, [idx]: false }));
    }
  }

  function rejectProposal(idx: number) {
    const p = proposals[idx];
    if (p?.lead_email) rejectedEmails.add(p.lead_email);
    setProposals(ps => ps.filter((_, i) => i !== idx));
    if (p) fetch(MARK_POSTED, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company: p.target_company, role: 'proposal_pending', email: p.lead_email }) }).catch(() => {});
  }

  const scoreClass = (s?: string) => {
    if (s === 'high')   return 'text-red-600 border-red-300 bg-red-50';
    if (s === 'medium') return 'text-yellow-600 border-yellow-300 bg-yellow-50';
    return 'text-emerald-600 border-emerald-300 bg-emerald-50';
  };
  const coClass = (c?: string) => {
    const lower = (c || '').toLowerCase();
    return lower.includes('tacit') ? 'text-orange-600 border-orange-300 bg-orange-50' : lower.includes('mydesign') ? 'text-teal-600 border-teal-300 bg-teal-50' : 'text-purple-600 border-purple-300 bg-purple-50';
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
              <h1 className="text-xl font-black tracking-tight text-gray-900">PROPOSITIONS</h1>
              {proposals.length > 0 && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-orange-300 text-orange-600 bg-orange-50">
                  {proposals.length} EN ATTENTE
                </span>
              )}
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

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* ── Agent Vendeur Form ── */}
          <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-7 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5">AGENT VENDEUR · GÉNÉRER PROPOSITION</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Nom lead *</label>
                <input value={avName} onChange={e => setAvName(e.target.value)} placeholder="Ahmed Al-Rashid"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Email lead *</label>
                <input value={avEmail} onChange={e => setAvEmail(e.target.value)} type="email" placeholder="ahmed@emaar.ae"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Société lead</label>
                <input value={avCompany} onChange={e => setAvCompany(e.target.value)} placeholder="Emaar Properties"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Service demandé</label>
                <input value={avService} onChange={e => setAvService(e.target.value)} placeholder="BIM modeling, Revit docs..."
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Budget estimé</label>
                <input value={avBudget} onChange={e => setAvBudget(e.target.value)} placeholder="$5,000 - $15,000"
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors" />
              </div>
              {avCo === 'Tacit3D' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Téléphone (WhatsApp) <span className="text-gray-300">· T3D only</span>
                  </label>
                  <input value={avPhone} onChange={e => setAvPhone(e.target.value)} placeholder="+974 5000 0000"
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors" />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Compagnie cible</label>
                <div className="flex gap-2 mt-1">
                  {(['Tacit3D', 'MyDesign3D'] as const).map(co => (
                    <button key={co} onClick={() => setAvCo(co)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        avCo === co
                          ? 'border-orange-400 text-orange-700 bg-orange-50 shadow-sm'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {co === 'Tacit3D' ? 'T3D' : 'MD3D'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Notes / contexte</label>
              <textarea value={avNotes} onChange={e => setAvNotes(e.target.value)} rows={3} placeholder="Contexte du lead, projet spécifique, urgence..."
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors resize-none" />
            </div>

            <button
              onClick={genProposal}
              disabled={genBusy}
              className="w-full py-3.5 text-sm font-black uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
            >
              {genBusy ? '⏳ GÉNÉRATION EN COURS…' : '[ ⚡ GÉNÉRER PROPOSITION (Claude) ]'}
            </button>
            {genStatus && <div className={`mt-2 text-xs font-mono tracking-wide ${genStatusColor}`}>{genStatus}</div>}
          </div>

          {/* ── Propositions en Attente ── */}
          {proposals.length > 0 && (
            <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-7 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">PROPOSITIONS EN ATTENTE</div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-orange-300 text-orange-600 bg-orange-50">
                  {proposals.length} EN ATTENTE
                </span>
              </div>

              <div className="space-y-6">
                {proposals.map((p, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                    {/* Proposal header */}
                    <div className="bg-gray-50/80 px-5 py-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-gray-800">{p.lead_name || '—'}</span>
                          <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${coClass(p.target_company)}`}>{p.target_company || '?'}</span>
                        </div>
                        <div className="text-xs text-gray-500">📧 {p.lead_email || '—'}{p.lead_company ? ` · ${p.lead_company}` : ''}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {p.score && <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${scoreClass(p.score)}`}>{(p.score || '?').toUpperCase()}</span>}
                        {p.value && <span className="text-xs font-bold text-emerald-600">{p.value}</span>}
                      </div>
                    </div>

                    {/* Editable subject */}
                    <div className="px-5 pt-4">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Sujet (modifiable)</label>
                      <input
                        value={editedSubjects[i] ?? (p.subject || '')}
                        onChange={e => setEditedSubjects(s => ({ ...s, [i]: e.target.value }))}
                        className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors font-medium text-teal-700"
                      />
                    </div>

                    {/* Editable email body */}
                    <div className="px-5 pt-3 pb-4">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">EMAIL — MODIFIER AVANT ENVOI</label>
                      <textarea
                        value={editedBodies[i] ?? (p.email_text || '')}
                        onChange={e => setEditedBodies(s => ({ ...s, [i]: e.target.value }))}
                        rows={8}
                        className="w-full text-xs bg-gray-900 text-gray-100 border border-gray-700 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 transition-colors font-mono resize-y"
                      />
                    </div>

                    {/* Actions */}
                    <div className="px-5 pb-5 flex gap-3 flex-wrap">
                      <button
                        onClick={() => approveProposal(i)}
                        disabled={propBusy[i]}
                        className="px-5 py-2 text-xs font-black uppercase tracking-widest text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
                      >
                        [ ✓ APPROUVER & ENVOYER ]
                      </button>
                      <button
                        onClick={() => rejectProposal(i)}
                        className="px-5 py-2 text-xs font-black uppercase tracking-widest text-red-600 border border-red-300 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                      >
                        [ ✗ REJETER ]
                      </button>
                    </div>
                    {propStatuses[i] && (
                      <div className={`px-5 pb-3 text-[10px] font-mono tracking-wide ${propStatuses[i].color}`}>
                        {propStatuses[i].msg}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {proposals.length === 0 && systemStatus !== 'loading' && (
            <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-10 shadow-sm text-center">
              <div className="text-4xl mb-3">📭</div>
              <div className="text-sm text-gray-500 font-medium">Aucune proposition en attente</div>
              <div className="text-xs text-gray-400 mt-1">Générez une proposition via le formulaire ci-dessus</div>
            </div>
          )}

          {/* Footer */}
          <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest flex justify-between border-t border-gray-200 pt-4">
            <span>PROPOSITIONS · n8n.tacit3d.com</span>
            <span>SYNC: {lastSync}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
