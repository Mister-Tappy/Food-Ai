import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import RestaurantCard from "../components/RestaurantCard";
import FiltersSidebar from "../components/FiltersSidebar";
import { useAppStore } from "../store/useAppStore";

export default function Search() {
  const { restaurants, favorites, toggleFavorite, preferences } = useAppStore();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let pool = restaurants;

    if (preferences.foodType !== "Any") pool = pool.filter((r) => r.foodType === preferences.foodType);
    if (preferences.openNowOnly) pool = pool.filter((r) => r.openNow !== false);
    if (preferences.requireDelivery) pool = pool.filter((r) => Boolean(r.delivery));
    if (preferences.requireParking) pool = pool.filter((r) => Boolean(r.parking));
    if (preferences.requireOutdoorSeating) pool = pool.filter((r) => Boolean(r.outdoorSeating));
    pool = pool.filter((r) => r.distanceKm <= preferences.distanceKm);

    if (!q) return pool;
    return pool.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.foodType.toLowerCase().includes(q) ||
        (r.cuisine ?? "").toLowerCase().includes(q) ||
        (r.address ?? "").toLowerCase().includes(q)
    );
  }, [restaurants, query, preferences]);

  return (
    <div className="flex flex-col md:flex-row gap-5">
      <FiltersSidebar />
      <div className="flex-1 flex flex-col gap-5">
        <h1 className="text-2xl font-extrabold">ค้นหา</h1>
        <SearchBar value={query} onChange={setQuery} placeholder="ค้นหาร้านอาหาร ประเภทอาหาร หรือที่อยู่..." />
        <p className="text-sm text-muted">
          {results.length} ผลลัพธ์
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 desktop:grid-cols-4 gap-4">
          {results.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} isFavorite={favorites.includes(r.id)} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
        {results.length === 0 && restaurants.length === 0 && (
          <p className="text-center text-muted py-10">
            ยังไม่มีร้านอาหาร — เลือกตำแหน่งในหน้าหลักเพื่อค้นหาร้านอาหารจริงจาก OpenStreetMap
          </p>
        )}
        {results.length === 0 && restaurants.length > 0 && (
          <p className="text-center text-muted py-10">ไม่พบร้านอาหารที่ตรงกับตัวกรอง{query && ` หรือ "${query}"`}</p>
        )}
      </div>
    </div>
  );
}
