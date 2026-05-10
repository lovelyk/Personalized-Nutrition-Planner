import { AlertTriangle, Info } from "lucide-react";
import type { NutritionPlan } from "../types";

interface CalorieSummaryProps {
  plan: NutritionPlan;
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-b border-stone-200 pb-4 last:border-b-0 last:pb-0 md:border-b-0 md:border-r md:pb-0 md:pr-5 md:last:border-r-0">
      <p className="text-xs font-semibold uppercase text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-stone-500">{detail}</p>
    </div>
  );
}

export default function CalorieSummary({ plan }: CalorieSummaryProps) {
  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-ink">Calorie Summary</h2>
        <p className="mt-1 text-sm leading-6 text-stone-500">BMR, estimated daily use, and the goal-based target.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="BMR" value={`${plan.bmr} kcal`} detail="Resting energy estimate using Mifflin-St Jeor." />
        <MetricCard label="TDEE" value={`${plan.tdee} kcal`} detail={`BMR multiplied by activity factor ${plan.activityFactor}.`} />
        <MetricCard
          label="Daily target"
          value={`${plan.targetCalories} kcal`}
          detail={`${plan.explanation} Planned adjustment: ${plan.plannedCalorieAdjustmentPercent > 0 ? "+" : ""}${plan.plannedCalorieAdjustmentPercent}%. Actual adjustment after safety checks: ${plan.actualCalorieAdjustmentPercent > 0 ? "+" : ""}${plan.actualCalorieAdjustmentPercent}% versus TDEE.`}
        />
      </div>

      {plan.katchBmr && (
        <div className="rounded-lg border border-calm/20 bg-calm/5 p-4 text-sm leading-6 text-calm">
          <div className="flex gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Katch-McArdle comparison: {plan.katchBmr} kcal BMR based on your optional body-fat estimate.</p>
          </div>
        </div>
      )}

      {plan.warnings.length > 0 && (
        <div className="rounded-lg border border-rose/20 bg-rose/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose">
            <AlertTriangle className="h-4 w-4" />
            Safety notes
          </div>
          <ul className="space-y-2 text-sm leading-6 text-stone-700">
            {plan.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
