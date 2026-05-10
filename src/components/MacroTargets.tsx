import type { NutritionPlan } from "../types";

interface MacroTargetsProps {
  plan: NutritionPlan;
}

function MacroCard({ label, value, unit, detail }: { label: string; value: number; unit: string; detail: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
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
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-ink">Macro Targets</h2>
        <p className="mt-1 text-sm leading-6 text-stone-500">Daily targets based on your goal, calories, and body weight.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MacroCard label="Protein" value={macros.proteinGrams} unit="g" detail="Supports satiety, repair, and lean mass retention." />
        <MacroCard label="Carbs" value={macros.carbGrams} unit="g" detail="Fills remaining calories for energy and training." />
        <MacroCard label="Fat" value={macros.fatGrams} unit="g" detail="Keeps dietary fat above a practical minimum." />
        <MacroCard label="Fiber" value={macros.fiberGrams} unit="g" detail="General target for fullness and digestive health." />
        <MacroCard label="Water" value={macros.waterLiters} unit="L" detail="Estimate based on weight and exercise frequency." />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-ink">Suggested meal distribution</h3>
          <div className="grid gap-2 sm:grid-cols-4">
            {Object.entries(plan.mealDistribution).map(([meal, calories]) => (
              <div key={meal} className="rounded-md border border-stone-200 bg-stone-50/70 p-3">
                <p className="text-xs uppercase text-stone-500">{meal}</p>
                <p className="mt-1 font-semibold text-ink">{calories} kcal</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 font-semibold text-ink">Why this plan</h3>
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
