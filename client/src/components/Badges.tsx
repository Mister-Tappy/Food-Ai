export function PriceBadge({ level }: { level: number }) {
  return <span className="badge bg-primary-light text-primary-dark">{"฿".repeat(level)}</span>;
}

export function DistanceBadge({ km }: { km: number }) {
  const label = km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`;
  return <span className="badge bg-slate-100 text-muted">{label}</span>;
}

export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-success/15 text-success" : score >= 50 ? "bg-warning/15 text-warning" : "bg-danger/10 text-danger";
  return <span className={`badge ${color}`}>{score}% match</span>;
}

export function CuisineBadge({ cuisine }: { cuisine: string }) {
  const label = cuisine.split(";")[0].replace(/_/g, " ");
  return <span className="badge bg-slate-100 text-muted capitalize">{label}</span>;
}

export function OpenNowBadge({ openNow }: { openNow: boolean | null | undefined }) {
  if (openNow === true) return <span className="badge bg-success/15 text-success">Open now</span>;
  if (openNow === false) return <span className="badge bg-danger/10 text-danger">Closed</span>;
  return <span className="badge bg-slate-100 text-muted">Hours unknown</span>;
}

const TAG_ICONS: Record<string, IconDefinition> = {
  wheelchair: faWheelchair,
  takeaway: faBox,
  delivery: faMotorcycle,
  outdoorSeating: faUmbrellaBeach,
  parking: faSquareParking,
};

const TAG_LABELS: Record<string, string> = {
  wheelchair: "Wheelchair accessible",
  takeaway: "Takeaway",
  delivery: "Delivery",
  outdoorSeating: "Outdoor seating",
  parking: "Parking",
};

export function TagBadge({ tag }: { tag: keyof typeof TAG_ICONS }) {
  return (
    <span className="badge bg-slate-100 text-muted" title={TAG_LABELS[tag]} aria-label={TAG_LABELS[tag]}>
      <FontAwesomeIcon icon={TAG_ICONS[tag]} aria-hidden="true" /> {TAG_LABELS[tag]}
    </span>
  );
}
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBox,
  faMotorcycle,
  faSquareParking,
  faUmbrellaBeach,
  faWheelchair,
} from "@fortawesome/free-solid-svg-icons";
