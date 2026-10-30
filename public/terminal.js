// Sandbox terminal UI: fake bash in the browser + script editor + auto-checked missions.
import { S, save, badge, award, toast } from '/engine.js';
import { Shell, mkfs, COMMANDS } from '/shell.js';
import { SEED, MISSIONS } from '/missions.js';
const FSKEY = 'cto-shell-fs-v1', HKEY = 'cto-shell-hist-v1';
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const root = document.querySelector('[data-terminal-app]');
if (root) {
  S.shellm ||= {};
  let fs; try { fs = JSON.parse(localStorage.getItem(FSKEY)); } catch (_) {} if (!fs?.root) fs = mkfs(SEED);
  const sh = new Shell(fs); sh.hist = JSON.parse(localStorage.getItem(HKEY) || '[]');
  const persist = () => { localStorage.setItem(FSKEY, JSON.stringify(sh.fs)); localStorage.setItem(HKEY, JSON.stringify(sh.hist.slice(-200))); };
  const out = root.querySelector('[data-out]'), inp = root.querySelector('[data-in]'), ps = root.querySelector('[data-ps]');
  const ed = root.querySelector('[data-editor]'), edName = root.querySelector('[data-edname]'), edText = root.querySelector('[data-edtext]');
  const prompt = () => { const p = sh.cwd.replace(/^\/home\/hasan/, '~'); ps.textContent = `hasan@cto:${p}$`; };
  const print = (html) => { out.insertAdjacentHTML('beforeend', html); out.scrollTop = out.scrollHeight; };
  const openEditor = (name) => { const p = sh.abs(name); const n = sh.node(p); edName.value = name; edText.value = n?.f ?? (name.endsWith('.sh') ? '#!/usr/bin/env bash\nset -euo pipefail\n\n' : ''); ed.classList.add('open'); edText.focus(); };
  const exec = (cmd) => {
    print(`<div class="ln"><span class="ps">${esc(ps.textContent)}</span> ${esc(cmd)}</div>`);
    if (cmd.trim()) { sh.hist.push(cmd); hi = sh.hist.length; }
    let m;
    if ((m = cmd.trim().match(/^(?:edit|nano|vim|vi|code)\s+(\S+)$/))) { openEditor(m[1]); print('<div class="sys">📝 editor opened → Save (Ctrl+S) when done.</div>'); persist(); return; }
    if (/^crontab\s+-e\s*$/.test(cmd.trim())) { openEditor('~/.crontab'); print('<div class="sys">📝 editing your crontab. One line = 5 time fields + command.</div>'); return; }
    if (cmd.trim() === 'clear') { out.innerHTML = ''; return; }
    if (cmd.trim() === 'reset-sandbox') { if (confirm('Reset the sandbox filesystem to the starter files?')) { localStorage.removeItem(FSKEY); location.reload(); } return; }
    const r = sh.run(cmd); if (r.out) print(`<pre class="o">${esc(r.out)}</pre>`);
    S.runs = (S.runs || 0) + 1; save(); prompt(); persist();
  };
  let hi = sh.hist.length;
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); const v = inp.value; inp.value = ''; exec(v); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) inp.value = sh.hist[--hi] || ''; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(sh.hist.length, hi + 1); inp.value = sh.hist[hi] || ''; }
    else if (e.key === 'Tab') { e.preventDefault(); const v = inp.value, m = v.match(/(\S*)$/), w = m[1], first = !v.trim().includes(' ');
      const dir = w.includes('/') ? w.slice(0, w.lastIndexOf('/') + 1) : '', base = w.slice(dir.length); const n = sh.node(sh.abs(dir || '.'));
      let opts = n?.d ? Object.keys(n.c).filter((k) => k.startsWith(base) && (base.startsWith('.') || !k.startsWith('.'))).map((k) => dir + k + (n.c[k].d ? '/' : '')) : [];
      if (first && !dir) opts = [...new Set([...COMMANDS.filter((c) => c.startsWith(base)), 'edit', ...opts])].filter((c) => c.startsWith(base));
      if (opts.length === 1) inp.value = v.slice(0, v.length - w.length) + opts[0] + (opts[0].endsWith('/') ? '' : ' ');
      else if (opts.length > 1) { let p = opts[0]; for (const o of opts) while (!o.startsWith(p)) p = p.slice(0, -1); inp.value = v.slice(0, v.length - w.length) + p; print(`<pre class="o dim">${esc(opts.join('  '))}</pre>`); } }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.innerHTML = ''; }
    else if (e.key === 'c' && e.ctrlKey && !getSelection().toString()) { e.preventDefault(); print(`<div class="ln"><span class="ps">${esc(ps.textContent)}</span> ${esc(inp.value)}^C</div>`); inp.value = ''; }
  });
  root.querySelector('.term').addEventListener('click', () => { if (!getSelection().toString()) inp.focus(); });
  const saveEd = (run) => { const name = edName.value.trim(); if (!name) return toast('Give the file a name'); try { const p = sh.abs(name); const [dir] = sh.parentOf(p); if (!dir?.d) return toast('Folder does not exist: mkdir it first'); sh.write(p, edText.value.endsWith('\n') ? edText.value : edText.value + '\n'); persist(); toast(`💾 saved ${name}`);
    if (run) { if (name.endsWith('.sh')) { sh.run('chmod +x ' + JSON.stringify(name)); exec('./' + name.replace(/^\.\//, '')); } } } catch (e) { toast(e.message); } };
  root.querySelector('[data-edsave]').onclick = () => saveEd(false);
  root.querySelector('[data-edrun]').onclick = () => saveEd(true);
  root.querySelector('[data-edclose]').onclick = () => { ed.classList.remove('open'); inp.focus(); };
  edText.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveEd(false); } if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); saveEd(true); } if (e.key === 'Tab') { e.preventDefault(); const s = edText.selectionStart; edText.setRangeText('  ', s, edText.selectionEnd, 'end'); } });
  // missions
  const list = root.querySelector('[data-missions]');
  const drawM = () => { const n = MISSIONS.filter((m) => S.shellm[m.id]).length; root.querySelector('[data-mcount]').textContent = `${n}/${MISSIONS.length}`;
    list.innerHTML = MISSIONS.map((m, i) => `<details class="msn${S.shellm[m.id] ? ' won' : ''}" ${!S.shellm[m.id] && MISSIONS.findIndex((x) => !S.shellm[x.id]) === i ? 'open' : ''}><summary><span class="num">${S.shellm[m.id] ? '✅' : i + 1}</span> ${m.title} <span class="xp">+${m.xp}</span></summary>
      <p>${m.brief}</p><div class="row"><button class="btn" data-chk="${m.id}">🧪 Check</button><button class="btn w" data-hnt="${m.id}">💡 Hint</button><button class="btn w" data-sol="${m.id}">🗝 Solution</button></div><div class="mfb" data-fb="${m.id}"></div></details>`).join(''); };
  list.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const id = b.dataset.chk || b.dataset.hnt || b.dataset.sol; const m = MISSIONS.find((x) => x.id === id); const fb = list.querySelector(`[data-fb="${id}"]`);
    if (b.dataset.hnt) fb.innerHTML = `<pre class="o">${esc(m.hint)}</pre>`;
    if (b.dataset.sol) fb.innerHTML = `<pre class="o">${esc(m.solution)}</pre><button class="btn w" data-load="${id}">📝 Load into editor</button><div class="muted">Read it, then retype it yourself. Typing it is the rep.</div>`;
    if (b.dataset.load) { const f = (m.brief.match(/<code>([\w.]+\.sh)<\/code>/) || [])[1]; if (f) { edName.value = f; edText.value = m.solution + '\n'; ed.classList.add('open'); } else exec('crontab -e'); }
    if (b.dataset.chk) { const chk = new Shell(sh.fs); let r; try { r = m.check(chk); } catch (err) { r = 'Checker crashed: ' + err.message; } persist();
      if (r === true) { fb.innerHTML = '<div class="good">✅ PASSED. Mission complete.</div>'; if (!S.shellm[id]) { S.shellm[id] = new Date().toISOString().slice(0, 10); save(); } award('sh:' + id, m.xp, `Terminal mission: ${m.title}`, b); badge('shell'); if (MISSIONS.every((x) => S.shellm[x.id])) badge('bashgod'); setTimeout(drawM, 1400); }
      else fb.innerHTML = `<div class="badfb">❌ ${esc(r)}</div>`; } });
  drawM(); prompt();
  print(`<div class="sys">🐚 CTO Sprint sandbox bash: fake, safe, saved in this browser. Try <b>ls</b>, <b>help</b>, <b>cat README.txt</b>, or <b>edit hello.sh</b>. Tab completes, ↑ history, <b>reset-sandbox</b> starts fresh.</div>`);
  inp.focus({ preventScroll: true });
}
