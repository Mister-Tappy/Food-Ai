import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import LocationSelector from "../components/LocationSelector";
import MealArtwork from "../components/MealArtwork";
import LeafletMapView from "../components/LeafletMapView";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faBowlFood,
  faCheck,
  faCoins,
  faLocationDot,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import type { FoodType, MealCategory, MealTaste } from "../types";

const CATEGORIES: Array<MealCategory | "Any"> = ["Any", "Rice", "Noodles", "Soup", "Snack", "Dessert", "Drink"];
const TASTES: MealTaste[] = ["Spicy", "Mild", "Sweet", "Savory", "Sour"];
const CUISINES: Array<FoodType | "Any"> = ["Any", "Thai", "Japanese", "Korean", "Chinese", "Cafe", "Vegetarian", "Halal"];
const BUDGETS: Array<{ label: string; value: number | null }> = [
  { label: "Any", value: null },
  { label: "≤ ฿100", value: 100 },
  { label: "≤ ฿200", value: 200 },
  { label: "≤ ฿300", value: 300 },
  { label: "฿300+", value: 500 },
];

export default function Home() {
  const navigate = useNavigate();
  const {
    mealPreferences,
    setMealPreferences,
    currentMeal,
    mealHistory,
    missions,
    coins,
    claimMission,
    userSettings,
    mapPickMode,
    searchOrigin,
    searchLabel,
    pickPointOnMap,
  } = useAppStore();
  const activeMission = missions.find((mission) => mission.status !== "claimed") || missions[0];

  function toggleTaste(taste: MealTaste) {
    setMealPreferences({
      tastes: mealPreferences.tastes.includes(taste)
        ? mealPreferences.tastes.filter((item) => item !== taste)
        : [...mealPreferences.tastes, taste],
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">สวัสดี {userSettings.displayName}</p>
          <h1 className="text-2xl md:text-3xl font-extrabold">วันนี้กินอะไรดี?</h1>
          <p className="text-sm text-muted mt-1">เริ่มจากเมนูที่เหมาะกับคุณ แล้วค่อยหาร้านจริงใกล้ๆ</p>
        </div>
        <Link to="/rewards" className="badge bg-primary-light text-primary-dark px-3 py-2 shrink-0" aria-label={`${coins} coins`}>
          <FontAwesomeIcon icon={faCoins} className="mr-1.5" />{coins}
        </Link>
      </header>

      <section className="hero-dark rounded-xl text-white p-5 md:p-7 grid xl:grid-cols-[1fr_240px] gap-5 overflow-hidden">
        <div className="flex flex-col justify-center">
          <span className="text-xs uppercase tracking-[0.2em] text-white/60 font-bold">Food decision assistant</span>
          <h2 className="text-2xl md:text-3xl xl:text-4xl font-extrabold mt-2 max-w-xl">ไม่ต้องเลื่อนหาร้านเป็นร้อยร้าน ให้ AI ช่วยเลือก “เมนู” ก่อน</h2>
          <p className="text-sm text-white/70 mt-3 max-w-xl">ระบบให้คะแนนจากประเภท รสชาติ งบ ประวัติ และความหลากหลายอย่างอธิบายได้</p>
        </div>
        <div className="hidden xl:flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-primary/30 flex items-center justify-center text-6xl"><FontAwesomeIcon icon={faBowlFood} /></div>
        </div>
      </section>

      <div className="grid xl:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          <LocationSelector />
          {mapPickMode && (
            <LeafletMapView
              restaurants={[]}
              origin={searchOrigin ?? undefined}
              originLabel={searchLabel ?? undefined}
              pickMode
              onPick={(point) => void pickPointOnMap(point)}
              heightClassName="h-72"
            />
          )}

          <section className="card p-4 md:p-5 flex flex-col gap-5" aria-labelledby="meal-preferences-title">
            <div>
              <h2 id="meal-preferences-title" className="font-extrabold text-lg">เลือกเท่าที่อยากเลือก</h2>
              <p className="text-xs text-muted">ทุกตัวเลือกเป็น optional—ปล่อย Any ได้</p>
            </div>

            <PreferenceGroup title="Food type">
              {CATEGORIES.map((category) => <Choice key={category} label={category} active={mealPreferences.category === category} onClick={() => setMealPreferences({ category })} />)}
            </PreferenceGroup>
            <PreferenceGroup title="Taste">
              {TASTES.map((taste) => <Choice key={taste} label={taste} active={mealPreferences.tastes.includes(taste)} onClick={() => toggleTaste(taste)} />)}
            </PreferenceGroup>
            <PreferenceGroup title="Cuisine">
              {CUISINES.map((cuisine) => <Choice key={cuisine} label={cuisine} active={mealPreferences.cuisine === cuisine} onClick={() => setMealPreferences({ cuisine })} />)}
            </PreferenceGroup>
            <PreferenceGroup title="Budget per meal">
              {BUDGETS.map((budget) => <Choice key={budget.label} label={budget.label} active={mealPreferences.budgetMax === budget.value} onClick={() => setMealPreferences({ budgetMax: budget.value })} />)}
            </PreferenceGroup>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Toggle label="Vegetarian" checked={mealPreferences.dietaryRestrictions.includes("vegetarian")} onChange={(checked) => setMealPreferences({ dietaryRestrictions: checked ? [...mealPreferences.dietaryRestrictions.filter((item) => item !== "vegan"), "vegetarian"] : mealPreferences.dietaryRestrictions.filter((item) => item !== "vegetarian") })} />
              <Toggle label="Halal meals" checked={mealPreferences.dietaryRestrictions.includes("halal")} onChange={(checked) => setMealPreferences({ dietaryRestrictions: checked ? [...mealPreferences.dietaryRestrictions, "halal"] : mealPreferences.dietaryRestrictions.filter((item) => item !== "halal") })} />
              <Toggle label="Restaurant must be open now" checked={mealPreferences.openNowOnly} onChange={(openNowOnly) => setMealPreferences({ openNowOnly })} />
              <Toggle label="Restaurant delivery required" checked={mealPreferences.requireDelivery} onChange={(requireDelivery) => setMealPreferences({ requireDelivery })} />
            </div>

            <button type="button" onClick={() => navigate("/thinking")} className="btn btn-primary text-base py-3.5 w-full sm:w-auto sm:min-w-[280px] self-center">
              <FontAwesomeIcon icon={faWandMagicSparkles} />ช่วยเลือกเมนูให้ฉัน
            </button>
          </section>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-20">
          {currentMeal ? (
            <section className="card overflow-hidden">
              <MealArtwork meal={currentMeal.meal} className="h-36" />
              <div className="p-4">
                <span className="badge bg-primary-light text-primary-dark">Last match {currentMeal.score}%</span>
                <h2 className="font-extrabold text-lg mt-2">{currentMeal.meal.nameTh}</h2>
                <p className="text-xs text-muted">{currentMeal.meal.name}</p>
                <Link to="/result" className="text-sm font-bold text-primary mt-3 inline-flex items-center gap-2">ดูคำแนะนำ <FontAwesomeIcon icon={faArrowRight} /></Link>
              </div>
            </section>
          ) : (
            <section className="card p-5 text-center">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="text-2xl mb-2" />
              <h2 className="font-bold">ยังไม่มีเมนูวันนี้</h2>
              <p className="text-xs text-muted mt-1">ตั้งค่าด้านซ้ายแล้วให้ระบบช่วยตัดสินใจ</p>
            </section>
          )}

          {activeMission && (
            <section className="card p-4">
              <div className="flex justify-between gap-3"><h2 className="font-bold">Daily mission</h2><span className="text-xs text-primary font-bold">+{activeMission.coinReward} coins</span></div>
              <p className="text-sm mt-2">{activeMission.title}</p>
              <div className="h-2 bg-subtle rounded-full mt-3 overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(activeMission.progress / activeMission.target) * 100}%` }} /></div>
              {activeMission.status === "completed" && <button type="button" onClick={() => claimMission(activeMission.id)} className="btn btn-ghost w-full mt-3 text-xs"><FontAwesomeIcon icon={faCheck} />Claim reward</button>}
              {activeMission.status !== "completed" && <Link to="/missions" className="text-xs text-primary font-bold mt-3 inline-block">View all missions</Link>}
            </section>
          )}

          <section className="card p-4">
            <h2 className="font-bold">Your progress</h2>
            <div className="grid grid-cols-2 gap-3 mt-3 text-center"><div className="bg-subtle rounded p-3"><strong className="block text-xl">{mealHistory.length}</strong><span className="text-xs text-muted">meals saved</span></div><div className="bg-subtle rounded p-3"><strong className="block text-xl">{coins}</strong><span className="text-xs text-muted">coins</span></div></div>
            <Link to="/diary" className="text-xs font-bold text-primary mt-3 inline-flex items-center gap-2"><FontAwesomeIcon icon={faLocationDot} />Open food diary</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}

function PreferenceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset><legend className="text-xs uppercase tracking-wide text-muted font-bold mb-2">{title}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>;
}
function Choice({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`chip ${active ? "chip-active" : ""}`}>{active && <FontAwesomeIcon icon={faCheck} className="mr-1" />}{label}</button>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-2 cursor-pointer"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-primary" /></label>;
}
