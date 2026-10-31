import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import { Link } from "react-router-dom";
import type { GeoPoint, Restaurant, ScoredRestaurant } from "../types";
import { scoreToMarkerColor } from "../lib/recommend";
import { DistanceBadge, PriceBadge, ScoreBadge, CuisineBadge } from "./Badges";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationArrow, faLocationCrosshairs, faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

interface Props {
  restaurants: (Restaurant | ScoredRestaurant)[];
  activeId?: number;
  /** Explicit map center (e.g. the chosen search origin). Falls back to the first restaurant, then a Bangkok default. */
  center?: GeoPoint;
  /** Chosen search origin — rendered as a distinct pin, separate from the "locate me" blue dot. */
  origin?: GeoPoint;
  originLabel?: string;
  /** When true, clicking anywhere on the map reports the point back (LOCATION requirement #3). */
  pickMode?: boolean;
  onPick?: (point: GeoPoint) => void;
  onSelectRestaurant?: (id: number) => void;
  /** Tailwind height class for the map container — defaults to a fixed h-64 card; MapScreen passes h-full for a full-bleed mobile map. */
  heightClassName?: string;
}

const MARKER_HEX: Record<"green" | "yellow" | "red", string> = {
  green: "#10B981",
  yellow: "#F59E0B",
  red: "#EF4444",
};

const DEFAULT_CENTER: GeoPoint = { lat: 13.7563, lng: 100.5018 }; // Bangkok fallback

const LIGHT_TILE = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};
const DARK_TILE = {
  url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
};

function hasScore(r: Restaurant | ScoredRestaurant): r is ScoredRestaurant {
  return "score" in r;
}

function osmDirectionsUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=;${lat}%2C${lng}`;
}


function pinDivIcon(color: string, pulse = false): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div class="map-pin${pulse ? " map-pin-pulse" : ""}" style="--pin-color:${color}"></div>`,
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

const ORIGIN_ICON = L.divIcon({
  className: "",
  html: `<div class="map-origin-dot"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const LOCATE_ICON = L.divIcon({
  className: "",
  html: `<div class="map-locate-dot"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Imperatively manages a clustered marker layer — react-leaflet has no first-class cluster component. */
function ClusterLayer({
  restaurants,
  activeId,
  onSelectRestaurant,
}: {
  restaurants: (Restaurant | ScoredRestaurant)[];
  activeId?: number;
  onSelectRestaurant?: (id: number) => void;
}) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup({ showCoverageOnHover: false, spiderfyOnMaxZoom: true });
    groupRef.current = group;
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.clearLayers();

    restaurants.forEach((r) => {
      const color = hasScore(r) ? MARKER_HEX[scoreToMarkerColor(r.score)] : "#2563EB";
      const marker = L.marker([r.lat, r.lng], { icon: pinDivIcon(color, r.id === activeId) });
      marker.on("click", () => onSelectRestaurant?.(r.id));

      const popupHtml = document.createElement("div");
      popupHtml.className = "map-popup";
      popupHtml.innerHTML = `
        <div class="map-popup-title">${escapeHtml(r.name)}</div>
        <div class="map-popup-meta">${r.distanceKm} km${
        hasScore(r) ? ` · ${r.score}% match` : ""
      }</div>
        <a class="map-popup-link" href="/restaurant/${r.id}">View details</a>
        <a class="map-popup-link" href="${osmDirectionsUrl(r.lat, r.lng)}" target="_blank" rel="noreferrer">Navigate</a>
      `;
      marker.bindPopup(popupHtml);
      group.addLayer(marker);
    });
  }, [restaurants, activeId, onSelectRestaurant]);

  return null;
}

