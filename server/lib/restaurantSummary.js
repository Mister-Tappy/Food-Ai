// =========================================================
// RESTAURANT SUMMARY
// Replaces the old Google-reviews-based summarizer (server/lib/reviewSummary.js).
// OpenStreetMap has no review text, so this generates a short, factual
// summary strictly from the restaurant's real OSM tags — distance,
// cuisine, price estimate, opening status, and amenities. Nothing here
// is invented: every clause traces back to a tag Overpass returned.
// =========================================================

const CUISINE_LABELS = {
  Thai: "Thai",
  Japanese: "Japanese",
  Chinese: "Chinese",
  Korean: "Korean",
  Cafe: "cafe-style",
  Dessert: "dessert",
  "Fast Food": "fast food",
  Steak: "steakhouse",
  Seafood: "seafood",
  Vegetarian: "vegetarian",
  Halal: "halal",
  Other: null,
};

/**
 * @param {object} restaurant a normalized restaurant (see overpassClient.normalizeElement)
 * @returns {string} a short, grounded AI summary
 */
function generateRestaurantSummary(restaurant) {
  const cuisineLabel = restaurant.cuisine
    ? restaurant.cuisine.split(";")[0].replace(/_/g, " ")
    : CUISINE_LABELS[restaurant.foodType];

  const clauses = [];

  clauses.push(
    cuisineLabel
      ? `This place is tagged for ${cuisineLabel} food`
      : "This is a place to eat with limited cuisine tags"
  );

  if (typeof restaurant.distanceKm === "number") {
    clauses.push(`about ${formatDistance(restaurant.distanceKm)} from your search location`);
  }

  const amenities = [];
  if (restaurant.takeaway) amenities.push("takeaway");
  if (restaurant.delivery) amenities.push("delivery");
  if (restaurant.outdoorSeating) amenities.push("outdoor seating");
  if (restaurant.wheelchair) amenities.push("wheelchair accessible");
  if (restaurant.parking) amenities.push("parking");

  let summary = clauses.join(", ") + ".";

  if (amenities.length) {
    summary += ` It supports ${joinWithAnd(amenities)}.`;
  }

  if (restaurant.openNow === true) {
    summary += " It's open right now.";
  } else if (restaurant.openNow === false) {
    summary += " It's currently closed.";
  }

  return summary;
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} meters`;
  return `${km.toFixed(1)} km`;
}

function joinWithAnd(items) {
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

module.exports = { generateRestaurantSummary };
