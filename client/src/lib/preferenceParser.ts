import type { FoodType, MealCategory, MealPreferences, MealTaste } from "../types";

export interface ParsedFoodIntent {
  preferences: Partial<MealPreferences>;
  exclusions: string[];
  asksForRestaurants: boolean;
  summary: string;
}

const CATEGORY_TERMS: Array<[MealCategory, string[]]> = [
  ["Rice", ["ข้าว", "rice"]],
  ["Noodles", ["เส้น", "ก๋วยเตี๋ยว", "ราเมง", "noodle", "ramen"]],
  ["Soup", ["ซุป", "ต้ม", "แกง", "soup"]],
  ["Snack", ["ของกินเล่น", "snack", "burger", "เบอร์เกอร์"]],
  ["Dessert", ["ของหวาน", "dessert", "ขนม"]],
  ["Drink", ["เครื่องดื่ม", "กาแฟ", "ชา", "drink", "coffee", "tea"]],
];
const TASTE_TERMS: Array<[MealTaste, string[]]> = [
  ["Spicy", ["เผ็ด", "จัดจ้าน", "spicy"]],
  ["Mild", ["ไม่เผ็ด", "อ่อน", "mild"]],
  ["Sweet", ["หวาน", "sweet"]],
  ["Savory", ["เค็ม", "กลมกล่อม", "savory"]],
  ["Sour", ["เปรี้ยว", "sour"]],
];
const CUISINE_TERMS: Array<[FoodType, string[]]> = [
  ["Thai", ["ไทย", "thai"]], ["Japanese", ["ญี่ปุ่น", "japanese", "sushi"]],
  ["Korean", ["เกาหลี", "korean"]], ["Chinese", ["จีน", "chinese"]],
  ["Cafe", ["คาเฟ่", "cafe", "coffee"]], ["Dessert", ["ของหวาน", "dessert"]],
  ["Fast Food", ["ฟาสต์ฟู้ด", "fast food", "burger"]], ["Vegetarian", ["มังสวิรัติ", "เจ", "vegetarian", "vegan"]],
  ["Halal", ["ฮาลาล", "halal"]], ["Seafood", ["ทะเล", "seafood"]],
];

function firstMatch<T>(text: string, entries: Array<[T, string[]]>): T | undefined {
  return entries.find(([, terms]) => terms.some((term) => text.includes(term)))?.[0];
}

export function parseFoodIntent(input: string): ParsedFoodIntent {
  const text = input.trim().toLowerCase();
  const category = firstMatch(text, CATEGORY_TERMS);
  const cuisine = firstMatch(text, CUISINE_TERMS);
  const tastes = TASTE_TERMS.filter(([, terms]) => terms.some((term) => text.includes(term))).map(([taste]) => taste);
  const budgetMatch = text.match(/(?:ไม่เกิน|under|below|≤|งบ)\s*฿?\s*(\d{2,4})/i);
  const distanceMatch = text.match(/(?:ไม่เกิน|within|ในระยะ)?\s*(\d+(?:\.\d+)?)\s*(กิโล|กม|km|เมตร|m)\b/i);
  const exclusions = Array.from(text.matchAll(/(?:ไม่เอา|ไม่กิน|ไม่อยากกิน|exclude|without)\s*([^,.;]+)/gi)).map((match) => match[1].trim());
  const preferences: Partial<MealPreferences> = {};
  if (category) preferences.category = category;
  if (cuisine) preferences.cuisine = cuisine;
  if (tastes.length) preferences.tastes = tastes;
  if (budgetMatch) preferences.budgetMax = Number(budgetMatch[1]);
  if (distanceMatch) {
    const amount = Number(distanceMatch[1]);
    preferences.distanceKm = /^(?:เมตร|m)$/i.test(distanceMatch[2]) ? amount / 1000 : amount;
  }
  if (/มังสวิรัติ|vegetarian/.test(text)) preferences.dietaryRestrictions = ["vegetarian"];
  if (/วีแกน|vegan/.test(text)) preferences.dietaryRestrictions = ["vegan"];
  if (/ฮาลาล|halal/.test(text)) preferences.dietaryRestrictions = ["halal"];
  if (/เปิดตอนนี้|open now/.test(text)) preferences.openNowOnly = true;

  const parts = [category, cuisine, ...tastes, budgetMatch ? `≤ ฿${budgetMatch[1]}` : null, distanceMatch ? `within ${preferences.distanceKm} km` : null].filter(Boolean);
  return {
    preferences,
    exclusions,
    asksForRestaurants: /ร้าน|ใกล้|restaurant|near me/.test(text),
    summary: parts.length ? `Understood: ${parts.join(" · ")}` : "Tell me a taste, meal type, cuisine, budget, or distance.",
  };
}
