import { useMemo, useState } from "react";
import { BadgeAlert, TriangleAlert } from "lucide-react";
import CalorieSummary from "./components/CalorieSummary";
import MacroTargets from "./components/MacroTargets";
import MealCurator from "./components/MealCurator";
import UserInputForm from "./components/UserInputForm";
import type { UserProfile } from "./types";
import { calculateNutritionPlan } from "./utils/calculations";
import { validateUserProfile } from "./utils/validation";

const initialProfile: UserProfile = {
  age: 32,
  sex: "female",
  heightCm: 165,
  currentWeightKg: 72,
  goalWeightKg: 66,
  activityLevel: "moderate",
  exerciseFrequency: 4,
  exerciseType: "Strength training and walking",
  lifestyleType: "lightly-active",
  goal: "fat-loss",
  pace: "moderate",
  dietaryPreference: "balanced",
  medicalConsiderations: ["none"],
  bodyFatPercentage: undefined,
  waistCm: undefined,
  targetTimelineWeeks: 16,
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const validationIssues = useMemo(() => validateUserProfile(profile), [profile]);
  const blockingErrors = validationIssues.filter((issue) => issue.severity === "error");
  const plan = useMemo(() => (blockingErrors.length === 0 ? calculateNutritionPlan(profile) : null), [blockingErrors.length, profile]);

  return (
    <main className="min-h-screen bg-[#fafaf8]">
      <header className="border-b border-stone-200/80 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase text-calm">Local nutrition planner</p>
              <h1 className="text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Personalized Calorie & Meal Planning</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                Estimate daily energy needs, choose practical calorie and macro targets, and curate meals through a local-first food data provider.
              </p>
            </div>
            <div className="rounded-lg border border-citrus/20 bg-citrus/5 p-4 text-sm leading-6 text-stone-700">
              <div className="mb-1 flex items-center gap-2 font-semibold text-ink">
                <BadgeAlert className="h-4 w-4 text-citrus" />
                Educational use only
              </div>
              This app does not diagnose, treat, or replace medical advice. If you have diabetes, thyroid disease, PCOS, pregnancy, kidney disease, an eating disorder history, or another medical condition, confirm nutrition targets with a qualified clinician.
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <UserInputForm profile={profile} issues={validationIssues} onChange={setProfile} />
        </div>

        <div className="space-y-8">
          {blockingErrors.length > 0 ? (
            <section className="rounded-lg border border-rose/30 bg-rose/5 p-5">
              <div className="mb-3 flex items-center gap-2 font-semibold text-rose">
                <TriangleAlert className="h-5 w-5" />
                Fix required inputs
              </div>
              <ul className="space-y-2 text-sm leading-6 text-stone-700">
                {blockingErrors.map((issue) => (
                  <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            </section>
          ) : (
            plan && (
              <>
                <CalorieSummary plan={plan} />
                <MacroTargets plan={plan} />
                <MealCurator plan={plan} dietaryPreference={profile.dietaryPreference} />
              </>
            )
          )}

          <details className="rounded-lg border border-stone-200/80 bg-white p-5 text-sm leading-6 text-stone-600">
            <summary className="cursor-pointer font-semibold text-ink">Future-ready roadmap</summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <p>Move USDA FoodData Central calls behind a secure backend proxy for production.</p>
              <p>Revisit Nutritionix as a future provider if needed.</p>
              <p>User login and saved daily meal plans.</p>
              <p>Weekly progress tracking and measurement trends.</p>
              <p>Barcode scanning for packaged foods.</p>
              <p>AI-generated meal recommendations.</p>
              <p>Diabetes-aware carb distribution.</p>
              <p>Export to PDF.</p>
              <p>Apple Health and Google Fit integration.</p>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
