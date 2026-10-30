import { S, save, award, badge, BADGES, toast, hud } from '/engine.js';
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const d = (s) => !!S.days[s];
export const BLADES = [
  { id: 'model', name: 'THE MODEL', c: '#B05BFF', need: 'w4d1', label: 'Week 4 · Day 1 (Ollama)', what: 'The brain. A local LLM (Llama via Ollama) running on your own box, so TLC data never leaves your control.', days: ['w4d1', 'w4d4'] },
  { id: 'backend', name: 'BACKEND (PYTHON)', c: '#FFD43B', need: 'w1d1', label: 'Week 1 · Day 1', what: 'Python glues everything: reads files, talks to Postgres, calls the model, returns answers.', days: ['w1d1', 'w1d2', 'w1d3'] },
  { id: 'api', name: 'API', c: '#FF5A1F', need: 'w2d3', label: 'Week 2 · Day 3 (pooling)', what: 'The neon wire between your app and the world. FastAPI endpoints + connection pooling + read replicas so it survives traffic.', days: ['w2d1', 'w2d2', 'w2d3'] },
  { id: 'db', name: 'DATABASE', c: '#FF8A3D', need: 'w1d5', label: 'Week 1 · Day 5 (indexes)', what: 'Postgres: where every shift, client and document lives. Indexes make it fast; EXPLAIN ANALYZE proves it.', days: ['w1d4', 'w1d5', 'w1d6'] },
  { id: 'search', name: 'SEARCH INDEX', c: '#FFD43B', need: 'w4d2', label: 'Week 4 · Day 2 (pgvector)', what: 'TLC documents chopped into chunks, turned into vectors and stored with pgvector, so the assistant finds the right paragraph.', days: ['w4d2', 'w4d3'] },
  { id: 'security', name: 'SECURITY', c: '#B05BFF', need: 'w3d3', label: 'Week 3 · Day 3 (RLS)', what: 'Roles, SCRAM, SSL and Row Level Security: each staff member only sees the rows they are allowed to. Privacy Act + NDIS ready.', days: ['w3d1', 'w3d2', 'w3d3', 'w3d4'] },
  { id: 'deploy', name: 'DEPLOY / MONITOR', c: '#FF5A1F', need: 'w4d7', label: 'the Capstone (W4 SHIP)', what: 'Shipped on Vercel + Supabase with evals, logs and alerts. The complete system, live.', days: ['w4d5', 'w4d6', 'w4d7'] },
];
export const built = () => BLADES.filter(b => d(b.need));
const esc = (s) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

function glow(el) {
  if (RM || !el) return; const r = el.getBoundingClientRect();
  for (let i = 0; i < 16; i++) { const g = document.createElement('i'); g.className = 'glowpop'; g.style.left = r.left + r.width / 2 + 'px'; g.style.top = r.top + r.height / 2 + 'px'; g.style.setProperty('--dx', (Math.random() * 300 - 150) + 'px'); g.style.setProperty('--dy', (Math.random() * 200 - 100) + 'px'); document.body.appendChild(g); setTimeout(() => g.remove(), 1000); }
}

