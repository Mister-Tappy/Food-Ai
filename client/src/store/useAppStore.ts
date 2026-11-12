import { create } from "zustand";
import type {
  Restaurant,
  ScoredRestaurant,
  RecommendationPreferences,
  FoodType,
  MealTime,
  GeoPoint,
  SearchMode,
  BudgetLevel,
  LocationSuggestion,
  TasteProfile,
  MoodKey,
  MealPreferences,
  MealRecommendation,
  CompletedMeal,
  DailyMission,
  UserSettings,
  RewardItem,
} from "../types";
import { osmPlaces, OsmApiError } from "../lib/osmPlaces";
import { osmToRestaurant } from "../lib/placeMapper";
import { rankAndSample } from "../lib/recommend";
import { recommendMeals } from "../lib/mealRecommend";
import {
  REWARDS,
  createDailyMissions,
  isDifferentFromPrevious,
  localDateKey,
  progressMission,
  stickerForMeal,
} from "../lib/gamification";
// Restaurants start empty and are populated only by live OpenStreetMap data.

const FAVORITES_KEY = "foodie_favorites";
const RECENT_SEARCHES_KEY = "foodie_recent_searches";
const SEARCH_HISTORY_FOODTYPES_KEY = "foodie_search_foodtypes";
const VIEWED_KEY = "foodie_viewed";
const TASTE_PROFILE_KEY = "foodie_taste_profile";
const RECOMMEND_COUNT_KEY = "foodie_recommend_count";
const MEAL_PREFERENCES_KEY = "foodie_meal_preferences_v1";
const CURRENT_MEAL_KEY = "foodie_current_meal_v1";
const MEAL_HISTORY_KEY = "foodie_meal_history_v1";
const LIKED_MEALS_KEY = "foodie_liked_meals_v1";
const DISLIKED_MEALS_KEY = "foodie_disliked_meals_v1";
const STICKERS_KEY = "foodie_stickers_v1";
const MISSIONS_KEY = "foodie_daily_missions_v1";
const COINS_KEY = "foodie_coins_v1";
const REWARDS_KEY = "foodie_rewards_v1";
const ACTIVE_THEME_KEY = "foodie_active_theme_v1";
const USER_SETTINGS_KEY = "foodie_user_settings_v1";
const FAVORITE_SNAPSHOTS_KEY = "foodie_favorite_snapshots_v1";

export interface RecentSearch {
  label: string;
  origin: GeoPoint;
  at: string;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app remains usable for the session when storage is unavailable.
  }
}

export const DEFAULT_MEAL_PREFERENCES: MealPreferences = {
  category: "Any",
  tastes: [],
  cuisine: "Any",
  budgetMax: 200,
  distanceKm: 5,
  openNowOnly: false,
  requireTakeaway: false,
  requireDelivery: false,
  requireParking: false,
  requireOutdoorSeating: false,
  dietaryRestrictions: [],
  exclusions: [],
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  displayName: "Foodie",
  preferredCuisines: [],
  preferredCategories: [],
  preferredTastes: [],
  defaultBudgetMax: 200,
  defaultRadiusKm: 5,
  dietaryRestrictions: [],
  exclusions: [],
};

function loadTodayMissions(): DailyMission[] {
  const saved = loadJson<{ date: string; missions: DailyMission[] }>(MISSIONS_KEY, {
    date: "",
    missions: [],
  });
  return saved.date === localDateKey() && Array.isArray(saved.missions)
    ? saved.missions
    : createDailyMissions();
}

interface AppState {
  restaurants: Restaurant[];
  preferences: RecommendationPreferences;
  recommendations: ScoredRestaurant[];
  favorites: number[];
  recentSearches: RecentSearch[];
  viewedIds: number[];
  loading: boolean;
  usingLiveData: boolean;

  // ---- Location selection: current GPS / search by address / click on map ----
  searchOrigin: GeoPoint | null;
  searchLabel: string | null;
  searchMode: SearchMode;
  searchRadiusKm: number;
  searchError: string | null;
  searching: boolean;

