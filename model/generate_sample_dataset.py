"""
Generates a synthetic dataset shaped like real usage logs would be,
so the pipeline in train.py can be exercised end-to-end before real
user interaction data exists.

Columns: food_type, time, budget, distance_km, recommendation_score
recommendation_score (0-100) is synthesized using the same intuition
as the client-side placeholder scorer, plus noise, so the trained
model has a genuine pattern to learn.
"""
import random
import csv

FOOD_TYPES = ["Thai", "Japanese", "Italian", "Cafe", "Vegan"]
TIMES = ["Breakfast", "Lunch", "Dinner", "Late Night"]

random.seed(42)


def synth_score(food_type, time, budget, distance_km, restaurant_food_type, restaurant_price, restaurant_open):
    score = 50
    if food_type == restaurant_food_type:
        score += 30
    score += max(0, 15 - abs(restaurant_price - budget) * 8)
    if distance_km <= 5:
        score += max(0, 15 - distance_km * 2)
    else:
        score -= (distance_km - 5) * 5
    if restaurant_open:
        score += 10
    else:
        score -= 20
    score += random.gauss(0, 4)  # noise
    return max(0, min(100, round(score)))


def main(n=2000, out_path="dataset.csv"):
    rows = []
    for _ in range(n):
        food_type = random.choice(FOOD_TYPES)
        time = random.choice(TIMES)
        budget = random.randint(1, 4)
        distance_km = round(random.uniform(0.2, 12), 1)

        restaurant_food_type = random.choice(FOOD_TYPES)
        restaurant_price = random.randint(1, 4)
        restaurant_open = random.random() > 0.25

        score = synth_score(
            food_type, time, budget, distance_km,
            restaurant_food_type, restaurant_price, restaurant_open,
        )

        rows.append({
            "food_type": food_type,
            "time": time,
            "budget": budget,
            "distance_km": distance_km,
            "recommendation_score": score,
        })

    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {n} rows to {out_path}")


if __name__ == "__main__":
    main()
