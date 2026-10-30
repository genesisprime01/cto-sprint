// CTO Sprint learning layer: Leitner flashcards, command drills, recall sprint. Progress lives in the same localStorage as XP.
import { S, save, toast, boom, badge, award, hud } from '/engine.js';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const IV = [0, 1, 2, 4, 8, 16];
S.cards ||= {}; S.drills ||= {}; S.combo ||= 0;
let DATA = null;
const data = async () => (DATA ||= await (await fetch('/learn-data.json')).json());
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- Leitner ----------
export const box = (id) => S.cards[id]?.b || 0;
export const isDue = (id) => !S.cards[id] || S.cards[id].due <= today();
function grade(t, ok, el) {
  const c = S.cards[t.id] || { b: 0, due: today() };
  c.b = ok ? Math.min(5, c.b + 1) : 1; c.due = addDays(IV[c.b]); S.cards[t.id] = c; save();
  if (c.b >= 3) award('fc3:' + t.id, 5, `Term locked in: ${t.term}`, el);
  if (c.b >= 5) award('fc5:' + t.id, 5, `Term mastered: ${t.term}`, el);
  if (Object.values(S.cards).filter((x) => x.b >= 3).length >= 25) badge('lex');
  hud();
}

// ---------- fuzzy command check ----------
const lev = (a, b) => { const m = a.length, n = b.length; if (Math.abs(m - n) > 6) return 99; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const q = [i]; for (let j = 1; j <= n; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; } return p[n]; };
export function norm(s, cat) {
  let x = String(s).trim().replace(/^\$\s+/, '').replace(/[‘’`´]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ');
  if (cat !== 'python') x = x.replace(/"/g, "'");
  x = x.replace(/\s*([(),=;{}\[\]])\s*/g, '$1').replace(/;+$/, '');
  if (cat === 'sql' || cat === 'psql') x = x.toLowerCase();
  x = x.split(' ').reduce((acc, tok) => { if (/^-[a-zA-Z]+$/.test(tok) && /^-[a-zA-Z]+$/.test(acc.at(-1) || '')) acc[acc.length - 1] += tok.slice(1); else acc.push(tok); return acc; }, [])
    .map((t) => (/^-[a-zA-Z]{2,}$/.test(t) ? '-' + [...t.slice(1)].sort().join('') : t)).join(' ');
  return x;
}
export function checkDrill(d, input) {
  const v = norm(input, d.cat); if (!v) return { ok: false, close: false };
  let best = 99; for (const a of d.a) { const n = norm(a, d.cat); if (n === v) return { ok: true }; best = Math.min(best, lev(n, v)); }
  return { ok: false, close: best <= Math.max(2, Math.min(3, Math.floor(v.length * 0.15))) };
}
function drillResult(d, ok, el, comboEl) {
  const st = S.drills[d.id] ||= { ok: 0, bad: 0 }; st.last = today();
  if (ok) { st.ok++; S.combo = (S.combo || 0) + 1; S.bestCombo = Math.max(S.bestCombo || 0, S.combo); award('dr:' + d.id, 10, `Drill: ${d.cat}`, el); if (S.combo >= 10) badge('combo10'); if (S.combo % 5 === 0) { toast(`💥 COMBO x${S.combo}!`); award(`combo:${today()}:${S.combo}`, 5 * (S.combo / 5), `Combo x${S.combo}`, el); } }
  else { st.bad++; S.combo = 0; st.miss = 1; }
  if (ok) delete st.miss;
  if (Object.keys(S.got).filter((k) => k.startsWith('dr:')).length >= 50) badge('cmd50');
  save(); hud(); if (comboEl) comboEl.textContent = S.combo;
}

// ---------- widgets ----------
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const BOXN = ['new', '1d', '2d', '4d', '8d', '16d'];
export function flashCard(t, onDone) {
  const el = h(`<div class="fc" tabindex="0"><div class="fc-top"><span class="tag">${esc(t.cat)}</span><span class="tag w">W${t.week}</span><span class="tag box b${box(t.id)}">box ${box(t.id)} · ${BOXN[box(t.id)]}</span></div>
    <div class="fc-term">${esc(t.term)}</div><div class="fc-q muted">What is it? Say it out loud, then flip. <kbd>Space</kbd></div>
    <div class="fc-back" hidden><p><b>Plain:</b> ${esc(t.plain)}</p><p><b>Literally:</b> ${esc(t.literal)}</p><pre class="fc-ex">${esc(t.example)}</pre></div>
    <div class="row fc-btns"><button class="btn w" data-flip>🔄 Flip</button><button class="btn red" data-no hidden>😵 Missed (1)</button><button class="btn g" data-yes hidden>🧠 Got it (2)</button></div></div>`);
  const flip = () => { el.querySelector('.fc-back').hidden = false; el.querySelector('.fc-q').hidden = true; el.querySelector('[data-flip]').hidden = true; el.querySelector('[data-no]').hidden = false; el.querySelector('[data-yes]').hidden = false; el.classList.add('flipped'); };
  const done = (ok) => { if (el.dataset.done) return; el.dataset.done = 1; grade(t, ok, el); onDone?.(ok); };
  el.querySelector('[data-flip]').onclick = flip; el.querySelector('[data-no]').onclick = () => done(false); el.querySelector('[data-yes]').onclick = () => done(true);
  el.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (el.classList.contains('flipped')) done(true); else flip(); } if (el.classList.contains('flipped') && e.key === '1') done(false); if (el.classList.contains('flipped') && e.key === '2') done(true); });
  return el;
}
export function drillCard(d, { onDone, comboEl, autofocus = true, compact = false } = {}) {
  const passed = !!S.got['dr:' + d.id];
  const el = h(`<div class="drill${passed ? ' passed' : ''}"><div class="dr-top"><span class="tag">${esc(d.cat)}</span><span class="tag w">W${d.week}</span>${passed ? '<span class="tag g">✓ passed</span>' : ''}</div>
    <div class="dr-q">${esc(d.q)}</div>
    <div class="dr-in"><span class="ps">$</span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="type the command, Enter to check"></div>
    <div class="row dr-btns"><button class="btn" data-check>Check ⏎</button><button class="btn w" data-hint>💡 Hint</button><button class="btn w" data-show>👀 Answer</button>${compact ? '' : '<button class="btn w" data-skip>Skip →</button>'}</div>
    <div class="dr-fb" hidden></div></div>`);
  const inp = el.querySelector('input'), fb = el.querySelector('.dr-fb'); let tries = 0, finished = false;
  const show = (cls, html) => { fb.hidden = false; fb.className = 'dr-fb ' + cls; fb.innerHTML = html; };
  const why = () => `<div class="why"><b>Answer:</b> <code>${esc(d.a[0])}</code>${d.a.length > 1 ? ` <span class="muted">(also: ${d.a.slice(1).map((x) => `<code>${esc(x)}</code>`).join(' ')})</span>` : ''}<br><b>Why:</b> ${esc(d.why)}</div>`;
  const finish = (ok) => { finished = true; el.classList.add(ok ? 'ok' : 'bad'); inp.readOnly = true; const nx = h('<button class="btn p" data-next>Next ⏎</button>'); if (onDone) { el.querySelector('.dr-btns').append(nx); nx.onclick = () => onDone(ok); nx.focus(); } };
  const check = () => {
    if (finished) { onDone?.(el.classList.contains('ok')); return; }
    const r = checkDrill(d, inp.value); tries++;
    if (r.ok) { drillResult(d, true, el, comboEl); show('good', `✅ Nailed it.${tries > 1 ? ' (got there!)' : ''} ${why()}`); finish(true); boom(el.getBoundingClientRect().left + 60, el.getBoundingClientRect().top, 8); }
    else if (r.close) { show('close', '🤏 So close: check spelling, flags, quotes or spaces. Try again.'); el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400); }
    else if (tries >= 3) { drillResult(d, false, el, comboEl); show('badfb', `❌ Not quite. ${why()}<div class="muted">Type it once anyway: muscle memory beats reading.</div>`); finish(false); }
    else { show('badfb', `❌ Nope (${tries}/3). ${tries === 2 ? 'Hint: ' + esc(d.hint) : 'Try again or take a 💡 hint.'}`); el.classList.add('shake'); setTimeout(() => el.classList.remove('shake'), 400); }
  };
  el.querySelector('[data-check]').onclick = check;
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
  el.addEventListener('keydown', (e) => { if (finished && e.key === 'Enter' && e.target !== inp) { e.preventDefault(); onDone?.(el.classList.contains('ok')); } });
  el.querySelector('[data-hint]').onclick = () => show('hintfb', '💡 ' + esc(d.hint));
  el.querySelector('[data-show]').onclick = () => { if (!finished) { drillResult(d, false, el, comboEl); show('badfb', `👀 ${why()}`); finished = true; el.classList.add('bad'); inp.readOnly = false; inp.value = ''; inp.placeholder = 'now type it yourself for the rep'; inp.focus(); const nx = h('<button class="btn p">Next ⏎</button>'); if (onDone) { el.querySelector('.dr-btns').append(nx); nx.onclick = () => onDone(false); } } };
  el.querySelector('[data-skip]')?.addEventListener('click', () => { S.combo = 0; save(); if (comboEl) comboEl.textContent = 0; onDone?.(null); });
  if (autofocus) setTimeout(() => inp.focus({ preventScroll: compact }), 30);
  return el;
}

// ---------- /terms ----------
async function initTerms(root) {
  const { terms } = await data();
  const cats = [...new Set(terms.map((t) => t.cat))];
  root.innerHTML = `<div class="ctrl row"><input class="srch" type="search" placeholder="🔎 search ${terms.length} terms…" data-q>
    <select data-wk><option value="">All weeks</option>${[1, 2, 3, 4].map((w) => `<option value="${w}">Week ${w}</option>`).join('')}</select>
    <select data-cat><option value="">All topics</option>${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select></div>
    <div class="row seg"><button class="btn" data-mode="flash">🃏 Flashcards</button><button class="btn w" data-mode="list">📋 Browse</button><span class="pill" data-stat></span></div><div data-body></div>`;
  const q = root.querySelector('[data-q]'), wk = root.querySelector('[data-wk]'), ct = root.querySelector('[data-cat]'), body = root.querySelector('[data-body]'), stat = root.querySelector('[data-stat]');
  let mode = 'flash', queue = [];
  const filt = () => { const s = q.value.toLowerCase().trim(); return terms.filter((t) => (!wk.value || t.week == wk.value) && (!ct.value || t.cat === ct.value) && (!s || (t.term + ' ' + t.plain + ' ' + t.literal + ' ' + t.example).toLowerCase().includes(s))); };
  const stats = () => { const m = Object.values(S.cards); stat.innerHTML = `📦 due <b>${terms.filter((t) => isDue(t.id)).length}</b> · 🔒 locked (box 3+) <b>${m.filter((c) => c.b >= 3).length}</b> · 👑 mastered <b>${m.filter((c) => c.b >= 5).length}</b> / ${terms.length}`; };
  const next = () => {
    stats(); body.innerHTML = '';
    if (!queue.length) { body.append(h(`<div class="card done-card"><h3>🎉 Nothing due in this filter.</h3><p>Cards come back on a 1 → 2 → 4 → 8 → 16 day schedule. Want more reps?</p><button class="btn p" data-cram>Cram these anyway</button></div>`)); body.querySelector('[data-cram]').onclick = () => { queue = shuffle(filt()).slice(0, 20); next(); }; return; }
    const t = queue.shift(); body.append(h(`<div class="muted left">${queue.length} left in this stack</div>`));
    const c = flashCard(t, () => setTimeout(next, 250)); body.append(c); c.focus({ preventScroll: true });
  };
  const list = () => {
    stats(); const f = filt();
    body.innerHTML = `<div class="tlist">${f.map((t) => `<details class="term"><summary><b>${esc(t.term)}</b><span class="tag">${esc(t.cat)}</span><span class="tag w">W${t.week}</span><span class="tag box b${box(t.id)}">box ${box(t.id)}</span></summary><p>${esc(t.plain)}</p><p class="muted"><b>Literally:</b> ${esc(t.literal)}</p><pre>${esc(t.example)}</pre></details>`).join('') || '<p class="muted">No matches.</p>'}</div>`;
  };
  const render = () => { root.querySelectorAll('[data-mode]').forEach((b) => b.className = 'btn' + (b.dataset.mode === mode ? '' : ' w')); if (mode === 'list') list(); else { const f = filt(); queue = shuffle(f.filter((t) => isDue(t.id))).sort((a, b) => !!S.cards[b.id] - !!S.cards[a.id]).slice(0, 20); next(); } };
  root.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { mode = b.dataset.mode; render(); });
  q.oninput = () => { if (q.value) mode = 'list'; render(); }; wk.onchange = render; ct.onchange = render;
  render();
}

// ---------- /drills ----------
async function initDrills(root) {
  const { drills } = await data();
  const cats = [...new Set(drills.map((d) => d.cat))];
  root.innerHTML = `<div class="ctrl row"><select data-cat><option value="">All tools</option>${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select>
    <select data-wk><option value="">All weeks</option>${[1, 2, 3, 4].map((w) => `<option value="${w}">Week ${w}</option>`).join('')}</select>
    <button class="btn" data-mode="practice">🎯 Practice</button><button class="btn w" data-mode="timer">⏱ 60s Blitz</button></div>
    <div class="row hudrow"><span class="pill">✅ passed <b data-passed>0</b>/${drills.length}</span><span class="pill fire">💥 combo <b data-combo>${S.combo || 0}</b></span><span class="pill">🏆 best combo <b data-best>${S.bestCombo || 0}</b></span><span class="pill">⏱ blitz best <b data-tb>${S.blitzBest || 0}</b></span><span class="pill big" data-clock hidden></span></div><div data-body></div>`;
  const body = root.querySelector('[data-body]'), cat = root.querySelector('[data-cat]'), wk = root.querySelector('[data-wk]'), comboEl = root.querySelector('[data-combo]'), clock = root.querySelector('[data-clock]');
  let mode = 'practice', queue = [], timer = null, score = 0, end = 0;
  const stats = () => { root.querySelector('[data-passed]').textContent = drills.filter((d) => S.got['dr:' + d.id]).length; root.querySelector('[data-best]').textContent = S.bestCombo || 0; root.querySelector('[data-tb]').textContent = S.blitzBest || 0; };
  const filt = () => drills.filter((d) => (!cat.value || d.cat === cat.value) && (!wk.value || d.week == wk.value));
  const build = () => { const f = filt(); const miss = f.filter((d) => S.drills[d.id]?.miss), fresh = f.filter((d) => !S.got['dr:' + d.id] && !S.drills[d.id]?.miss), old = f.filter((d) => S.got['dr:' + d.id] && !S.drills[d.id]?.miss); queue = mode === 'timer' ? shuffle(f) : [...shuffle(miss), ...shuffle(fresh), ...shuffle(old)]; };
  const next = () => {
    stats(); body.innerHTML = '';
    if (mode === 'timer' && Date.now() > end) return stopBlitz();
    if (!queue.length) build();
    const d = queue.shift(); if (!d) { body.innerHTML = '<p class="muted">No drills in this filter.</p>'; return; }
    body.append(drillCard(d, { comboEl, onDone: (ok) => { if (mode === 'timer' && ok) { score++; } next(); } }));
  };
  const stopBlitz = () => { clearInterval(timer); timer = null; clock.hidden = true; const best = S.blitzBest || 0; if (score > best) { S.blitzBest = score; save(); } award(`blitz:${today()}`, 25, 'Daily 60s blitz', root); body.innerHTML = `<div class="card done-card"><h3>⏱ Time! ${score} correct${score > best ? ' · NEW BEST 🏆' : ''}</h3><button class="btn p" data-again>Go again</button></div>`; body.querySelector('[data-again]').onclick = start; stats(); };
  const start = () => { root.querySelectorAll('[data-mode]').forEach((b) => b.className = 'btn' + (b.dataset.mode === mode ? '' : ' w')); clearInterval(timer); clock.hidden = mode !== 'timer'; build();
    if (mode === 'timer') { score = 0; end = Date.now() + 60000; timer = setInterval(() => { const s = Math.max(0, Math.ceil((end - Date.now()) / 1000)); clock.textContent = `⏱ ${s}s · ${score} ✓`; if (!s) stopBlitz(); }, 250); }
    next(); };
  root.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { mode = b.dataset.mode; start(); });
  cat.onchange = start; wk.onchange = start; start();
}

// ---------- day page blocks ----------
async function initDay(el) {
  const { terms, drills } = await data();
  const tIds = el.dataset.terms.split(','), dIds = el.dataset.drills.split(',');
  const T = tIds.map((id) => terms.find((t) => t.id === id)).filter(Boolean), D = dIds.map((id) => drills.find((d) => d.id === id)).filter(Boolean);
  const tb = el.querySelector('[data-flash5]'); if (tb) tb.onclick = () => { const wrap = el.querySelector('[data-flashwrap]'); let i = 0; const go = () => { wrap.innerHTML = ''; if (i >= T.length) { wrap.innerHTML = '<p>✅ All 5 flashed. They’ll come back when due.</p>'; return; } const c = flashCard(T[i++], () => setTimeout(go, 200)); wrap.append(c); c.focus({ preventScroll: true }); }; go(); };
  const dw = el.querySelector('[data-drillwrap]'); if (dw) D.forEach((d) => dw.append(drillCard(d, { autofocus: false, compact: true })));
}

// ---------- recall sprint ----------
async function initRecall(root) {
  const { terms, drills } = await data();
  const start = () => {
    const dueT = shuffle(terms.filter((t) => S.cards[t.id] && isDue(t.id))), missD = shuffle(drills.filter((d) => S.drills[d.id]?.miss));
    const newT = shuffle(terms.filter((t) => !S.cards[t.id])), newD = shuffle(drills.filter((d) => !S.got['dr:' + d.id]));
    const items = []; const take = (arr, kind, n) => { while (n-- > 0 && arr.length) items.push([kind, arr.shift()]); };
    take(dueT, 't', 4); take(missD, 'd', 4); take(newD, 'd', 5 - items.filter((x) => x[0] === 'd').length); take(newT, 't', 10 - items.length); take(newD, 'd', 10 - items.length);
    const q = shuffle(items); let i = 0, ok = 0;
    const next = () => { root.innerHTML = '';
      if (i >= q.length) { const first = award('recall:' + today(), 50, 'Recall Sprint 🧠', root); badge('recall'); root.innerHTML = `<div class="done-card"><h3>🧠 Sprint done: ${ok}/${q.length}</h3><p>${first ? '+50 XP banked.' : 'Already banked today: extra reps still count for cards & drills.'}</p><button class="btn p" data-go>Another round</button></div>`; root.querySelector('[data-go]').onclick = start; return; }
      const [k, it] = q[i++]; root.append(h(`<div class="rprog"><i style="width:${(i - 1) * 10}%"></i><span>${i}/${q.length} · ${k === 't' ? '🃏 term' : '⌨️ command'}</span></div>`));
      root.append(k === 't' ? flashCard(it, (g) => { if (g) ok++; setTimeout(next, 200); }) : drillCard(it, { onDone: (g) => { if (g) ok++; next(); } }));
      if (k === 't') root.querySelector('.fc').focus({ preventScroll: true });
    };
    next();
  };
  root.innerHTML = `<button class="btn p big" data-start>▶ Start Recall Sprint (10)</button> <span class="muted">${S.got['recall:' + today()] ? '✅ done today' : '⏳ not done today'}</span>`;
  root.querySelector('[data-start]').onclick = start;
}

document.querySelectorAll('[data-terms-app]').forEach(initTerms);
document.querySelectorAll('[data-drills-app]').forEach(initDrills);
document.querySelectorAll('[data-day-learn]').forEach(initDay);
document.querySelectorAll('[data-recall]').forEach(initRecall);
