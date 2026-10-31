import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import MealArtwork from "../components/MealArtwork";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faHeart,
  faLocationDot,
  faShuffle,
  faThumbsDown,
} from "@fortawesome/free-solid-svg-icons";

export default function Result() {
  const navigate = useNavigate();
  const {
    currentMeal,
    searchOrigin,
    likeCurrentMeal,
    dislikeCurrentMeal,
    recommendMeal,
    completeCurrentMeal,
  } = useAppStore();

  if (!currentMeal) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
        <p className="text-muted">ยังไม่มีเมนูแนะนำ</p>
        <Link to="/" className="btn btn-primary">เริ่มเลือกเมนู</Link>
      </div>
    );
  }

  const { meal, score, reasons, scoreBreakdown } = currentMeal;

  function tryAnother() {
    recommendMeal(true);
  }

  function saveMeal() {
    likeCurrentMeal();
    completeCurrentMeal();
    navigate("/diary");
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5 pb-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate("/")} aria-label="ย้อนกลับ" className="w-9 h-9 rounded-full border border-slate-200">←</button>
        <div className="flex-1">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">AI food decision</p>
          <h1 className="text-xl font-extrabold">เมนูที่เหมาะกับคุณ</h1>
        </div>
        <span className="badge bg-primary-light text-primary-dark">AI Match {score}%</span>
      </div>

      <article className="card overflow-hidden grid md:grid-cols-[280px_1fr]">
        <MealArtwork meal={meal} className="h-56 md:h-full min-h-[250px]" />
        <div className="p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">{meal.nameTh}</h2>
            <p className="text-sm text-muted">{meal.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-subtle text-ink">{meal.category}</span>
            {meal.tastes.map((taste) => <span key={taste} className="badge bg-subtle text-ink">{taste}</span>)}
            {meal.cuisines.map((cuisine) => <span key={cuisine} className="badge bg-subtle text-ink">{cuisine}</span>)}
          </div>
          <p className="text-sm"><strong>Typical meal estimate:</strong> ฿{meal.priceRange[0]}–{meal.priceRange[1]}</p>
          <div>
            <h3 className="font-bold text-sm mb-2">Why it matches</h3>
            <ul className="space-y-1.5 text-sm text-muted">
              {reasons.map((reason) => <li key={reason}><FontAwesomeIcon icon={faCheck} className="mr-2 text-success" />{reason}</li>)}
            </ul>
          </div>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer font-semibold text-ink">How the score was calculated</summary>
            <div className="grid grid-cols-5 gap-1 mt-2 text-center">
              {Object.entries(scoreBreakdown).map(([label, value]) => (
                <div key={label} className="bg-subtle rounded p-2"><strong className="block text-ink">{value}</strong>{label}</div>
              ))}
            </div>
          </details>
        </div>
      </article>

      {!searchOrigin && (
        <p className="card p-3 text-sm text-muted">Choose a location on Home before finding nearby restaurants.</p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <button type="button" onClick={() => navigate(searchOrigin ? "/recommendation" : "/")} className="btn btn-primary py-3">
          <FontAwesomeIcon icon={faLocationDot} />Find nearby restaurants
        </button>
        <button type="button" onClick={tryAnother} className="btn btn-dark py-3"><FontAwesomeIcon icon={faShuffle} />Try another</button>
        <button type="button" onClick={saveMeal} className="btn btn-ghost"><FontAwesomeIcon icon={faHeart} />Save meal</button>
        <button type="button" onClick={dislikeCurrentMeal} className="btn btn-ghost"><FontAwesomeIcon icon={faThumbsDown} />Not interested</button>
      </div>
    </div>
  );
}
