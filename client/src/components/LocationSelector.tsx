import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import type { SearchMode } from "../types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faLocationCrosshairs, faMagnifyingGlass, faMapLocationDot } from "@fortawesome/free-solid-svg-icons";

const MODE_LABELS: Record<SearchMode, { label: string; icon: IconDefinition }> = {
  current: { label: "Current location", icon: faLocationCrosshairs },
  manual: { label: "Search address", icon: faMagnifyingGlass },
  map: { label: "Click on map", icon: faMapLocationDot },
};

export default function LocationSelector() {
  const {
    searchMode,
    searchOrigin,
    searchLabel,
    searchRadiusKm,
    searching,
    searchError,
    locationSuggestions,
    suggestionsLoading,
    suggestionError,
    recentSearches,
    useCurrentLocation,
    useManualLocation,
    setSearchRadiusKm,
    searchNearby,
    fetchLocationSuggestions,
    clearLocationSuggestions,
    setMapPickMode,
    mapPickMode,
  } = useAppStore();

  const [mode, setMode] = useState<SearchMode>(searchMode);
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function selectMode(next: SearchMode) {
    setMode(next);
    setMapPickMode(next === "map");
    if (next !== "manual") clearLocationSuggestions();
  }

  function onQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchLocationSuggestions(value);
    }, 350); // debounced search (PERFORMANCE requirement)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="card p-4 flex flex-col gap-3 min-w-0 w-full" aria-label="Choose a search location">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div role="group" aria-label="Search mode" className="flex flex-col min-[430px]:flex-row rounded-lg border border-slate-200 overflow-hidden w-full sm:w-auto min-w-0">
          {(Object.keys(MODE_LABELS) as SearchMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => selectMode(m)}
              aria-pressed={mode === m}
              className={`px-3 py-1.5 text-sm font-semibold whitespace-nowrap text-left min-[430px]:text-center flex-1 ${
                mode === m ? "bg-primary text-white" : "bg-surface text-muted"
              }`}
            >
              <FontAwesomeIcon icon={MODE_LABELS[m].icon} className="mr-1.5" aria-hidden="true" />
              {MODE_LABELS[m].label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          Radius
          <input
            type="number"
            min={1}
            max={20}
            value={searchRadiusKm}
            onChange={(e) => setSearchRadiusKm(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
            onBlur={() => searchOrigin && void searchNearby()}
            className="w-16 border border-slate-200 rounded px-2 py-1"
            aria-label="Search radius in kilometers"
          />
          km
        </label>
      </div>

      {mode === "current" && (
        <button type="button" onClick={useCurrentLocation} disabled={searching} className="btn btn-primary w-full sm:w-auto">
          {searching ? (
            "Locating…"
          ) : (
            <>
              <FontAwesomeIcon icon={faLocationCrosshairs} />
              Find restaurants near me
            </>
          )}
        </button>
      )}

      {mode === "manual" && (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Type a province, district, university, mall, hospital, landmark, or address…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
            aria-label="Search for a location"
          />
          {(suggestionsLoading || locationSuggestions.length > 0) && (
            <ul className="absolute z-10 mt-1 w-full bg-surface border border-slate-200 rounded-lg shadow-hover max-h-64 overflow-y-auto">
              {suggestionsLoading && <li className="px-3 py-2 text-xs text-muted">Searching…</li>}
              {locationSuggestions.map((s) => (
                <li key={`${s.lat},${s.lng},${s.label}`}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-bg"
                    onClick={() => {
                      useManualLocation({ lat: s.lat, lng: s.lng }, s.label);
                      setQuery(s.label);
                      clearLocationSuggestions();
                    }}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!suggestionsLoading && query.trim().length >= 2 && !suggestionError && locationSuggestions.length === 0 && (
            <p className="mt-2 text-xs text-muted">No matching location found.</p>
          )}
          {suggestionError && <p role="alert" className="mt-2 text-xs text-danger">{suggestionError}</p>}
        </div>
      )}

      {mode === "map" && (
        <p className="text-sm text-muted">
          {mapPickMode ? "Tap anywhere on the map below to search that area." : "Switch back to this tab, then tap the map."}
        </p>
      )}

      {searchOrigin && (
        <p className="text-xs text-muted">
          Searching within {searchRadiusKm} km of <strong>{searchLabel}</strong>
          {searching && " — updating…"}
        </p>
      )}

      {searchError && (
        <p role="alert" className="text-xs text-danger">
          {searchError}
        </p>
      )}

      {recentSearches.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">Recent searches</h3>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((s) => (
              <button
                key={`${s.label}-${s.at}`}
                type="button"
                onClick={() => useManualLocation(s.origin, s.label)}
                className="chip"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
