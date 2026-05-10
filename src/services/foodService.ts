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

interface EdamamParserResponse {
  hints?: Array<{
    food: {
      foodId: string;
      label: string;
      category?: string;
      categoryLabel?: string;
      brand?: string;
      nutrients?: {
        ENERC_KCAL?: number;
        PROCNT?: number;
        FAT?: number;
        CHOCDF?: number;
        FIBTG?: number;
        SUGAR?: number;
      };
    };
    measures?: Array<{
      label: string;
      weight?: number;
    }>;
  }>;
}

function mapEdamamFood(hint: NonNullable<EdamamParserResponse["hints"]>[number]): FoodSearchResult {
  const nutrients = hint.food.nutrients ?? {};
  const servingMeasure = hint.measures?.find((measure) => measure.label.toLowerCase() === "serving") ?? hint.measures?.[0];
  const servingWeight = servingMeasure?.weight ?? 100;
  const item: FoodItem = {
    id: `edamam-${hint.food.foodId}`,
    name: hint.food.label,
    category: hint.food.categoryLabel ?? hint.food.category ?? "Edamam food",
    defaultUnit: "grams",
    baseAmount: 100,
    baseUnit: "grams",
    gramsPerUnit: {
      grams: 1,
      oz: 28.35,
      serving: servingWeight,
    },
    nutrition: {
      calories: nutrients.ENERC_KCAL ?? 0,
      protein: nutrients.PROCNT ?? 0,
      carbs: nutrients.CHOCDF ?? 0,
      fat: nutrients.FAT ?? 0,
      fiber: nutrients.FIBTG ?? 0,
      sugar: nutrients.SUGAR ?? 0,
    },
    dietaryTags: ["balanced"],
  };

  return {
    id: `edamam:${hint.food.foodId}`,
    displayName: hint.food.label,
    category: item.category,
    source: "edamam",
    food: item,
    externalId: hint.food.foodId,
    brandName: hint.food.brand,
  };
}

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
    // USDA, Edamam, Nutritionix, or any paid API key in frontend code. Route
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
    // Parked for future development. Nutritionix is intentionally not exposed
    // in the current UI because credentials/API availability are not ready.
    // When revisited, call it through a backend proxy rather than the browser.
    return [];
  },
  async getFoodById() {
    return undefined;
  },
};

export const edamamFoodProvider: FoodDataProvider = {
  source: "edamam",
  async searchFoods(options: FoodSearchOptions = {}) {
    const query = options.query?.trim();
    if (!query) return [];

    // Edamam Food Database API credentials are exposed if they are used as
    // VITE_* browser variables. This direct call is for local experiments only.
    // Production should use a backend proxy and keep app_id/app_key server-side.
    const appId = import.meta.env.VITE_EDAMAM_APP_ID;
    const appKey = import.meta.env.VITE_EDAMAM_APP_KEY;
    if (!appId || !appKey) return [];

    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      ingr: query,
    });

    const response = await fetch(`https://api.edamam.com/api/food-database/v2/parser?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Edamam Food Database request failed: ${response.status}`);
    }

    const data = (await response.json()) as EdamamParserResponse;
    return (data.hints ?? []).slice(0, options.limit ?? 10).map(mapEdamamFood);
  },
  async getFoodById(id: string) {
    const result = await this.searchFoods({ query: id, limit: 1 });
    return result[0]?.food;
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
  { value: "edamam", label: "Edamam", description: "Requires local demo credentials" },
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
