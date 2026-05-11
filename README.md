# Personalized Nutrition Planner

Local Vite + React + TypeScript app for educational calorie, macro, and meal planning.

## Run Locally

```bash
npm install
npm run dev
```

Then open the Vite URL shown in the terminal.

## Build

```bash
npm run build
```

The production build outputs to `dist/`.

## Safety

This app provides educational nutrition estimates only. It does not diagnose, treat, or replace medical advice. Users with diabetes, thyroid conditions, PCOS, pregnancy, eating disorder history, kidney disease, or other medical conditions should consult a qualified clinician or registered dietitian.

## MVP Features

- Intake form for body metrics, activity, goals, diet preference, and medical considerations.
- Height entry in centimeters or feet/inches, and weight entry in kilograms or pounds.
- Field-level validation with helpful errors and warnings.
- Mifflin-St Jeor BMR and TDEE calculation.
- Optional Katch-McArdle BMR comparison when body fat percentage is entered.
- Goal-based calorie targets with safety floors, aggressive deficit warnings, and medical context notes.
- Optional target timeline adjusts non-maintenance calorie targets when goal weight differs from current weight.
- Improved protein, carb, fat, fiber, and water targets for fat loss, maintenance, muscle gain, and recomposition.
- Meal curator using `src/data/foods.json`.
- Add, edit, remove, and clear food items in the daily meal list.
- Progress bars comparing consumed calories, protein, carbs, fat, and fiber against calculated targets.

## Project Structure

```text
src/
  App.tsx
  components/
    CalorieSummary.tsx
    FoodSearch.tsx
    MacroTargets.tsx
    MealCurator.tsx
    ProgressBars.tsx
    UserInputForm.tsx
  data/
    foods.json
  services/
    foodService.ts
  utils/
    calculations.ts
    validation.ts
  types.ts
```

## Food Data Sources

The app now uses a food data service abstraction:

- `local`: offline JSON database used by the MVP.
- `usda`: active external provider for local credential-based experiments.
- `nutritionix`: parked for future development and not shown in the current food source selector.

For local experimentation with USDA, copy `.env.example` to `.env` and add:

```bash
VITE_USDA_FOODDATA_API_KEY=your_demo_key
```

For quick local testing, USDA also supports `DEMO_KEY`, but it has lower rate limits than a personal key.

Important: `VITE_*` environment variables are bundled into frontend code. Do not expose private, paid, or production API keys in the browser. A production deployment should call USDA or Nutritionix through a backend proxy that stores API keys server-side.

## Calculation Notes

- BMR uses Mifflin-St Jeor.
- TDEE multiplies BMR by a selected activity factor.
- Katch-McArdle is shown only as an optional comparison when body fat percentage is provided.
- Fat-loss and recomposition targets are capped to avoid extreme deficits.
- Target timeline uses an estimated 7,700 kcal per kg of desired weight change, then applies the app's safety caps. Short timelines may produce the same final target when capped.
- Protein is prioritized first, fat is protected with a practical minimum, and carbs fill the remaining calorie budget.

## Future Enhancements

- Backend proxy for secure external food provider access.
- Revisit Nutritionix provider implementation.
- User login and saved meal plans.
- Weekly progress tracking.
- Barcode scanning.
- AI-generated meal recommendations.
- Diabetes-aware carb distribution.
- PDF export.
- Apple Health or Google Fit integration.
