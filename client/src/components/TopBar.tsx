import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBell,
  faBowlFood,
  faChevronDown,
  faLocationDot,
  faMagnifyingGlass,
  faUser,
  faCoins,
} from "@fortawesome/free-solid-svg-icons";

export default function TopBar() {
  const navigate = useNavigate();
  const searchLabel = useAppStore((s) => s.searchLabel);
  const coins = useAppStore((s) => s.coins);
  const [query, setQuery] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 bg-surface border-b border-slate-200">
      <Link to="/" className="flex items-center gap-2 font-extrabold shrink-0 md:hidden">
        <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs" aria-hidden="true">
          <FontAwesomeIcon icon={faBowlFood} />
        </span>
        <span>EatPick</span>
      </Link>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="hidden md:flex items-center gap-2 border border-slate-200 rounded-full px-4 py-2 text-left shrink-0"
        title="เปลี่ยนตำแหน่งค้นหา"
      >
        <FontAwesomeIcon icon={faLocationDot} className="text-muted" aria-hidden="true" />
        <span className="leading-tight">
          <span className="block text-[11px] text-muted">ตำแหน่งปัจจุบัน</span>
          <span className="block text-sm font-bold truncate max-w-[140px]">{searchLabel || "เลือกตำแหน่ง"}</span>
        </span>
      </button>

      <form onSubmit={submitSearch} className="hidden lg:flex flex-1 max-w-md">
        <div className="flex items-center gap-2 border border-slate-200 rounded-full px-4 py-2 bg-bg w-full">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาร้านอาหาร..."
            className="flex-1 bg-transparent text-sm outline-none min-w-0"
            aria-label="ค้นหาร้านอาหาร"
          />
          <button type="submit" aria-label="ค้นหา" className="text-muted shrink-0">
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
        <Link to="/rewards" className="hidden sm:inline-flex badge bg-primary-light text-primary-dark" aria-label={`${coins} coins`}>
          <FontAwesomeIcon icon={faCoins} className="mr-1" />{coins}
        </Link>
        <Link
          to="/search"
          aria-label="ค้นหาร้านอาหาร"
          className="lg:hidden w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </Link>
        <button
          type="button"
          aria-label="การแจ้งเตือน"
          className="relative w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faBell} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" aria-hidden="true" />
        </button>
        <Link to="/profile" className="hidden sm:flex items-center gap-1.5" aria-label="โปรไฟล์">
          <span className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-sm">
            <FontAwesomeIcon icon={faUser} />
          </span>
          <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" className="hidden md:inline text-muted text-[10px]" />
        </Link>
        <Link
          to="/profile"
          aria-label="เมนู"
          className="sm:hidden w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-lg"
        >
          <FontAwesomeIcon icon={faBars} />
        </Link>
      </div>
    </header>
  );
}
