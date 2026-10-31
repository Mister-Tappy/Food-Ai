import { useEffect, useRef, useState } from "react";
import type { Restaurant } from "../types";
import { osmPlaces } from "../lib/osmPlaces";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBowlFood, faCamera, faStore } from "@fortawesome/free-solid-svg-icons";

interface Props { restaurant: Restaurant; className?: string; }
interface OpenPhoto { url: string; sourceUrl: string; label: string; }

export default function RestaurantPhoto({ restaurant, className = "h-36" }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [directFailed, setDirectFailed] = useState(false);
  const [openPhoto, setOpenPhoto] = useState<OpenPhoto | null>(null);
  const [openFailed, setOpenFailed] = useState(false);
  const [lookupComplete, setLookupComplete] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setDirectFailed(false); setOpenPhoto(null); setOpenFailed(false); setLookupComplete(false);
  }, [restaurant.id, restaurant.imageUrl, restaurant.website, restaurant.wikidataId]);

  useEffect(() => {
    if (!visible || (restaurant.imageUrl && !directFailed)) return;
    if (!restaurant.website && !restaurant.wikidataId) { setLookupComplete(true); return; }
    let cancelled = false;
    void osmPlaces.photo(restaurant.website, restaurant.wikidataId ?? null)
      .then((photo) => !cancelled && setOpenPhoto(photo))
      .catch(() => !cancelled && setOpenPhoto(null))
      .finally(() => !cancelled && setLookupComplete(true));
    return () => { cancelled = true; };
  }, [visible, directFailed, restaurant.imageUrl, restaurant.website, restaurant.wikidataId]);

  const source = restaurant.imageUrl && !directFailed
    ? { url: restaurant.imageUrl, label: "OSM-linked venue photo", sourceUrl: restaurant.imageSourceUrl || restaurant.imageUrl }
    : openPhoto && !openFailed ? openPhoto : null;
  const loading = !visible || (!source && !lookupComplete);

  return <div ref={containerRef} className={`relative overflow-hidden bg-subtle ${className}`}>
    {source ? <><img src={source.url} alt={`Photo published for ${restaurant.name}`} loading="lazy" onError={() => restaurant.imageUrl && !directFailed ? setDirectFailed(true) : setOpenFailed(true)} className="h-full w-full object-cover" /><a href={source.sourceUrl} target="_blank" rel="noreferrer" className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white"><FontAwesomeIcon icon={faCamera} className="mr-1" />{source.label}</a></> : loading ? <div className="h-full animate-pulse bg-slate-100" aria-label="Checking for a legitimate venue image" /> : <div className="h-full flex flex-col items-center justify-center text-center p-4 bg-gradient-to-br from-subtle to-primary-light"><FontAwesomeIcon icon={restaurant.foodType === "Other" ? faStore : faBowlFood} className="text-3xl" /><span className="mt-2 text-xs font-semibold text-muted">{restaurant.foodType} category illustration</span><span className="text-[10px] text-muted">Not a photograph of this venue</span></div>}
  </div>;
}
