import { terms, type Term } from './terms';
import { drills, type Drill } from './drills';
import { days } from './days';
function pick<T extends { day: string; week: number }>(arr: T[], slug: string, n: number): T[] {
  const wk = +slug[1];
  const exact = arr.filter((x) => x.day === slug);
  const out = exact.slice(0, n);
  if (out.length < n) {
    const pool = arr.filter((x) => x.week === wk && x.day !== slug);
    const seed = [...slug].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
    const sorted = pool.map((x, i) => ({ x, k: (i * 2654435761 + seed) % 1000003 })).sort((a, b) => a.k - b.k).map((o) => o.x);
    out.push(...sorted.slice(0, n - out.length));
  }
  return out;
}
export const dayTerms = (slug: string): Term[] => pick(terms, slug, 5);
export const dayDrills = (slug: string): Drill[] => pick(drills, slug, 5);
export const daySlugs = days.map((d) => d.slug);
export { terms, drills };
