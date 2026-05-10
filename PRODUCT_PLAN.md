# Personalized Nutrition Planner - MVP Plan

## Product Requirements

Build a locally hosted browser app that helps users estimate daily calorie needs, choose a goal-based calorie and macro target, and curate a daily meal list through a local-first food data provider. The app is educational only and must avoid medical certainty, extreme calorie recommendations, or disease-specific treatment guidance.

## MVP Scope

- Intake form for demographics, body metrics, activity, training, goal, dietary preference, medical considerations, and optional measurements.
- Mifflin-St Jeor BMR and TDEE calculation.
- Optional Katch-McArdle comparison when body fat percentage is supplied.
- Goal-based calorie recommendation for fat loss, maintenance, muscle gain, or recomposition.
- Macro targets for protein, carbs, fat, fiber, and water.
- Meal curator using local JSON food data through a food service abstraction.
- Daily nutrition totals and remaining calories/macros.
- Responsive dashboard with clear safety disclaimers and warnings.

## Data Model

- `UserProfile`: intake answers and optional body composition/timeline fields.
- `NutritionPlan`: calculated BMR, TDEE, calorie target, macro targets, warnings, explanation, and meal distribution.
- `FoodItem`: normalized food entry from the active provider.
- `FoodSearchResult`: provider-agnostic search result that can represent local, USDA, or future Nutritionix data.
- `MealEntry`: selected food, quantity, unit, meal slot, and derived nutrition.
- `NutritionTotals`: calories, protein, carbs, fat, fiber, and sugar.

## Calculation Logic

- BMR: Mifflin-St Jeor.
- TDEE: BMR multiplied by an activity factor from sedentary to very active.
- Katch-McArdle: shown as comparison only when body fat percentage is present.
- Fat loss: deficit based on preferred pace, capped to avoid unsafe lows.
- Maintenance: near TDEE.
- Muscle gain: modest surplus based on pace.
- Recomposition: maintenance or small deficit with higher protein.
- Protein: goal-sensitive grams per kg body weight.
- Fat: minimum based on calories and body weight, then adjusted by preference.
- Carbs: fill remaining calories after protein and fat.
- Fiber: sex and calorie-aware estimate.
- Water: weight and activity-aware estimate.

## Edge Cases

- Missing or invalid height, weight, or age.
- Goal calories below safe minimum thresholds.
- Aggressive deficit or excessive weekly loss.
- Diabetes or blood sugar concerns with high carbohydrate targets.
- Kidney disease, pregnancy, eating disorder history, thyroid conditions, or other clinical conditions.
- Body fat percentage outside a realistic range.
- Meal totals above or below targets.

## Safety Disclaimers

The app provides educational nutrition estimates and does not replace medical advice. Users with diabetes, thyroid disease, PCOS, pregnancy, kidney disease, eating disorder history, or other medical conditions should work with a qualified clinician or registered dietitian. The app avoids very-low-calorie recommendations and flags aggressive deficits.

## UI Component Plan

- `UserInputForm`: intake controls and validation-friendly defaults.
- `CalorieSummary`: BMR, TDEE, calorie target, explanations, warnings.
- `MacroTargets`: macro cards, fiber, water, and meal distribution.
- `MealCurator`: daily meal builder and totals comparison.
- `FoodSearch`: provider-backed food search selector.
- `ProgressBars`: reusable target comparison bars.

## Future Enhancements

- Secure backend proxy for USDA FoodData Central and any future Nutritionix API access.
- Production hardening for the USDA provider that is currently available for local credential-based experiments.
- User login and saved daily meal plans.
- Weekly progress tracking and measurements.
- Barcode scanning.
- AI-generated meal recommendations.
- Diabetes-aware carb distribution.
- Export to PDF.
- Apple Health and Google Fit integrations.