  // ---- Nominatim autocomplete ----
  locationSuggestions: LocationSuggestion[];
  suggestionsLoading: boolean;
  suggestionError: string | null;

  // ---- "Click anywhere on map" mode ----
  mapPickMode: boolean;

  // ---- Preferences page: longer-lived taste profile ----
  tasteProfile: TasteProfile;
  toggleLikedFoodType: (foodType: FoodType) => void;
  toggleDislikedFoodType: (foodType: FoodType) => void;

  // ---- Honest, self-reported mood check-in (not camera/biometric) ----
  mood: MoodKey | null;
  setMood: (mood: MoodKey | null) => void;

  // ---- Simple, real usage stats shown on Profile (no fabricated ML metrics) ----
  recommendCount: number;

  // ---- Meal-first decision system and device-local prototype persistence ----
  mealPreferences: MealPreferences;
  currentMeal: MealRecommendation | null;
  mealAlternatives: MealRecommendation[];
  mealHistory: CompletedMeal[];
  likedMealIds: string[];
  dislikedMealIds: string[];
  favoriteSnapshots: Restaurant[];
  stickerIds: string[];
  newStickerId: string | null;
  missions: DailyMission[];
  coins: number;
  unlockedRewardIds: string[];
  activeTheme: string;
  userSettings: UserSettings;

  setMealPreferences: (patch: Partial<MealPreferences>) => void;
  recommendMeal: (excludeCurrent?: boolean) => MealRecommendation | null;
  selectMealRecommendation: (recommendation: MealRecommendation) => void;
  likeCurrentMeal: () => void;
  dislikeCurrentMeal: () => void;
  completeCurrentMeal: (restaurantId?: number) => CompletedMeal | null;
  clearNewSticker: () => void;
  claimMission: (missionId: string) => void;
  unlockReward: (reward: RewardItem) => boolean;
  setActiveTheme: (themeId: string) => void;
  updateUserSettings: (patch: Partial<UserSettings>) => void;
  findRestaurantsForCurrentMeal: () => Promise<void>;

  setFoodType: (v: FoodType | "Any") => void;
  setBudget: (v: BudgetLevel) => void;
  setDistanceKm: (v: number) => void;
  setTime: (v: MealTime) => void;
  setOpenNowOnly: (v: boolean) => void;
  setRequireTakeaway: (v: boolean) => void;
  setRequireDelivery: (v: boolean) => void;
  setRequireParking: (v: boolean) => void;
  setRequireOutdoorSeating: (v: boolean) => void;

  runRecommendation: () => Promise<void>;
  toggleFavorite: (restaurantId: number) => void;
  recordSelection: (restaurantId: number) => Promise<void>;

  setSearchRadiusKm: (km: number) => void;
  useCurrentLocation: () => void;
  useManualLocation: (origin: GeoPoint, label: string) => void;
  searchNearby: () => Promise<void>;

  fetchLocationSuggestions: (query: string) => Promise<void>;
  clearLocationSuggestions: () => void;
  setMapPickMode: (v: boolean) => void;
  pickPointOnMap: (point: GeoPoint) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Real restaurants only — populated exclusively from OpenStreetMap
  // (see `searchNearby`). Empty until the user picks a search location.
  restaurants: [],
  preferences: {
    foodType: "Any",
    budget: 2,
    distanceKm: 5,
    time: "Lunch",
    openNowOnly: false,
    requireTakeaway: false,
    requireDelivery: false,
    requireParking: false,
    requireOutdoorSeating: false,
  },
  recommendations: [],
  favorites: loadJson(FAVORITES_KEY, [] as number[]),
  recentSearches: loadJson(RECENT_SEARCHES_KEY, [] as RecentSearch[]),
  viewedIds: loadJson(VIEWED_KEY, [] as number[]),
  loading: false,
  usingLiveData: false,

  searchOrigin: null,
  searchLabel: null,
  searchMode: "current",
  searchRadiusKm: 5,
  searchError: null,
  searching: false,

  locationSuggestions: [],
  suggestionsLoading: false,
  suggestionError: null,
  mapPickMode: false,

