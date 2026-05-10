import { Search } from "lucide-react";
import type { FoodSearchResult } from "../types";
import type { SupportedFoodProvider } from "../services/foodService";

interface FoodSearchProps {
  results: FoodSearchResult[];
  query: string;
  selectedFoodId: string;
  source: SupportedFoodProvider;
  sources: Array<{ value: SupportedFoodProvider; label: string; description: string }>;
  onQueryChange: (query: string) => void;
  onSelect: (foodId: string) => void;
  onSourceChange: (source: SupportedFoodProvider) => void;
}

export default function FoodSearch({ results, query, selectedFoodId, source, sources, onQueryChange, onSelect, onSourceChange }: FoodSearchProps) {
  return (
    <div className="block">
      <label className="block">
        <span className="field-label">Food source</span>
        <select className="field" value={source} onChange={(event) => onSourceChange(event.target.value as SupportedFoodProvider)}>
          {sources.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label} - {item.description}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="field-label">Search food</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" />
          <input className="field pl-9" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={source === "local" ? "Search local foods..." : "Try: 1 cup rice, 2 eggs..."} />
        </div>
      </label>

      <label className="mt-3 block">
        <span className="field-label">Food item</span>
        <select className="field" value={selectedFoodId} onChange={(event) => onSelect(event.target.value)}>
          {results.length === 0 ? (
            <option value="">No foods found</option>
          ) : (
            results.map((result) => (
              <option key={result.id} value={result.id}>
                {result.displayName} ({result.category}, {result.source})
              </option>
            ))
          )}
        </select>
      </label>
    </div>
  );
}
