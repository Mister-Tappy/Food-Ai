import { NavLink } from "react-router-dom";
import { useTheme } from "../lib/theme";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBowlFood,
  faCalendarDays,
  faComments,
  faClockRotateLeft,
  faDice,
  faGear,
  faHeart,
  faHouse,
  faMapLocationDot,
  faMoon,
  faSun,
  faUser,
  faUsers,
  faGift,
} from "@fortawesome/free-solid-svg-icons";

const NAV_ITEMS = [
  { to: "/", label: "หน้าหลัก", icon: faHouse, end: true },
  { to: "/thinking", label: "ช่วยเลือกเมนู", icon: faDice, end: false },
  { to: "/recommendation", label: "ร้านใกล้เมนู", icon: faMapLocationDot, end: false },
  { to: "/diary", label: "Food diary", icon: faCalendarDays, end: false },
  { to: "/favorites", label: "ร้านโปรด", icon: faHeart, end: false },
  { to: "/history", label: "ประวัติการสุ่ม", icon: faClockRotateLeft, end: false },
  { to: "/profile", label: "โปรไฟล์", icon: faUser, end: false },
  { to: "/chat", label: "AI food chat", icon: faComments, end: false },
  { to: "/group", label: "เลือกอาหารกลุ่ม", icon: faUsers, end: false },
  { to: "/rewards", label: "Rewards", icon: faGift, end: false },
  { to: "/admin", label: "ตั้งค่า", icon: faGear, end: false },
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 bg-surface border-r border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-sm text-white shrink-0" aria-hidden="true">
          <FontAwesomeIcon icon={faBowlFood} />
        </div>
        <div className="leading-tight">
          <div className="font-extrabold text-lg">EatPick</div>
          <div className="text-xs text-muted">วันนี้กินอะไรดี?</div>
        </div>
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <FontAwesomeIcon icon={item.icon} className="w-4" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted">ธีม</span>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="inline-flex items-center rounded-full bg-subtle border border-slate-200 p-1 gap-1"
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${theme === "light" ? "bg-surface shadow-soft" : ""}`}>
            <FontAwesomeIcon icon={faSun} />
          </span>
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${theme === "dark" ? "bg-surface shadow-soft" : ""}`}>
            <FontAwesomeIcon icon={faMoon} />
          </span>
        </button>
      </div>

      <p className="text-[11px] text-muted">
        © {new Date().getFullYear()} EatPick
        <br />
        All rights reserved.
      </p>
    </aside>
  );
}