function RecenterOnOrigin({ origin }: { origin?: GeoPoint }) {
  const map = useMap();
  useEffect(() => {
    if (origin) map.flyTo([origin.lat, origin.lng], Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [origin, map]);
  return null;
}

function FitRestaurantBounds({ restaurants, origin }: { restaurants: (Restaurant | ScoredRestaurant)[]; origin?: GeoPoint }) {
  const map = useMap();
  const lastKey = useRef("");
  useEffect(() => {
    if (!restaurants.length) return;
    const key = restaurants.map((restaurant) => restaurant.id).sort((a, b) => a - b).join(",");
    if (key === lastKey.current) return;
    lastKey.current = key;
    const points: L.LatLngExpression[] = restaurants.map((restaurant) => [restaurant.lat, restaurant.lng]);
    if (origin) points.push([origin.lat, origin.lng]);
    map.fitBounds(L.latLngBounds(points), { padding: [34, 34], maxZoom: 16, animate: true });
  }, [map, origin, restaurants]);
  return null;
}

function ClickToPick({ pickMode, onPick }: { pickMode?: boolean; onPick?: (p: GeoPoint) => void }) {
  useMapEvents({
    click(e) {
      if (pickMode && onPick) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export default function LeafletMapView({
  restaurants,
  activeId,
  center: centerProp,
  origin,
  originLabel,
  pickMode,
  onPick,
  onSelectRestaurant,
  heightClassName = "h-64",
}: Props) {
  const [dark, setDark] = useState(false);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);

  const center = useMemo(() => {
    if (centerProp) return centerProp;
    if (origin) return origin;
    if (userLocation) return userLocation;
    const first = restaurants[0];
    return first ? { lat: first.lat, lng: first.lng } : DEFAULT_CENTER;
  }, [centerProp, origin, restaurants, userLocation]);

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        /* permission denied or unavailable — silently ignore, keep default center */
      }
    );
  }

  const tile = dark ? DARK_TILE : LIGHT_TILE;
  const activeRestaurant = restaurants.find((r) => r.id === activeId);
  const directionsUrl = activeRestaurant ? osmDirectionsUrl(activeRestaurant.lat, activeRestaurant.lng) : "";

  return (
    <div className={`relative ${heightClassName} ${pickMode ? "cursor-crosshair" : ""}`}>
      <MapContainer
          center={[center.lat, center.lng]}
          zoom={14}
          scrollWheelZoom
          className={`${heightClassName} rounded-md overflow-hidden z-0`}
          zoomAnimation
          style={{ background: dark ? "#0f172a" : "#EEF2F7" }}
        >
          <TileLayer url={tile.url} attribution={tile.attribution} />

          <ClusterLayer restaurants={restaurants} activeId={activeId} onSelectRestaurant={onSelectRestaurant} />
          <FitRestaurantBounds restaurants={restaurants} origin={origin} />
          <RecenterOnOrigin origin={restaurants.length ? undefined : origin} />
          <ClickToPick pickMode={pickMode} onPick={onPick} />

          {origin && (
            <Marker position={[origin.lat, origin.lng]} icon={ORIGIN_ICON}>
              <Popup>{originLabel || "Search location"}</Popup>
            </Marker>
          )}

          {!origin && userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={LOCATE_ICON}>
              <Popup>You are here</Popup>
            </Marker>
          )}
      </MapContainer>

      {activeRestaurant && (
        <div className="absolute z-[500] left-3 bottom-3 right-3 sm:right-auto sm:max-w-xs bg-surface/95 backdrop-blur rounded-md shadow-hover p-3 text-sm">
          <div className="font-bold mb-1">{activeRestaurant.name}</div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {!activeRestaurant.priceLevelEstimated && <PriceBadge level={activeRestaurant.priceLevel} />}
            <DistanceBadge km={activeRestaurant.distanceKm} />
            {activeRestaurant.cuisine && <CuisineBadge cuisine={activeRestaurant.cuisine} />}
            {hasScore(activeRestaurant) && <ScoreBadge score={activeRestaurant.score} />}
          </div>
          <div className="flex gap-3">
            <Link to={`/restaurant/${activeRestaurant.id}`} className="text-xs font-semibold text-primary underline">
              View details
            </Link>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-primary underline"
            >
              <FontAwesomeIcon icon={faLocationArrow} className="mr-1" />
              Navigate
            </a>
          </div>
        </div>
      )}

      <div className="absolute z-[500] top-3 right-3 flex flex-col gap-2">
        <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="bg-surface shadow-soft rounded-full w-9 h-9 flex items-center justify-center text-sm"
            aria-label={dark ? "Switch to light map" : "Switch to dark map"}
            title={dark ? "Light map" : "Dark map"}
          >
            <FontAwesomeIcon icon={dark ? faSun : faMoon} />
        </button>
        <button
          type="button"
          onClick={locateMe}
          className="bg-surface shadow-soft rounded-full w-9 h-9 flex items-center justify-center text-sm"
          aria-label="Use my current location"
          title="Use my current location"
        >
          <FontAwesomeIcon icon={faLocationCrosshairs} />
        </button>
      </div>

      {pickMode && (
        <div className="absolute z-[500] top-14 left-3 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-soft">
          Tap the map to choose a location
        </div>
      )}
    </div>
  );
}
