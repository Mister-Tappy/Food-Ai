import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import type { FoodType, BudgetLevel } from "../types";

const FOOD_TYPES: { value: FoodType; label: string }[] = [
  { value: "Thai", label: "อาหารไทย" },
  { value: "Japanese", label: "ญี่ปุ่น" },
  { value: "Chinese", label: "จีน" },
  { value: "Korean", label: "เกาหลี" },
  { value: "Cafe", label: "คาเฟ่" },
  { value: "Dessert", label: "ของหวาน" },
  { value: "Fast Food", label: "ฟาสต์ฟู้ด" },
  { value: "Steak", label: "สเต็ก" },
  { value: "Seafood", label: "ซีฟู้ด" },
  { value: "Vegetarian", label: "มังสวิรัติ" },
  { value: "Halal", label: "ฮาลาล" },
];

const BUDGET_OPTIONS: { value: BudgetLevel; label: string }[] = [
  { value: 1, label: "฿ ประหยัด" },
  { value: 2, label: "฿฿ ปานกลาง" },
  { value: 3, label: "฿฿฿ ค่อนข้างสูง" },
  { value: 4, label: "฿฿฿฿ หรูหรา" },
];

const DISTANCE_STOPS = [0.5, 1, 3, 5, 10, 20];

export default function Preferences() {
  const navigate = useNavigate();
  const { tasteProfile, toggleLikedFoodType, toggleDislikedFoodType, preferences, setBudget, setDistanceKm } =
    useAppStore();

  const distanceIndex = Math.max(0, DISTANCE_STOPS.indexOf(preferences.distanceKm));

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="ย้อนกลับ"
          className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center shrink-0"
        >
          ←
        </button>
        <h1 className="font-bold text-lg">ตั้งค่าความชอบ</h1>
      </div>

      <section className="card p-4">
        <h2 className="font-bold mb-1">ประเภทอาหารที่ชอบ</h2>
        <p className="text-xs text-muted mb-3">เลือกได้หลายรายการ — AI จะให้คะแนนร้านเหล่านี้เพิ่มขึ้นเล็กน้อย</p>
        <div className="flex flex-wrap gap-2">
          {FOOD_TYPES.map((f) => {
            const active = tasteProfile.liked.includes(f.value);
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => toggleLikedFoodType(f.value)}
                aria-pressed={active}
                className={`chip ${active ? "chip-active" : ""}`}
              >
                {active && <span aria-hidden="true">✓ </span>}
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-bold mb-1">อาหารที่ไม่ชอบ</h2>
        <p className="text-xs text-muted mb-3">ร้านประเภทนี้จะไม่ถูกแนะนำให้คุณเลย</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {FOOD_TYPES.map((f) => {
            const active = tasteProfile.disliked.includes(f.value);
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => toggleDislikedFoodType(f.value)}
                aria-pressed={active}
                className={`chip ${active ? "!bg-danger/10 !border-danger !text-danger" : ""}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        {tasteProfile.disliked.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tasteProfile.disliked.map((f) => (
              <span key={f} className="badge bg-danger/10 text-danger">
                {FOOD_TYPES.find((x) => x.value === f)?.label ?? f}
                <button type="button" onClick={() => toggleDislikedFoodType(f)} aria-label={`เอา ${f} ออก`} className="ml-1">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="card p-4">
        <h2 className="font-bold mb-3">งบประมาณที่สบายใจ</h2>
        <div className="flex flex-col gap-2">
          {BUDGET_OPTIONS.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => setBudget(b.value)}
              aria-pressed={preferences.budget === b.value}
              className={`chip justify-start ${preferences.budget === b.value ? "chip-active" : ""}`}
            >
              {preferences.budget === b.value && <span aria-hidden="true">✓ </span>}
              {b.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">ระยะทางที่ยอมรับได้</h2>
          <span className="text-sm font-semibold text-primary">
            {preferences.distanceKm < 1 ? `${preferences.distanceKm * 1000} m` : `${preferences.distanceKm} km`}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={DISTANCE_STOPS.length - 1}
          step={1}
          value={distanceIndex}
          onChange={(e) => setDistanceKm(DISTANCE_STOPS[Number(e.target.value)])}
          className="w-full accent-primary"
          aria-label="ระยะทางที่ยอมรับได้"
        />
      </section>
    </div>
  );
}
