// CTO Sprint game engine: XP, levels, streaks, badges, quizzes, sandboxes, focus timer. All in localStorage.
const KEY = 'cto-sprint-v1';
export const S = Object.assign({ cards: {}, drills: {}, combo: 0, shellm: {}, xp: 0, got: {}, missions: {}, quiz: {}, days: {}, boss: {}, runs: 0, poms: 0, streak: { last: null, count: 0, best: 0 }, badges: {}, log: [] }, JSON.parse(localStorage.getItem(KEY) || '{}'));
export const save = () => localStorage.setItem(KEY, JSON.stringify(S));
window.CTO = S;
const TOTAL = +document.body.dataset.totalXp || 5000;
const LEVELS = JSON.parse(document.body.dataset.levels || '[]');
const localDay = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

export const BADGES = [
  ['first', '⚡', 'First Blood', 'Earn your first XP'],
  ['runner', '🧪', 'Lab Rat', 'Run 5 sandboxes'],
  ['perfect', '🎯', 'Sniper', 'Perfect quiz on a day'],
  ['s3', '🔥', 'On Fire', '3-day streak'],
  ['s7', '☄️', 'Unstoppable', '7-day streak'],
  ['pom3', '🍅', 'Deep Diver', '3 focus sessions'],
  ['ship', '🚢', 'Shipper', 'Complete a SHIP day'],
  ['boss1', '🐉', 'Hydra Slayer', 'Beat Week 1 boss'],
  ['boss2', '🌪️', 'Storm Breaker', 'Beat Week 2 boss'],
  ['boss3', '👻', 'Leak Hunter', 'Beat Week 3 boss'],
  ['boss4', '🔥', 'Dragon Tamer', 'Beat the final boss'],
  ['god', '👑', 'GOD MODE', 'All 28 days complete'],
  ['lex', '📖', 'Lexicon', '25 terms to Leitner box 3+'],
  ['cmd50', '⌨️', 'Fingers of Fury', 'Pass 50 command drills'],
  ['combo10', '💥', 'Combo x10', '10 drills in a row, no misses'],
  ['shell', '🐚', 'Shell Shocked', 'Clear your first terminal mission'],
  ['bashgod', '🧙', 'Bash Wizard', 'Clear every terminal mission'],
  ['recall', '🧠', 'Total Recall', 'Finish a Recall Sprint'],
];

