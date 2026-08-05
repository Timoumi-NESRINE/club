import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import Link from 'next/link';

// ═══════════════════════════════════════════════
// Config Webhooks n8n
// ═══════════════════════════════════════════════
const SIM_WEBHOOK    = '/api/n8n/marketing-publish';
const BLOG_WEBHOOK   = '/api/n8n/blog-drafts-direct';
const BLOG_PUBLISH   = '/api/n8n/blog-publish';
const MARK_POSTED    = '/api/n8n/mark-draft-posted';
const IMGBB_KEY      = 'e4b64f3ef2712a9ed60e44d1515b8e63';

const SIM_COMPANIES = {
  t3d:  { label: 'Tacit3D',    abbr: 'T3',  handle: 'tacit3d',    fbId: '115904864808192', igId: '17841459318915512' },
  md3d: { label: 'MyDesign3D', abbr: 'MD',  handle: 'mydesign3d', fbId: '611976142006243', igId: '17841402020476559' },
};

interface BlogDraft {
  company?: string;
  service?: string;
  site_url?: string;
  title?: string;
  meta_description?: string;
  excerpt?: string;
  content?: string;
  freepik_image_prompt?: string;
  freepik_filename?: string;
}

interface BlogData {
  weekId?: string;
  blogs?: BlogDraft[];
}