function renderRack(host) {
  const seen = S.rackSeen || {};
  host.innerHTML = `<div class="rack"><div class="frame">${BLADES.map((b, i) => {
    const on = d(b.need);
    return `<button class="blade ${b.id} ${on ? 'on' : ''}" style="--c:${b.c};animation-delay:${i * .12}s" data-blade="${b.id}" aria-label="${b.name}: ${on ? 'built' : 'locked, unlock by clearing ' + b.label}"><span class="led"></span>${b.name}${on ? '' : `<span class="lk">🔒 ${b.label}</span>`}</button>`;
  }).join('')}</div></div>`;
  const panel = host.closest('.rk')?.querySelector('[data-rack-panel]');
  host.querySelectorAll('[data-blade]').forEach(btn => btn.addEventListener('click', () => {
    const b = BLADES.find(x => x.id === btn.dataset.blade); const on = d(b.need);
    const html = `<h3>${on ? '✅' : '🔒'} ${b.name}</h3><p>${b.what}</p><p>${on ? 'Built. Nice.' : `Unlock by clearing <b>${b.label}</b>.`}</p><div class="row">${b.days.map(s => `<a class="btn w" href="/day/${s}">${s.toUpperCase()} →</a>`).join('')}</div>`;
    if (panel) panel.innerHTML = html; else location.href = '/rack#b-' + b.id;
  }));
  // newly unlocked → glow
  BLADES.forEach(b => { if (d(b.need) && !seen[b.id]) { seen[b.id] = 1; setTimeout(() => { glow(host.querySelector(`[data-blade=${b.id}]`)); toast(`🧱 Blade installed: ${b.name}`); }, 900); } });
  S.rackSeen = seen; save();
  document.querySelectorAll('[data-rack-count]').forEach(e => e.textContent = built().length);
  if (built().length === 7 && host.closest('[data-rack-full]')) { award('rack:7', 300, 'RACK COMPLETE 7/7', host); badge('rack'); }
}
if (!BADGES.find(b => b[0] === 'rack')) BADGES.push(['rack', '🗄️', 'Rack Builder', 'Build all 7 rack blades']);
document.querySelectorAll('[data-rack]').forEach(renderRack);
const deep = location.hash.match(/^#b-(\w+)/); if (deep) document.querySelector(`[data-blade=${deep[1]}]`)?.click();

// ---------- STORY ----------
const SCENES = [
  { cap: 'Everyone *collects* AI tools.', vis: 'tools' },
  { cap: 'Almost nobody can ^build^ the system.', vis: 'empty' },
  { cap: 'An AI engineer builds a complete rack. Start: *0/7*.', vis: 'rack0' },
  { cap: 'Blade 1: ~THE MODEL~ — a local LLM on your box.', vis: 'blade', n: 1 },
  { cap: 'Blade 2: ^BACKEND^ in *Python* to glue it all.', vis: 'blade', n: 2 },
  { cap: 'Blade 3: the *API* — the glowing wire to the world.', vis: 'blade', n: 3 },
  { cap: 'Blade 4: ^DATABASE^ — Postgres holds the truth.', vis: 'blade', n: 4 },
  { cap: 'Now take the ~TLC DOCUMENTS~ …', vis: 'docs' },
  { cap: '…break them into *chunks* …', vis: 'chunks' },
  { cap: '…and store them in the ^SEARCH INDEX^. 5/7.', vis: 'blade', n: 5 },
  { cap: 'Staff ask: "What’s our *incident reporting* policy?"', vis: 'query' },
  { cap: 'The right chunks get pulled out. The assistant ^answers with sources^.', vis: 'answer' },
  { cap: 'Then *10,000 users* show up.', vis: 'users' },
  { cap: 'Cost spikes. Latency climbs. ^Errors^ appear.', vis: 'bars' },
  { cap: 'And private client data must stay ~locked~. 🔒', vis: 'lock' },
  { cap: 'Blade 6: *SECURITY* — roles + Row Level Security.', vis: 'blade', n: 6 },
  { cap: 'Blade 7: ^DEPLOY / MONITOR^. 7/7 BUILT.', vis: 'blade', n: 7 },
  { cap: 'Learn to build *complete systems*, not collect AI tools.', vis: 'road' },
];
// multi-word highlights: mark continuation words
function capFix(t) { let cls = ''; return t.split(' ').map(w => { const open = w.match(/^[*^~]/); const close = /[*^~][.,!?…"]*$/.test(w);
  if (open) cls = open[0]; const ww = w.replace(/[*^~]/g, ''); const c = cls ? { '*': 'hl', '^': 'hy', '~': 'hp' }[cls] : ''; if (close) cls = ''; return `<span class="${c}">${esc(ww)}</span>`; }).join(' '); }
function miniRack(n) { return `<div class="rack" style="width:min(250px,70vw);margin:0 auto"><div class="frame">${BLADES.map((b, i) => `<div class="blade ${i < n ? 'on' : ''} ${b.id}" style="--c:${b.c};height:26px;font-size:.62rem"><span class="led"></span>${b.name}</div>`).join('')}</div></div>`; }
const ORDER = ['model', 'backend', 'api', 'db', 'search', 'security', 'deploy'];
function visHTML(s) {
  switch (s.vis) {
    case 'tools': return ['ChatGPT', 'Claude', 'Cursor', 'Midjourney', 'Copilot', 'Perplexity'].map(x => `<span class="chip">${x}</span>`).join('');
    case 'empty': case 'rack0': return miniRack(0);
    case 'blade': return miniRack(s.n);
    case 'docs': return ['Incident Reporting Policy', 'Refund Policy', 'Privacy Policy'].map(x => `<span class="chip" style="background:#FFF4E6;color:#000">📄 ${x}</span>`).join('');
    case 'chunks': return Array.from({ length: 12 }, (_, i) => `<span class="chip" style="animation-delay:${i * .08}s;font-size:.65rem">chunk ${i + 1}</span>`).join('');
    case 'query': return `<div class="chat" style="max-width:440px"><div class="u">🧑 What’s our incident reporting policy?</div></div>`;
    case 'answer': return `<div class="chat" style="max-width:480px;text-align:left"><div class="u">🧑 What’s our incident reporting policy?</div><div class="a">🤖 Report any incident to your supervisor within 24 hours, log it in the incident register, and notify the NDIS Commission within 24 hours for reportable incidents. <i>[Incident Policy §2, §4]</i></div></div>`;
    case 'users': return `<div class="dots">${Array.from({ length: 120 }, () => `<i style="left:${Math.random() * 98}%;top:${Math.random() * 95}%;animation-delay:${Math.random()}s"></i>`).join('')}</div><div class="chip">10,000 USERS</div>`;
    case 'bars': setTimeout(() => document.querySelectorAll('.stage .bars i').forEach((e, i) => e.style.width = [92, 78, 64][i] + '%'), 60); return `<div class="bars"><b>💸 COST</b><div class="b"><i></i></div><b>🐢 LATENCY</b><div class="b"><i></i></div><b>❌ ERRORS</b><div class="b"><i></i></div></div>`;
    case 'lock': return `<div style="font-size:5rem">🔒</div><span class="chip">PRIVATE CLIENT DATA</span>`;
    case 'road': return `<div style="text-align:left">${['W1 · Python + Postgres + indexes', 'W2 · API, pooling, replication, load test', 'W3 · Security: roles, RLS, auth', 'W4 · Model + Search Index + Capstone'].map((x, i) => `<div class="chip" style="margin:6px 0;animation-delay:${i * .2}s">${x}</div>`).join('')}</div>`;
  }
  return '';
}
const story = document.querySelector('[data-story]');
if (story) {
  const cap = story.querySelector('.cap'), vis = story.querySelector('.vis'), bar = story.querySelector('.prog i'), cnt = story.querySelector('[data-story-count]');
  let i = -1, timer = null, playing = false, step = false;
  const builtAt = (k) => { const s = SCENES[k]; let n = 0; for (let j = 0; j <= k; j++) if (SCENES[j].vis === 'blade') n = SCENES[j].n; return n; };
  function show(k) {
    i = Math.max(0, Math.min(SCENES.length - 1, k)); const s = SCENES[i];
    cap.innerHTML = capFix(s.cap); vis.innerHTML = visHTML(s);
    cnt.textContent = builtAt(i); bar.style.width = ((i + 1) / SCENES.length * 100) + '%';
    const ws = [...cap.querySelectorAll('span')];
    ws.forEach((w, j) => RM ? w.classList.add('in') : setTimeout(() => w.classList.add('in'), j * 140));
    story.dataset.scene = i;
    if (i === SCENES.length - 1) { award('rack:story', 25, 'Watched the Rack story', story); }
  }
  function tick() { clearTimeout(timer); if (!playing || step) return; timer = setTimeout(() => { if (i < SCENES.length - 1) { show(i + 1); tick(); } else { playing = false; ui(); } }, 4200); }
  function ui() { story.querySelector('[data-s=play]').textContent = playing ? '⏸ Pause' : '▶ Play the story'; story.querySelector('[data-s=step]').textContent = step ? '🎯 Step mode: ON' : '🎯 Step mode'; }
  story.querySelector('[data-s=play]').onclick = () => { if (i >= SCENES.length - 1 || i < 0) show(0); playing = !playing; ui(); tick(); };
  story.querySelector('[data-s=next]').onclick = () => { show(i + 1); tick(); };
  story.querySelector('[data-s=prev]').onclick = () => { show(i - 1); tick(); };
  story.querySelector('[data-s=skip]').onclick = () => { playing = false; show(SCENES.length - 1); ui(); };
  story.querySelector('[data-s=step]').onclick = () => { step = !step; ui(); tick(); };
  addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowRight') story.querySelector('[data-s=next]').click(); if (e.key === 'ArrowLeft') story.querySelector('[data-s=prev]').click(); });
  show(0);
}

// ---------- RAG ----------
const DOCS = [
  { id: 'inc', t: 'Incident Reporting Policy', s: ['Any incident involving a participant must be reported to your supervisor immediately and within 24 hours.', 'Log every incident in the incident register with date, time, people involved and actions taken.', 'Reportable incidents such as serious injury, abuse or neglect must be notified to the NDIS Quality and Safeguards Commission within 24 hours.', 'Staff must not alter or delete incident records after submission.'] },
  { id: 'ref', t: 'Refund Policy', s: ['Clients may request a refund for cancelled services by emailing accounts within 14 days.', 'Refunds are processed to the original payment method within 10 business days.', 'Short-notice cancellations under 48 hours may be charged at 90 percent of the agreed fee.'] },
  { id: 'priv', t: 'Privacy Policy', s: ['Personal and health information is collected only for providing support and is stored securely in Australia.', 'Staff can access client records only for participants they are rostered to support.', 'Clients may request access to or correction of their personal information at any time.'] },
];
const SYN = { refund: 'refund', refunds: 'refund', money: 'refund', back: 'refund', cancel: 'cancel', cancelled: 'cancel', cancellation: 'cancel', cancellations: 'cancel', incident: 'incident', incidents: 'incident', accident: 'incident', injury: 'injury', report: 'report', reported: 'report', reporting: 'report', reportable: 'report', notify: 'report', notified: 'report', privacy: 'privacy', private: 'privacy', personal: 'privacy', data: 'information', information: 'information', records: 'record', record: 'record', access: 'access', see: 'access', days: 'day', day: 'day', hours: 'hour', hour: 'hour', ndis: 'ndis', commission: 'ndis', staff: 'staff', worker: 'staff', employees: 'staff' };
const STOP = new Set('the a an is are to of and or in for by our we what whats how do does with on at be may must any your their it this that i can'.split(' '));
const toks = (t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w && !STOP.has(w)).map(w => SYN[w] || w.replace(/s$/, ''));
const vec = (t) => { const v = {}; toks(t).forEach(w => v[w] = (v[w] || 0) + 1); return v; };
const cos = (a, b) => { let d = 0, na = 0, nb = 0; for (const k in a) { na += a[k] ** 2; if (b[k]) d += a[k] * b[k]; } for (const k in b) nb += b[k] ** 2; return d ? d / Math.sqrt(na * nb) : 0; };
const rag = document.querySelector('[data-rag]');
if (rag) {
  const idx = rag.querySelector('.index'), out = rag.querySelector('[data-rag-out]'), INDEX = [];
  rag.querySelector('.docs').innerHTML = DOCS.map(x => `<div class="doc" draggable="true" tabindex="0" role="button" data-doc="${x.id}">📄 ${x.t}<br><small>${x.s.length} chunks · click or drag</small></div>`).join('');
  function chunk(id) {
    const doc = DOCS.find(x => x.id === id); const el = rag.querySelector(`[data-doc=${id}]`); if (el.classList.contains('done')) return;
    el.classList.add('done');
    doc.s.forEach((s, j) => setTimeout(() => { const c = document.createElement('div'); c.className = 'ck'; c.textContent = `[${doc.t.split(' ')[0]} §${j + 1}] ${s}`; idx.appendChild(c); INDEX.push({ el: c, v: vec(s + ' ' + doc.t), s, src: `${doc.t} §${j + 1}` }); }, RM ? 0 : j * 220));
    idx.querySelector('.muted')?.remove();
    if (rag.querySelectorAll('.doc.done').length === DOCS.length) setTimeout(() => award('rack:rag', 30, 'Indexed all TLC docs', idx), 900);
  }
  rag.querySelectorAll('.doc').forEach(el => { el.onclick = () => chunk(el.dataset.doc); el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chunk(el.dataset.doc); } }; el.ondragstart = e => e.dataTransfer.setData('text', el.dataset.doc); });
  idx.ondragover = e => { e.preventDefault(); idx.classList.add('over'); }; idx.ondragleave = () => idx.classList.remove('over');
  idx.ondrop = e => { e.preventDefault(); idx.classList.remove('over'); chunk(e.dataTransfer.getData('text')); };
  rag.querySelector('form').onsubmit = (e) => {
    e.preventDefault(); const q = rag.querySelector('input').value.trim(); if (!q) return;
    if (!INDEX.length) { out.innerHTML = `<div class="chat">🤖 My index is empty. Chunk a document first (click a 📄).</div>`; return; }
    const qv = vec(q); const ranked = INDEX.map(c => ({ ...c, sc: cos(qv, c.v) })).sort((a, b) => b.sc - a.sc);
    INDEX.forEach(c => c.el.classList.remove('top')); const top = ranked.filter(c => c.sc > 0).slice(0, 2);
    top.forEach(c => c.el.classList.add('top'));
    out.innerHTML = `<div class="chat"><div class="u">🧑 ${esc(q)}</div><div class="a" data-answer>🤖 ${top.length ? `Based on TLC policy: ${top.map(c => esc(c.s)).join(' ')} <i>[${top.map(c => c.src).join(', ')}]</i>` : 'I could not find that in the indexed documents, so I won’t guess. (That refusal is a feature!)'}</div><small class="muted">scores: ${ranked.slice(0, 3).map(c => c.sc.toFixed(2)).join(' · ')}</small></div>`;
    if (top.length) award('rack:ask', 20, 'First RAG answer', out);
  };
}

