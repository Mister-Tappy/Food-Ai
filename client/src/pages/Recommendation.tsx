import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import RestaurantCard from "../components/RestaurantCard";
import LeafletMapView from "../components/LeafletMapView";
import LocationSelector from "../components/LocationSelector";
import MealArtwork from "../components/MealArtwork";

type SortMode = "recommended" | "nearest" | "name";

export default function Recommendation() {
  const {
    currentMeal,
    recommendations,
    restaurants,
    favorites,
    toggleFavorite,
    findRestaurantsForCurrentMeal,
    searching,
    searchError,
    searchOrigin,
    searchLabel,
  } = useAppStore();
  const [sort, setSort] = useState<SortMode>("recommended");
  const [activeId, setActiveId] = useState<number | undefined>();

  useEffect(() => {
    if (currentMeal && searchOrigin) void findRestaurantsForCurrentMeal();
    // Only refetch when the selected meal changes or this screen first receives a location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMeal?.meal.id, searchOrigin?.lat, searchOrigin?.lng]);

  const sorted = useMemo(() => {
    const list = [...recommendations];
    if (sort === "nearest") return list.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
    return list.sort((a, b) => b.score - a.score);
  }, [recommendations, sort]);

  if (!currentMeal) {
    return <div className="text-center py-16"><p className="text-muted mb-3">Choose a meal before searching restaurants.</p><Link to="/" className="btn btn-primary">Choose a meal</Link></div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card overflow-hidden grid sm:grid-cols-[150px_1fr]">
        <MealArtwork meal={currentMeal.meal} className="h-36 sm:h-full" />
        <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div><p className="text-xs text-primary font-bold uppercase">Finding real places for</p><h1 className="text-xl font-extrabold">{currentMeal.meal.nameTh}</h1><p className="text-xs text-muted">Progressive match: OSM keyword → cuisine → category → nearby compatible place</p></div>
          <Link to="/result" className="btn btn-ghost text-sm">Change meal</Link>
        </div>
      </div>

      <LocationSelector />

      {searchError && <div role="alert" className="card p-4 border border-danger/30 text-sm text-danger"><p>{searchError}</p><button type="button" onClick={() => void findRestaurantsForCurrentMeal()} className="underline font-bold mt-1">Try again</button></div>}

      {searching && <div className="card h-64 animate-pulse bg-subtle flex items-center justify-center text-sm text-muted">Searching live OpenStreetMap restaurants…</div>}
      {!searching && sorted.length > 0 && (
        <LeafletMapView restaurants={sorted} activeId={activeId} onSelectRestaurant={setActiveId} origin={searchOrigin ?? undefined} originLabel={searchLabel ?? undefined} heightClassName="h-[360px]" />
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div><h2 className="font-extrabold text-lg">Nearby restaurant matches</h2><p className="text-xs text-muted">{restaurants.length} real OSM records · {sorted.length} ranked results</p></div>
        <label className="text-sm flex items-center gap-2">Sort<select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} className="border border-slate-200 rounded px-2 py-1.5 bg-surface"><option value="recommended">Recommended</option><option value="nearest">Nearest</option><option value="name">Name</option></select></label>
      </div>

      {!searching && searchOrigin && !searchError && sorted.length === 0 && (
        <div className="card p-8 text-center"><h3 className="font-bold">No compatible restaurants found</h3><p className="text-sm text-muted mt-1">Try a larger radius or another location. No mock venues were substituted.</p></div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((restaurant, index) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} isFavorite={favorites.includes(restaurant.id)} onToggleFavorite={toggleFavorite} onSelect={setActiveId} ribbon={index === 0 ? "Best evidence" : undefined} />
        ))}
      </div>
    </div>
  );
}
