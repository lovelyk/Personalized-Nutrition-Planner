import { useMemo, useState } from "react";
import { BadgeAlert, HeartPulse, ShieldCheck, TriangleAlert } from "lucide-react";
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
    <main className="min-h-screen bg-[#f6f7f4]">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-calm/10 px-3 py-1 text-sm font-medium text-calm">
                <HeartPulse className="h-4 w-4" />
                Local nutrition planner
              </div>
              <h1 className="text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Personalized Calorie & Meal Planning</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
                Estimate daily energy needs, choose practical calorie and macro targets, and curate meals through a local-first food data provider.
              </p>
            </div>
            <div className="rounded-lg border border-citrus/30 bg-citrus/5 p-4 text-sm leading-6 text-stone-700 lg:max-w-md">
              <div className="mb-2 flex items-center gap-2 font-semibold text-ink">
                <BadgeAlert className="h-5 w-5 text-citrus" />
                Educational use only
              </div>
              This app does not diagnose, treat, or replace medical advice. If you have diabetes, thyroid disease, PCOS, pregnancy, kidney disease, an eating disorder history, or another medical condition, confirm nutrition targets with a qualified clinician.
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-600 md:grid-cols-3">
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
              Uses Mifflin-St Jeor with optional Katch-McArdle comparison.
            </div>
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
              Avoids extreme calorie targets with general safety floors.
            </div>
            <div className="flex gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
              Flags medical contexts where professional guidance matters.
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <UserInputForm profile={profile} issues={validationIssues} onChange={setProfile} />
        </div>

        <div className="space-y-6">
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

          <section className="rounded-lg border border-stone-200 bg-white p-5 text-sm leading-6 text-stone-600">
            <h2 className="text-lg font-semibold text-ink">Future-ready roadmap</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <p>Enable USDA FoodData Central through a secure backend proxy.</p>
              <p>Add Nutritionix or Edamam providers behind the existing food service interface.</p>
              <p>User login and saved daily meal plans.</p>
              <p>Weekly progress tracking and measurement trends.</p>
              <p>Barcode scanning for packaged foods.</p>
              <p>AI-generated meal recommendations.</p>
              <p>Diabetes-aware carb distribution.</p>
              <p>Export to PDF.</p>
              <p>Apple Health and Google Fit integration.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
