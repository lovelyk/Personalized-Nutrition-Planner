import { Search } from "lucide-react";
import type { FoodSearchResult } from "../types";

interface FoodSearchProps {
  results: FoodSearchResult[];
  query: string;
  selectedFoodId: string;
  onQueryChange: (query: string) => void;
  onSelect: (foodId: string) => void;
}

export default function FoodSearch({ results, query, selectedFoodId, onQueryChange, onSelect }: FoodSearchProps) {
  return (
    <div className="block">
      <label>
        <span className="field-label">Search food</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
          <input className="field pl-9" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search local foods..." />
        </div>
      </label>

      <label className="mt-3 block">
        <span className="field-label">Food item</span>
        <select className="field" value={selectedFoodId} onChange={(event) => onSelect(event.target.value)}>
          {results.length === 0 ? (
            <option value="">No foods found</option>
          ) : (
            results.map((result) => (
              <option key={result.id} value={result.food.id}>
                {result.displayName} ({result.category}, {result.source})
              </option>
            ))
          )}
        </select>
      </label>
    </div>
  );
}
