import { useAppStore } from "../store/useAppStore";
import RestaurantCard from "../components/RestaurantCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

export default function Favorites() {
  const { restaurants, favoriteSnapshots, favorites, toggleFavorite } = useAppStore();
  const available = [...restaurants, ...favoriteSnapshots].filter((restaurant, index, all) => all.findIndex((item) => item.id === restaurant.id) === index);
  const favRestaurants = available.filter((r) => favorites.includes(r.id));

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">รายการโปรด</h1>
      {favRestaurants.length === 0 ? (
        <p className="text-muted text-center py-16">
          ยังไม่มีร้านโปรด — กด <FontAwesomeIcon icon={faHeart} className="mx-1" /> ที่ร้านอาหารเพื่อบันทึกไว้ที่นี่
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 desktop:grid-cols-4 gap-4">
          {favRestaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} isFavorite onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
