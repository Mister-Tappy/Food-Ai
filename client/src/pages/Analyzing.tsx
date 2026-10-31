import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBrain, faCheck, faCircle } from "@fortawesome/free-solid-svg-icons";

const STEPS = [
  "อ่านประเภทอาหาร รสชาติ และข้อจำกัด",
  "กรองเมนูที่ไม่ผ่านเงื่อนไข",
  "คำนวณ Preference · Taste · Budget · Novelty",
  "จัดอันดับและเลือกเมนูที่เหมาะที่สุด",
];

export default function Analyzing() {
  const navigate = useNavigate();
  const recommendMeal = useAppStore((state) => state.recommendMeal);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timers = STEPS.map((_, index) =>
      setTimeout(() => !cancelled && setDoneCount(index + 1), 260 * (index + 1))
    );
    const result = recommendMeal(false);
    const finalTimer = setTimeout(() => {
      if (!cancelled) navigate(result ? "/result" : "/", { replace: true });
    }, 1300);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      clearTimeout(finalTimer);
    };
  }, [navigate, recommendMeal]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center gap-7 px-6" aria-live="polite">
      <div>
        <h1 className="text-xl font-extrabold">กำลังช่วยตัดสินใจ...</h1>
        <p className="text-sm text-muted mt-1">ระบบกำลังให้คะแนนเมนูจากความชอบจริงของคุณ</p>
      </div>
      <div className="relative w-36 h-36 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary-light animate-pulse" aria-hidden="true" />
        <div className="relative w-20 h-20 rounded-full bg-ink flex items-center justify-center text-3xl text-white shadow-hover">
          <FontAwesomeIcon icon={faBrain} />
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-sm text-left w-full max-w-sm">
        {STEPS.map((step, index) => (
          <li key={step} className={`flex items-center gap-2 transition-opacity ${index < doneCount ? "opacity-100" : "opacity-40"}`}>
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${index < doneCount ? "bg-ink text-white border-ink" : "border-slate-300 text-slate-300"}`}>
              <FontAwesomeIcon icon={index < doneCount ? faCheck : faCircle} />
            </span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}
