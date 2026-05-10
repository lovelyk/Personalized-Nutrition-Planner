interface ProgressBarsProps {
  label: string;
  value: number;
  target: number;
  unit: string;
  tone?: "calories" | "protein" | "carbs" | "fat" | "fiber";
}

const toneClasses = {
  calories: "bg-calm",
  protein: "bg-leaf",
  carbs: "bg-citrus",
  fat: "bg-rose",
  fiber: "bg-stone-700",
};

export default function ProgressBars({ label, value, target, unit, tone = "calories" }: ProgressBarsProps) {
  const percent = target > 0 ? Math.min((value / target) * 100, 140) : 0;
  const overTarget = value > target * 1.05;
  const remaining = Math.max(target - value, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-stone-700">{label}</span>
        <span className="text-stone-600">
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full ${toneClasses[tone]}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <div className={`flex items-center gap-1 text-xs ${overTarget ? "text-rose" : "text-stone-500"}`}>
        {overTarget ? `${Math.round(value - target)} ${unit} over target` : `${Math.round(remaining)} ${unit} remaining`}
      </div>
    </div>
  );
}
