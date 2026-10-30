import { terms } from '../data/terms';
import { drills } from '../data/drills';
import { days } from '../data/days';
export function GET() {
  return new Response(JSON.stringify({ terms, drills, days: days.map((d) => ({ slug: d.slug, title: d.title, week: d.week })) }), { headers: { 'content-type': 'application/json' } });
}
