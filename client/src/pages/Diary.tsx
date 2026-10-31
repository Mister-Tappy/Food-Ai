import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { localDateKey } from "../lib/gamification";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faUtensils } from "@fortawesome/free-solid-svg-icons";

export default function Diary() {
  const mealHistory = useAppStore((state) => state.mealHistory);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const byDate = useMemo(() => {
    const map = new Map<string, typeof mealHistory>();
    mealHistory.forEach((entry) => {
      const key = localDateKey(new Date(entry.completedAt));
      map.set(key, [...(map.get(key) || []), entry]);
    });
    return map;
  }, [mealHistory]);
  const startDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: startDay + days }, (_, index) => index < startDay ? null : index - startDay + 1);
  const selected = byDate.get(selectedDate) || [];

  function dateKey(day: number) {
    return localDateKey(new Date(month.getFullYear(), month.getMonth(), day));
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5">
      <div><h1 className="text-2xl font-extrabold">Food diary</h1><p className="text-sm text-muted">วันนี้กินอะไรไปแล้วบ้าง?</p></div>
      <section className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="w-9 h-9 rounded-full border border-slate-200"><FontAwesomeIcon icon={faChevronLeft} /></button>
          <h2 className="font-bold">{month.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}</h2>
          <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="w-9 h-9 rounded-full border border-slate-200"><FontAwesomeIcon icon={faChevronRight} /></button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-muted mb-1">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <div key={day} className="py-2">{day}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, index) => day == null ? <div key={`blank-${index}`} /> : (
            <button key={day} type="button" onClick={() => setSelectedDate(dateKey(day))} aria-pressed={selectedDate === dateKey(day)} className={`min-h-14 md:min-h-20 rounded border p-1 flex flex-col items-center justify-center ${selectedDate === dateKey(day) ? "border-primary bg-primary-light" : "border-slate-100 hover:bg-subtle"}`}>
              <span>{day}</span>{byDate.has(dateKey(day)) && <FontAwesomeIcon icon={faUtensils} className="mt-1 text-primary" aria-label="Meal saved" />}
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-bold mb-3">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("th-TH", { dateStyle: "long" })}</h2>
        {selected.length ? <div className="grid sm:grid-cols-2 gap-3">{selected.map((entry) => <article key={entry.id} className="card p-4"><span className="badge bg-primary-light text-primary-dark">{entry.meal.category}</span><h3 className="font-bold text-lg mt-2">{entry.meal.nameTh}</h3><p className="text-xs text-muted">{new Date(entry.completedAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</p><p className="text-sm mt-2">{entry.restaurant ? entry.restaurant.name : "Meal saved without a restaurant"}</p><Link to="/stickers" className="text-xs font-bold text-primary mt-2 inline-block">Sticker: {entry.stickerId}</Link></article>)}</div> : <div className="card p-8 text-center text-muted text-sm">No completed meal on this date.</div>}
      </section>
    </div>
  );
}
