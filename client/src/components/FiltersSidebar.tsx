import FilterChips from "./FilterChips";
import AIRecommendButton from "./AIRecommendButton";
import { useAppStore } from "../store/useAppStore";
import type { FoodType } from "../types";

const FOOD_TYPES: (FoodType | "Any")[] = [
  "Any",
  "Thai",
  "Japanese",
  "Chinese",
  "Korean",
  "Cafe",
  "Dessert",
  "Fast Food",
  "Steak",
  "Seafood",
  "Vegetarian",
  "Halal",
];
const DISTANCE_OPTIONS: { label: string; km: number }[] = [
  { label: "500m", km: 0.5 },
  { label: "1km", km: 1 },
  { label: "3km", km: 3 },
  { label: "5km", km: 5 },
  { label: "10km", km: 10 },
  { label: "20km", km: 20 },
];

export default function FiltersSidebar() {
  const {
    preferences,
    setFoodType,
    setDistanceKm,
    setOpenNowOnly,
    setRequireDelivery,
    setRequireTakeaway,
    setRequireParking,
    setRequireOutdoorSeating,
    runRecommendation,
    loading,
  } = useAppStore();

  return (
    <aside
      aria-label="Recommendation filters"
      className="card p-4 md:sticky md:top-20 desktop:w-[260px] flex flex-col gap-1"
    >
      <FilterChips label="Cuisine" options={FOOD_TYPES} value={preferences.foodType} onChange={setFoodType} />

      <div className="mb-5">
        <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-3">Distance</h3>
        <div className="flex flex-wrap gap-2">
          {DISTANCE_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              aria-pressed={preferences.distanceKm === opt.km}
              onClick={() => setDistanceKm(opt.km)}
              className={`chip ${preferences.distanceKm === opt.km ? "chip-active" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-2">
        <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-1">More filters</h3>
        <ToggleRow label="Open now" checked={preferences.openNowOnly} onChange={setOpenNowOnly} />
        <ToggleRow label="Takeaway" checked={preferences.requireTakeaway} onChange={setRequireTakeaway} />
        <ToggleRow label="Delivery" checked={preferences.requireDelivery} onChange={setRequireDelivery} />
        <ToggleRow label="Parking" checked={preferences.requireParking} onChange={setRequireParking} />
        <ToggleRow label="Outdoor seating" checked={preferences.requireOutdoorSeating} onChange={setRequireOutdoorSeating} />
      </div>

      <AIRecommendButton onClick={runRecommendation} loading={loading} />
    </aside>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between text-sm cursor-pointer">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary w-4 h-4"
      />
    </label>
  );
}
