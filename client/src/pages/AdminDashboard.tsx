import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { MEALS } from "../data/meals";

export default function AdminDashboard() {
  const { restaurants, recommendCount, mealHistory, favorites, likedMealIds } = useAppStore();
  const acceptance = recommendCount ? Math.round((likedMealIds.length / recommendCount) * 100) : null;
  const categoryCounts = mealHistory.reduce<Record<string, number>>((counts, entry) => ({ ...counts, [entry.meal.category]: (counts[entry.meal.category] || 0) + 1 }), {});
  const cuisineCounts = mealHistory.flatMap((entry) => entry.meal.cuisines).reduce<Record<string, number>>((counts, cuisine) => ({ ...counts, [cuisine]: (counts[cuisine] || 0) + 1 }), {});
  const top = (counts: Record<string, number>) => Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return <div className="flex flex-col gap-5"><div><h1 className="text-2xl font-extrabold">Admin dashboard</h1><p className="text-sm text-muted">Actual device activity and currently loaded OSM data</p></div><div className="grid grid-cols-2 lg:grid-cols-5 gap-3"><Stat label="Meal recommendations" value={recommendCount} /><Stat label="Completed meals" value={mealHistory.length} /><Stat label="Favorites" value={favorites.length} /><Stat label="Live OSM records" value={restaurants.length} /><Stat label="Acceptance" value={acceptance == null ? "—" : `${acceptance}%`} /></div><div className="grid md:grid-cols-2 gap-4"><Breakdown title="Popular meal categories" data={top(categoryCounts)} /><Breakdown title="Popular cuisines" data={top(cuisineCounts)} /></div><div className="grid sm:grid-cols-2 gap-4"><Link to="/admin/dataset" className="card p-5"><h2 className="font-bold">Meal dataset</h2><p className="text-sm text-muted mt-1">{MEALS.length} structured internal meals. No restaurant records are invented.</p></Link><Link to="/admin/training" className="card p-5"><h2 className="font-bold">AI training</h2><p className="text-sm text-muted mt-1">Inspect optional model status and the deterministic scoring fallback.</p></Link></div></div>;
}
function Stat({ label, value }: { label: string; value: string | number }) { return <div className="card p-4 text-center"><strong className="text-2xl text-primary">{value}</strong><span className="text-xs text-muted block mt-1">{label}</span></div>; }
function Breakdown({ title, data }: { title: string; data: [string, number][] }) { return <section className="card p-4"><h2 className="font-bold mb-3">{title}</h2>{data.length ? <ul className="space-y-2">{data.map(([label, count]) => <li key={label} className="flex justify-between text-sm"><span>{label}</span><strong>{count}</strong></li>)}</ul> : <p className="text-sm text-muted">No completed-meal data yet.</p>}</section>; }
