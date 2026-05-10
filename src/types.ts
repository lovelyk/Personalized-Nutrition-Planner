export type Sex = "female" | "male";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very-active";
export type LifestyleType = "sedentary" | "lightly-active" | "active" | "very-active";
export type Goal = "fat-loss" | "maintenance" | "muscle-gain" | "recomposition";
export type Pace = "slow" | "moderate" | "aggressive";
export type DietaryPreference =
  | "balanced"
  | "vegetarian"
  | "non-vegetarian"
  | "vegan"
  | "high-protein"
  | "low-carb";
export type MedicalConsideration =
  | "none"
  | "diabetes"
  | "hypothyroidism"
  | "pcos"
  | "pregnancy"
  | "kidney-disease"
  | "eating-disorder-history"
  | "other";

export type Unit = "grams" | "oz" | "cup" | "tbsp" | "tsp" | "piece" | "serving";
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snacks";

export interface UserProfile {
  age: number;
  sex: Sex;
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  exerciseFrequency: number;
  exerciseType: string;
  lifestyleType: LifestyleType;
  goal: Goal;
  pace: Pace;
  dietaryPreference: DietaryPreference;
  medicalConsiderations: MedicalConsideration[];
  otherMedicalConsideration?: string;
  bodyFatPercentage?: number;
  waistCm?: number;
  targetTimelineWeeks?: number;
}

export interface MacroTargets {
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  fiberGrams: number;
  waterLiters: number;
}

export interface MealDistribution {
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
}

export interface NutritionPlan {
  bmr: number;
  tdee: number;
  activityFactor: number;
  katchBmr?: number;
  plannedCalorieAdjustmentPercent: number;
  actualCalorieAdjustmentPercent: number;
  targetCalories: number;
  macros: MacroTargets;
  mealDistribution: MealDistribution;
  explanation: string;
  warnings: string[];
  notes: string[];
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  defaultUnit: Unit;
  baseAmount: number;
  baseUnit: Unit;
  gramsPerUnit: Partial<Record<Unit, number>>;
  nutrition: NutritionTotals;
  dietaryTags: DietaryPreference[];
}

export interface MealEntry {
  id: string;
  foodId: string;
  mealSlot: MealSlot;
  quantity: number;
  unit: Unit;
}

export type UserProfileField = keyof UserProfile;

export interface ValidationIssue {
  field: UserProfileField;
  message: string;
  severity: "error" | "warning";
}
