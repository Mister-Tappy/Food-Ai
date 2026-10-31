import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { PriceBadge, DistanceBadge, OpenNowBadge, CuisineBadge, TagBadge } from "../components/Badges";
import LeafletMapView from "../components/LeafletMapView";
import RestaurantPhoto from "../components/RestaurantPhoto";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faHeart, faLocationArrow, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

function osmDirectionsUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${lat}%2C${lng}`;
}
function googleDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export default function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const restaurantId = Number(id);
  const { restaurants, recommendations, favoriteSnapshots, favorites, toggleFavorite, recordSelection, currentMeal, completeCurrentMeal } = useAppStore();
  const restaurant = [...restaurants, ...favoriteSnapshots].find((r) => r.id === restaurantId);
  const scoredRestaurant = recommendations.find((r) => r.id === restaurantId);
  const [savedMeal, setSavedMeal] = useState(false);

  // History requirement: viewing a restaurant page logs it (Recently Viewed / History page).
  useEffect(() => {
    if (restaurantId) void recordSelection(restaurantId);
  }, [restaurantId, recordSelection]);

  if (!restaurant) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-4">
          ไม่พบร้านนี้ในผลการค้นหาปัจจุบัน — กลับไปเลือกตำแหน่งเพื่อโหลดร้านอาหารจริงใกล้คุณ
        </p>
        <Link to="/" className="btn btn-ghost">
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  const isFavorite = favorites.includes(restaurant.id);

  function saveCompletedMeal() {
    if (completeCurrentMeal(restaurant!.id)) setSavedMeal(true);
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <RestaurantPhoto restaurant={restaurant} className="h-52 rounded-md" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{restaurant.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {!restaurant.priceLevelEstimated && <PriceBadge level={restaurant.priceLevel} />}
            <DistanceBadge km={restaurant.distanceKm} />
            {restaurant.cuisine && <CuisineBadge cuisine={restaurant.cuisine} />}
            <OpenNowBadge openNow={restaurant.openNow} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => toggleFavorite(restaurant.id)}
          className={`btn shrink-0 ${isFavorite ? "btn-primary" : "btn-ghost"}`}
        >
          <FontAwesomeIcon icon={faHeart} />
          {isFavorite ? "Saved" : "Save"}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <a href={osmDirectionsUrl(restaurant.lat, restaurant.lng)} target="_blank" rel="noreferrer" className="btn btn-primary flex-1 text-center">
          <FontAwesomeIcon icon={faLocationArrow} />
          Navigate (OpenStreetMap)
        </a>
        <a href={googleDirectionsUrl(restaurant.lat, restaurant.lng)} target="_blank" rel="noreferrer" className="btn btn-ghost flex-1 text-center">
          Open in Google Maps
        </a>
        <Link to="/history" className="btn btn-ghost">
          History
        </Link>
        {currentMeal && (
          <button type="button" onClick={saveCompletedMeal} disabled={savedMeal} className="btn btn-dark flex-1">
            <FontAwesomeIcon icon={faCheck} />{savedMeal ? "Meal saved" : `I ate ${currentMeal.meal.nameTh}`}
          </button>
        )}
      </div>

      <LeafletMapView restaurants={[restaurant]} activeId={restaurant.id} center={{ lat: restaurant.lat, lng: restaurant.lng }} />

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="font-bold text-lg">Details</h2>
        <dl className="text-sm grid gap-1.5">
          <div><dt className="inline font-semibold">Address: </dt><dd className="inline text-muted">{restaurant.address || "Not available"}</dd></div>
          <div><dt className="inline font-semibold">Cuisine: </dt><dd className="inline text-muted">{restaurant.cuisine?.replace(/_/g, " ") || "Not available"}</dd></div>
          <div><dt className="inline font-semibold">Phone: </dt><dd className="inline text-muted">{restaurant.phone ? <a href={`tel:${restaurant.phone}`} className="underline">{restaurant.phone}</a> : "Not available"}</dd></div>
          <div><dt className="inline font-semibold">Website: </dt><dd className="inline text-muted">{restaurant.website ? <a href={restaurant.website} target="_blank" rel="noreferrer" className="underline break-all">{restaurant.website}</a> : "Not available"}</dd></div>
          <div>
            <dt className="inline font-semibold">OSM source: </dt>
            <dd className="inline text-muted font-mono text-xs">
              <a
                href={`https://www.openstreetmap.org/${restaurant.osmId}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {restaurant.osmId}
              </a>
            </dd>
          </div>
        </dl>

        <div>
          <h3 className="font-semibold text-sm mb-1">
            Opening hours{" "}
            {restaurant.openNow !== null && (
              <span className={restaurant.openNow ? "text-success" : "text-danger"}>
                · {restaurant.openNow ? "Open now" : "Closed now"}
              </span>
            )}
          </h3>
          <p className="text-sm text-muted">{restaurant.openingHoursRaw || "Opening hours not tagged on OpenStreetMap."}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {restaurant.wheelchair && <TagBadge tag="wheelchair" />}
          {restaurant.takeaway && <TagBadge tag="takeaway" />}
          {restaurant.delivery && <TagBadge tag="delivery" />}
          {restaurant.outdoorSeating && <TagBadge tag="outdoorSeating" />}
          {restaurant.parking && <TagBadge tag="parking" />}
        </div>

        {restaurant.aiSummary && (
          <div className="bg-subtle border border-primary-light rounded-md p-3">
            <h3 className="font-semibold text-sm mb-1">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-1.5" />
              AI summary
            </h3>
            <p className="text-sm text-muted">{restaurant.aiSummary}</p>
          </div>
        )}
      </section>
      {scoredRestaurant && (
        <section className="card p-4">
          <h2 className="font-bold">{scoredRestaurant.score}% recommendation match</h2>
          <p className="text-xs text-muted mt-1">{scoredRestaurant.matchDisclosure}</p>
          <ul className="text-sm text-muted mt-3 space-y-1">{scoredRestaurant.reasons.map((reason) => <li key={reason}><FontAwesomeIcon icon={faCheck} className="mr-2" />{reason}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