export function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}
export function boom(x = innerWidth / 2, y = innerHeight / 3, n = 18) {
  const em = ['⚡', '🔥', '✨', '💥', '🟧', '🟪', '🟩'];
  for (let i = 0; i < n; i++) {
    const e = document.createElement('span'); e.className = 'boom'; e.textContent = em[i % em.length];
    e.style.left = x + 'px'; e.style.top = y + 'px';
    e.style.setProperty('--dx', (Math.random() * 360 - 180) + 'px'); e.style.setProperty('--dy', (Math.random() * 300 - 220) + 'px');
    document.body.appendChild(e); setTimeout(() => e.remove(), 1200);
  }
}
export function badge(id) {
  if (S.badges[id]) return; S.badges[id] = localDay(); save();
  const b = BADGES.find(b => b[0] === id); if (b) setTimeout(() => { toast(`🏅 Badge unlocked: ${b[1]} ${b[2]}`); boom(innerWidth / 2, innerHeight / 2, 30); }, 900);
}
function bumpStreak() {
  const today = localDay(); const st = S.streak;
  if (st.last === today) return;
  const y = localDay(new Date(Date.now() - 864e5));
  st.count = st.last === y ? st.count + 1 : 1; st.last = today; st.best = Math.max(st.best, st.count);
  if (st.count >= 3) badge('s3'); if (st.count >= 7) badge('s7');
}
export function award(key, xp, why, el) {
  if (S.got[key]) return false;
  S.got[key] = 1; S.xp += xp; S.log.unshift([localDay(), xp, why]); S.log = S.log.slice(0, 60);
  bumpStreak(); badge('first'); save(); hud();
  toast(`+${xp} XP · ${why}`);
  if (el) { const r = el.getBoundingClientRect(); boom(r.left + r.width / 2, r.top, xp >= 100 ? 30 : 10); }
  return true;
}
function level() { const per = TOTAL / LEVELS.length; const i = Math.min(LEVELS.length - 1, Math.floor(S.xp / per)); return { i, name: LEVELS[i], pct: ((S.xp % per) / per) * 100, per }; }
export function hud() {
  const L = level();
  document.querySelectorAll('[data-hud=xp]').forEach(e => e.textContent = S.xp);
  document.querySelectorAll('[data-hud=level]').forEach(e => e.textContent = `Lv ${L.i + 1} · ${L.name}`);
  document.querySelectorAll('[data-hud=bar]').forEach(e => e.style.width = (L.i === LEVELS.length - 1 ? 100 : L.pct) + '%');
  const alive = S.streak.last === localDay() || S.streak.last === localDay(new Date(Date.now() - 864e5));
  document.querySelectorAll('[data-hud=streak]').forEach(e => e.textContent = alive ? S.streak.count : 0);
  document.querySelectorAll('[data-hud=best]').forEach(e => e.textContent = S.streak.best);
  document.querySelectorAll('[data-hud=daysdone]').forEach(e => e.textContent = Object.keys(S.days).length);
  document.querySelectorAll('[data-hud=poms]').forEach(e => e.textContent = S.poms);
  document.querySelectorAll('[data-hud=tonext]').forEach(e => e.textContent = L.i === LEVELS.length - 1 ? 'MAX' : Math.ceil(L.per - (S.xp % L.per)));
  document.querySelectorAll('[data-day-tile]').forEach(e => { e.classList.toggle('done', !!S.days[e.dataset.dayTile]); });
  document.querySelectorAll('[data-badge]').forEach(e => e.classList.toggle('got', !!S.badges[e.dataset.badge]));
  document.querySelectorAll('[data-week-pct]').forEach(e => { const w = e.dataset.weekPct; const n = Object.keys(S.days).filter(k => k.startsWith('w' + w)).length; e.textContent = Math.round(n / 7 * 100) + '%'; });
  document.querySelectorAll('[data-boss-state]').forEach(e => { const b = S.boss[e.dataset.bossState]; e.textContent = b ? `Defeated · ${b}%` : 'Undefeated'; });
  const log = document.querySelector('[data-hud=log]');
  if (log) log.innerHTML = S.log.slice(0, 8).map(([d, x, w]) => `<li><b>+${x}</b> ${w} <span class="muted">${d}</span></li>`).join('') || '<li class="muted">No XP yet. Open Today and tick your first micro-mission.</li>';
}

// Missions
document.querySelectorAll('[data-mission]').forEach(lab => {
  const id = lab.dataset.mission, cb = lab.querySelector('input');
  cb.checked = !!S.missions[id]; lab.classList.toggle('on', cb.checked);
  cb.addEventListener('change', () => {
    S.missions[id] = cb.checked ? 1 : 0; if (!cb.checked) delete S.missions[id]; save();
    lab.classList.toggle('on', cb.checked);
    if (cb.checked) award('m:' + id, 10, 'Micro-mission done', lab);
  });
});

