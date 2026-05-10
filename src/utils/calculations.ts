import type {
  ActivityLevel,
  DietaryPreference,
  FoodItem,
  Goal,
  MacroTargets,
  MedicalConsideration,
  NutritionPlan,
  NutritionTotals,
  Pace,
  Sex,
  Unit,
  UserProfile,
} from "../types";

export const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
};

export const goalLabels: Record<Goal, string> = {
  "fat-loss": "Fat loss",
  maintenance: "Maintenance",
  "muscle-gain": "Muscle gain",
  recomposition: "Body recomposition",
};

export const paceLabels: Record<Pace, string> = {
  slow: "Slow",
  moderate: "Moderate",
  aggressive: "Aggressive",
};

export const medicalLabels: Record<MedicalConsideration, string> = {
  none: "None",
  diabetes: "Diabetes or blood sugar concerns",
  hypothyroidism: "Hypothyroidism",
  pcos: "PCOS",
  pregnancy: "Pregnancy",
  "kidney-disease": "Kidney disease",
  "eating-disorder-history": "Eating disorder history",
  other: "Other",
};

export function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function mifflinStJeor(profile: UserProfile) {
  const sexAdjustment = profile.sex === "male" ? 5 : -161;
  return 10 * profile.currentWeightKg + 6.25 * profile.heightCm - 5 * profile.age + sexAdjustment;
}

export function katchMcArdle(profile: UserProfile) {
  if (!profile.bodyFatPercentage || profile.bodyFatPercentage <= 0 || profile.bodyFatPercentage >= 60) {
    return undefined;
  }

  const leanMassKg = profile.currentWeightKg * (1 - profile.bodyFatPercentage / 100);
  return 370 + 21.6 * leanMassKg;
}

function getSafeMinimumCalories(sex: Sex) {
  return sex === "male" ? 1500 : 1200;
}

function getDeficitFloor(profile: UserProfile, tdee: number) {
  const absoluteFloor = getSafeMinimumCalories(profile.sex);
  const relativeFloor = tdee * 0.8;

  // The app is educational, so the target is never allowed below a general
  // sex-based floor or below a 20% TDEE deficit. Clinical very-low-calorie
  // diets need professional supervision and are outside this MVP.
  return Math.max(absoluteFloor, relativeFloor);
}

function getGoalAdjustmentPercent(goal: Goal, pace: Pace) {
  const fatLoss: Record<Pace, number> = {
    slow: -0.1,
    moderate: -0.15,
    aggressive: -0.18,
  };
  const surplus: Record<Pace, number> = {
    slow: 0.05,
    moderate: 0.08,
    aggressive: 0.12,
  };
  const recomp: Record<Pace, number> = {
    slow: 0,
    moderate: -0.05,
    aggressive: -0.08,
  };

  if (goal === "fat-loss") return fatLoss[pace];
  if (goal === "muscle-gain") return surplus[pace];
  if (goal === "recomposition") return recomp[pace];
  return 0;
}

function getTimelineCalorieAdjustment(profile: UserProfile) {
  if (!profile.targetTimelineWeeks || profile.targetTimelineWeeks <= 0) {
    return undefined;
  }

  const weightChangeKg = profile.goalWeightKg - profile.currentWeightKg;
  if (weightChangeKg === 0 || profile.goal === "maintenance" || profile.goal === "recomposition") {
    return undefined;
  }

  // A common planning approximation is about 7,700 kcal per kg of body-weight
  // change. This is only an estimate, so the result still goes through the
  // app's deficit/surplus caps and safety warnings.
  return (weightChangeKg * 7700) / (profile.targetTimelineWeeks * 7);
}

function getSafeSurplusCeiling(tdee: number) {
  return tdee * 1.15;
}

function getGoalCalorieTarget(profile: UserProfile, tdee: number) {
  const plannedCalorieAdjustmentPercent = getGoalAdjustmentPercent(profile.goal, profile.pace);
  const defaultAdjustment = tdee * plannedCalorieAdjustmentPercent;
  const timelineAdjustment = getTimelineCalorieAdjustment(profile);
  const shouldUseTimeline =
    timelineAdjustment !== undefined &&
    ((profile.goal === "fat-loss" && timelineAdjustment < 0) || (profile.goal === "muscle-gain" && timelineAdjustment > 0));
  const chosenAdjustment = shouldUseTimeline ? timelineAdjustment : defaultAdjustment;
  const rawTarget = tdee + chosenAdjustment;

  if (profile.goal === "fat-loss" || profile.goal === "recomposition") {
    return {
      plannedCalorieAdjustmentPercent,
      rawTarget,
      targetCalories: Math.max(rawTarget, getDeficitFloor(profile, tdee)),
      timelineAdjustment: shouldUseTimeline ? timelineAdjustment : undefined,
    };
  }

  if (profile.goal === "muscle-gain") {
    return {
      plannedCalorieAdjustmentPercent,
      rawTarget,
      targetCalories: Math.min(rawTarget, getSafeSurplusCeiling(tdee)),
      timelineAdjustment: shouldUseTimeline ? timelineAdjustment : undefined,
    };
  }

  return {
    plannedCalorieAdjustmentPercent,
    rawTarget,
    targetCalories: rawTarget,
    timelineAdjustment: undefined,
  };
}