  tasteProfile: loadJson(TASTE_PROFILE_KEY, { liked: [], disliked: [] } as TasteProfile),
  mood: null,
  recommendCount: loadJson(RECOMMEND_COUNT_KEY, 0 as number),

  mealPreferences: {
    ...DEFAULT_MEAL_PREFERENCES,
    ...loadJson(MEAL_PREFERENCES_KEY, DEFAULT_MEAL_PREFERENCES),
  },
  currentMeal: loadJson(CURRENT_MEAL_KEY, null as MealRecommendation | null),
  mealAlternatives: [],
  mealHistory: loadJson(MEAL_HISTORY_KEY, [] as CompletedMeal[]),
  likedMealIds: loadJson(LIKED_MEALS_KEY, [] as string[]),
  dislikedMealIds: loadJson(DISLIKED_MEALS_KEY, [] as string[]),
  favoriteSnapshots: loadJson(FAVORITE_SNAPSHOTS_KEY, [] as Restaurant[]),
  stickerIds: loadJson(STICKERS_KEY, [] as string[]),
  newStickerId: null,
  missions: loadTodayMissions(),
  coins: loadJson(COINS_KEY, 0 as number),
  unlockedRewardIds: loadJson(REWARDS_KEY, [] as string[]),
  activeTheme: loadJson(ACTIVE_THEME_KEY, "default"),
  userSettings: {
    ...DEFAULT_USER_SETTINGS,
    ...loadJson(USER_SETTINGS_KEY, DEFAULT_USER_SETTINGS),
  },

  setFoodType: (v) => set((s) => ({ preferences: { ...s.preferences, foodType: v } })),
  setBudget: (v) => set((s) => ({ preferences: { ...s.preferences, budget: v } })),
  setDistanceKm: (v) => {
    set((s) => ({
      preferences: { ...s.preferences, distanceKm: v },
      mealPreferences: { ...s.mealPreferences, distanceKm: v },
    }));
    saveJson(MEAL_PREFERENCES_KEY, { ...get().mealPreferences, distanceKm: v });
  },
  setTime: (v) => set((s) => ({ preferences: { ...s.preferences, time: v } })),
  setOpenNowOnly: (v) => {
    set((s) => ({
      preferences: { ...s.preferences, openNowOnly: v },
      mealPreferences: { ...s.mealPreferences, openNowOnly: v },
    }));
    saveJson(MEAL_PREFERENCES_KEY, get().mealPreferences);
  },
  setRequireTakeaway: (v) => {
    set((s) => ({
      preferences: { ...s.preferences, requireTakeaway: v },
      mealPreferences: { ...s.mealPreferences, requireTakeaway: v },
    }));
    saveJson(MEAL_PREFERENCES_KEY, get().mealPreferences);
  },
  setRequireDelivery: (v) => get().setMealPreferences({ requireDelivery: v }),
  setRequireParking: (v) => get().setMealPreferences({ requireParking: v }),
  setRequireOutdoorSeating: (v) => get().setMealPreferences({ requireOutdoorSeating: v }),

  setMealPreferences: (patch) => {
    const mealPreferences = { ...get().mealPreferences, ...patch };
    const preferences = {
      ...get().preferences,
      distanceKm: mealPreferences.distanceKm,
      openNowOnly: mealPreferences.openNowOnly,
      requireTakeaway: mealPreferences.requireTakeaway,
      requireDelivery: mealPreferences.requireDelivery,
      requireParking: mealPreferences.requireParking,
      requireOutdoorSeating: mealPreferences.requireOutdoorSeating,
    };
    saveJson(MEAL_PREFERENCES_KEY, mealPreferences);
    set({ mealPreferences, preferences, searchRadiusKm: mealPreferences.distanceKm });
  },

