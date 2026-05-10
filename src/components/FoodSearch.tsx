import { Search } from "lucide-react";
import type { DietaryPreference, FoodItem } from "../types";

interface FoodSearchProps {
  foods: FoodItem[];
  selectedFoodId: string;
  onSelect: (foodId: string) => void;
  dietaryFilter?: string;
}

export default function FoodSearch({ foods, selectedFoodId, onSelect, dietaryFilter }: FoodSearchProps) {
  const filteredFoods =
    dietaryFilter && dietaryFilter !== "balanced"
      ? foods.filter((food) => food.dietaryTags.includes(dietaryFilter as DietaryPreference) || food.dietaryTags.includes("balanced"))
      : foods;

  return (
    <label className="block">
      <span className="field-label">Food item</span>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
        <select className="field pl-9" value={selectedFoodId} onChange={(event) => onSelect(event.target.value)}>
          {filteredFoods.map((food) => (
            <option key={food.id} value={food.id}>
              {food.name} ({food.category})
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}
