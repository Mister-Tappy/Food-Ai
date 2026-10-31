import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import type { Restaurant, ScoredRestaurant } from "../types";
import { PriceBadge, DistanceBadge, ScoreBadge, CuisineBadge, OpenNowBadge } from "./Badges";
import RestaurantPhoto from "./RestaurantPhoto";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

interface Props {
  restaurant: Restaurant | ScoredRestaurant;
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  ribbon?: string;
  className?: string;
  onSelect?: (id: number) => void;
}

function hasScore(r: Restaurant | ScoredRestaurant): r is ScoredRestaurant {
  return "score" in r;
}

export default function RestaurantCard({ restaurant, isFavorite, onToggleFavorite, ribbon, className, onSelect }: Props) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`card overflow-hidden cursor-pointer relative ${className ?? ""}`}
    >
      {ribbon && (
        <span className="absolute top-2 left-2 z-10 badge bg-primary text-white shadow-soft">{ribbon}</span>
      )}
      <Link to={`/restaurant/${restaurant.id}`} className="block" onFocus={() => onSelect?.(restaurant.id)} onMouseEnter={() => onSelect?.(restaurant.id)}>
        <RestaurantPhoto restaurant={restaurant} className="h-36" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold">{restaurant.name}</h3>
            <button
              type="button"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(restaurant.id);
              }}
              className={`text-lg shrink-0 ${isFavorite ? "text-danger" : "text-muted"}`}
            >
              <FontAwesomeIcon icon={faHeart} className={isFavorite ? "" : "opacity-45"} />
            </button>
          </div>
          {restaurant.address && <p className="text-xs text-muted mt-1 truncate">{restaurant.address}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {!restaurant.priceLevelEstimated && <PriceBadge level={restaurant.priceLevel} />}
            <DistanceBadge km={restaurant.distanceKm} />
            {restaurant.cuisine && <CuisineBadge cuisine={restaurant.cuisine} />}
            <OpenNowBadge openNow={restaurant.openNow} />
            {hasScore(restaurant) && <ScoreBadge score={restaurant.score} />}
          </div>
          {hasScore(restaurant) && restaurant.matchDisclosure && (
            <p className="text-[11px] text-muted mt-2 line-clamp-2">{restaurant.matchDisclosure}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