  recommendMeal: (excludeCurrent = true) => {
    const state = get();
    const excludeMealIds = excludeCurrent && state.currentMeal ? [state.currentMeal.meal.id] : [];
    const mealAlternatives = recommendMeals(
      state.mealPreferences,
      {
        history: state.mealHistory,
        likedMealIds: state.likedMealIds,
        dislikedMealIds: state.dislikedMealIds,
        settings: state.userSettings,
        excludeMealIds,
      },
      10
    );
    const currentMeal = mealAlternatives[0] ?? null;
    const recommendCount = state.recommendCount + (currentMeal ? 1 : 0);
    saveJson(RECOMMEND_COUNT_KEY, recommendCount);
    saveJson(CURRENT_MEAL_KEY, currentMeal);
    set({ currentMeal, mealAlternatives, recommendCount });
    return currentMeal;
  },

  selectMealRecommendation: (recommendation) => {
    saveJson(CURRENT_MEAL_KEY, recommendation);
    set({ currentMeal: recommendation });
  },

  likeCurrentMeal: () => {
    const id = get().currentMeal?.meal.id;
    if (!id) return;
    const likedMealIds = Array.from(new Set([...get().likedMealIds, id]));
    const dislikedMealIds = get().dislikedMealIds.filter((mealId) => mealId !== id);
    saveJson(LIKED_MEALS_KEY, likedMealIds);
    saveJson(DISLIKED_MEALS_KEY, dislikedMealIds);
    set({ likedMealIds, dislikedMealIds });
  },

  dislikeCurrentMeal: () => {
    const id = get().currentMeal?.meal.id;
    if (!id) return;
    const dislikedMealIds = Array.from(new Set([...get().dislikedMealIds, id]));
    const likedMealIds = get().likedMealIds.filter((mealId) => mealId !== id);
    saveJson(LIKED_MEALS_KEY, likedMealIds);
    saveJson(DISLIKED_MEALS_KEY, dislikedMealIds);
    set({ likedMealIds, dislikedMealIds });
    get().recommendMeal(true);
  },

  completeCurrentMeal: (restaurantId) => {
    const state = get();
    if (!state.currentMeal) return null;
    const restaurant = restaurantId
      ? [...state.restaurants, ...state.favoriteSnapshots].find((item) => item.id === restaurantId)
      : undefined;
    const stickerId = stickerForMeal(state.currentMeal.meal, state.mealHistory.length);
    const entry: CompletedMeal = {
      id: `meal-${Date.now()}-${state.currentMeal.meal.id}`,
      completedAt: new Date().toISOString(),
      meal: state.currentMeal.meal,
      recommendationScore: state.currentMeal.score,
      restaurant: restaurant
        ? {
            id: restaurant.id,
            osmId: restaurant.osmId,
            name: restaurant.name,
            lat: restaurant.lat,
            lng: restaurant.lng,
            address: restaurant.address,
            cuisine: restaurant.cuisine,
          }
        : null,
      preferences: state.mealPreferences,
      locationLabel: state.searchLabel,
      stickerId,
    };
    const mealHistory = [entry, ...state.mealHistory].slice(0, 365);
    const stickerIds = Array.from(new Set([...state.stickerIds, stickerId]));
    let missions = progressMission(state.missions, "complete-meal");
    if (isDifferentFromPrevious(state.currentMeal.meal, state.mealHistory)) {
      missions = progressMission(missions, "try-variety");
    }
    const firstCategory = !state.mealHistory.some((item) => item.meal.category === state.currentMeal!.meal.category);
    const coins = state.coins + (firstCategory ? 5 : 0);
    saveJson(MEAL_HISTORY_KEY, mealHistory);
    saveJson(STICKERS_KEY, stickerIds);
    saveJson(MISSIONS_KEY, { date: localDateKey(), missions });
    saveJson(COINS_KEY, coins);
    set({ mealHistory, stickerIds, newStickerId: stickerId, missions, coins });
    return entry;
  },

  clearNewSticker: () => set({ newStickerId: null }),

  claimMission: (missionId) => {
    const mission = get().missions.find((item) => item.id === missionId);
    if (!mission || mission.status !== "completed") return;
    const missions = get().missions.map((item) =>
      item.id === missionId ? { ...item, status: "claimed" as const } : item
    );
    const coins = get().coins + mission.coinReward;
    saveJson(MISSIONS_KEY, { date: localDateKey(), missions });
    saveJson(COINS_KEY, coins);
    set({ missions, coins });
  },

