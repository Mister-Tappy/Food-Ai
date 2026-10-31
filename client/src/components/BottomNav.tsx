import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBowlFood, faCalendarDays, faHouse, faMapLocationDot, faUser } from "@fortawesome/free-solid-svg-icons";

const ITEMS = [
  { to: "/", label: "หน้าหลัก", icon: faHouse },
  { to: "/thinking", label: "เลือกเมนู", icon: faBowlFood },
  { to: "/map", label: "แผนที่", icon: faMapLocationDot },
  { to: "/diary", label: "ไดอารี่", icon: faCalendarDays },
  { to: "/profile", label: "โปรไฟล์", icon: faUser },
];

export default function BottomNav() {
  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around bg-surface border-t border-slate-200 px-2 py-2"
    >
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 text-xs px-2 py-1 ${isActive ? "text-primary" : "text-muted"}`
          }
        >
          <FontAwesomeIcon icon={item.icon} className="text-sm" aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
