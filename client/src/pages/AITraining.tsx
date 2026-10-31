import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAppStore } from "../store/useAppStore";
import {
  CuisineBadge,
  DistanceBadge,
  OpenNowBadge,
  PriceBadge,
  ScoreBadge,
} from "../components/Badges";
import RestaurantPhoto from "../components/RestaurantPhoto";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore } from "@fortawesome/free-solid-svg-icons";
import type { ModelStatus, Restaurant, ScoredRestaurant } from "../types";

function hasScore(restaurant: Restaurant | ScoredRestaurant): restaurant is ScoredRestaurant {
  return "score" in restaurant;
}

function RestaurantTrainingCard({
  restaurant,
}: {
  restaurant: Restaurant | ScoredRestaurant;
}) {
  const features = [
    restaurant.delivery ? "Delivery" : null,
    restaurant.takeaway ? "Takeaway" : null,
    restaurant.parking ? "Parking" : null,
    restaurant.outdoorSeating ? "Outdoor seating" : null,
    restaurant.wheelchair ? "Wheelchair access" : null,
  ].filter(Boolean);

  return (
    <article className="card overflow-hidden flex flex-col min-w-0">
      <RestaurantPhoto restaurant={restaurant} className="h-44" />

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold leading-snug">{restaurant.name}</h3>
            <OpenNowBadge openNow={restaurant.openNow} />
          </div>
          <p className="text-xs text-muted mt-1 line-clamp-2">
            {restaurant.address || "Address is not tagged in OpenStreetMap."}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="badge bg-subtle text-ink">{restaurant.foodType}</span>
          {!restaurant.priceLevelEstimated && <PriceBadge level={restaurant.priceLevel} />}
          <DistanceBadge km={restaurant.distanceKm} />
          {restaurant.cuisine && <CuisineBadge cuisine={restaurant.cuisine} />}
          {hasScore(restaurant) && <ScoreBadge score={restaurant.score} />}
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <div>
            <dt className="text-muted">Opening hours</dt>
            <dd className="font-semibold truncate">{restaurant.openingHoursRaw || "Not tagged"}</dd>
          </div>
          <div>
            <dt className="text-muted">OSM record</dt>
            <dd className="font-semibold font-mono truncate">{restaurant.osmId}</dd>
          </div>
        </dl>

        {restaurant.aiSummary && (
          <p className="rounded-md bg-subtle p-2.5 text-xs text-muted leading-relaxed">
            {restaurant.aiSummary}
          </p>
        )}

        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Restaurant features">
            {features.map((feature) => (
              <span key={feature} className="rounded-full bg-primary-light px-2 py-1 text-[11px] font-semibold text-primary-dark">
                {feature}
              </span>
            ))}
          </div>
        )}

        {hasScore(restaurant) && restaurant.reasons.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-bold mb-1">Signals used by the recommender</p>
            <ul className="text-xs text-muted space-y-1">
              {restaurant.reasons.slice(0, 2).map((reason) => (
                <li key={reason}>• {reason}</li>
              ))}
            </ul>
          </div>
        )}

        <Link
          to={`/restaurant/${restaurant.id}`}
          className="mt-auto text-xs font-bold text-primary underline"
        >
          View full store details →
        </Link>
      </div>
    </article>
  );
}

export default function AITraining() {
  const { restaurants, recommendations } = useAppStore();
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [training, setTraining] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const restaurantSamples = (recommendations.length ? recommendations : restaurants).slice(0, 6);

  async function refreshStatus() {
    const s = await api.getModelStatus();
    setStatus(s);
  }

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function handleTrain() {
    setTraining(true);
    setMessage(null);
    const result = await api.triggerTrain();
    setMessage(
      result.started
        ? "Training job started. This can take a few minutes — refresh status below to check progress."
        : "Couldn't reach the training service (backend offline). Run `python model/train.py` locally instead."
    );
    setTraining(false);
    void refreshStatus();
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-extrabold">AI Training</h1>
        <p className="text-sm text-muted mt-1">
          Monitor the model and review the real restaurant context behind recommendation feedback.
        </p>
      </div>

      <div className="card p-5 max-w-xl">
        <h2 className="font-bold mb-3">Model status</h2>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Trained</dt>
            <dd className="font-semibold">{status?.trained ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt className="text-muted">Last trained</dt>
            <dd className="font-semibold">
              {status?.lastTrainedAt ? new Date(status.lastTrainedAt).toLocaleString() : "Never"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Validation MAE</dt>
            <dd className="font-semibold">{status?.validationMae ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted">Dataset rows</dt>
            <dd className="font-semibold">{status?.datasetRows ?? 0}</dd>
          </div>
        </dl>
      </div>

      <motion.button
        type="button"
        onClick={handleTrain}
        disabled={training}
        whileTap={{ scale: 0.97 }}
        className="btn btn-primary disabled:opacity-70 max-w-xl"
      >
        {training ? "Starting..." : "Retrain model now"}
      </motion.button>

      {message && <p className="text-sm text-muted">{message}</p>}

      <section>
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <h2 className="font-bold text-lg">Restaurant data preview</h2>
            <p className="text-sm text-muted">
              Store details and user feedback become signals for future model training.
            </p>
          </div>
          {restaurantSamples.length > 0 && (
            <span className="text-xs text-muted shrink-0">
              Showing {restaurantSamples.length} of {restaurants.length}
            </span>
          )}
        </div>

        {restaurantSamples.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {restaurantSamples.map((restaurant) => (
              <RestaurantTrainingCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <FontAwesomeIcon icon={faStore} className="text-3xl text-muted mb-3" aria-hidden="true" />
            <h3 className="font-bold">No restaurant data loaded yet</h3>
            <p className="text-sm text-muted mt-1 mb-4">
              Search a location first to load real stores, photos, and details from OpenStreetMap.
            </p>
            <Link to="/" className="btn btn-ghost">
              Search for restaurants
            </Link>
          </div>
        )}
      </section>

      <div className="card p-5 max-w-xl">
        <h2 className="font-bold mb-2">Nightly retraining</h2>
        <p className="text-sm text-muted">
          Retraining is available only after a real exported <code>dataset.csv</code> exists.
          The deterministic meal and restaurant scorers continue to work when no trained model is deployed.
        </p>
      </div>
    </div>
  );
}
