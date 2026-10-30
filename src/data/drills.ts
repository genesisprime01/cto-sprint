import RAW from './drills.txt?raw';
export type Drill = { id: string; cat: string; day: string; week: number; q: string; a: string[]; hint: string; why: string };
export const drills: Drill[] = RAW.trim().split('\n').map((l: string, i: number) => {
  const [cat, day, q, a, hint, why] = l.split(' ¦ ').map((x) => x.trim());
  return { id: `${cat}-${i + 1}`, cat, day, week: +day[1], q, a: a.split(' ‖ ').map((x) => x.trim()), hint, why };
});
export const drillCats = ['bash', 'git', 'docker', 'psql', 'sql', 'python', 'supabase', 'vercel', 'ollama'];
