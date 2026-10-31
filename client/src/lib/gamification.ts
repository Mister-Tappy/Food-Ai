import type { CompletedMeal, DailyMission, Meal, RewardItem, StickerDefinition } from "../types";

export const STICKERS: StickerDefinition[] = [
  { id: "first-bite", name: "First Bite", description: "Save your first completed meal", icon: "utensils", category: "milestone" },
  { id: "rice-lover", name: "Rice Lover", description: "Complete a rice meal", icon: "bowl-rice", category: "Rice" },
  { id: "noodle-explorer", name: "Noodle Explorer", description: "Complete a noodle meal", icon: "bowl-food", category: "Noodles" },
  { id: "spice-spark", name: "Spice Spark", description: "Complete a spicy meal", icon: "pepper-hot", category: "Spicy" },
  { id: "sweet-day", name: "Sweet Day", description: "Complete a dessert", icon: "ice-cream", category: "Dessert" },
  { id: "cafe-day", name: "Cafe Day", description: "Complete a cafe or drink choice", icon: "mug-hot", category: "Cafe" },
  { id: "japan-trip", name: "Japan Trip", description: "Complete a Japanese meal", icon: "fish", category: "Japanese" },
  { id: "korea-trip", name: "Korea Trip", description: "Complete a Korean meal", icon: "fire-flame-curved", category: "Korean" },
  { id: "green-choice", name: "Green Choice", description: "Complete a vegetarian or vegan meal", icon: "leaf", category: "healthy" },
];

export const REWARDS: RewardItem[] = [
  { id: "theme-mint", name: "Fresh Mint Theme", description: "A calm green accent for your app", cost: 80, type: "theme" },
  { id: "theme-berry", name: "Berry Theme", description: "A playful berry accent", cost: 120, type: "theme" },
  { id: "sticker-street-food", name: "Street Food Pack", description: "Unlock a profile decoration for street-food explorers", cost: 60, type: "sticker-pack" },
  { id: "profile-gold", name: "Golden Foodie Ring", description: "A gold profile decoration", cost: 160, type: "profile" },
];

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDailyMissions(): DailyMission[] {
  return [
    { id: "complete-meal", title: "Make today’s food decision", description: "Save one completed meal", coinReward: 20, status: "available", progress: 0, target: 1 },
    { id: "try-variety", title: "Try something different", description: "Choose a category different from your previous meal", coinReward: 25, status: "available", progress: 0, target: 1 },
    { id: "save-restaurant", title: "Keep a place for later", description: "Save one real restaurant", coinReward: 15, status: "available", progress: 0, target: 1 },
  ];
}

export function progressMission(missions: DailyMission[], id: string, amount = 1): DailyMission[] {
  return missions.map((mission) => {
    if (mission.id !== id || mission.status === "claimed") return mission;
    const progress = Math.min(mission.target, mission.progress + amount);
    return { ...mission, progress, status: progress >= mission.target ? "completed" : "in_progress" };
  });
}

export function stickerForMeal(meal: Meal, historyLength: number): string {
  if (historyLength === 0) return "first-bite";
  if (meal.tastes.includes("Spicy")) return "spice-spark";
  if (meal.category === "Noodles") return "noodle-explorer";
  if (meal.category === "Rice") return "rice-lover";
  if (meal.category === "Dessert") return "sweet-day";
  if (meal.category === "Drink" || meal.cuisines.includes("Cafe")) return "cafe-day";
  if (meal.cuisines.includes("Japanese")) return "japan-trip";
  if (meal.cuisines.includes("Korean")) return "korea-trip";
  if (meal.dietary.includes("vegetarian") || meal.dietary.includes("vegan")) return "green-choice";
  return "first-bite";
}

export function isDifferentFromPrevious(meal: Meal, history: CompletedMeal[]): boolean {
  return history.length === 0 || history[0].meal.category !== meal.category;
}
