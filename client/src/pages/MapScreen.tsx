import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import LeafletMapView from "../components/LeafletMapView";

export default function MapScreen() {
  const navigate = useNavigate();
  const { restaurants, recommendations, searchOrigin, searchLabel, preferences, setOpenNowOnly } = useAppStore();

  const list = recommendations.length ? recommendations : restaurants;
  const topPick = recommendations[0];

  return (
    <div className="flex flex-col gap-3 h-[65vh] md:h-[75vh]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="ย้อนกลับ"
          className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center shrink-0"
        >
          ←
        </button>
        <h1 className="font-bold text-lg flex-1 truncate">แผนที่ร้านอาหาร</h1>
        <label className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
          <input
            type="checkbox"
            checked={preferences.openNowOnly}
            onChange={(e) => setOpenNowOnly(e.target.checked)}
            className="accent-primary w-3.5 h-3.5"
          />
          เปิดอยู่
        </label>
      </div>

      {list.length === 0 ? (
        <div className="flex-1 card flex items-center justify-center text-center text-sm text-muted p-6">
          ยังไม่มีร้านอาหารให้แสดงบนแผนที่ — กลับไปหน้าหลักเพื่อเลือกตำแหน่งค้นหาก่อน
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <LeafletMapView
            restaurants={list}
            activeId={topPick?.id}
            origin={searchOrigin ?? undefined}
            originLabel={searchLabel ?? undefined}
            heightClassName="h-full"
          />
        </div>
      )}
    </div>
  );
}
