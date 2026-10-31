import { useAppStore } from "../store/useAppStore";
import type { MoodKey } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faFaceGrinTongue,
  faFaceMeh,
  faFaceTired,
  faLeaf,
  faPepperHot,
} from "@fortawesome/free-solid-svg-icons";

const MOODS: { key: MoodKey; icon: IconDefinition; label: string }[] = [
  { key: "spicy", icon: faPepperHot, label: "อยากกินเผ็ด" },
  { key: "hungry", icon: faFaceGrinTongue, label: "หิวมาก" },
  { key: "neutral", icon: faFaceMeh, label: "เฉยๆ" },
  { key: "light", icon: faLeaf, label: "อยากกินเบาๆ" },
  { key: "lowAppetite", icon: faFaceTired, label: "ไม่ค่อยหิว" },
];

export default function MoodCheckIn() {
  const { mood, setMood } = useAppStore();

  return (
    <section className="card p-4" aria-label="เช็คอินความอยากอาหาร">
      <h2 className="font-bold text-sm mb-1">วันนี้คุณรู้สึกยังไง?</h2>
      <p className="text-xs text-muted mb-3">บอก AI ให้ช่วยเลือกร้านที่เข้ากับความรู้สึกตอนนี้</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MOODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMood(mood === m.key ? null : m.key)}
            aria-pressed={mood === m.key}
            className={`flex flex-col items-center gap-1 shrink-0 w-16 py-2 rounded-md border text-xs font-semibold transition ${
              mood === m.key ? "border-primary bg-primary-light text-primary-dark" : "border-slate-200 text-muted"
            }`}
          >
            <FontAwesomeIcon icon={m.icon} className="text-lg" aria-hidden="true" />
            {m.label}
          </button>
        ))}
      </div>
    </section>
  );
}