// Quizzes (day + boss)
document.querySelectorAll('[data-quiz]').forEach(qz => {
  const qid = qz.dataset.quiz; const qs = [...qz.querySelectorAll('.q')];
  qs.forEach((q, qi) => {
    const ans = +q.dataset.answer; const key = qid + ':' + qi; const opts = [...q.querySelectorAll('.opt')];
    const show = (picked) => { q.classList.add('answered'); opts.forEach((o, i) => { if (i === ans) o.classList.add('right'); else if (i === picked) o.classList.add('wrong'); }); };
    if (S.quiz[key] !== undefined) show(S.quiz[key]);
    opts.forEach((o, i) => o.addEventListener('click', () => {
      if (q.classList.contains('answered')) return;
      S.quiz[key] = i; save(); show(i);
      if (i === ans) { if (qz.dataset.boss) { toast('💥 Critical hit!'); boom(o.getBoundingClientRect().left + 40, o.getBoundingClientRect().top, 12); } else award('q:' + key, 20, 'Correct!', o); }
      else toast('Not quite. Read the why, it sticks better now 🧠');
      const done = qs.every((_, j) => S.quiz[qid + ':' + j] !== undefined);
      if (done) {
        const right = qs.filter((qq, j) => S.quiz[qid + ':' + j] === +qq.dataset.answer).length;
        const pct = Math.round(right / qs.length * 100);
        const out = qz.querySelector('[data-score]'); if (out) out.textContent = `${right}/${qs.length} · ${pct}%`;
        if (qz.dataset.boss) {
          const w = qz.dataset.boss;
          if (pct >= 80) { S.boss[w] = pct; save(); award('boss:' + w, 500, `BOSS DEFEATED: Week ${w}`, qz); badge('boss' + w); }
          else toast(`Boss survived with ${100 - pct}% HP. Reset and strike again 💪`);
        } else if (right === qs.length) badge('perfect');
        hud();
      }
    }));
  });
  const done = qs.every((_, j) => S.quiz[qid + ':' + j] !== undefined);
  if (done) { const right = qs.filter((qq, j) => S.quiz[qid + ':' + j] === +qq.dataset.answer).length; const out = qz.querySelector('[data-score]'); if (out) out.textContent = `${right}/${qs.length} · ${Math.round(right / qs.length * 100)}%`; }
  qz.querySelector('[data-reset]')?.addEventListener('click', () => { qs.forEach((_, j) => delete S.quiz[qid + ':' + j]); save(); location.reload(); });
});

// Complete day
document.querySelectorAll('[data-complete]').forEach(b => {
  const slug = b.dataset.complete, xp = +b.dataset.xp;
  const paint = () => { if (S.days[slug]) { b.textContent = '✅ Day complete'; b.classList.add('g'); } };
  paint();
  b.addEventListener('click', () => {
    if (S.days[slug]) return;
    S.days[slug] = localDay(); save();
    award('d:' + slug, xp, `Day ${slug.toUpperCase()} cleared`, b); paint();
    if (b.dataset.kind === 'ship') badge('ship');
    if (Object.keys(S.days).length >= 28) badge('god');
  });
});
document.querySelectorAll('[data-journaled]').forEach(b => b.addEventListener('click', () => award('j:' + b.dataset.journaled, 25, 'Journal entry written ✍️', b)));

// Sandboxes
let pyP, pgP;
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
async function py() {
  if (!pyP) pyP = (async () => { const { loadPyodide } = await import('https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs'); return loadPyodide(); })();
  return pyP;
}
async function newPg() {
  const [{ PGlite }, { vector }, { pgcrypto }] = await Promise.all([
    import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.13/dist/index.js'),
    import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite-pgvector@0.0.14/dist/index.js'),
    import('https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.13/dist/contrib/pgcrypto.js')]);
  return PGlite.create({ extensions: { vector, pgcrypto } });
}
const table = (r) => {
  if (!r.fields?.length) return `<div class="muted">✔ ${r.affectedRows ?? 0} row(s) affected</div>`;
  const cols = r.fields.map(f => f.name);
  return `<table><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${r.rows.slice(0, 50).map(row => `<tr>${cols.map(c => `<td>${esc(typeof row[c] === 'object' && row[c] !== null ? JSON.stringify(row[c]) : row[c])}</td>`).join('')}</tr>`).join('')}</table>${r.rows.length > 50 ? `<div class="muted">…${r.rows.length} rows</div>` : ''}`;
};
document.querySelectorAll('[data-sandbox]').forEach(box => {
  const lang = box.dataset.sandbox, ta = box.querySelector('textarea'), out = box.querySelector('pre'), btn = box.querySelector('[data-run]');
  const orig = ta.value;
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('    ', s, ta.selectionEnd, 'end'); }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) btn.click();
  });
  box.querySelector('[data-restore]')?.addEventListener('click', () => { ta.value = orig; });
  btn.addEventListener('click', async () => {
    btn.disabled = true; const t0 = performance.now();
    out.innerHTML = lang === 'python' ? (pyP ? 'Running…' : '⏳ Booting Python in your browser (first run ~5–10s)…') : '⏳ Booting a fresh Postgres in your browser…';
    try {
      if (lang === 'python') {
        const p = await py(); let buf = '';
        p.setStdout({ batched: s => buf += s + '\n' }); p.setStderr({ batched: s => buf += s + '\n' });
        await p.loadPackagesFromImports(ta.value);
        const r = await p.runPythonAsync(ta.value);
        if (r !== undefined && r !== null) buf += String(r);
        out.innerHTML = esc(buf || '(no output: add a print())');
      } else {
        const db = await newPg(); let html = '';
        const stmts = ta.value.split(/;[ \t]*(?:--[^\n]*)?(?:\n|$)/).map(s => s.trim()).filter(s => s && !/^(--[^\n]*\n?)+$/.test(s));
        for (const s of stmts) {
          try { const res = await db.query(s); html += `<div><code>${esc(s.split('\n')[0].slice(0, 70))}</code></div>` + table(res); }
          catch (e) { html += `<div><code>${esc(s.split('\n')[0].slice(0, 70))}</code></div><div style="color:#c92a2a;font-weight:700">ERROR: ${esc(e.message)}</div>`; break; }
        }
        out.innerHTML = html; db.close?.();
      }
      out.insertAdjacentHTML('beforeend', `<div class="muted" style="margin-top:6px">⏱ ${Math.round(performance.now() - t0)}ms</div>`);
      S.runs++; save(); if (S.runs >= 5) badge('runner');
      award('run:' + box.dataset.id, 15, 'Sandbox run 🧪', btn);
    } catch (e) { out.innerHTML = `<span style="color:#c92a2a;font-weight:700">${esc(e.message || e)}</span>`; }
    btn.disabled = false;
  });
});

