import { Droplets, Wheat, Utensils } from "lucide-react";
import type { NutritionPlan } from "../types";

interface MacroTargetsProps {
  plan: NutritionPlan;
}

function MacroCard({ label, value, unit, detail }: { label: string; value: number; unit: string; detail: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">
        {value}
        <span className="ml-1 text-sm font-medium text-stone-500">{unit}</span>
      </p>
      <p className="mt-2 text-sm leading-6 text-stone-600">{detail}</p>
    </div>
  );
}

export default function MacroTargets({ plan }: MacroTargetsProps) {
  const { macros } = plan;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Utensils className="h-5 w-5 text-calm" />
        <h2 className="text-xl font-semibold text-ink">Macro Targets</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MacroCard label="Protein" value={macros.proteinGrams} unit="g" detail="Supports satiety, repair, and lean mass retention." />
        <MacroCard label="Carbs" value={macros.carbGrams} unit="g" detail="Fills remaining calories for energy and training." />
        <MacroCard label="Fat" value={macros.fatGrams} unit="g" detail="Keeps dietary fat above a practical minimum." />
        <MacroCard label="Fiber" value={macros.fiberGrams} unit="g" detail="General target for fullness and digestive health." />
        <MacroCard label="Water" value={macros.waterLiters} unit="L" detail="Estimate based on weight and exercise frequency." />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <Wheat className="h-5 w-5 text-citrus" />
            Suggested meal distribution
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {Object.entries(plan.mealDistribution).map(([meal, calories]) => (
              <div key={meal} className="rounded-md bg-stone-50 p-3">
                <p className="text-xs uppercase text-stone-500">{meal}</p>
                <p className="mt-1 font-semibold text-ink">{calories} kcal</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <Droplets className="h-5 w-5 text-calm" />
            Why this plan
          </div>
          <ul className="space-y-2 text-sm leading-6 text-stone-600">
            {plan.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