function proteinPerKg(goal: Goal, preference: DietaryPreference) {
  let grams = 1.5;
  if (goal === "maintenance") grams = 1.5;
  if (goal === "fat-loss") grams = 2;
  if (goal === "recomposition") grams = 2.1;
  if (goal === "muscle-gain") grams = 1.8;
  if (preference === "high-protein") grams += 0.2;
  if (preference === "vegan") grams += 0.1;
  return Math.min(2.4, grams);
}

function fatTargets(profile: UserProfile, calories: number) {
  const minFatCalories = profile.currentWeightKg * 0.6 * 9;
  const goalPercent =
    profile.goal === "muscle-gain"
      ? 0.27
      : profile.goal === "fat-loss"
        ? 0.25
        : profile.goal === "recomposition"
          ? 0.26
          : 0.28;
  const preferencePercent =
    profile.dietaryPreference === "low-carb" ? 0.38 : profile.dietaryPreference === "high-protein" ? 0.25 : goalPercent;

  return Math.round(Math.max(minFatCalories, calories * preferencePercent) / 9);
}

function getFiberTarget(profile: UserProfile, calories: number) {
  const calorieBased = (calories / 1000) * 14;
  const sexBaseline = profile.sex === "male" ? 38 : 25;
  return Math.max(22, Math.min(sexBaseline, calorieBased));
}

function getWaterTarget(profile: UserProfile) {
  const base = profile.currentWeightKg * 0.035;
  const exerciseBonus = Math.min(profile.exerciseFrequency, 7) * 0.15;
  return Math.min(5, base + exerciseBonus);
}

function calculateMacros(profile: UserProfile, calories: number): MacroTargets {
  // Protein is assigned first because it is the macro most tied to satiety,
  // training adaptation, and lean-mass retention during a deficit.
  const proteinGrams = Math.round(profile.currentWeightKg * proteinPerKg(profile.goal, profile.dietaryPreference));
  const proteinCalories = proteinGrams * 4;

  // Fat is second and protected with a practical floor, then adjusted by goal
  // and dietary preference. Carbohydrate fills the remaining energy budget.
  const fatGrams = fatTargets(profile, calories);
  const remainingCalories = Math.max(0, calories - proteinCalories - fatGrams * 9);
  const carbGrams = Math.round(remainingCalories / 4);

  return {
    calories: Math.round(calories),
    proteinGrams,
    carbGrams,
    fatGrams,
    fiberGrams: Math.round(getFiberTarget(profile, calories)),
    waterLiters: round(getWaterTarget(profile), 1),
  };
}

function buildWarnings(profile: UserProfile, targetCalories: number, rawTarget: number, tdee: number, macros: MacroTargets, timelineAdjustment?: number) {
  const warnings: string[] = [];
  const safeMinimum = getDeficitFloor(profile, tdee);
  const deficitPercent = (tdee - targetCalories) / tdee;
  const hasMedical = profile.medicalConsiderations.some((item) => item !== "none");

  if (rawTarget < safeMinimum) {
    warnings.push(`The calculated target was below the app's safety floor, so it was raised to ${Math.round(safeMinimum)} calories. Do not follow very-low-calorie diets without medical supervision.`);
  }

  if (profile.goal === "muscle-gain" && rawTarget > getSafeSurplusCeiling(tdee)) {
    warnings.push("The timeline-based surplus was above the app's gain ceiling, so calories were capped to keep the plan gradual.");
  }

  if (timelineAdjustment !== undefined && Math.round(targetCalories) !== Math.round(rawTarget)) {
    warnings.push("Your timeline target was adjusted by the app's safety limits. Consider a longer timeline if the adjusted calories feel too aggressive.");
  }

  if (profile.goal === "fat-loss" && profile.pace === "aggressive") {
    warnings.push("Aggressive weight loss is higher risk. Watch for fatigue, excessive hunger, performance drops, poor adherence, and muscle loss; a slower pace is usually easier to sustain.");
  }

  if (profile.goal === "fat-loss" && deficitPercent > 0.15) {
    warnings.push("This plan is near the upper end of a sensible deficit. Prioritize protein, resistance training, sleep, and recovery.");
  }

  if (profile.goal === "fat-loss" && profile.exerciseType.toLowerCase().includes("cardio") && !profile.exerciseType.toLowerCase().includes("strength")) {
    warnings.push("For muscle preservation during fat loss, add progressive resistance training if it is appropriate for you.");
  }

  if (profile.medicalConsiderations.includes("diabetes") && macros.carbGrams > 250) {
    warnings.push("Carbohydrate targets may need individualized timing and distribution for diabetes or blood sugar concerns. Consult a clinician or registered dietitian.");
  }

  if (profile.medicalConsiderations.includes("kidney-disease")) {
    warnings.push("Kidney disease may require individualized protein, sodium, potassium, phosphorus, and fluid guidance. Confirm targets with your care team.");
  }

  if (profile.medicalConsiderations.includes("pregnancy")) {
    warnings.push("Pregnancy changes calorie and nutrient needs. Do not use this estimate as a pregnancy nutrition prescription.");
  }

  if (profile.medicalConsiderations.includes("eating-disorder-history")) {
    warnings.push("If calorie tracking could be triggering or unsafe, use this app only with support from a qualified professional.");
  }

  if (hasMedical) {
    warnings.push("Medical considerations can change nutrition targets. This tool is educational and does not replace medical advice.");
  }

  return warnings;
}