// Focus timer 15/5
(() => {
  const el = document.getElementById('timer'); if (!el) return;
  const $ = k => el.querySelector(`[data-t=${k}]`);
  let st = JSON.parse(localStorage.getItem(KEY + '-timer') || 'null') || { mode: 'focus', end: null, left: 900 };
  const dur = m => m === 'focus' ? 900 : 300;
  const persist = () => localStorage.setItem(KEY + '-timer', JSON.stringify(st));
  const draw = () => {
    const left = st.end ? Math.max(0, Math.round((st.end - Date.now()) / 1000)) : st.left;
    $('time').textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
    $('mode').textContent = st.mode === 'focus' ? '🍅 Focus 15' : '🌿 Break 5';
    $('go').textContent = st.end ? 'Pause' : 'Start'; $('count').textContent = S.poms;
    el.classList.toggle('brk', st.mode !== 'focus');
    if (st.end && left === 0) {
      if (st.mode === 'focus') { S.poms++; save(); award('pom:' + Date.now(), 15, 'Focus block done 🍅', el); if (S.poms >= 3) badge('pom3'); }
      else toast('Break over. Next micro-mission 🚀');
      try { new AudioContext().resume().then(function () { const c = new AudioContext(), o = c.createOscillator(); o.connect(c.destination); o.frequency.value = 880; o.start(); o.stop(c.currentTime + .25); }); } catch (_) {}
      st = { mode: st.mode === 'focus' ? 'break' : 'focus', end: null, left: 0 }; st.left = dur(st.mode); persist();
    }
    document.title = st.end ? `${$('time').textContent} ${st.mode === 'focus' ? '🍅' : '🌿'} · CTO Sprint` : document.title.replace(/^\d\d:\d\d \S+ · /, '');
  };
  $('go').onclick = () => { if (st.end) { st.left = Math.max(0, Math.round((st.end - Date.now()) / 1000)); st.end = null; } else st.end = Date.now() + st.left * 1000; persist(); draw(); };
  $('reset').onclick = () => { st = { mode: 'focus', end: null, left: 900 }; persist(); draw(); };
  $('min').onclick = () => { el.classList.toggle('min'); $('min').textContent = el.classList.contains('min') ? '+' : '–'; };
  setInterval(draw, 1000); draw();
})();

// Export / import / reset progress
document.querySelector('[data-export]')?.addEventListener('click', () => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
  a.download = `cto-sprint-progress-${localDay()}.json`; a.click();
});
document.querySelector('[data-import]')?.addEventListener('change', async e => {
  const f = e.target.files[0]; if (!f) return; localStorage.setItem(KEY, await f.text()); location.reload();
});
document.querySelector('[data-wipe]')?.addEventListener('click', () => { if (confirm('Wipe ALL progress on this device?')) { localStorage.removeItem(KEY); location.reload(); } });

hud();
