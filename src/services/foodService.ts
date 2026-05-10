import foods from "../data/foods.json";
import type { DietaryPreference, FoodDataProvider, FoodItem, FoodSearchOptions, FoodSearchResult, NutritionTotals } from "../types";

const localFoods = foods as FoodItem[];

function matchesDietaryPreference(food: FoodItem, dietaryFilter?: DietaryPreference) {
  return !dietaryFilter || dietaryFilter === "balanced" || food.dietaryTags.includes(dietaryFilter) || food.dietaryTags.includes("balanced");
}

function matchesQuery(food: FoodItem, query?: string) {
  if (!query?.trim()) return true;
  const normalizedQuery = query.trim().toLowerCase();
  return [food.name, food.category, ...food.dietaryTags].some((value) => value.toLowerCase().includes(normalizedQuery));
}

function toSearchResult(food: FoodItem, source = "local" as const): FoodSearchResult {
  return {
    id: `${source}:${food.id}`,
    displayName: food.name,
    category: food.category,
    source,
    food,
    externalId: food.id,
  };
}

export const localFoodProvider: FoodDataProvider = {
  source: "local",
  async searchFoods(options: FoodSearchOptions = {}) {
    const limit = options.limit ?? localFoods.length;
    return localFoods
      .filter((food) => matchesDietaryPreference(food, options.dietaryFilter))
      .filter((food) => matchesQuery(food, options.query))
      .slice(0, limit)
      .map((food) => toSearchResult(food));
  },
  async getFoodById(id: string) {
    return localFoods.find((food) => food.id === id);
  },
};

interface UsdaFoodSearchResponse {
  foods?: Array<{
    fdcId: number;
    description: string;
    foodCategory?: string;
    brandName?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    foodNutrients?: Array<{
      nutrientName?: string;
      value?: number;
      unitName?: string;
    }>;
  }>;
}

function getNutrient(food: NonNullable<UsdaFoodSearchResponse["foods"]>[number], nutrientNames: string[]) {
  const nutrient = food.foodNutrients?.find((item) => nutrientNames.some((name) => item.nutrientName?.toLowerCase().includes(name)));
  return nutrient?.value ?? 0;
}

function mapUsdaFood(food: NonNullable<UsdaFoodSearchResponse["foods"]>[number]): FoodSearchResult {
  const nutrition: NutritionTotals = {
    calories: getNutrient(food, ["energy"]),
    protein: getNutrient(food, ["protein"]),
    carbs: getNutrient(food, ["carbohydrate"]),
    fat: getNutrient(food, ["total lipid", "total fat"]),
    fiber: getNutrient(food, ["fiber"]),
    sugar: getNutrient(food, ["sugars"]),
  };

  const item: FoodItem = {
    id: `usda-${food.fdcId}`,
    name: food.description,
    category: food.foodCategory ?? "USDA food",
    defaultUnit: "grams",
    baseAmount: 100,
    baseUnit: "grams",
    gramsPerUnit: { serving: food.servingSize ?? 100 },
    nutrition,
    dietaryTags: ["balanced"],
  };

  return {
    id: `usda:${food.fdcId}`,
    displayName: food.description,
    category: item.category,
    source: "usda",
    food: item,
    externalId: String(food.fdcId),
    brandName: food.brandName,
  };
}

export const usdaFoodProvider: FoodDataProvider = {
  source: "usda",
  async searchFoods(options: FoodSearchOptions = {}) {
    const query = options.query?.trim();
    if (!query) return [];

    // Vite exposes VITE_* variables to browser code. This is acceptable only
    // for local experiments with public/demo keys. For production, do not put
    // USDA, Nutritionix, Edamam, or any paid API key in frontend code. Route
    // requests through a backend proxy that keeps secrets server-side.
    const apiKey = import.meta.env.VITE_USDA_FOODDATA_API_KEY;
    if (!apiKey) return [];

    const params = new URLSearchParams({
      query,
      pageSize: String(options.limit ?? 10),
      api_key: apiKey,
    });

    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`USDA FoodData Central request failed: ${response.status}`);
    }

    const data = (await response.json()) as UsdaFoodSearchResponse;
    return (data.foods ?? []).map(mapUsdaFood);
  },
  async getFoodById(id: string) {
    const result = await this.searchFoods({ query: id, limit: 1 });
    return result[0]?.food;
  },
};

export const nutritionixFoodProvider: FoodDataProvider = {
  source: "nutritionix",
  async searchFoods() {
    // Future integration point. Nutritionix requires app credentials that must
    // be stored on a backend proxy, not bundled into this frontend.
    return [];
  },
  async getFoodById() {
    return undefined;
  },
};

export const edamamFoodProvider: FoodDataProvider = {
  source: "edamam",
  async searchFoods() {
    // Future integration point. Edamam app IDs and keys should be protected by
    // a backend proxy before this source is enabled for production users.
    return [];
  },
  async getFoodById() {
    return undefined;
  },
};

export const foodProviders = {
  local: localFoodProvider,
  usda: usdaFoodProvider,
  nutritionix: nutritionixFoodProvider,
  edamam: edamamFoodProvider,
} satisfies Record<string, FoodDataProvider>;

export async function searchFoods(source: keyof typeof foodProviders, options: FoodSearchOptions = {}) {
  return foodProviders[source].searchFoods(options);
}

export async function getLocalFoodItems() {
  return localFoodProvider.searchFoods();
}

export function getLocalFoodCatalog() {
  return localFoods;
}