  unlockReward: (reward) => {
    const state = get();
    if (state.unlockedRewardIds.includes(reward.id)) return true;
    if (state.coins < reward.cost || !REWARDS.some((item) => item.id === reward.id)) return false;
    const unlockedRewardIds = [...state.unlockedRewardIds, reward.id];
    const coins = state.coins - reward.cost;
    saveJson(REWARDS_KEY, unlockedRewardIds);
    saveJson(COINS_KEY, coins);
    set({ unlockedRewardIds, coins });
    return true;
  },

  setActiveTheme: (themeId) => {
    const allowed = themeId === "default" || get().unlockedRewardIds.includes(themeId);
    if (!allowed) return;
    saveJson(ACTIVE_THEME_KEY, themeId);
    set({ activeTheme: themeId });
    document.documentElement.dataset.rewardTheme = themeId;
  },

  updateUserSettings: (patch) => {
    const userSettings = { ...get().userSettings, ...patch };
    saveJson(USER_SETTINGS_KEY, userSettings);
    set({ userSettings });
  },

  findRestaurantsForCurrentMeal: async () => {
    if (!get().currentMeal) {
      set({ searchError: "Choose a meal recommendation first." });
      return;
    }
    await get().searchNearby();
  },

  // The AI score is computed entirely client-side from whatever is
  // currently in `restaurants` — always live OSM results from
  // `searchNearby`, never mock/hardcoded data.
  runRecommendation: async () => {
    set({ loading: true });
    const { restaurants, preferences, favorites, viewedIds, tasteProfile, mood, currentMeal } = get();

    const searchedFoodTypes = new Set(loadJson<string[]>(SEARCH_HISTORY_FOODTYPES_KEY, []));
    if (preferences.foodType !== "Any") {
      searchedFoodTypes.add(preferences.foodType);
      const arr = Array.from(searchedFoodTypes);
      localStorage.setItem(SEARCH_HISTORY_FOODTYPES_KEY, JSON.stringify(arr));
    }

    const recommendations = rankAndSample(
      restaurants,
      preferences,
      (r) => ({
        isFavorite: favorites.includes(r.id),
        previouslyViewed: viewedIds.includes(r.id),
        searchedFoodTypes: searchedFoodTypes as Set<string>,
        likedFoodTypes: tasteProfile.liked,
        mood,
        selectedMeal: currentMeal?.meal ?? null,
      }),
      10,
      tasteProfile.disliked
    );

    set({ recommendations, loading: false });
  },

  toggleFavorite: (restaurantId) => {
    const state = get();
    const removing = state.favorites.includes(restaurantId);
    const favorites = removing
      ? state.favorites.filter((id) => id !== restaurantId)
      : [...state.favorites, restaurantId];
    const restaurant = state.restaurants.find((item) => item.id === restaurantId);
    const favoriteSnapshots = removing
      ? state.favoriteSnapshots.filter((item) => item.id !== restaurantId)
      : restaurant
      ? [restaurant, ...state.favoriteSnapshots.filter((item) => item.id !== restaurantId)]
      : state.favoriteSnapshots;
    let missions = state.missions;
    if (!removing) missions = progressMission(missions, "save-restaurant");
    saveJson(FAVORITES_KEY, favorites);
    saveJson(FAVORITE_SNAPSHOTS_KEY, favoriteSnapshots);
    saveJson(MISSIONS_KEY, { date: localDateKey(), missions });
    set({ favorites, favoriteSnapshots, missions });
  },

  recordSelection: async (restaurantId) => {
    const viewedIds = get().viewedIds.includes(restaurantId)
      ? get().viewedIds
      : [restaurantId, ...get().viewedIds].slice(0, 100);
    localStorage.setItem(VIEWED_KEY, JSON.stringify(viewedIds));
    set({ viewedIds });
  },

  setSearchRadiusKm: (km) => get().setMealPreferences({ distanceKm: km }),