// ---------- STRESS ----------
const sbtn = document.querySelector('[data-stress-btn]');
if (sbtn) {
  const box = document.querySelector('[data-stress]'); const rk = sbtn.closest('.rk');
  const ITEMS = [
    ['👥 10,000 users', 'One Postgres can’t take every connection.', 'Pooling + read replicas', ['w2d3', 'w2d2', 'w2d5'], 'w2d3'],
    ['💸 Cost', 'Every question to a paid API costs money.', 'Local model via Ollama', ['w4d1'], 'w4d1'],
    ['🐢 Latency', 'Slow queries = slow answers.', 'Indexes + HNSW vector index', ['w1d5', 'w4d2'], 'w4d2'],
    ['❌ Errors', 'Bad answers and crashes under load.', 'Load tests + evals', ['w2d5', 'w4d4'], 'w4d4'],
    ['🔒 Privacy', 'Staff must only see their clients’ data.', 'Row Level Security + auth', ['w3d3', 'w3d4'], 'w3d3'],
  ];
  sbtn.onclick = () => {
    const on = !rk.classList.toggle('stress-on') ? false : true; sbtn.textContent = on ? '🧯 Stop stress test' : '🔥 Stress test the rack';
    box.innerHTML = on ? `<div class="stress">${ITEMS.map(([h, p, fix, ds, need]) => `<div class="st ${d(need) ? 'fixed' : ''}"><h4>${h}</h4><div>${p}</div><div><b>${d(need) ? '✅ Solved by you:' : 'Fix:'}</b> ${fix}</div><div class="row" style="margin-top:6px">${ds.map(s => `<a href="/day/${s}">${s.toUpperCase()}</a>`).join(' ')}</div></div>`).join('')}</div>` : '';
  };
}
hud();