function buildNotes(profile: UserProfile, macros: MacroTargets) {
  const notes: string[] = [];

  if (profile.goal === "fat-loss") {
    notes.push("Protein and resistance training are prioritized to help preserve lean mass while weight trends down.");
  }

  if (profile.dietaryPreference === "vegan") {
    notes.push("For vegan diets, pay attention to complete protein variety, B12, iron, calcium, iodine, zinc, and omega-3 sources.");
  }

  if (profile.dietaryPreference === "low-carb") {
    notes.push("Low-carb preferences shift more calories toward fat while still keeping protein high enough for the selected goal.");
  }

  if (profile.targetTimelineWeeks) {
    const weeklyChange = (profile.currentWeightKg - profile.goalWeightKg) / profile.targetTimelineWeeks;
    if (Math.abs(weeklyChange) > profile.currentWeightKg * 0.01) {
      notes.push("Your timeline implies a weight change faster than about 1% of body weight per week. A slower timeline may be safer and easier to maintain.");
    }
  }

  notes.push(`Fiber is estimated at ${macros.fiberGrams} g/day using common intake targets, not a disease-specific prescription.`);
  return notes;
}

export function calculateNutritionPlan(profile: UserProfile): NutritionPlan {
  const bmr = mifflinStJeor(profile);
  const activityFactor = activityFactors[profile.activityLevel];
  const tdee = bmr * activityFactor;
  const goalTarget = getGoalCalorieTarget(profile, tdee);
  const { plannedCalorieAdjustmentPercent, rawTarget, targetCalories, timelineAdjustment } = goalTarget;
  const actualCalorieAdjustmentPercent = (targetCalories - tdee) / tdee;
  const macros = calculateMacros(profile, targetCalories);
  const warnings = buildWarnings(profile, targetCalories, rawTarget, tdee, macros, timelineAdjustment);
  const notes = buildNotes(profile, macros);
  const katchBmrValue = katchMcArdle(profile);

  const explanation =
    profile.goal === "maintenance"
      ? "The plan keeps calories near estimated daily energy use."
      : profile.goal === "muscle-gain"
        ? "The plan uses a modest surplus to support training performance and gradual lean mass gain."
        : profile.goal === "recomposition"
          ? "The plan stays near maintenance with higher protein to support gradual fat loss and muscle retention."
          : "The plan uses a controlled deficit with higher protein to support fat loss while reducing muscle-loss risk.";

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    activityFactor,
    katchBmr: katchBmrValue ? Math.round(katchBmrValue) : undefined,
    plannedCalorieAdjustmentPercent: round(plannedCalorieAdjustmentPercent * 100, 1),
    actualCalorieAdjustmentPercent: round(actualCalorieAdjustmentPercent * 100, 1),
    timelineCalorieAdjustment: timelineAdjustment !== undefined ? Math.round(timelineAdjustment) : undefined,
    targetCalories: Math.round(targetCalories),
    macros,
    mealDistribution: {
      breakfast: Math.round(targetCalories * 0.25),
      lunch: Math.round(targetCalories * 0.3),
      dinner: Math.round(targetCalories * 0.3),
      snacks: Math.round(targetCalories * 0.15),
    },
    explanation,
    warnings,
    notes,
  };
}

export function scaleFoodNutrition(food: FoodItem, quantity: number, unit: Unit): NutritionTotals {
  const selectedGrams = unit === food.baseUnit ? quantity : quantity * (food.gramsPerUnit[unit] ?? food.gramsPerUnit.serving ?? food.baseAmount);
  const baseGrams = food.baseUnit === "grams" ? food.baseAmount : food.gramsPerUnit[food.baseUnit] ?? food.baseAmount;
  const factor = selectedGrams / baseGrams;

  return {
    calories: round(food.nutrition.calories * factor),
    protein: round(food.nutrition.protein * factor, 1),
    carbs: round(food.nutrition.carbs * factor, 1),
    fat: round(food.nutrition.fat * factor, 1),
    fiber: round(food.nutrition.fiber * factor, 1),
    sugar: round(food.nutrition.sugar * factor, 1),
  };
}

export function addTotals(items: NutritionTotals[]): NutritionTotals {
  return items.reduce(
    (sum, item) => ({
      calories: round(sum.calories + item.calories),
      protein: round(sum.protein + item.protein, 1),
      carbs: round(sum.carbs + item.carbs, 1),
      fat: round(sum.fat + item.fat, 1),
      fiber: round(sum.fiber + item.fiber, 1),
      sugar: round(sum.sugar + item.sugar, 1),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
  );
}