  useCurrentLocation: () => {
    if (!window.isSecureContext && location.hostname !== "localhost") {
      set({ searchError: "Current location requires HTTPS. Search an address instead." });
      return;
    }
    if (!navigator.geolocation) {
      set({ searchError: "Geolocation isn't available in this browser." });
      return;
    }
    set({ searching: true, searchError: null, searchMode: "current", mapPickMode: false });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({
          searchOrigin: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          searchLabel: "Current location",
          searching: false,
        });
        void get().searchNearby();
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied — allow access or search by address instead."
            : err.code === err.TIMEOUT
            ? "Location request timed out. Try again or search by address."
            : "Your location is unavailable. Search by address instead.";
        set({
          searching: false,
          searchError: message,
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  useManualLocation: (origin, label) => {
    set({ searchOrigin: origin, searchLabel: label, searchMode: "manual", searchError: null, mapPickMode: false });

    const recentSearches = [
      { label, origin, at: new Date().toISOString() },
      ...get().recentSearches.filter((s) => s.label !== label),
    ].slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    set({ recentSearches });

    void get().searchNearby();
  },

  searchNearby: async () => {
    const { searchOrigin, searchRadiusKm } = get();
    if (!searchOrigin) {
      set({ searchError: "Choose a location first." });
      return;
    }
    set({ searching: true, searchError: null });
    try {
      const places = await osmPlaces.nearby(searchOrigin, searchRadiusKm);
      const restaurants = places.map((p) => osmToRestaurant(p, searchOrigin));
      set({ restaurants, usingLiveData: true, searching: false });
      await get().runRecommendation();
    } catch (err) {
      set({
        searching: false,
        searchError: err instanceof OsmApiError ? `${err.message} Public OSM providers can be busy; wait a minute and try again.` : "Failed to search nearby restaurants.",
      });
    }
  },

  fetchLocationSuggestions: async (query) => {
    if (query.trim().length < 2) {
      set({ locationSuggestions: [], suggestionError: null, suggestionsLoading: false });
      return;
    }
    set({ suggestionsLoading: true, suggestionError: null });
    try {
      const results = await osmPlaces.search(query);
      set({ locationSuggestions: results, suggestionsLoading: false, suggestionError: null });
    } catch {
      set({ locationSuggestions: [], suggestionsLoading: false, suggestionError: "Location search is unavailable. Try again shortly." });
    }
  },

  clearLocationSuggestions: () => set({ locationSuggestions: [], suggestionError: null }),

  setMapPickMode: (v) => set({ mapPickMode: v, searchMode: v ? "map" : get().searchMode }),

  toggleLikedFoodType: (foodType) => {
    const { liked, disliked } = get().tasteProfile;
    const nextLiked = liked.includes(foodType) ? liked.filter((f) => f !== foodType) : [...liked, foodType];
    // Liking and disliking the same cuisine at once doesn't make sense —
    // picking "liked" clears it from "disliked" if it was there.
    const nextDisliked = disliked.filter((f) => f !== foodType);
    const tasteProfile = { liked: nextLiked, disliked: nextDisliked };
    localStorage.setItem(TASTE_PROFILE_KEY, JSON.stringify(tasteProfile));
    set({ tasteProfile });
  },

  toggleDislikedFoodType: (foodType) => {
    const { liked, disliked } = get().tasteProfile;
    const nextDisliked = disliked.includes(foodType) ? disliked.filter((f) => f !== foodType) : [...disliked, foodType];
    const nextLiked = liked.filter((f) => f !== foodType);
    const tasteProfile = { liked: nextLiked, disliked: nextDisliked };
    localStorage.setItem(TASTE_PROFILE_KEY, JSON.stringify(tasteProfile));
    set({ tasteProfile });
  },

  setMood: (mood) => set({ mood }),

  pickPointOnMap: async (point) => {
    set({ searching: true, searchError: null });
    try {
      const reverse = await osmPlaces.reverse(point);
      const label = reverse?.label ?? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
      get().useManualLocation(point, label);
    } catch {
      get().useManualLocation(point, `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`);
    } finally {
      set({ mapPickMode: false });
    }
  },
}));
