import { useMemo, useState } from "react";
import { recommendForGroup } from "../lib/groupRecommend";
import { DEFAULT_MEAL_PREFERENCES, useAppStore } from "../store/useAppStore";
import type { FoodType, GroupMember, MealCategory } from "../types";
import MealArtwork from "../components/MealArtwork";
import { useNavigate } from "react-router-dom";

const CATEGORIES: Array<MealCategory | "Any"> = ["Any", "Rice", "Noodles", "Soup", "Snack", "Dessert", "Drink"];
const CUISINES: Array<FoodType | "Any"> = ["Any", "Thai", "Japanese", "Korean", "Chinese", "Cafe", "Vegetarian", "Halal"];

export default function GroupDecision() {
  const navigate = useNavigate();
  const setMealPreferences = useAppStore((state) => state.setMealPreferences);
  const selectMealRecommendation = useAppStore((state) => state.selectMealRecommendation);
  const [members, setMembers] = useState<GroupMember[]>([
    { id: "member-1", name: "You", preferences: { ...DEFAULT_MEAL_PREFERENCES } },
    { id: "member-2", name: "Friend", preferences: { ...DEFAULT_MEAL_PREFERENCES } },
  ]);
  const results = useMemo(() => recommendForGroup(members), [members]);

  function update(id: string, patch: Partial<GroupMember>) { setMembers((items) => items.map((member) => member.id === id ? { ...member, ...patch } : member)); }
  function updatePrefs(id: string, patch: Partial<GroupMember["preferences"]>) { setMembers((items) => items.map((member) => member.id === id ? { ...member, preferences: { ...member.preferences, ...patch } } : member)); }
  function choose(index: number) { const chosen = results[index]; if (!chosen) return; setMealPreferences({ category: chosen.meal.category, cuisine: chosen.meal.cuisines[0] || "Any", tastes: chosen.meal.tastes }); selectMealRecommendation(chosen); navigate("/result"); }

  return <div className="flex flex-col gap-5"><div><h1 className="text-2xl font-extrabold">Group food decision</h1><p className="text-sm text-muted">A local temporary session that finds a safe compromise</p></div><div className="grid md:grid-cols-2 gap-4">{members.map((member) => <article key={member.id} className="card p-4 flex flex-col gap-3"><input value={member.name} onChange={(event) => update(member.id, { name: event.target.value })} aria-label="Member name" className="font-bold border-b border-slate-200 bg-transparent pb-1" /><label className="text-xs text-muted">Meal type<select value={member.preferences.category} onChange={(event) => updatePrefs(member.id, { category: event.target.value as MealCategory | "Any" })} className="block w-full mt-1 border border-slate-200 rounded px-2 py-2 bg-surface text-ink">{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs text-muted">Cuisine<select value={member.preferences.cuisine} onChange={(event) => updatePrefs(member.id, { cuisine: event.target.value as FoodType | "Any" })} className="block w-full mt-1 border border-slate-200 rounded px-2 py-2 bg-surface text-ink">{CUISINES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs text-muted">Maximum budget<input type="number" min="50" step="50" value={member.preferences.budgetMax || ""} onChange={(event) => updatePrefs(member.id, { budgetMax: Number(event.target.value) || null })} className="block w-full mt-1 border border-slate-200 rounded px-2 py-2 bg-surface text-ink" /></label></article>)}</div><button type="button" onClick={() => setMembers((items) => [...items, { id: `member-${Date.now()}`, name: `Member ${items.length + 1}`, preferences: { ...DEFAULT_MEAL_PREFERENCES } }])} className="btn btn-ghost self-start">Add member</button><section><h2 className="font-bold text-lg mb-3">Best group compromises</h2><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{results.map((result, index) => <article key={result.meal.id} className="card overflow-hidden"><MealArtwork meal={result.meal} className="h-32" /><div className="p-4"><span className="badge bg-primary-light text-primary-dark">Group match {result.score}%</span><h3 className="font-bold mt-2">{result.meal.nameTh}</h3><p className="text-xs text-muted mt-1">{result.compromiseReason}</p><button type="button" onClick={() => choose(index)} className="btn btn-primary text-xs w-full mt-3">Choose this meal</button></div></article>)}</div></section></div>;
}
