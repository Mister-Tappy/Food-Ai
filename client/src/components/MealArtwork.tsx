import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBowlFood,
  faBowlRice,
  faCookieBite,
  faIceCream,
  faMugHot,
  faUtensils,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import type { Meal, MealCategory } from "../types";

const ICONS: Record<MealCategory, IconDefinition> = {
  Rice: faBowlRice,
  Noodles: faBowlFood,
  Soup: faBowlFood,
  Snack: faCookieBite,
  Dessert: faIceCream,
  Drink: faMugHot,
};

export default function MealArtwork({ meal, className = "h-48" }: { meal: Meal; className?: string }) {
  if (meal.image) {
    return <img src={meal.image} alt={meal.nameTh} className={`${className} w-full object-cover`} />;
  }
  return (
    <div
      className={`${className} w-full bg-gradient-to-br from-primary-light via-surface to-[#f5dcc0] flex flex-col items-center justify-center text-center p-5`}
      aria-label={`${meal.category} meal illustration; not a restaurant photograph`}
    >
      <span className="w-16 h-16 rounded-full bg-surface/90 shadow-soft flex items-center justify-center text-2xl">
        <FontAwesomeIcon icon={ICONS[meal.category] || faUtensils} />
      </span>
      <span className="mt-3 text-xs font-semibold text-muted">{meal.category} illustration</span>
    </div>
  );
}
