// Tiny bash-compatible shell for practice: virtual FS, pipes, redirects, heredocs, vars, $(...), $((...)),
// if/for/while/case/functions, test, set -euo pipefail, ~50 coreutils. Pure JS, synchronous.
const HOME = '/home/hasan';
export class ShErr extends Error { constructor(m, code = 1) { super(m); this.code = code; } }
class Exit { constructor(code) { this.code = code; } }
class Ret { constructor(code) { this.code = code; } }
class Brk { constructor(n) { this.n = n; } }
class Cont { constructor(n) { this.n = n; } }

export function mkfs(files) {
  const root = { d: 1, c: {} };
  for (const [p, v] of Object.entries(files)) {
    const parts = p.split('/').filter(Boolean); let n = root;
    for (let i = 0; i < parts.length - 1; i++) n = n.c[parts[i]] ||= { d: 1, c: {} };
    if (v === null) n.c[parts.at(-1)] ||= { d: 1, c: {} };
    else n.c[parts.at(-1)] = { f: v, x: false, t: Date.now() };
  }
  return { root };
}

const OPS = ['&&', '||', ';;', '>>', '2>&1', '2>>', '2>', '&>', '<<', '|', ';', '&', '>', '<', '(', ')', '\n'];
function lex(src) {
  const toks = []; let i = 0, w = '', inWord = false; const pendingHd = [];
  const push = () => { if (inWord) { toks.push({ t: 'w', v: w }); w = ''; inWord = false; } };
  const balanced = (start) => {
    let d = 0, j = start;
    while (j < src.length) {
      const c = src[j];
      if (c === '\\') { j += 2; continue; }
      if (c === "'") { j = src.indexOf("'", j + 1); if (j < 0) return src.length; j++; continue; }
      if (c === '"') { j++; while (j < src.length && src[j] !== '"') { if (src[j] === '\\') j++; j++; } j++; continue; }
      if (c === '(') { d++; j++; continue; }
      if (c === ')') { d--; j++; if (d === 0) return j; continue; }
      j++;
    }
    throw new ShErr("syntax error: unexpected end of input (missing ')')", 2);
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '\\' && src[i + 1] === '\n') { i += 2; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { push(); i++; continue; }
    if (c === '#' && !inWord) { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === "'") { const j = src.indexOf("'", i + 1); if (j < 0) throw new ShErr("syntax error: unterminated quote '", 2); w += src.slice(i, j + 1); inWord = true; i = j + 1; continue; }
    if (c === '"') { let j = i + 1; while (j < src.length && src[j] !== '"') { if (src[j] === '\\') j++; else if (src[j] === '$' && src[j + 1] === '(') { j = balanced(j + 1); continue; } j++; } if (j >= src.length) throw new ShErr('syntax error: unterminated quote "', 2); w += src.slice(i, j + 1); inWord = true; i = j + 1; continue; }
    if (c === '\\') { w += src.slice(i, i + 2); inWord = true; i += 2; continue; }
    if (c === '$' && src[i + 1] === '(') { const j = balanced(i + 1); w += src.slice(i, j); inWord = true; i = j; continue; }
    if (c === '$' && src[i + 1] === '{') { const j = src.indexOf('}', i); w += src.slice(i, j + 1); inWord = true; i = j + 1; continue; }
    if (c === '`') { const j = src.indexOf('`', i + 1); w += '$(' + src.slice(i + 1, j) + ')'; inWord = true; i = j + 1; continue; }
    let op = null;
    if (c === '2' && !inWord && src[i + 1] === '>') op = src.startsWith('2>&1', i) ? '2>&1' : src.startsWith('2>>', i) ? '2>>' : '2>';
    else if (c !== '2') { for (const o of OPS) if (o[0] !== '2' && src.startsWith(o, i)) { op = o; break; } }
    if (op === '(' && src[i + 1] === ')') { push(); toks.push({ t: 'o', v: '()' }); i += 2; continue; }
    if (op === '(' && inWord) op = null;
    if (op) {
      if (op === '(' && src[i + 1] === ')') { push(); toks.push({ t: 'o', v: '()' }); i += 2; continue; }
      push(); toks.push({ t: 'o', v: op }); i += op.length;
      if (op === '<<') {
        while (src[i] === ' ' || src[i] === '-') i++;
        let j = i; while (j < src.length && !/[\s;|&<>]/.test(src[j])) j++;
        const raw = src.slice(i, j); const tok = { t: 'w', v: raw, quoted: /['"]/.test(raw), delim: raw.replace(/['"]/g, '') };
        toks.push(tok); pendingHd.push(tok); i = j;
      }
      if (op === '\n' && pendingHd.length) {
        for (const h of pendingHd) {
          const lines = []; while (i < src.length) { let e = src.indexOf('\n', i); if (e < 0) e = src.length; const line = src.slice(i, e); i = e + 1; if (line.replace(/^\t+/, '').trim() === h.delim) break; lines.push(line); }
          h.body = lines.length ? lines.join('\n') + '\n' : '';
        }
        pendingHd.length = 0;
      }
      continue;
    }
    w += c; inWord = true; i++;
  }
  push();
  for (const h of pendingHd) h.body ??= '';
  return toks;
}

const REDIR = ['>', '>>', '<', '2>', '2>>', '2>&1', '&>', '<<'];
function parse(toks) {
  let p = 0;
  const peek = () => toks[p];
  const isW = (v) => toks[p] && toks[p].t === 'w' && toks[p].v === v;
  const isO = (v) => toks[p] && toks[p].t === 'o' && toks[p].v === v;
  const skipNl = () => { while (isO('\n') || isO(';')) p++; };
  const expectW = (v) => { if (!isW(v)) throw new ShErr(`syntax error near ${peek() ? '`' + peek().v.replace('\n', 'newline') + "'" : 'end of file'} (expected '${v}')`, 2); p++; };
  function list(stops) {
    const items = [];
    for (;;) {
      skipNl(); const t = peek(); if (!t) break;
      if (t.t === 'w' && stops.includes(t.v)) break;
      if (t.t === 'o' && (t.v === ')' || t.v === ';;')) break;
      items.push(andOr());
      if (isO(';') || isO('\n') || isO('&')) p++;
    }
    return { type: 'list', items };
  }
  function andOr() {
    const parts = [pipeline()]; const ops = [];
    while (isO('&&') || isO('||')) { ops.push(peek().v); p++; while (isO('\n')) p++; parts.push(pipeline()); }
    return { type: 'andor', parts, ops };
  }
  function pipeline() {
    let neg = false; if (isW('!')) { neg = true; p++; }
    const cmds = [command()];
    while (isO('|')) { p++; while (isO('\n')) p++; cmds.push(command()); }
    return { type: 'pipe', cmds, neg };
  }
  function redirs(node) {
    node.redirs ||= [];
    while (peek() && peek().t === 'o' && REDIR.includes(peek().v)) {
      const op = peek().v; p++;
      if (op === '2>&1') { node.redirs.push({ op }); continue; }
      const tgt = peek(); if (!tgt || tgt.t !== 'w') throw new ShErr("syntax error near unexpected token `newline'", 2);
      p++; node.redirs.push({ op, tgt });
    }
    return node;
  }
  function command() {
    const t = peek();
    if (!t) throw new ShErr('syntax error: unexpected end of file', 2);
    if (t.t === 'o' && t.v === '(') { p++; const body = list([]); if (!isO(')')) throw new ShErr("syntax error: expected ')'", 2); p++; return redirs({ type: 'sub', body }); }
    if (t.t === 'o') throw new ShErr(`syntax error near unexpected token \`${t.v === '\n' ? 'newline' : t.v}'`, 2);
    if (t.v === 'if') {
      p++; const clauses = []; let els = null;
      const cond = list(['then']); expectW('then'); clauses.push([cond, list(['elif', 'else', 'fi'])]);
      while (isW('elif')) { p++; const c = list(['then']); expectW('then'); clauses.push([c, list(['elif', 'else', 'fi'])]); }
      if (isW('else')) { p++; els = list(['fi']); }
      expectW('fi'); return redirs({ type: 'if', clauses, els });
    }
    if (t.v === 'for') {
      p++; const name = peek().v; p++; let words = null;
      while (isO('\n')) p++;
      if (isW('in')) { p++; words = []; while (peek() && peek().t === 'w') { words.push(peek().v); p++; } }
      skipNl(); expectW('do'); const body = list(['done']); expectW('done');
      return redirs({ type: 'for', name, words, body });
    }
    if (t.v === 'while' || t.v === 'until') {
      p++; const cond = list(['do']); expectW('do'); const body = list(['done']); expectW('done');
      return redirs({ type: 'while', until: t.v === 'until', cond, body });
    }
    if (t.v === 'case') {
      p++; const word = peek().v; p++; skipNl(); expectW('in'); const arms = [];
      for (;;) {
        skipNl(); if (isW('esac')) { p++; break; }
        if (!peek()) throw new ShErr("syntax error: expected 'esac'", 2);
        if (isO('(')) p++;
        const pats = []; while (peek() && peek().t === 'w') { pats.push(peek().v); p++; if (isO('|')) p++; else break; }
        if (!isO(')')) throw new ShErr("syntax error in case: expected ')'", 2); p++;
        const body = list(['esac']); arms.push({ pats, body });
        if (isO(';;')) p++;
      }
      return redirs({ type: 'case', word, arms });
    }
    if (t.v === '{') { p++; const body = list(['}']); expectW('}'); return redirs({ type: 'group', body }); }
    if (t.v === 'function') { p++; const name = peek().v.replace(/\(\)$/, ''); p++; if (isO('()')) p++; while (isO('\n')) p++; return { type: 'func', name, body: command() }; }
    if (toks[p + 1] && toks[p + 1].t === 'o' && toks[p + 1].v === '()') { const name = t.v; p += 2; while (isO('\n')) p++; return { type: 'func', name, body: command() }; }
    if (t.v === '[[') {
      const words = []; p++;
      while (peek() && !(peek().t === 'w' && peek().v === ']]')) { words.push(peek().t === 'o' ? { v: peek().v, op: 1 } : peek()); p++; }
      expectW(']]'); return redirs({ type: 'dbl', words });
    }
    const node = { type: 'simple', words: [], redirs: [] };
    for (;;) {
      const k = peek(); if (!k) break;
      if (k.t === 'o') { if (REDIR.includes(k.v)) { redirs(node); continue; } break; }
      node.words.push(k.v); p++;
    }
    return node;
  }
  const ast = list([]);
  if (p < toks.length) throw new ShErr(`syntax error near unexpected token \`${toks[p].v}'`, 2);
  return ast;
}

const globRe = (g) => new RegExp('^' + g.replace(/[.+^${}()|\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.').replace(/\[!/g, '[^') + '$');
const fmtDate = (fmt, d = new Date()) => {
  const z = (n) => String(n).padStart(2, '0');
  const m = { Y: d.getFullYear(), m: z(d.getMonth() + 1), d: z(d.getDate()), H: z(d.getHours()), M: z(d.getMinutes()), S: z(d.getSeconds()), s: Math.floor(d / 1000), F: `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`, T: `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`, A: d.toLocaleDateString('en-AU', { weekday: 'long' }), a: d.toLocaleDateString('en-AU', { weekday: 'short' }), b: d.toLocaleDateString('en-AU', { month: 'short' }), '%': '%' };
  return fmt.replace(/%([A-Za-z%])/g, (_, k) => m[k] ?? '%' + k);
};

export class Shell {
  constructor(fs, opts = {}) {
    this.fs = fs; this.cwd = opts.cwd || HOME; this.hist = [];
    this.vars = { HOME, USER: 'hasan', PATH: '/usr/local/bin:/usr/bin:/bin', SHELL: '/bin/bash', PWD: this.cwd, HOSTNAME: 'cto-sprint', ...(opts.env || {}) };
    this.exp = new Set(['HOME', 'USER', 'PATH', 'SHELL', 'PWD', 'HOSTNAME', ...Object.keys(opts.env || {})]);
    this.funcs = {}; this.last = 0; this.o = { e: false, u: false, pipefail: false, x: false };
    this.args = []; this.arg0 = 'bash'; this.noErr = 0; this.steps = 0; this.depth = 0;
    this.fd = { 1: { s: '' }, 2: { s: '' } }; this.in = { s: '' };
  }
  abs(p) {
    if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1);
    const parts = (p.startsWith('/') ? p : this.cwd + '/' + p).split('/'); const out = [];
    for (const s of parts) { if (!s || s === '.') continue; if (s === '..') out.pop(); else out.push(s); }
    return '/' + out.join('/');
  }
  node(p) { let n = this.fs.root; for (const s of this.abs(p).split('/').filter(Boolean)) { if (!n.d || !n.c[s]) return null; n = n.c[s]; } return n; }
  parentOf(p) { const a = this.abs(p); const i = a.lastIndexOf('/'); return [this.node(a.slice(0, i) || '/'), a.slice(i + 1), a]; }
  read(p, cmd) { if (p === '/dev/null') return ''; const n = this.node(p); if (!n) throw new ShErr(`${cmd}: ${p}: No such file or directory`); if (n.d) throw new ShErr(`${cmd}: ${p}: Is a directory`); return n.f; }
  write(p, s, append = false, cmd = 'bash') {
    if (p === '/dev/null') return;
    const [dir, name, a] = this.parentOf(p);
    if (!dir || !dir.d) throw new ShErr(`${cmd}: ${p}: No such file or directory`);
    const ex = dir.c[name]; if (ex && ex.d) throw new ShErr(`${cmd}: ${p}: Is a directory`);
    if (ex) { ex.f = append ? ex.f + s : s; ex.t = Date.now(); } else dir.c[name] = { f: s, x: false, t: Date.now() };
    return a;
  }
  getVar(name) {
    if (name === '?') return String(this.last);
    if (name === '#') return String(this.args.length);
    if (name === '@' || name === '*') return this.args.join(' ');
    if (name === '$') return '4242';
    if (name === 'RANDOM') return String(Math.floor(Math.random() * 32768));
    if (name === 'PWD') return this.cwd;
    if (/^\d+$/.test(name)) { const v = name === '0' ? this.arg0 : this.args[+name - 1]; if (v === undefined && this.o.u) throw new ShErr(`$${name}: unbound variable`); return v ?? ''; }
    const v = this.vars[name];
    if (v === undefined && this.o.u) throw new ShErr(`${name}: unbound variable`);
    return v ?? '';
  }
  isSet(name) { if (/^\d+$/.test(name)) return name === '0' || this.args[+name - 1] !== undefined; return this.vars[name] !== undefined; }
  rawVal(name) { return /^\d+$/.test(name) ? (name === '0' ? this.arg0 : this.args[+name - 1] ?? '') : this.vars[name] ?? ''; }
  arith(e) {
    const assign = e.match(/^\s*([A-Za-z_]\w*)\s*(\+\+|--|[+\-*/]?=)\s*(.*)$/);
    if (assign && !assign[2].startsWith('==')) {
      const [, n, op, rhs] = assign; const cur = +(this.vars[n] || 0);
      const v = op === '++' ? cur + 1 : op === '--' ? cur - 1 : op === '=' ? this.arith(rhs) : op === '+=' ? cur + this.arith(rhs) : op === '-=' ? cur - this.arith(rhs) : op === '*=' ? cur * this.arith(rhs) : Math.trunc(cur / this.arith(rhs));
      this.vars[n] = String(v); return op === '++' ? cur : op === '--' ? cur : v;
    }
    let s = e.replace(/\$\{?([A-Za-z_]\w*|\d+|#)\}?/g, (_, n) => this.getVar(n) || '0');
    s = s.replace(/\b([A-Za-z_]\w*)\b/g, (_, n) => { const v = this.vars[n]; return /^\s*-?\d+\s*$/.test(v ?? '') ? v : '0'; });
    if (!/^[\d\s+\-*/%()<>=!&|?:]*$/.test(s)) throw new ShErr(`${e}: syntax error in expression`);
    if (!s.trim()) return 0;
    let r; try { r = Function('"use strict";return (' + s.replace(/(\d+)\s*\/\s*(\d+)/g, 'Math.trunc($1/$2)') + ')')(); } catch { throw new ShErr(`${e}: syntax error in expression`); }
    return typeof r === 'boolean' ? +r : Math.trunc(r);
  }
  dollar(raw, i) {
    const n1 = raw[i + 1];
    if (raw.startsWith('$((', i)) { let d = 0, j = i + 1; for (; j < raw.length; j++) { if (raw[j] === '(') d++; else if (raw[j] === ')') { d--; if (d === 0) break; } } return [String(this.arith(raw.slice(i + 3, j - 1))), j + 1]; }
    if (n1 === '(') { let d = 0, j = i + 1, q = null; for (; j < raw.length; j++) { const c = raw[j]; if (q) { if (c === q) q = null; continue; } if (c === "'" || c === '"') { q = c; continue; } if (c === '(') d++; else if (c === ')') { d--; if (d === 0) break; } } return [this.capture(raw.slice(i + 2, j)).replace(/\n+$/, ''), j + 1]; }
    if (n1 === '{') {
      const j = raw.indexOf('}', i); const body = raw.slice(i + 2, j); let m;
      if (body === '#') return [String(this.args.length), j + 1];
      if (body.startsWith('#')) return [String(this.getVar(body.slice(1)).length), j + 1];
      if ((m = body.match(/^(\w+)(:?)([-=?+])(.*)$/s))) {
        const [, n, colon, op, w] = m; const set = this.isSet(n); const val = set ? this.rawVal(n) : '';
        const empty = !set || (colon && val === '');
        const word = () => this.expandStr(w);
        if (op === '-') return [empty ? word() : val, j + 1];
        if (op === '=') { if (empty) this.vars[n] = word(); return [this.vars[n], j + 1]; }
        if (op === '+') return [empty ? '' : word(), j + 1];
        if (op === '?') { if (empty) throw new ShErr(`${n}: ${word() || 'parameter null or not set'}`); return [val, j + 1]; }
      }
      if ((m = body.match(/^(\w+)(%%?|##?)(.*)$/))) { const v = this.getVar(m[1]); const core = globRe(this.expandStr(m[3])).source.slice(1, -1); const greedy = m[2].length === 2; const c2 = greedy ? core : core.replace(/\.\*/g, '.*?'); const re = m[2][0] === '%' ? new RegExp((greedy ? '' : '') + c2 + '$') : new RegExp('^' + c2); if (m[2][0] === '%' && !greedy) { for (let k = v.length; k >= 0; k--) if (new RegExp('^' + core + '$').test(v.slice(k))) return [v.slice(0, k), j + 1]; return [v, j + 1]; } return [v.replace(re, ''), j + 1]; }
      if ((m = body.match(/^(\w+)\/(.*?)\/(.*)$/))) return [this.getVar(m[1]).replace(m[2], m[3]), j + 1];
      if ((m = body.match(/^(\w+)\^\^$/))) return [this.getVar(m[1]).toUpperCase(), j + 1];
      if ((m = body.match(/^(\w+),,$/))) return [this.getVar(m[1]).toLowerCase(), j + 1];
      return [this.getVar(body), j + 1];
    }
    if (n1 && /[?#@*$0-9]/.test(n1)) return [this.getVar(n1), i + 2];
    const m = raw.slice(i + 1).match(/^[A-Za-z_]\w*/);
    if (m) return [this.getVar(m[0]), i + 1 + m[0].length];
    return ['$', i + 1];
  }
  expandStr(raw) { return this.expand(raw, false).join(' '); }
  expand(raw, split = true) {
    if (split && !/['"$]/.test(raw)) {
      let m = raw.match(/^(.*?)\{(-?\d+)\.\.(-?\d+)\}(.*)$/);
      if (m) { const a = +m[2], b = +m[3], st = a <= b ? 1 : -1, out = []; for (let k = a; st > 0 ? k <= b : k >= b; k += st) out.push(...this.expand(m[1] + k + m[4])); return out; }
      m = raw.match(/^(.*?)\{([^{}]*,[^{}]*)\}(.*)$/);
      if (m) return m[2].split(',').flatMap((x) => this.expand(m[1] + x + m[3]));
    }
    const fields = []; let cur = '', has = false, glob = false;
    const pushF = () => { if (has) fields.push({ s: cur, g: glob }); cur = ''; has = false; glob = false; };
    const unq = (txt) => { if (!split) { cur += txt; has = true; return; } const ifs = this.vars.IFS; const parts = txt.split(ifs !== undefined && ifs !== '' ? new RegExp('[' + ifs.replace(/[\]\\^-]/g, '\\$&') + ']') : /[ \t\n]+/); parts.forEach((p, k) => { if (k > 0) pushF(); if (p) { cur += p; has = true; if (/[*?]/.test(p)) glob = true; } }); };
    let i = 0;
    while (i < raw.length) {
      const ch = raw[i];
      if (ch === "'") { const j = raw.indexOf("'", i + 1); cur += raw.slice(i + 1, j < 0 ? undefined : j); has = true; i = j < 0 ? raw.length : j + 1; continue; }
      if (ch === '"') {
        i++; has = true;
        while (i < raw.length && raw[i] !== '"') {
          if (raw[i] === '\\' && '"\\$`'.includes(raw[i + 1])) { cur += raw[i + 1]; i += 2; continue; }
          if (raw[i] === '$') { if (raw.startsWith('$@', i) && split) { this.args.forEach((x, k) => { if (k > 0) pushF(); cur += x; has = true; }); if (!this.args.length && raw === '"$@"') has = false; i += 2; continue; } const [v, n] = this.dollar(raw, i); cur += v; i = n; continue; }
          cur += raw[i++];
        }
        i++; continue;
      }
      if (ch === '\\') { cur += raw[i + 1] ?? ''; has = true; i += 2; continue; }
      if (ch === '$') { const [v, n] = this.dollar(raw, i); if (v === '$' && n === i + 1) { cur += '$'; has = true; } else unq(v); i = n; continue; }
      if (ch === '~' && i === 0 && (raw.length === 1 || raw[1] === '/')) { cur += HOME; has = true; i++; continue; }
      if (ch === '*' || ch === '?' || (ch === '[' && raw.includes(']'))) glob = true;
      cur += ch; has = true; i++;
    }
    pushF();
    if (!split) return [fields.map((f) => f.s).join(' ')];
    const out = [];
    for (const f of fields) {
      if (!f.g) { out.push(f.s); continue; }
      const k = f.s.lastIndexOf('/'); const dirPart = k >= 0 ? f.s.slice(0, k + 1) : ''; const pat = f.s.slice(k + 1);
      const dir = this.node(dirPart || '.'); const re = globRe(pat);
      const hits = dir && dir.d ? Object.keys(dir.c).filter((n) => re.test(n) && (pat.startsWith('.') || !n.startsWith('.'))).sort() : [];
      if (hits.length) out.push(...hits.map((h) => dirPart + h)); else out.push(f.s);
    }
    return out;
  }
  capture(src, stdin = '') {
    const save = [this.fd, this.in]; const buf = { s: '' };
    this.fd = { 1: buf, 2: save[0][2] }; this.in = { s: stdin };
    try { this.execList(parse(lex(src))); } catch (e) { if (!(e instanceof Exit)) throw e; } finally { [this.fd, this.in] = save; }
    return buf.s;
  }
  run(src) {
    const buf = { s: '' }; this.top = buf; this.fd = { 1: buf, 2: buf }; this.in = { s: '' }; this.steps = 0; this.noErr = 0; this.depth = 0;
    if (src.trim()) this.hist.push(src);
    try { this.execList(parse(lex(src))); }
    catch (e) {
      if (e instanceof Exit) { this.last = e.code; buf.s += `[shell would exit with code ${e.code}; options reset]\n`; this.o = { e: false, u: false, pipefail: false, x: false }; }
      else if (e instanceof ShErr) { buf.s += 'bash: ' + e.message + '\n'; this.last = e.code; }
      else if (e instanceof Ret || e instanceof Brk || e instanceof Cont) { /* ignore */ }
      else { buf.s += 'bash: internal error: ' + (e.message || e) + '\n'; this.last = 1; }
    }
    return { out: buf.s, code: this.last };
  }
  w(fd, s) { this.fd[fd].s += s; }
  tick() { if (++this.steps > 200000) throw new ShErr('stopped: too many steps (infinite loop?)', 130); }
  execList(l) { let c = 0; for (const it of l.items) c = this.execAndOr(it); return c; }
  execAndOr(n) {
    let c = 0;
    for (let k = 0; k < n.parts.length; k++) {
      if (k > 0) { const op = n.ops[k - 1]; if ((op === '&&' && c !== 0) || (op === '||' && c === 0)) continue; }
      const guarded = k < n.parts.length - 1 || n.parts[k].neg;
      if (guarded) this.noErr++;
      try { c = this.execPipe(n.parts[k]); } finally { if (guarded) this.noErr--; }
      if (!guarded && c !== 0 && this.o.e && this.noErr === 0) throw new Exit(c);
    }
    this.last = c; return c;
  }
  execPipe(p) {
    let c;
    if (p.cmds.length === 1) c = this.execCmd(p.cmds[0]);
    else {
      const save = [this.fd, this.in]; let input = this.in.s; const codes = [];
      try {
        p.cmds.forEach((cmd, k) => {
          const buf = { s: '' }; const last = k === p.cmds.length - 1;
          this.fd = { 1: last ? save[0][1] : buf, 2: save[0][2] }; this.in = { s: input };
          let cc; if (!last) this.noErr++;
          try { cc = this.execCmd(cmd); } catch (e) { if (e instanceof Exit && !last) cc = e.code; else throw e; } finally { if (!last) this.noErr--; }
          codes.push(cc); input = buf.s;
        });
      } finally { [this.fd, this.in] = save; }
      c = this.o.pipefail ? ([...codes].reverse().find((x) => x !== 0) ?? 0) : codes.at(-1);
    }
    if (p.neg) c = c === 0 ? 1 : 0;
    this.last = c; return c;
  }
  withRedirs(node, fn) {
    if (!node.redirs || !node.redirs.length) return fn();
    const save = [this.fd, this.in]; const fd = { ...this.fd }; const after = []; let inp = this.in;
    for (const r of node.redirs) {
      if (r.op === '2>&1') { fd[2] = fd[1]; continue; }
      if (r.op === '<<') { inp = { s: r.tgt.quoted ? r.tgt.body : this.expandStr('"' + r.tgt.body.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\\\\\$/g, '\\$') + '"') }; continue; }
      const target = this.expandStr(r.tgt.v);
      if (r.op === '<') { inp = { s: this.read(target, 'bash') }; continue; }
      const buf = { s: '' };
      if (target !== '/dev/null') { const [dir] = this.parentOf(target); if (!dir || !dir.d) throw new ShErr(`${target}: No such file or directory`); if (r.op === '>' || r.op === '&>' || r.op === '2>') this.write(target, ''); }
      if (r.op === '>' || r.op === '>>') fd[1] = buf; else if (r.op === '2>' || r.op === '2>>') fd[2] = buf; else if (r.op === '&>') { fd[1] = buf; fd[2] = buf; }
      after.push([target, buf]);
    }
    this.fd = fd; this.in = inp;
    try { return fn(); } finally { [this.fd, this.in] = save; for (const [t, b] of after) this.write(t, b.s, true); }
  }
  execCmd(n) {
    this.tick();
    return this.withRedirs(n, () => {
      switch (n.type) {
        case 'simple': return this.execSimple(n.words);
        case 'group': return this.execList(n.body);
        case 'sub': { const sv = { cwd: this.cwd, vars: { ...this.vars }, o: { ...this.o } }; try { return this.execList(n.body); } catch (e) { if (e instanceof Exit) return e.code; throw e; } finally { this.cwd = sv.cwd; this.vars = sv.vars; this.o = sv.o; } }
        case 'func': this.funcs[n.name] = n.body; return 0;
        case 'if': {
          for (const [cond, body] of n.clauses) { this.noErr++; let c; try { c = this.execList(cond); } finally { this.noErr--; } if (c === 0) return this.execList(body); }
          return n.els ? this.execList(n.els) : 0;
        }
        case 'for': {
          const items = n.words ? n.words.flatMap((w) => this.expand(w)) : [...this.args]; let c = 0;
          for (const it of items) { this.tick(); this.vars[n.name] = it; try { c = this.execList(n.body); } catch (e) { if (e instanceof Brk) { if (e.n > 1) throw new Brk(e.n - 1); break; } if (e instanceof Cont) { if (e.n > 1) throw new Cont(e.n - 1); continue; } throw e; } }
          return c;
        }
        case 'while': {
          let c = 0;
          for (;;) {
            this.tick(); this.noErr++; let k; try { k = this.execList(n.cond); } finally { this.noErr--; }
            if (n.until ? k === 0 : k !== 0) break;
            try { c = this.execList(n.body); } catch (e) { if (e instanceof Brk) { if (e.n > 1) throw new Brk(e.n - 1); break; } if (e instanceof Cont) { if (e.n > 1) throw new Cont(e.n - 1); continue; } throw e; }
          }
          return c;
        }
        case 'case': {
          const v = this.expandStr(n.word);
          for (const a of n.arms) if (a.pats.some((p) => globRe(this.expandStr(p)).test(v))) return this.execList(a.body);
          return 0;
        }
        case 'dbl': return this.dblTest(n.words.map((w) => (w.op ? w.v : this.expandStr(w.v)))) ? 0 : 1;
      }
      return 0;
    });
  }
  dblTest(a) {
    const oi = a.indexOf('||'); if (oi >= 0) return this.dblTest(a.slice(0, oi)) || this.dblTest(a.slice(oi + 1));
    const ai = a.indexOf('&&'); if (ai >= 0) return this.dblTest(a.slice(0, ai)) && this.dblTest(a.slice(ai + 1));
    if (a.length === 3 && (a[1] === '==' || a[1] === '=')) return globRe(a[2]).test(a[0]);
    if (a.length === 3 && a[1] === '!=') return !globRe(a[2]).test(a[0]);
    if (a.length === 3 && a[1] === '=~') return new RegExp(a[2]).test(a[0]);
    return this.test(a);
  }
  test(a) {
    if (!a.length) return false;
    if (a[0] === '!') return !this.test(a.slice(1));
    const ai = a.indexOf('-a'); if (ai > 0) return this.test(a.slice(0, ai)) && this.test(a.slice(ai + 1));
    const oi = a.indexOf('-o'); if (oi > 0) return this.test(a.slice(0, oi)) || this.test(a.slice(oi + 1));
    if (a.length === 1) return a[0] !== '';
    if (a.length === 2) {
      const [op, x] = a; const n = this.node(x);
      switch (op) { case '-f': return !!n && !n.d; case '-d': return !!n && !!n.d; case '-e': return !!n; case '-s': return !!n && !n.d && n.f.length > 0; case '-x': return !!n && (!!n.d || n.x); case '-r': case '-w': return !!n; case '-z': return x === ''; case '-n': return x !== ''; }
      throw new ShErr(`test: ${op}: unary operator expected`, 2);
    }
    const [l, op, r] = a; const num = (v) => { if (!/^\s*-?\d+\s*$/.test(v)) throw new ShErr(`test: ${v || '""'}: integer expression expected`, 2); return +v; };
    switch (op) {
      case '=': case '==': return l === r; case '!=': return l !== r; case '<': return l < r; case '>': return l > r;
      case '-eq': return num(l) === num(r); case '-ne': return num(l) !== num(r); case '-lt': return num(l) < num(r); case '-le': return num(l) <= num(r); case '-gt': return num(l) > num(r); case '-ge': return num(l) >= num(r);
    }
    throw new ShErr(`test: ${op}: binary operator expected`, 2);
  }
  execSimple(words) {
    let k = 0; const assigns = [];
    while (k < words.length && /^[A-Za-z_]\w*\+?=/.test(words[k])) { const m = words[k].match(/^([A-Za-z_]\w*)(\+?)=(.*)$/s); assigns.push([m[1], m[2], m[3]]); k++; }
    if (words[k] === '((') { /* not used */ }
    const argv = words.slice(k).flatMap((w) => this.expand(w));
    const doAssign = () => { for (const [n, plus, v] of assigns) { const val = this.expandStr(v); this.vars[n] = plus ? (this.vars[n] ?? '') + val : val; } };
    if (!argv.length) { doAssign(); return 0; }
    if (this.o.x) this.w(2, '+ ' + argv.join(' ') + '\n');
    if (!assigns.length) return this.runArgv(argv);
    const saved = assigns.map(([n]) => [n, this.vars[n], this.exp.has(n)]);
    doAssign(); assigns.forEach(([n]) => this.exp.add(n));
    try { return this.runArgv(argv); } finally { for (const [n, v, e] of saved) { if (v === undefined) delete this.vars[n]; else this.vars[n] = v; if (!e) this.exp.delete(n); } }
  }
  runArgv(argv) {
    const [cmd, ...args] = argv;
    try {
      if (this.funcs[cmd]) return this.callFunc(cmd, args);
      if (cmd.includes('/')) return this.runFile(cmd, args, true);
      const f = CMDS[cmd];
      if (!f) {
        if (NOT_HERE[cmd]) { this.w(2, `${cmd}: not available in this browser sandbox. ${NOT_HERE[cmd]}\n`); return 127; }
        this.w(2, `bash: ${cmd}: command not found\n`); return 127;
      }
      const r = f.call(this, args, cmd);
      return r === undefined ? 0 : r;
    } catch (e) {
      if (e instanceof ShErr && !/unbound variable|parameter null|not set$|syntax error|too many steps/.test(e.message) && !e.fatal) { this.w(2, e.message + '\n'); return e.code; }
      throw e;
    }
  }
  callFunc(name, args) {
    const sv = this.args; this.args = args; this.depth++;
    if (this.depth > 100) throw new ShErr('maximum function nesting level exceeded');
    try { return this.execCmd(this.funcs[name]); } catch (e) { if (e instanceof Ret) return e.code; throw e; } finally { this.args = sv; this.depth--; }
  }
  runFile(path, args, needX) {
    const n = this.node(path);
    if (!n) { this.w(2, `bash: ${path}: No such file or directory\n`); return 127; }
    if (n.d) { this.w(2, `bash: ${path}: Is a directory\n`); return 126; }
    if (needX && !n.x) { this.w(2, `bash: ${path}: Permission denied  (hint: chmod +x ${path})\n`); return 126; }
    const sv = { vars: this.vars, exp: this.exp, cwd: this.cwd, o: this.o, funcs: this.funcs, args: this.args, arg0: this.arg0, noErr: this.noErr };
    const env = {}; for (const k of this.exp) if (this.vars[k] !== undefined) env[k] = this.vars[k];
    this.vars = env; this.exp = new Set(Object.keys(env)); this.o = { e: false, u: false, pipefail: false, x: false }; this.funcs = {}; this.args = args; this.arg0 = path; this.noErr = 0;
    let code = 0;
    try { code = this.execList(parse(lex(n.f))); }
    catch (e) { if (e instanceof Exit) code = e.code; else if (e instanceof ShErr) { this.w(2, `${path}: ${e.message}\n`); code = e.code || 1; } else if (e instanceof Ret) code = e.code; else throw e; }
    finally { Object.assign(this, sv); }
    return code;
  }
}

function flags(args, withVal = '') {
  const f = {}; const rest = [];
  for (let k = 0; k < args.length; k++) {
    const a = args[k];
    if (a === '--') { rest.push(...args.slice(k + 1)); break; }
    if (/^-\d+$/.test(a) && withVal.includes('n')) { f.n = a.slice(1); continue; }
    if (a.startsWith('--')) { const [n, v] = a.slice(2).split('='); f[n] = v ?? true; continue; }
    if (a.startsWith('-') && a.length > 1) {
      for (let j = 1; j < a.length; j++) { const ch = a[j]; if (withVal.includes(ch)) { f[ch] = a.slice(j + 1) || args[++k]; break; } f[ch] = true; }
      continue;
    }
    rest.push(a);
  }
  return [f, rest];
}
function inputs(sh, files, cmd) { if (!files.length || (files.length === 1 && files[0] === '-')) { const s = sh.in.s; sh.in.s = ''; return [[null, s]]; } return files.map((f) => [f, sh.read(f, cmd)]); }
const lines = (s) => { const l = s.split('\n'); if (l.at(-1) === '') l.pop(); return l; };
const unl = (arr) => (arr.length ? arr.join('\n') + '\n' : '');
function walk(sh, p, cb, display = p) { const n = sh.node(p); if (!n) return; cb(display, n); if (n.d) for (const k of Object.keys(n.c).sort()) walk(sh, p.replace(/\/$/, '') + '/' + k, cb, display.replace(/\/$/, '') + '/' + k); }
const mode = (n) => (n.d ? 'drwxr-xr-x' : n.x ? '-rwxr-xr-x' : '-rw-r--r--');
const esc = (s) => s.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
const NOT_HERE = {
  python: 'Practise Python in the day-page sandboxes.', python3: 'Practise Python in the day-page sandboxes.', psql: 'Practise psql in /drills.', docker: 'Practise docker in /drills.', git: 'Practise git in /drills.',
  pip: 'Try /drills (python).', uv: 'Try /drills (python).', ollama: 'Try /drills (ollama).', supabase: 'Try /drills (supabase).', vercel: 'Try /drills (vercel).', ssh: 'No network in the sandbox.', scp: 'No network in the sandbox.', curl: 'No network in the sandbox.', wget: 'No network in the sandbox.', sudo: 'You are already the boss here.', apt: 'No package manager here.', vim: "Use the editor panel, or: cat > file.sh <<'EOF' ... EOF", nano: "Use the editor panel, or: cat > file.sh <<'EOF' ... EOF", vi: 'Use the editor panel.', code: 'Use the editor panel.', pgbench: 'Try /drills (psql).', pg_dump: 'Try /drills (psql).', jq: 'Use grep/cut/awk here.', top: 'Try ps.', less: 'Use cat or head.', more: 'Use cat or head.',
};

const CMDS = {
  ':'() { return 0; }, true() { return 0; }, false() { return 1; },
  echo(args) {
    let n = false, e = false; while (args[0] && /^-[neE]+$/.test(args[0])) { if (args[0].includes('n')) n = true; if (args[0].includes('e')) e = true; args = args.slice(1); }
    let s = args.join(' '); if (e) s = esc(s); this.w(1, s + (n ? '' : '\n'));
  },
  printf(args) {
    if (!args.length) throw new ShErr('printf: usage: printf format [arguments]', 2);
    const fmt = esc(args[0]); let rest = args.slice(1); let out = '';
    do {
      let used = 0;
      out += fmt.replace(/%(-?)(\d*)(?:\.(\d+))?([sdfx%])/g, (_, l, wd, pr, t) => {
        if (t === '%') return '%'; let v = rest[used++] ?? '';
        if (t === 'd') v = String(Math.trunc(+v || 0)); else if (t === 'f') v = (+v || 0).toFixed(pr ? +pr : 6); else if (t === 'x') v = (+v || 0).toString(16); else if (pr) v = v.slice(0, +pr);
        return wd ? (l ? v.padEnd(+wd) : v.padStart(+wd)) : v;
      });
      rest = rest.slice(used); if (!used) break;
    } while (rest.length);
    this.w(1, out);
  },
  pwd() { this.w(1, this.cwd + '\n'); },
  cd(args) {
    const t = args[0] === undefined || args[0] === '~' ? this.vars.HOME || HOME : args[0] === '-' ? this.vars.OLDPWD || this.cwd : args[0];
    const n = this.node(t); if (!n) throw new ShErr(`cd: ${t}: No such file or directory`); if (!n.d) throw new ShErr(`cd: ${t}: Not a directory`);
    this.vars.OLDPWD = this.cwd; this.cwd = this.abs(t); this.vars.PWD = this.cwd;
  },
  ls(args) {
    const [f, rest] = flags(args); const targets = rest.length ? rest : ['.']; const out = [];
    const tty = this.fd[1] === this.top; let code = 0;
    const ent = (name, n) => f.l ? `${mode(n)} 1 hasan hasan ${String(n.d ? 4096 : n.f.length).padStart(5)} ${new Date(n.t || Date.now()).toLocaleDateString('en-AU', { month: 'short', day: '2-digit' })} ${name}` : (tty && n.d ? name + '/' : tty && n.x ? name + '*' : name);
    targets.forEach((t, ti) => {
      const n = this.node(t); if (!n) { this.w(2, `ls: cannot access '${t}': No such file or directory\n`); code = 2; return; }
      if (!n.d) { out.push(ent(t, n)); return; }
      let names = Object.keys(n.c).sort(); if (!f.a && !f.A) names = names.filter((x) => !x.startsWith('.'));
      if (f.t) names.sort((a, b) => (n.c[b].t || 0) - (n.c[a].t || 0)); if (f.r) names.reverse();
      if (targets.length > 1) out.push((ti ? '\n' : '') + t + ':');
      if (f.a && f.l) out.push(ent('.', n), ent('..', n));
      const ents = names.map((x) => ent(x, n.c[x]));
      if (f.l || f[1] || !tty) out.push(...ents); else if (ents.length) out.push(ents.join('  '));
    });
    this.w(1, unl(out)); return code;
  },
  cat(args) { const [f, files] = flags(args); let s = inputs(this, files, 'cat').map((x) => x[1]).join(''); if (f.n) s = unl(lines(s).map((l, i) => String(i + 1).padStart(6) + '\t' + l)); this.w(1, s); },
  mkdir(args) {
    const [f, rest] = flags(args); if (!rest.length) throw new ShErr('mkdir: missing operand');
    for (const p of rest) {
      const parts = this.abs(p).split('/').filter(Boolean); let n = this.fs.root;
      for (let k = 0; k < parts.length; k++) {
        const last = k === parts.length - 1;
        if (!n.c[parts[k]]) { if (!last && !f.p) throw new ShErr(`mkdir: cannot create directory '${p}': No such file or directory`); n.c[parts[k]] = { d: 1, c: {}, t: Date.now() }; }
        else if (last && !f.p) throw new ShErr(`mkdir: cannot create directory '${p}': File exists`);
        n = n.c[parts[k]]; if (!n.d) throw new ShErr(`mkdir: '${p}': Not a directory`);
      }
    }
  },
  rmdir(args) { for (const p of args) { const [dir, name] = this.parentOf(p); const n = dir?.c[name]; if (!n) throw new ShErr(`rmdir: failed to remove '${p}': No such file or directory`); if (!n.d || Object.keys(n.c).length) throw new ShErr(`rmdir: failed to remove '${p}': Directory not empty`); delete dir.c[name]; } },
  rm(args) {
    const [f, rest] = flags(args); if (!rest.length) throw new ShErr('rm: missing operand');
    for (const p of rest) {
      const [dir, name, a] = this.parentOf(p); const n = dir?.c?.[name];
      if (a === '/' || a === HOME || a === '/home') throw new ShErr(`rm: refusing to remove '${p}' (nice try)`);
      if (!n) { if (!f.f) throw new ShErr(`rm: cannot remove '${p}': No such file or directory`); continue; }
      if (n.d && !(f.r || f.R)) throw new ShErr(`rm: cannot remove '${p}': Is a directory`);
      delete dir.c[name];
    }
  },
  touch(args) { for (const p of args) { const n = this.node(p); if (n) n.t = Date.now(); else this.write(p, '', false, 'touch'); } },
  cp(args) {
    const [f, rest] = flags(args); if (rest.length < 2) throw new ShErr('cp: missing destination file operand');
    const dst = rest.pop(); const dn = this.node(dst);
    for (const src of rest) {
      const sn = this.node(src); if (!sn) throw new ShErr(`cp: cannot stat '${src}': No such file or directory`);
      if (sn.d && !(f.r || f.R || f.a)) throw new ShErr(`cp: -r not specified; omitting directory '${src}'`);
      const target = dn && dn.d ? dst.replace(/\/$/, '') + '/' + this.abs(src).split('/').pop() : dst;
      const [dir, name] = this.parentOf(target); if (!dir || !dir.d) throw new ShErr(`cp: cannot create '${target}': No such file or directory`);
      const c = JSON.parse(JSON.stringify(sn)); c.t = Date.now(); dir.c[name] = c;
    }
  },
  mv(args) {
    const [, rest] = flags(args); if (rest.length < 2) throw new ShErr('mv: missing destination file operand');
    const dst = rest.pop(); const dn = this.node(dst);
    for (const src of rest) {
      const [sd, sname] = this.parentOf(src); const sn = sd?.c?.[sname]; if (!sn) throw new ShErr(`mv: cannot stat '${src}': No such file or directory`);
      const target = dn && dn.d ? dst.replace(/\/$/, '') + '/' + sname : dst;
      const [dir, name] = this.parentOf(target); if (!dir || !dir.d) throw new ShErr(`mv: cannot move to '${target}': No such file or directory`);
      delete sd.c[sname]; dir.c[name] = sn;
    }
  },
  chmod(args) {
    const [m, ...files] = args.filter((a) => a !== '-R'); if (!files.length) throw new ShErr('chmod: missing operand');
    for (const p of files) {
      const n = this.node(p); if (!n) throw new ShErr(`chmod: cannot access '${p}': No such file or directory`);
      if (/^[0-7]{3,4}$/.test(m)) n.x = (parseInt(m.slice(-3)[0], 8) & 1) === 1;
      else if (/^[ugoa]*\+[rw]*x/.test(m)) n.x = true; else if (/^[ugoa]*-[rw]*x/.test(m)) n.x = false;
      else if (!/^[ugoa]*[+\-=][rwx]+$/.test(m)) throw new ShErr(`chmod: invalid mode: '${m}'`);
    }
  },
  grep(args) {
    const [f, rest] = flags(args, 'eAB'); const pat = f.e ?? rest.shift(); if (pat === undefined) throw new ShErr('grep: usage: grep [OPTION]... PATTERN [FILE]...', 2);
    let src = pat; if (!f.E && !f.F) src = src.replace(/\\\|/g, '|').replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\+/g, '+'); if (f.F) src = src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); if (f.w) src = `\\b(?:${src})\\b`; if (f.x) src = `^(?:${src})$`;
    let re; try { re = new RegExp(src, f.i ? 'i' : ''); } catch { throw new ShErr(`grep: invalid regex '${pat}'`, 2); }
    let files = rest; if (f.r || f.R) { const all = []; for (const p of files.length ? files : ['.']) walk(this, p, (d, n) => { if (!n.d) all.push(d); }); files = all; }
    const ins = []; let code2 = false;
    if (!files.length) ins.push(...inputs(this, [], 'grep')); else for (const fl of files) { const n = this.node(fl); if (!n || n.d) { this.w(2, `grep: ${fl}: ${n ? 'Is a directory' : 'No such file or directory'}\n`); code2 = true; continue; } ins.push([fl, n.f]); }
    const multi = files.length > 1 || f.r || f.R; let any = false; const out = [];
    for (const [name, s] of ins) {
      let cnt = 0;
      lines(s).forEach((l, i) => {
        const hit = re.test(l) !== !!f.v; if (!hit) return; cnt++; any = true;
        if (f.c || f.l || f.q) return;
        const pre = (multi && !f.h ? name + ':' : '') + (f.n ? i + 1 + ':' : '');
        if (f.o) { for (const m of l.matchAll(new RegExp(re.source, re.flags + 'g'))) out.push(pre + m[0]); } else out.push(pre + l);
      });
      if (f.c) out.push((multi ? name + ':' : '') + cnt); if (f.l && cnt) out.push(name ?? '(standard input)');
    }
    if (!f.q) this.w(1, unl(out)); return code2 && !any ? 2 : any ? 0 : 1;
  },
  wc(args) {
    const [f, files] = flags(args); const ins = inputs(this, files, 'wc'); const none = !f.l && !f.w && !f.c && !f.m; const out = []; const tot = [0, 0, 0];
    for (const [name, s] of ins) {
      const v = [(s.match(/\n/g) || []).length, s.split(/\s+/).filter(Boolean).length, s.length]; v.forEach((x, i) => (tot[i] += x));
      const parts = []; if (none || f.l) parts.push(v[0]); if (none || f.w) parts.push(v[1]); if (none || f.c || f.m) parts.push(v[2]);
      out.push((parts.length > 1 ? parts.map((x) => String(x).padStart(7)).join(' ') : String(parts[0])) + (name ? ' ' + name : ''));
    }
    if (ins.length > 1) out.push(tot.filter((_, i) => none || [f.l, f.w, f.c || f.m][i]).join(' ') + ' total');
    this.w(1, unl(out));
  },
  head(args) { const [f, files] = flags(args, 'nc'); const n = +(f.n ?? 10); const ins = inputs(this, files, 'head'); ins.forEach(([name, s], i) => { if (ins.length > 1) this.w(1, `${i ? '\n' : ''}==> ${name} <==\n`); this.w(1, unl(lines(s).slice(0, n))); }); },
  tail(args) { const [f, files] = flags(args, 'nc'); const raw = String(f.n ?? '10'); const ins = inputs(this, files, 'tail'); ins.forEach(([, s]) => { const L = lines(s); this.w(1, unl(raw.startsWith('+') ? L.slice(+raw.slice(1) - 1) : +raw === 0 ? [] : L.slice(-+raw))); }); if (f.f) this.w(2, '(tail -f: no live appends in the sandbox; showing the end)\n'); },
  sort(args) {
    const [f, files] = flags(args, 'kt'); let L = inputs(this, files, 'sort').flatMap(([, s]) => lines(s));
    const key = (l) => { if (!f.k) return l; const fld = parseInt(f.k); const parts = f.t ? l.split(f.t) : l.trim().split(/\s+/); return parts[fld - 1] ?? ''; };
    const cmp = (a, b) => { const x = key(a), y = key(b); if (f.n || f.h) { const d = (parseFloat(x) || 0) - (parseFloat(y) || 0); if (d) return d; } return x < y ? -1 : x > y ? 1 : 0; };
    L.sort(cmp); if (f.r) L.reverse(); if (f.u) L = L.filter((l, i) => i === 0 || cmp(l, L[i - 1]) !== 0);
    this.w(1, unl(L));
  },
  uniq(args) {
    const [f, files] = flags(args); const L = inputs(this, files, 'uniq').flatMap(([, s]) => lines(s)); const groups = [];
    for (const l of L) { const g = groups.at(-1); if (g && (f.i ? g[0].toLowerCase() === l.toLowerCase() : g[0] === l)) g[1]++; else groups.push([l, 1]); }
    this.w(1, unl(groups.filter((g) => (f.d ? g[1] > 1 : f.u ? g[1] === 1 : true)).map(([l, c]) => (f.c ? String(c).padStart(7) + ' ' + l : l))));
  },
  cut(args) {
    const [f, files] = flags(args, 'dfc'); const d = f.d ?? '\t';
    const sel = (spec, n) => { const s = new Set(); for (const part of String(spec).split(',')) { const [a, b] = part.split('-'); const lo = a ? +a : 1, hi = part.includes('-') ? (b ? +b : n) : lo; for (let k = lo; k <= hi; k++) s.add(k); } return [...s].sort((x, y) => x - y); };
    if (!f.c && !f.f) throw new ShErr('cut: you must specify a list of bytes, characters, or fields');
    this.w(1, unl(inputs(this, files, 'cut').flatMap(([, s]) => lines(s)).map((l) => {
      if (f.c) return sel(f.c, l.length).map((k) => l[k - 1] ?? '').join('');
      const parts = l.split(d); if (parts.length === 1) return l; return sel(f.f, parts.length).filter((k) => k <= parts.length).map((k) => parts[k - 1]).join(d);
    })));
  },
  tr(args) {
    const [f, rest] = flags(args);
    const ex = (s) => s.replace(/\[:upper:\]/g, 'A-Z').replace(/\[:lower:\]/g, 'a-z').replace(/\[:digit:\]/g, '0-9').replace(/\[:space:\]/g, ' \t\n').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/(.)-(.)/g, (_, a, b) => { let o = ''; for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) o += String.fromCharCode(c); return o; });
    const a = ex(rest[0] ?? ''), b = ex(rest[1] ?? ''); const s = this.in.s; this.in.s = ''; let out = '';
    for (const ch of s) { const i = a.indexOf(ch); if (f.d) { if (i < 0) out += ch; } else if (i >= 0 && b) out += b[Math.min(i, b.length - 1)]; else out += ch; }
    if (f.s) { const set = b || a; let o2 = ''; for (const ch of out) { if (set.includes(ch) && o2.at(-1) === ch) continue; o2 += ch; } out = o2; }
    this.w(1, out);
  },
  sed(args) {
    const [f, rest] = flags(args, 'e'); const script = f.e ?? rest.shift(); if (!script) throw new ShErr('sed: no script', 1); const files = rest;
    const cmds = script.split(/;(?=\s*(?:s.|\/|\d))/).map((s) => s.trim()).filter(Boolean).map((sc) => {
      let m;
      if ((m = sc.match(/^s(.)(.*?)\1(.*?)\1([gip0-9]*)$/))) return { t: 's', re: new RegExp(m[2].replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/\\\+/g, '+').replace(/\\\|/g, '|'), (m[4].includes('g') ? 'g' : '') + (m[4].includes('i') ? 'i' : '')), rep: m[3].replace(/\$/g, '$$$$').replace(/\\(\d)/g, '$$$1').replace(/(^|[^\\])&/g, '$1$$&').replace(/\\&/g, '&'), p: m[4].includes('p') };
      if ((m = sc.match(/^\/(.*)\/([dp])$/))) return { t: m[2], re: new RegExp(m[1]) };
      if ((m = sc.match(/^(\d+)(?:,(\d+|\$))?([dp])$/))) return { t: m[3], lo: +m[1], hi: m[2] === '$' ? Infinity : m[2] ? +m[2] : +m[1] };
      throw new ShErr(`sed: unsupported script '${sc}' (sandbox supports s///g, /re/d, /re/p, Nd, N,Mp)`);
    });
    const proc = (s) => { const out = []; lines(s).forEach((l, i) => { let del = false, pr = false; for (const c of cmds) { const inR = c.lo ? i + 1 >= c.lo && i + 1 <= c.hi : c.re && c.re.test(l); if (c.t === 's') { const nl = l.replace(c.re, c.rep); if (nl !== l && c.p) pr = true; l = nl; } else if (c.t === 'd' && inR) del = true; else if (c.t === 'p' && inR) pr = true; } if (del) return; if (pr) out.push(l); if (!f.n) out.push(l); }); return unl(out); };
    if (f.i) { for (const p of files) this.write(p, proc(this.read(p, 'sed'))); return; }
    this.w(1, inputs(this, files, 'sed').map(([, s]) => proc(s)).join(''));
  },
  awk(args) {
    const [f, rest] = flags(args, 'Fv'); const prog = rest.shift(); if (!prog) throw new ShErr("awk: usage: awk [-F sep] 'program' [file...]", 2);
    const vars = {}; if (f.v) { const [k, v] = f.v.split('='); vars[k] = v; }
    const fn = compileAwk(prog); const text = inputs(this, rest, 'awk').map(([, s]) => s).join('');
    const out = []; fn(text, f.F, vars, (s) => out.push(s)); this.w(1, out.join(''));
  },
  find(args) {
    const roots = []; let k = 0; while (k < args.length && !args[k].startsWith('-')) roots.push(args[k++]);
    if (!roots.length) roots.push('.');
    let name = null, type = null, del = false, iname = false, execArgs = null;
    for (; k < args.length; k++) {
      const a = args[k];
      if (a === '-name' || a === '-iname') { name = args[++k]; iname = a === '-iname'; } else if (a === '-type') type = args[++k]; else if (a === '-delete') del = true; else if (['-mtime', '-maxdepth', '-size', '-mmin', '-newer'].includes(a)) k++; else if (a === '-exec') { execArgs = []; k++; while (k < args.length && args[k] !== ';' && args[k] !== '+') execArgs.push(args[k++]); }
    }
    const re = name ? new RegExp(globRe(name).source, iname ? 'i' : '') : null; const hits = [];
    for (const r of roots) { if (!this.node(r)) { this.w(2, `find: '${r}': No such file or directory\n`); continue; } walk(this, r, (d, n) => { if (re && !re.test(d.split('/').pop())) return; if (type === 'f' && n.d) return; if (type === 'd' && !n.d) return; hits.push(d); }); }
    if (del) { for (const h of hits.reverse()) { const [dir, nm] = this.parentOf(h); if (dir?.c[nm]) delete dir.c[nm]; } return; }
    if (execArgs) { for (const h of hits) this.runArgv(execArgs.map((x) => (x === '{}' ? h : x))); return; }
    this.w(1, unl(hits));
  },
  basename(args) { const [p, suf] = args; let b = (p || '').replace(/\/+$/, '').split('/').pop(); if (suf && b.endsWith(suf)) b = b.slice(0, -suf.length); this.w(1, b + '\n'); },
  dirname(args) { const p = (args[0] || '').replace(/\/+$/, ''); const i = p.lastIndexOf('/'); this.w(1, (i < 0 ? '.' : i === 0 ? '/' : p.slice(0, i)) + '\n'); },
  tee(args) { const [f, files] = flags(args); const s = this.in.s; this.in.s = ''; for (const p of files) this.write(p, s, !!f.a, 'tee'); this.w(1, s); },
  xargs(args) { const [f, rest] = flags(args, 'n'); const cmd = rest.length ? rest : ['echo']; const items = this.in.s.split(/\s+/).filter(Boolean); this.in.s = ''; const n = f.n ? +f.n : items.length || 1; let c = 0; for (let k = 0; k < Math.max(items.length, 1); k += n) c = this.runArgv([...cmd, ...items.slice(k, k + n)]); return c; },
  seq(args) { const nums = args.map(Number); const [a, st, b] = nums.length === 1 ? [1, 1, nums[0]] : nums.length === 2 ? [nums[0], 1, nums[1]] : nums; const out = []; for (let x = a; st > 0 ? x <= b : x >= b; x += st) { out.push(x); if (out.length > 100000) break; } this.w(1, unl(out)); },
  date(args) { const fmt = args.find((a) => a.startsWith('+')); this.w(1, (fmt ? fmtDate(fmt.slice(1)) : new Date().toString().replace(/ GMT.*/, '')) + '\n'); },
  sleep() { return 0; },
  pg_isready() { this.pgTry = (this.pgTry || 0) + 1; if (this.pgTry >= 3) { this.w(1, 'localhost:5432 - accepting connections\n'); return 0; } this.w(1, 'localhost:5432 - no response\n'); return 2; },
  whoami() { this.w(1, 'hasan\n'); }, hostname() { this.w(1, 'cto-sprint\n'); }, id() { this.w(1, 'uid=1000(hasan) gid=1000(hasan) groups=1000(hasan),27(sudo),999(docker)\n'); },
  uname(args) { this.w(1, args.includes('-a') ? 'Linux cto-sprint 6.8.0-sandbox x86_64 GNU/Linux\n' : 'Linux\n'); },
  clear() { this.w(1, '\x1bc'); },
  history() { this.w(1, unl(this.hist.map((h, i) => String(i + 1).padStart(5) + '  ' + h))); },
  export(args) { if (!args.length || args[0] === '-p') { this.w(1, unl([...this.exp].sort().map((k) => `declare -x ${k}="${this.vars[k] ?? ''}"`))); return; } for (const a of args) { const m = a.match(/^([A-Za-z_]\w*)(?:=(.*))?$/s); if (!m) throw new ShErr(`export: \`${a}': not a valid identifier`); if (m[2] !== undefined) this.vars[m[1]] = m[2]; this.exp.add(m[1]); } },
  local(args) { for (const a of args) { const m = a.match(/^([A-Za-z_]\w*)(?:=(.*))?$/s); if (m) this.vars[m[1]] = m[2] ?? ''; } },
  readonly(args) { return CMDS.local.call(this, args); },
  declare(args) { return CMDS.local.call(this, args.filter((a) => !a.startsWith('-'))); },
  unset(args) { for (const a of args.filter((x) => !x.startsWith('-'))) { delete this.vars[a]; this.exp.delete(a); delete this.funcs[a]; } },
  env() { this.w(1, unl([...this.exp].sort().filter((k) => this.vars[k] !== undefined).map((k) => `${k}=${this.vars[k]}`))); },
  printenv(args) { if (args[0]) { if (!this.exp.has(args[0])) return 1; this.w(1, (this.vars[args[0]] ?? '') + '\n'); return; } return CMDS.env.call(this); },
  set(args) {
    if (!args.length) { this.w(1, unl(Object.keys(this.vars).sort().map((k) => `${k}=${this.vars[k]}`))); return; }
    for (let k = 0; k < args.length; k++) {
      const a = args[k]; const on = a[0] === '-';
      const opt = (o) => { if (o === 'pipefail') this.o.pipefail = on; else if (o === 'errexit') this.o.e = on; else if (o === 'nounset') this.o.u = on; else if (o === 'xtrace') this.o.x = on; else throw new ShErr(`set: ${o}: invalid option name`); };
      if (a === '-o' || a === '+o') { opt(args[++k]); continue; }
      if (/^[-+][euxo]+$/.test(a)) { for (const ch of a.slice(1)) { if (ch === 'o') opt(args[++k]); else this.o[ch] = on; } continue; }
      if (a === '--') { this.args = args.slice(k + 1); break; }
      throw new ShErr(`set: ${a}: invalid option`);
    }
  },
  shift(args) { this.args = this.args.slice(+(args[0] ?? 1)); },
  exit(args) { throw new Exit(args[0] !== undefined ? +args[0] & 255 : this.last); },
  return(args) { throw new Ret(args[0] !== undefined ? +args[0] : this.last); },
  break(args) { throw new Brk(+(args[0] ?? 1)); }, continue(args) { throw new Cont(+(args[0] ?? 1)); },
  test(args) { return this.test(args) ? 0 : 1; },
  '['(args) { if (args.at(-1) !== ']') throw new ShErr("[: missing `]'", 2); return this.test(args.slice(0, -1)) ? 0 : 1; },
  read(args) {
    const [f, names] = flags(args, 'pd'); if (f.p) this.w(2, f.p);
    if (!this.in.s) return 1;
    const i = this.in.s.indexOf('\n'); const line = i < 0 ? this.in.s : this.in.s.slice(0, i); this.in.s = i < 0 ? '' : this.in.s.slice(i + 1);
    const vs = names.length ? names : ['REPLY']; const ifs = this.vars.IFS;
    const parts = ifs !== undefined && ifs !== '' && !/^\s+$/.test(ifs) ? line.split(new RegExp('[' + ifs.replace(/[\]\\^-]/g, '\\$&') + ']')) : line.trim().split(/\s+/);
    vs.forEach((n, k) => { this.vars[n] = k === vs.length - 1 ? parts.slice(k).join(ifs && ifs.length === 1 && ifs !== ' ' ? ifs : ' ') : parts[k] ?? ''; });
    return 0;
  },
  source(args) { const n = this.node(args[0] || ''); if (!n || n.d) throw new ShErr(`source: ${args[0]}: No such file or directory`); const sv = this.args; if (args.length > 1) this.args = args.slice(1); try { return this.execList(parse(lex(n.f))); } catch (e) { if (e instanceof Ret) return e.code; throw e; } finally { this.args = sv; } },
  '.'(args) { return CMDS.source.call(this, args); },
  bash(args) {
    if (args[0] === '-c') { const sv = this.o; try { return this.execList(parse(lex(args[1] || ''))); } catch (e) { if (e instanceof Exit) return e.code; throw e; } finally { this.o = sv; } }
    const [f, rest] = flags(args); if (!rest.length) { this.w(2, 'bash: nested interactive shells are not supported here; run a script: bash file.sh\n'); return 1; }
    if (f.n) { try { parse(lex(this.read(rest[0], 'bash'))); return 0; } catch (e) { this.w(2, `${rest[0]}: ${e.message}\n`); return 2; } }
    return this.runFile(rest[0], rest.slice(1), false);
  },
  sh(args) { return CMDS.bash.call(this, args); },
  type(args) { for (const a of args) this.w(1, this.funcs[a] ? `${a} is a function\n` : ['cd', 'echo', 'export', 'set', 'read', 'source', 'test', 'exit', 'printf', 'pwd'].includes(a) ? `${a} is a shell builtin\n` : CMDS[a] ? `${a} is /usr/bin/${a}\n` : `bash: type: ${a}: not found\n`); },
  which(args) { let c = 0; for (const a of args) { if (CMDS[a]) this.w(1, `/usr/bin/${a}\n`); else c = 1; } return c; },
  command(args) { if (args[0] === '-v') return CMDS.which.call(this, args.slice(1)); return this.runArgv(args); },
  alias() { this.w(2, 'alias: not supported in the sandbox (use a function: ll() { ls -la "$@"; })\n'); return 1; },
  du(args) { const [, rest] = flags(args); for (const p of rest.length ? rest : ['.']) { let size = 0; walk(this, p, (_, n) => { if (!n.d) size += n.f.length; }); this.w(1, `${(size / 1024).toFixed(1)}K\t${p}\n`); } },
  df() { this.w(1, 'Filesystem      Size  Used Avail Use% Mounted on\nbrowserfs       5.0M  120K  4.9M   3% /\n'); },
  ps() { this.w(1, '  PID TTY          TIME CMD\n    1 pts/0    00:00:00 bash\n 4242 pts/0    00:00:00 ps\n'); },
  kill(args) { const pid = args.filter((a) => !a.startsWith('-'))[0]; this.w(2, `bash: kill: (${pid}) - No such process\n`); return 1; },
  man(args) { this.w(1, `No manuals in the sandbox. Real life: man ${args[0] || ''} (q to quit). Here: help\n`); },
  tar(args) {
    let ops = (args[0] || '').replace(/^-/, ''); const rest = args.slice(1); let file = null;
    if (ops.includes('f')) file = rest.shift();
    if (ops.includes('c')) {
      if (!file) throw new ShErr('tar: refusing to write archive to terminal (use -f FILE)', 2); const files = {};
      for (const p of rest) { if (!this.node(p)) throw new ShErr(`tar: ${p}: Cannot stat: No such file or directory`, 2); walk(this, p, (d, n) => { files[d.replace(/^\.\//, '')] = n.d ? null : n.f; if (ops.includes('v')) this.w(1, d + (n.d ? '/' : '') + '\n'); }); }
      this.write(file, 'TARJSON' + JSON.stringify(files)); return;
    }
    const data = this.read(file, 'tar'); if (!data.startsWith('TARJSON')) throw new ShErr('tar: This does not look like a tar archive', 2); const files = JSON.parse(data.slice(7));
    if (ops.includes('t')) { this.w(1, unl(Object.keys(files))); return; }
    if (ops.includes('x')) { for (const [p, v] of Object.entries(files)) { if (v === null) CMDS.mkdir.call(this, ['-p', p]); else { if (p.includes('/')) CMDS.mkdir.call(this, ['-p', p.slice(0, p.lastIndexOf('/'))]); this.write(p, v); } if (ops.includes('v')) this.w(1, p + '\n'); } return; }
    throw new ShErr('tar: You must specify one of -c, -x, -t', 2);
  },
  crontab(args) {
    const tab = HOME + '/.crontab';
    if (args[0] === '-l') { const n = this.node(tab); if (!n) { this.w(2, 'no crontab for hasan\n'); return 1; } this.w(1, n.f); return; }
    if (args[0] === '-r') { const [d, nm] = this.parentOf(tab); delete d.c[nm]; return; }
    if (args[0] === '-e') { this.w(2, 'crontab -e opens an editor in real life. Here: put the line in a file, then run: crontab mycron.txt\n'); return 1; }
    if (args[0]) { let s; if (args[0] === '-') { s = this.in.s; this.in.s = ''; } else s = this.read(args[0], 'crontab'); for (const l of lines(s)) { if (!l.trim() || l.trim().startsWith('#')) continue; if (l.trim().split(/\s+/).length < 6) throw new ShErr(`crontab: "${l}": bad line (need 5 time fields + a command)`); } this.write(tab, s); this.w(1, 'crontab: installing new crontab\n'); return; }
    throw new ShErr('usage: crontab FILE | crontab -l | crontab -r');
  },
  'cron-explain'(args) { const s = args.join(' ').trim().split(/\s+/); if (s.length < 5) throw new ShErr('usage: cron-explain "MIN HOUR DOM MON DOW"'); const [mi, h, dom, mon, dow] = s; const D = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; const part = (v, unit) => (v === '*' ? `every ${unit}` : v.startsWith('*/') ? `every ${v.slice(2)} ${unit}s` : `${unit} ${v}`); this.w(1, `minute: ${part(mi, 'minute')} | hour: ${part(h, 'hour')} | day-of-month: ${part(dom, 'day')} | month: ${part(mon, 'month')} | weekday: ${dow === '*' ? 'any' : dow.split(',').map((d) => D[+d] || d).join(',')}\n`); },
  help() { this.w(1, "Sandbox bash. Builtins: cd pwd echo printf export unset set read source test [ [[ exit return local shift\nSyntax: if/elif/else/fi  for/while/until..do..done  case..esac  f() { }  && || | ; > >> < 2> 2>&1 <<EOF  $(..) $((..)) ${VAR:-x}\nTools: ls cat mkdir rm rmdir touch cp mv chmod grep wc head tail sort uniq cut tr sed awk find tee xargs seq date basename dirname tar crontab cron-explain du df history clear\nWrite scripts with the editor panel or: cat > script.sh <<'EOF' ... EOF\n"); },
};

function compileAwk(prog) {
  const rules = []; let i = 0; const s = prog.trim();
  while (i < s.length) {
    while (/[\s;]/.test(s[i] || '')) i++; if (i >= s.length) break;
    let pat = ''; while (i < s.length && s[i] !== '{') { if (s[i] === '/') { const j = s.indexOf('/', i + 1); pat += s.slice(i, j + 1); i = j + 1; continue; } if (s[i] === '"') { const j = s.indexOf('"', i + 1); pat += s.slice(i, j + 1); i = j + 1; continue; } pat += s[i++]; }
    let body = null;
    if (s[i] === '{') { let d = 0, j = i; for (; j < s.length; j++) { if (s[j] === '"') { j = s.indexOf('"', j + 1); continue; } if (s[j] === '{') d++; else if (s[j] === '}' && --d === 0) break; } body = s.slice(i + 1, j); i = j + 1; }
    rules.push({ pat: pat.trim(), body });
  }
  const KW = new Set(['if', 'else', 'for', 'in', 'while', 'NR', 'NF', 'length', 'substr', 'tolower', 'toupper', 'int', 'index', 'sprintf', 'return']);
  const expr = (e) => e
    .replace(/"(?:[^"\\]|\\.)*"|\/(?:[^/\\]|\\.)+\/(?!\s*\d)|\$(\d+|NF|\([^)]*\))|\b([A-Za-z_]\w*)\b(\s*\[)?/g, (m, fld, id, br) => {
      if (m.startsWith('"')) return m; if (m.startsWith('/')) return `${m}.test(L)`;
      if (fld !== undefined) return `F(${fld === 'NF' ? 'NF' : fld.startsWith('(') ? expr(fld.slice(1, -1)) : fld})`;
      if (KW.has(id)) return id === 'length' ? 'LEN' : m; if (br) return `A('${id}')[`; return `V.${id}`;
    })
    .replace(/\bin\s+V\.(\w+)/g, "in A('$1')")
    ;
  const splitTop = (a, sep) => { const out = []; let d = 0, cur = '', q = false; for (const c of a) { if (c === '"') q = !q; if (!q && '([{'.includes(c)) d++; if (!q && ')]}'.includes(c)) d--; if (sep.includes(c) && !d && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map((x) => x.trim()).filter(Boolean); };
  const stmt = (b) => splitTop(b, ';\n').map((x) => {
    let m;
    if ((m = x.match(/^for\s*\(\s*(\w+)\s+in\s+(\w+)\s*\)\s*(.*)$/s))) return `for (const __k in A('${m[2]}')) { V.${m[1]} = __k; ${stmt(m[3].replace(/^\{|\}$/g, ''))} }`;
    if ((m = x.match(/^if\s*\((.*?)\)\s*(.*)$/s))) return `if (${expr(m[1])}) { ${stmt(m[2].replace(/^\{|\}$/g, ''))} }`;
    if (x === 'next') return 'return;';
    if ((m = x.match(/^printf\s*\(?(.*?)\)?$/s))) return `out(PF(${splitTop(m[1], ',').map(expr).join(',')}));`;
    if ((m = x.match(/^print\s*(.*)$/s))) { const a = m[1].trim(); if (!a) return 'out(L + "\\n");'; return `out([${splitTop(a, ',').map(expr).join(',')}].join(V.OFS) + "\\n");`; }
    return expr(x) + ';';
  }).join('\n');
  const begin = rules.filter((r) => r.pat === 'BEGIN').map((r) => stmt(r.body)).join('\n');
  const end = rules.filter((r) => r.pat === 'END').map((r) => stmt(r.body)).join('\n');
  const main = rules.filter((r) => r.pat !== 'BEGIN' && r.pat !== 'END').map((r) => `if (${r.pat ? expr(r.pat) : 'true'}) { ${r.body === null ? 'out(L + "\\n");' : stmt(r.body)} }`).join('\n');
  let fn;
  try {
    fn = new Function('text', 'FS', 'init', 'out', `
      const V = new Proxy(Object.assign({ OFS: ' ' }, init), { get: (t, k) => (k in t ? t[k] : 0) });
      const arrs = {}; const A = (n) => (arrs[n] ||= new Proxy({}, { get: (t, k) => (k in t ? t[k] : 0) }));
      let L = '', P = [], NR = 0, NF = 0;
      const num = (v) => (/^\\s*-?\\d+(\\.\\d+)?\\s*$/.test(v) ? +v : v);
      const F = (n) => (n === 0 ? num(L) : num(P[n - 1] ?? ''));
      const LEN = (x) => String(x === undefined ? L : x).length;
      const substr = (s, a, n) => String(s).substr(a - 1, n), tolower = (s) => String(s).toLowerCase(), toupper = (s) => String(s).toUpperCase(), int = (x) => Math.trunc(+x || 0), index = (s, t) => String(s).indexOf(t) + 1;
      const PF = (fmt, ...a) => { let k = 0; return String(fmt).replace(/%(-?)(\\d*)(?:\\.(\\d+))?([sdf%])/g, (_, l, w, p, t) => { if (t === '%') return '%'; let v = a[k++]; v = t === 'd' ? String(Math.trunc(+v || 0)) : t === 'f' ? (+v || 0).toFixed(p ? +p : 6) : String(v ?? ''); return w ? (l ? v.padEnd(+w) : v.padStart(+w)) : v; }); };
      const sprintf = PF;
      ${begin}
      const rows = text.split('\\n'); if (rows.at(-1) === '') rows.pop();
      for (const line of rows) {
        NR++; L = line; P = FS ? line.split(FS === '\\\\t' || FS === 't' ? '\\t' : FS) : line.trim().split(/\\s+/).filter(Boolean); NF = P.length;
        (() => { ${main} })();
      }
      ${end}`);
  } catch (e) { throw new ShErr('awk: syntax error (sandbox awk supports print/printf, $N, NR, NF, BEGIN/END, /re/, comparisons, +=, ++, arrays, for-in, if)', 2); }
  return (text, FS, init, out) => { try { fn(text, FS, init, out); } catch (e) { throw new ShErr('awk: ' + e.message, 2); } };
}

export const COMMANDS = Object.keys(CMDS);