function esc(s: string) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export default function MarketingPage() {
  // ── Simulation post ──
  const [simCo, setSimCo] = useState<'t3d' | 'md3d'>('t3d');
  const [simPlatform, setSimPlatform] = useState<'fb' | 'ig' | 'li'>('fb');
  const [simText, setSimText] = useState('');
  const [simImg, setSimImg] = useState('');
  const [simStatus, setSimStatus] = useState('');
  const [simStatusColor, setSimStatusColor] = useState('text-gray-400');
  const [simBusy, setSimBusy] = useState(false);
  const [simUploadStatus, setSimUploadStatus] = useState('');
  const [simUploadColor, setSimUploadColor] = useState('text-gray-400');
  const [freepikPrompt, setFreepikPrompt] = useState('—');
  const [imgCopied, setImgCopied] = useState(false);

  // Image cache per company
  const imgCacheRef = useRef<Record<string, string>>(() => {
    try { const s = localStorage.getItem('simImgCache'); return s ? JSON.parse(s) : { t3d: '', md3d: '' }; } catch { return { t3d: '', md3d: '' }; }
  });
  const saveImgCache = () => { try { localStorage.setItem('simImgCache', JSON.stringify(imgCacheRef.current)); } catch {} };

  // ── Blog ──
  const [blogData, setBlogData] = useState<BlogData | null>(null);
  const [blogStatus, setBlogStatus] = useState('');
  const [blogEditedTitles, setBlogEditedTitles] = useState<Record<number, string>>({});
  const [blogEditedMeta, setBlogEditedMeta] = useState<Record<number, string>>({});
  const [blogEditedExcerpt, setBlogEditedExcerpt] = useState<Record<number, string>>({});
  const [blogImgUrls, setBlogImgUrls] = useState<Record<number, string>>({});
  const [blogItemStatus, setBlogItemStatus] = useState<Record<number, { msg: string; color: string }>>({});
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState('');
  const [rejectedBlogs, setRejectedBlogs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('rejected_blogs') || '[]')); } catch { return new Set(); }
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    loadBlogDrafts();
    const interval = setInterval(loadBlogDrafts, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Pre-fill img input from cache when co changes ──
  useEffect(() => {
    setSimImg(imgCacheRef.current[simCo] || '');
  }, [simCo]);

  // ── Update img cache on change ──
  useEffect(() => {
    if (simImg) { imgCacheRef.current[simCo] = simImg; saveImgCache(); }
  }, [simImg, simCo]);

  async function loadBlogDrafts() {
    try {
      const res = await fetch(BLOG_WEBHOOK);
      if (!res.ok) { setBlogStatus('Blog agent hors ligne'); return; }
      const text = await res.text();
      if (!text.trim()) { setBlogStatus('Aucun article en attente — prochain lundi 09h15'); return; }
      const data: BlogData = JSON.parse(text);
      if (data.blogs && data.blogs.length > 0) {
        setBlogData(data);
        setBlogStatus('');
      } else {
        setBlogStatus('Aucun article en attente — prochain lundi 09h15');
      }
    } catch {
      setBlogStatus('Blog agent hors ligne');
    }
  }

  // ── Generate blogs manually ──
  async function generateBlogs() {
    setGenerating(true);
    setGenerateStatus('⏳ Génération en cours (Claude ~60s)...');
    try {
      const res = await fetch(BLOG_WEBHOOK, { method: 'POST' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setGenerateStatus('✓ Génération lancée — chargement dans 60s...');
      // Wait 60s then reload
      setTimeout(() => {
        setGenerateStatus('');
        loadBlogDrafts();
      }, 60000);
    } catch (e: any) {
      setGenerateStatus('✗ Erreur: ' + e.message);
    } finally {
      setGenerating(false);
    }
  }

  // ── Upload image to ImgBB ──
  async function uploadToImgbb(file: File) {
    if (file.size > 32 * 1024 * 1024) { setSimUploadStatus('✗ Image trop grande (max 32MB)'); setSimUploadColor('text-red-600'); return; }
    setSimUploadStatus('⏳ Lecture image...'); setSimUploadColor('text-gray-400');
    const base64 = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = e => res((e.target!.result as string).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    setSimUploadStatus('⏳ Upload imgbb...');
    try {
      const form = new FormData();
      form.append('key', IMGBB_KEY);
      form.append('image', base64);
      form.append('name', file.name.replace(/\.[^.]+$/, ''));
      const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'imgbb fail');
      setSimImg(json.data.url);
      imgCacheRef.current[simCo] = json.data.url;
      saveImgCache();
      setSimUploadStatus(`✓ Image uploadée · ${(file.size / 1024).toFixed(0)}KB`);
      setSimUploadColor('text-emerald-600');
    } catch (e: any) {
      setSimUploadStatus('✗ ' + e.message); setSimUploadColor('text-red-600');
    }
  }

  async function uploadBlogImage(file: File, idx: number) {
    setBlogItemStatus(s => ({ ...s, [idx]: { msg: '⏳ upload imgbb...', color: 'text-gray-400' } }));
    try {
      const base64 = await new Promise<string>((res, rej) => {
        const r = new FileReader(); r.onload = e => res((e.target!.result as string).split(',')[1]); r.onerror = rej; r.readAsDataURL(file);
      });
      const form = new FormData();
      form.append('key', IMGBB_KEY); form.append('image', base64); form.append('name', file.name.replace(/\.[^.]+$/, ''));
      const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || 'imgbb fail');
      setBlogImgUrls(u => ({ ...u, [idx]: json.data.url }));
      setBlogItemStatus(s => ({ ...s, [idx]: { msg: `✓ ${(file.size / 1024).toFixed(0)}KB uploadée`, color: 'text-emerald-600' } }));
    } catch (e: any) {
      setBlogItemStatus(s => ({ ...s, [idx]: { msg: '✗ ' + e.message, color: 'text-red-600' } }));
    }
  }

  async function simPost() {
    if (!simText.trim()) { setSimStatus('⚠ Texte requis'); setSimStatusColor('text-red-600'); return; }
    const company = simCo === 't3d' ? 'Tacit3D' : 'MyDesign3D';
    const co = SIM_COMPANIES[simCo];
    const targets: ('fb' | 'ig' | 'li')[] = ['fb', 'li'];
    if (simImg) targets.push('ig');
    const platNames = { fb: 'Facebook', ig: 'Instagram', li: 'LinkedIn' };
    setSimBusy(true);
    setSimStatus(`⏳ Programmation ${targets.map(p => platNames[p]).join(' + ')}...`);
    setSimStatusColor('text-gray-400');
    const ok: string[] = [], fail: string[] = [];
    for (const platform of targets) {
      try {
        const res = await fetch(SIM_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company, platform, content: simText, caption: simText, image_url: simImg, mediaUrl: simImg, fb_page_id: co.fbId, ig_id: co.igId, source: 'dashboard-simulation' }),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        let slot = '';
        try { const j = await res.json(); slot = j?.slot || ''; } catch {}
        ok.push(platNames[platform] + (slot ? ' → ' + slot : ''));
      } catch (e: any) {
        fail.push(platNames[platform] + ' (' + e.message + ')');
      }
      await new Promise(r => setTimeout(r, 500));
    }
    const skipped = !simImg ? ' · Instagram sauté (pas d\'image)' : '';
    if (fail.length === 0) { setSimStatus(`✓ PROGRAMMÉ · ${company} — ${ok.join(' · ')}${skipped}`); setSimStatusColor('text-emerald-600'); }
    else if (ok.length === 0) { setSimStatus('✗ ÉCHEC: ' + fail.join(' | ')); setSimStatusColor('text-red-600'); }
    else { setSimStatus(`⚠ Partiel — PROGRAMMÉ: ${ok.join(' · ')} · ÉCHEC: ${fail.join(' | ')}`); setSimStatusColor('text-orange-600'); }
    if (ok.length > 0) {
      imgCacheRef.current[simCo] = '';
      saveImgCache();
      fetch(MARK_POSTED, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company }) }).catch(() => {});
    }
    setSimBusy(false);
  }

  async function blogPublish(idx: number, status: 'publish' | 'draft') {
    const blog = blogData?.blogs?.[idx];
    if (!blog) return;
    setBlogItemStatus(s => ({ ...s, [idx]: { msg: 'Publication en cours...', color: 'text-gray-400' } }));
    try {
      const res = await fetch(BLOG_PUBLISH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: blog.company,
          blog: {
            ...blog,
            title: blogEditedTitles[idx] || blog.title,
            meta_description: blogEditedMeta[idx] || blog.meta_description,
            excerpt: blogEditedExcerpt[idx] || blog.excerpt,
          },
          publish_status: status,
          weekId: blogData?.weekId,
          featured_image_url: blogImgUrls[idx] || null,
        }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const result = await res.json().catch(() => ({}));
      setBlogItemStatus(s => ({
        ...s, [idx]: {
          msg: status === 'publish' ? `Publié ✓${result.url ? ' · ' + result.url : ''}` : 'Sauvegardé en draft WP. ✓',
          color: 'text-teal-600',
        }
      }));
    } catch (e: any) {
      setBlogItemStatus(s => ({ ...s, [idx]: { msg: 'Erreur: ' + e.message, color: 'text-red-600' } }));
    }
  }

  function blogReject(idx: number) {
    const blog = blogData?.blogs?.[idx];
    const key = blogData ? `${blogData.weekId || ''}_${blog?.company || idx}` : String(idx);
    const newSet = new Set([...rejectedBlogs, key]);
    setRejectedBlogs(newSet);
    localStorage.setItem('rejected_blogs', JSON.stringify([...newSet]));
    setBlogItemStatus(s => ({ ...s, [idx]: { msg: 'Rejeté.', color: 'text-gray-400' } }));
  }

  // ── Social mockup ──
  const co = SIM_COMPANIES[simCo];
  const previewText = simText || 'Votre texte apparaîtra ici...';
  const isVideo = simImg && /\.(mp4|mov|avi|webm|mkv)(\?|$)/i.test(simImg);

  const MediaEl = ({ placeholder }: { placeholder: string }) => {
    if (!simImg) return <div className="text-gray-400 text-xs text-center p-5">📷 Aucun média</div>;
    if (isVideo) return <video src={simImg} controls muted className="w-full h-full object-cover" />;
    return <img src={simImg} alt="post" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="text-gray-400 text-xs p-5">⚠ Image non chargée</div>`; }} />;
  };

  const allPlatforms = ['fb' as const, 'ig' as const, 'li' as const];
  const allLabels = { fb: 'FACEBOOK', ig: 'INSTAGRAM', li: 'LINKEDIN' };

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
              <h1 className="text-xl font-black tracking-tight text-gray-900">MARKETING & BLOG</h1>
            </div>
            <div className="text-lg font-bold text-orange-600 tabular-nums">{currentTime.toLocaleTimeString('fr-FR')}</div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          {/* ── Simulation Post ── */}
          <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-7 shadow-sm">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">SIMULATION POST</div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT: editor */}
              <div className="space-y-4">
                {/* Company toggle */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Compagnie</label>
                  <div className="flex gap-2">
                    {(['t3d', 'md3d'] as const).map(c => (
                      <button key={c} onClick={() => setSimCo(c)}
                        className={`px-4 py-2 text-xs font-black rounded-lg border transition-all ${
                          simCo === c
                            ? 'border-orange-400 text-orange-700 bg-orange-50 shadow-sm'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {c === 't3d' ? 'TACIT3D' : 'MYDESIGN3D'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Texte du post</label>
                  <textarea value={simText} onChange={e => setSimText(e.target.value)} rows={6}
                    placeholder="Contenu du post..."
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-teal-500 transition-colors resize-none"
                  />
                </div>

                {/* Freepik prompt */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">PROMPT IMAGE · FREEPIK</label>
                  <div
                    className="text-xs text-gray-600 border border-amber-200 bg-amber-50/60 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-amber-100/60 transition-colors min-h-10"
                    title="Cliquer pour copier"
                    onClick={() => {
                      if (freepikPrompt && freepikPrompt !== '—') {
                        navigator.clipboard.writeText(freepikPrompt);
                        setImgCopied(true);
                        setTimeout(() => setImgCopied(false), 1500);
                      }
                    }}
                  >
                    {imgCopied ? <span className="text-teal-600 font-bold">✓ Copié !</span> : freepikPrompt}
                  </div>
                  <div className="text-[9px] text-gray-400 mt-1 tracking-wide">
                    ① Copie ce prompt  ② Génère sur <b>freepik.com</b>  ③ Upload sur <b>imgbb.com</b>  ④ Colle URL ci-dessous
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">IMAGE · UPLOAD LOCAL → IMGBB AUTO</label>
                  <label className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest border border-gray-200 bg-white hover:bg-gray-50 rounded-lg cursor-pointer transition-all text-gray-600 w-fit">
                    📁 CHOISIR FICHIER LOCAL
                    <input type="file" accept="image/*,video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadToImgbb(f); e.target.value = ''; }} />
                  </label>
                  {simUploadStatus && <div className={`mt-1.5 text-[10px] font-mono ${simUploadColor}`}>{simUploadStatus}</div>}

                  <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-3 mb-1.5">OU URL MANUELLE</label>
                  <input value={simImg} onChange={e => setSimImg(e.target.value)} type="url" placeholder="https://i.ibb.co/..."
                    className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors font-mono" />
                </div>

                {/* Post button */}
                <button
                  onClick={simPost}
                  disabled={simBusy}
                  className="w-full py-3.5 text-sm font-black uppercase tracking-widest text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all"
                >
                  {simBusy
                    ? '⏳ PROGRAMMATION...'
                    : `[ ▶ APPROUVER & PROGRAMMER${simImg ? ' (FB + IG + LI)' : ' (FB + LI)'} ]`
                  }
                </button>
                {simStatus && <div className={`text-xs font-mono tracking-wide ${simStatusColor}`}>{simStatus}</div>}
              </div>

              {/* RIGHT: mockup */}
              <div>
                {/* Platform tabs */}
                <div className="flex gap-2 mb-4">
                  {allPlatforms.map(p => (
                    <button key={p} onClick={() => setSimPlatform(p)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                        simPlatform === p
                          ? 'border-teal-400 text-teal-700 bg-teal-50'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {allLabels[p]}
                    </button>
                  ))}
                </div>

                {/* FB mockup */}
                {simPlatform === 'fb' && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden max-w-md font-sans text-[#050505]">
                    <div className="flex items-center gap-2 p-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">{co.abbr}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{co.label}</div>
                        <div className="text-xs text-gray-500">Sponsorisé · 🌐</div>
                      </div>
                    </div>
                    <div className="px-3 pb-2 text-sm leading-snug whitespace-pre-wrap">{previewText}</div>
                    {simImg && <div className="aspect-video bg-gray-100 overflow-hidden"><MediaEl placeholder="fb-img" /></div>}
                    <div className="px-3 py-2 text-xs text-gray-500 flex justify-between border-b border-gray-100">
                      <span>👍 J'aime · Commenter</span><span>Partager</span>
                    </div>
                    <div className="flex">
                      {['👍 J\'aime', '💬 Commenter', '↗ Partager'].map(a => (
                        <div key={a} className="flex-1 text-center py-2 text-xs text-gray-500 hover:bg-gray-50 cursor-pointer">{a}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LI mockup */}
                {simPlatform === 'li' && (
                  <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden max-w-md font-sans">
                    <div className="flex items-start gap-3 p-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white font-bold shrink-0">{co.abbr}</div>
                      <div>
                        <div className="font-semibold text-sm">{co.label}</div>
                        <div className="text-xs text-gray-500">{simCo === 't3d' ? 'BIM · Architecture · GCC · 1,200 followers' : 'Architecture · IT · Web · Switzerland · 850 followers'}</div>
                        <div className="text-xs text-gray-400">Maintenant · 🌐</div>
                      </div>
                    </div>
                    <div className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap text-gray-900">{previewText}</div>
                    {simImg && <div className="aspect-video bg-gray-100 overflow-hidden"><MediaEl placeholder="li-img" /></div>}
                    <div className="flex border-t border-gray-100">
                      {['👍 J\'aime', '💬 Commenter', '↗ Partager', '📤 Envoyer'].map(a => (
                        <div key={a} className="flex-1 text-center py-2 text-xs text-gray-500 hover:bg-gray-50 cursor-pointer font-medium">{a}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* IG mockup */}
                {simPlatform === 'ig' && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-w-xs font-sans">
                    <div className="flex items-center gap-2 p-3 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 p-0.5">
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xs font-bold text-pink-600">{co.abbr}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-800">{co.handle}</div>
                    </div>
                    {simImg
                      ? <div className="aspect-square bg-gray-100 overflow-hidden"><MediaEl placeholder="ig-img" /></div>
                      : <div className="aspect-square bg-gray-50 flex items-center justify-center text-gray-300 text-xs">📷 Aucune image</div>
                    }
                    <div className="p-3 text-sm text-gray-800">
                      <span className="font-semibold">{co.handle}</span> {previewText.substring(0, 100)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Blog Agent ── */}
          <div className="bg-white/70 backdrop-blur border border-white/80 rounded-2xl p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">BLOG AGENT · ARTICLES EN ATTENTE</div>
              {blogData?.blogs && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full border border-purple-300 text-purple-700 bg-purple-50">
                  {blogData.blogs.filter((_, i) => !rejectedBlogs.has(`${blogData.weekId || ''}_${blogData.blogs![i].company || i}`)).length} EN ATTENTE
                </span>
              )}
              <div className="ml-auto flex items-center gap-3">
                {generateStatus && <span className="text-[10px] font-mono text-gray-500">{generateStatus}</span>}
                <button
                  onClick={generateBlogs}
                  disabled={generating}
                  className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all disabled:opacity-50"
                >
                  {generating ? '⏳ EN COURS...' : '[ ▶ GÉNÉRER BLOGS ]'}
                </button>
                <button
                  onClick={loadBlogDrafts}
                  className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg transition-all"
                >
                  [ ↻ REFRESH ]
                </button>
              </div>
            </div>

            {blogStatus && (
              <div className="text-sm text-gray-500 font-mono py-4 text-center">{blogStatus}</div>
            )}

            {blogData?.blogs && blogData.blogs.length > 0 && (
              <div className="space-y-8">
                {blogData.blogs.map((blog, idx) => {
                  const blogKey = `${blogData.weekId || ''}_${blog.company || idx}`;
                  if (rejectedBlogs.has(blogKey)) return null;
                  const compColor = blog.company === 'tacit3d' ? 'text-teal-600 border-teal-300 bg-teal-50' : 'text-emerald-600 border-emerald-300 bg-emerald-50';
                  return (
                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                      {/* Blog header */}
                      <div className="bg-gray-50/80 px-5 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold border px-2 py-0.5 rounded uppercase tracking-widest ${compColor}`}>
                            {(blog.company || '').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">{(blog.service || '').replace(/_/g, ' ')}</span>
                        </div>
                        {blog.site_url && (
                          <a href={blog.site_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 hover:text-teal-600 transition-colors truncate max-w-[200px]">
                            {blog.site_url}
                          </a>
                        )}
                      </div>

                      <div className="px-5 pt-4 pb-2">
                        <div className="text-[9px] text-teal-600 font-bold uppercase tracking-widest mb-3">
                          ✎ MODIFIABLE — cliquez sur les champs pour éditer avant de publier
                        </div>

                        {/* Title */}
                        <div className="mb-3">
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Titre</label>
                          <input
                            value={blogEditedTitles[idx] ?? (blog.title || '')}
                            onChange={e => setBlogEditedTitles(t => ({ ...t, [idx]: e.target.value }))}
                            className="w-full text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors text-gray-800"
                          />
                        </div>

                        {/* Meta description */}
                        <div className="mb-3">
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Meta description</label>
                          <input
                            value={blogEditedMeta[idx] ?? (blog.meta_description || '')}
                            onChange={e => setBlogEditedMeta(m => ({ ...m, [idx]: e.target.value }))}
                            className="w-full text-xs italic bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors text-gray-600"
                          />
                        </div>

                        {/* Excerpt */}
                        <div className="mb-4">
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Extrait</label>
                          <textarea
                            value={blogEditedExcerpt[idx] ?? (blog.excerpt || '')}
                            onChange={e => setBlogEditedExcerpt(ex => ({ ...ex, [idx]: e.target.value }))}
                            rows={3}
                            className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors text-gray-700 resize-none"
                          />
                        </div>

                        {/* Freepik section */}
                        {blog.freepik_image_prompt && (
                          <div className="bg-teal-50/60 border border-teal-200 rounded-lg p-4 mb-4">
                            <div className="text-[9px] font-black uppercase tracking-widest text-teal-700 mb-2">IMAGE FEATURED · FREEPIK</div>
                            <div
                              className="text-xs text-gray-700 cursor-pointer hover:text-teal-700 transition-colors leading-relaxed"
                              onClick={() => navigator.clipboard.writeText(blog.freepik_image_prompt || '')}
                            >
                              {blog.freepik_image_prompt}
                            </div>
                            {blog.freepik_filename && (
                              <div className="mt-2 flex items-center justify-between bg-white/80 rounded px-3 py-1.5 text-[10px]">
                                <span className="font-mono text-gray-600">{blog.freepik_filename}</span>
                                <button
                                  onClick={() => navigator.clipboard.writeText(blog.freepik_filename || '')}
                                  className="text-teal-600 font-bold hover:underline"
                                >[ COPIER NOM ]</button>
                              </div>
                            )}
                            <div className="text-[9px] text-gray-400 mt-2">① Génère sur freepik.com ② Choisis fichier (upload imgbb auto) OU colle URL imgbb</div>
                            <div className="flex items-center gap-3 mt-2">
                              <label className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide border border-gray-200 bg-white hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-gray-600">
                                📁 CHOISIR IMAGE → IMGBB AUTO
                                <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadBlogImage(f, idx); e.target.value = ''; }} />
                              </label>
                              {blogItemStatus[idx] && (
                                <span className={`text-[10px] font-mono ${blogItemStatus[idx].color}`}>{blogItemStatus[idx].msg}</span>
                              )}
                            </div>
                            <input
                              value={blogImgUrls[idx] || ''}
                              onChange={e => setBlogImgUrls(u => ({ ...u, [idx]: e.target.value }))}
                              type="url"
                              placeholder="ou colle URL imgbb ici (https://i.ibb.co/...)"
                              className="mt-2 w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors font-mono"
                            />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="px-5 pb-5 flex gap-3 flex-wrap items-center">
                        <button onClick={() => blogPublish(idx, 'publish')}
                          className="px-5 py-2 text-xs font-black uppercase tracking-widest text-teal-700 border border-teal-300 bg-teal-50 hover:bg-teal-100 rounded-lg transition-all">
                          [ ▶ PUBLIER MAINTENANT ]
                        </button>
                        <button onClick={() => blogPublish(idx, 'draft')}
                          className="px-5 py-2 text-xs font-bold uppercase tracking-widest text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-all">
                          [ ✎ PUBLIER EN DRAFT ]
                        </button>
                        <button onClick={() => blogReject(idx)}
                          className="px-5 py-2 text-xs font-bold uppercase tracking-widest text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg transition-all">
                          [ ✕ REJETER ]
                        </button>
                        {blogItemStatus[idx] && (
                          <span className={`text-[10px] font-mono ${blogItemStatus[idx].color}`}>{blogItemStatus[idx].msg}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest flex justify-between border-t border-gray-200 pt-4">
            <span>MARKETING & BLOG · n8n.tacit3d.com</span>
            <span>{currentTime.toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
