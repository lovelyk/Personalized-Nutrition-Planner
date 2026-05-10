import foods from "../data/foods.json";
import type { DietaryPreference, FoodDataProvider, FoodDataSource, FoodItem, FoodSearchOptions, FoodSearchResult, NutritionTotals } from "../types";

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
  async searchFoods(options: FoodSearchOptions = {}) {
    const query = options.query?.trim();
    if (!query) return [];

    // Nutritionix Track API v2 uses x-app-id and x-app-key headers. Vite
    // exposes VITE_* values to browser code, so this direct call is for local
    // experiments only. Production should route Nutritionix requests through a
    // backend proxy that stores app credentials server-side.
    const appId = import.meta.env.VITE_NUTRITIONIX_APP_ID;
    const appKey = import.meta.env.VITE_NUTRITIONIX_APP_KEY;
    if (!appId || !appKey) return [];

    const response = await fetch("https://trackapi.nutritionix.com/v2/natural/nutrients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-app-id": appId,
        "x-app-key": appKey,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Nutritionix request failed: ${response.status}`);
    }

    const data = (await response.json()) as NutritionixNaturalResponse;
    return data.foods.slice(0, options.limit ?? 10).map(mapNutritionixFood);
  },
  async getFoodById(id: string) {
    const result = await this.searchFoods({ query: id, limit: 1 });
    return result[0]?.food;
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

export type SupportedFoodProvider = keyof typeof foodProviders;

export const selectableFoodSources: Array<{ value: SupportedFoodProvider; label: string; description: string }> = [
  { value: "local", label: "Local", description: "Offline starter database" },
  { value: "nutritionix", label: "Nutritionix", description: "Requires local demo credentials" },
  { value: "usda", label: "USDA", description: "Requires local demo key" },
];

export async function searchFoods(source: SupportedFoodProvider, options: FoodSearchOptions = {}) {
  return foodProviders[source].searchFoods(options);
}

export async function getLocalFoodItems() {
  return localFoodProvider.searchFoods();
}

export function getLocalFoodCatalog() {
  return localFoods;
}

interface NutritionixNaturalResponse {
  foods: Array<{
    food_name: string;
    brand_name?: string;
    serving_qty?: number;
    serving_unit?: string;
    serving_weight_grams?: number;
    nf_calories?: number;
    nf_total_fat?: number;
    nf_total_carbohydrate?: number;
    nf_protein?: number;
    nf_dietary_fiber?: number;
    nf_sugars?: number;
    tags?: {
      item?: string;
      food_group?: number;
    };
  }>;
}

function mapNutritionixFood(food: NutritionixNaturalResponse["foods"][number], index: number): FoodSearchResult {
  const servingGrams = food.serving_weight_grams ?? 100;
  const servingUnit = food.serving_unit?.trim() || "serving";
  const name = food.food_name || food.tags?.item || "Nutritionix food";
  const item: FoodItem = {
    id: `nutritionix-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}`,
    name,
    category: food.brand_name ?? "Nutritionix food",
    defaultUnit: "serving",
    baseAmount: servingGrams,
    baseUnit: "grams",
    gramsPerUnit: {
      serving: servingGrams,
      grams: 1,
      oz: 28.35,
    },
    nutrition: {
      calories: food.nf_calories ?? 0,
      protein: food.nf_protein ?? 0,
      carbs: food.nf_total_carbohydrate ?? 0,
      fat: food.nf_total_fat ?? 0,
      fiber: food.nf_dietary_fiber ?? 0,
      sugar: food.nf_sugars ?? 0,
    },
    dietaryTags: ["balanced"],
  };

  return {
    id: `nutritionix:${item.id}`,
    displayName: `${name}${food.serving_qty && servingUnit ? `, ${food.serving_qty} ${servingUnit}` : ""}`,
    category: item.category,
    source: "nutritionix" satisfies FoodDataSource,
    food: item,
    externalId: item.id,
    brandName: food.brand_name,
  };
}
