import { Activity, AlertTriangle, Flame, HeartPulse, Info, type LucideIcon } from "lucide-react";
import type { NutritionPlan } from "../types";

interface CalorieSummaryProps {
  plan: NutritionPlan;
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-calm/10 p-2 text-calm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="text-2xl font-semibold text-ink">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">{detail}</p>
    </div>
  );
}

export default function CalorieSummary({ plan }: CalorieSummaryProps) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="BMR" value={`${plan.bmr} kcal`} detail="Estimated calories your body uses at rest using Mifflin-St Jeor." icon={HeartPulse} />
        <MetricCard label="TDEE" value={`${plan.tdee} kcal`} detail={`BMR multiplied by your activity factor (${plan.activityFactor}).`} icon={Activity} />
        <MetricCard
          label="Daily target"
          value={`${plan.targetCalories} kcal`}
          detail={`${plan.explanation} Planned adjustment: ${plan.plannedCalorieAdjustmentPercent > 0 ? "+" : ""}${plan.plannedCalorieAdjustmentPercent}%. Actual adjustment after safety checks: ${plan.actualCalorieAdjustmentPercent > 0 ? "+" : ""}${plan.actualCalorieAdjustmentPercent}% versus TDEE.`}
          icon={Flame}
        />
      </div>

      {plan.katchBmr && (
        <div className="rounded-lg border border-calm/30 bg-calm/5 p-4 text-sm leading-6 text-calm">
          <div className="flex gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Katch-McArdle comparison: {plan.katchBmr} kcal BMR based on your optional body-fat estimate.</p>
          </div>
        </div>
      )}

      {plan.warnings.length > 0 && (
        <div className="rounded-lg border border-rose/30 bg-rose/5 p-4">
          <div className="mb-2 flex items-center gap-2 font-semibold text-rose">
            <AlertTriangle className="h-5 w-5" />
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
