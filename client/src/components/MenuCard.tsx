import type { MenuItem } from "../types";

export default function MenuCard({ item }: { item: MenuItem }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
      <span className="font-semibold">{item.name}</span>
      <span className="text-primary font-bold">฿{item.price}</span>
    </div>
  );
}
