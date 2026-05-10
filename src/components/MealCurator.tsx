import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DietaryPreference, FoodSearchResult, MealEntry, MealSlot, NutritionPlan, Unit } from "../types";
import { getLocalFoodCatalog, searchFoods, selectableFoodSources, type SupportedFoodProvider } from "../services/foodService";
import { addTotals, scaleFoodNutrition } from "../utils/calculations";
import FoodSearch from "./FoodSearch";
import ProgressBars from "./ProgressBars";

const foodItems = getLocalFoodCatalog();
const units: Unit[] = ["grams", "oz", "cup", "tbsp", "tsp", "piece", "serving"];
const mealSlots: MealSlot[] = ["breakfast", "lunch", "dinner", "snacks"];

interface MealCuratorProps {
  plan: NutritionPlan;
  dietaryPreference: DietaryPreference;
}

export default function MealCurator({ plan, dietaryPreference }: MealCuratorProps) {
  const [foodSource, setFoodSource] = useState<SupportedFoodProvider>("local");
  const [selectedFoodId, setSelectedFoodId] = useState(`local:${foodItems[0].id}`);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<FoodSearchResult[]>([]);
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const selectedResult = foodResults.find((result) => result.id === selectedFoodId);
  const selectedFood = selectedResult?.food ?? foodResults[0]?.food ?? foodItems[0];
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>(selectedFood.defaultUnit);
  const [mealSlot, setMealSlot] = useState<MealSlot>("breakfast");
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const canAdd = Number.isFinite(quantity) && quantity > 0 && foodResults.length > 0;

  const itemPreview = scaleFoodNutrition(selectedFood, canAdd ? quantity : 0, unit);

  useEffect(() => {
    let isActive = true;
    setIsSearching(true);
    setSearchError("");

    searchFoods(foodSource, {
      query: foodQuery,
      dietaryFilter: dietaryPreference,
    }).then((results) => {
      if (!isActive) return;
      setFoodResults(results);
      if (results.length > 0 && !results.some((result) => result.id === selectedFoodId)) {
        setSelectedFoodId(results[0].id);
        setUnit(results[0].food.defaultUnit);
      }
      if (results.length === 0) {
        setSelectedFoodId("");
        if (foodSource !== "local" && foodQuery.trim()) {
          setSearchError(`No ${foodSource} results found. Check credentials or try a more specific food phrase.`);
        }
      }
    }).catch((error: unknown) => {
      if (!isActive) return;
      setFoodResults([]);
      setSelectedFoodId("");
      setSearchError(error instanceof Error ? error.message : "Food search failed.");
    }).finally(() => {
      if (isActive) {
        setIsSearching(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [dietaryPreference, foodQuery, foodSource, selectedFoodId]);

  const rows = useMemo(
    () =>
      entries.map((entry) => {
        return {
          ...entry,
          nutrition: scaleFoodNutrition(entry.food, entry.quantity, entry.unit),
        };
      }),
    [entries],
  );

  const totals = useMemo(() => addTotals(rows.map((row) => row.nutrition)), [rows]);

  const addEntry = () => {
    if (!canAdd) return;

    setEntries((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        foodId: selectedFood.id,
        food: selectedFood,
        mealSlot,
        quantity,
        unit,
      },
    ]);
  };

  const updateEntry = <K extends keyof MealEntry>(id: string, key: K, value: MealEntry[K]) => {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, [key]: value } : entry)));
  };

  const removeEntry = (id: string) => setEntries((current) => current.filter((entry) => entry.id !== id));
  const clearEntries = () => setEntries([]);

  const handleFoodSelect = (resultId: string) => {
    const nextResult = foodResults.find((result) => result.id === resultId);
    setSelectedFoodId(resultId);
    if (nextResult) {
      setUnit(nextResult.food.defaultUnit);
    }
  };

  const handleSourceChange = (source: SupportedFoodProvider) => {
    setFoodSource(source);
    setFoodQuery("");
    setFoodResults([]);
    setSelectedFoodId("");
  };

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-semibold text-ink">Curate Your Meals</h2>
          <p className="mt-1 text-sm leading-6 text-stone-500">Build a simple day of eating from the active food provider and compare it with your targets.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FoodSearch
              results={foodResults}
              query={foodQuery}
              selectedFoodId={selectedFoodId}
              source={foodSource}
              sources={selectableFoodSources}
              onQueryChange={setFoodQuery}
              onSelect={handleFoodSelect}
              onSourceChange={handleSourceChange}
            />
            {isSearching && <p className="text-sm text-stone-500">Searching food provider...</p>}
            {searchError && <p className="text-sm text-rose">{searchError}</p>}
            <label className="block">
              <span className="field-label">Meal</span>
              <select className="field" value={mealSlot} onChange={(event) => setMealSlot(event.target.value as MealSlot)}>
                {mealSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">Quantity</span>
              <input className="field" type="number" min={0.1} step={0.1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
            </label>
            <label className="block">
              <span className="field-label">Unit</span>
              <select className="field" value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
                {units.map((unitOption) => (
                  <option key={unitOption} value={unitOption}>
                    {unitOption}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-2 rounded-lg border border-stone-200 bg-stone-50/70 p-3 text-sm text-stone-700 sm:grid-cols-3">
            <span>{itemPreview.calories} kcal</span>
            <span>{itemPreview.protein} g protein</span>
            <span>{itemPreview.carbs} g carbs</span>
            <span>{itemPreview.fat} g fat</span>
            <span>{itemPreview.fiber} g fiber</span>
            <span>{itemPreview.sugar} g sugar</span>
          </div>

          {!canAdd && <p className="mt-3 text-sm text-rose">Choose a matching food and enter a quantity greater than zero before adding food.</p>}

          <button
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-calm px-4 py-2 text-sm font-semibold text-white transition hover:bg-calm/90 disabled:cursor-not-allowed disabled:bg-stone-300"
            type="button"
            onClick={addEntry}
            disabled={!canAdd}
          >
            <Plus className="h-4 w-4" />
            Add food
          </button>
        </div>

        <div className="space-y-4">
          <ProgressBars label="Calories" value={totals.calories} target={plan.macros.calories} unit="kcal" tone="calories" />
          <ProgressBars label="Protein" value={totals.protein} target={plan.macros.proteinGrams} unit="g" tone="protein" />
          <ProgressBars label="Carbs" value={totals.carbs} target={plan.macros.carbGrams} unit="g" tone="carbs" />
          <ProgressBars label="Fat" value={totals.fat} target={plan.macros.fatGrams} unit="g" tone="fat" />
          <ProgressBars label="Fiber" value={totals.fiber} target={plan.macros.fiberGrams} unit="g" tone="fiber" />
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-stone-200 pt-5">
        <div>
          <h3 className="font-semibold text-ink">Daily food list</h3>
          <p className="text-sm text-stone-500">Edit meal, amount, or unit any time.</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={clearEntries}
          disabled={entries.length === 0}
        >
          <RotateCcw className="h-4 w-4" />
          Clear
        </button>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-stone-200">
        <div className="hidden grid-cols-12 bg-stone-50 px-3 py-2 text-xs font-semibold uppercase text-stone-500 md:grid">
          <span className="col-span-2">Food</span>
          <span className="col-span-2">Meal</span>
          <span className="col-span-2">Quantity</span>
          <span className="col-span-2">Unit</span>
          <span className="col-span-3">Nutrition</span>
          <span className="text-right">Remove</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-3 py-5 text-sm text-stone-500">No foods added yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="grid gap-3 border-t border-stone-100 px-3 py-3 text-sm md:grid-cols-12 md:items-center">
              <div className="md:col-span-2">
                <p className="font-medium text-ink">{row.food.name}</p>
                <p className="text-xs text-stone-500">
                  {row.food.category}
                </p>
              </div>
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-medium uppercase text-stone-500 md:hidden">Meal</span>
                <select className="field mt-0 py-1.5" value={row.mealSlot} onChange={(event) => updateEntry(row.id, "mealSlot", event.target.value as MealSlot)}>
                  {mealSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-medium uppercase text-stone-500 md:hidden">Quantity</span>
                <input
                  className="field mt-0 py-1.5"
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={row.quantity}
                  onChange={(event) => updateEntry(row.id, "quantity", Math.max(Number(event.target.value), 0.1))}
                />
              </label>
              <label className="md:col-span-2">
                <span className="mb-1 block text-xs font-medium uppercase text-stone-500 md:hidden">Unit</span>
                <select className="field mt-0 py-1.5" value={row.unit} onChange={(event) => updateEntry(row.id, "unit", event.target.value as Unit)}>
                  {units.map((unitOption) => (
                    <option key={unitOption} value={unitOption}>
                      {unitOption}
                    </option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-3">
                <p className="font-medium text-ink">{row.nutrition.calories} kcal</p>
                <p className="text-xs text-stone-500">
                  P {row.nutrition.protein}g · C {row.nutrition.carbs}g · F {row.nutrition.fat}g · Fiber {row.nutrition.fiber}g
                </p>
              </div>
              <button className="justify-self-start rounded-md p-2 text-stone-500 transition hover:bg-rose/10 hover:text-rose md:justify-self-end" type="button" onClick={() => removeEntry(row.id)} aria-label={`Remove ${row.food.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <p className="mt-4 border-t border-stone-100 pt-4 text-xs leading-5 text-stone-500">
        Food search can use the local offline provider or external providers such as Nutritionix when local demo credentials are configured. Production API access should run through a backend proxy so keys are not exposed in the browser.
      </p>
    </section>
  );
}
