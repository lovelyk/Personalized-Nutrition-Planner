import { Calculator, ShieldAlert } from "lucide-react";
import type { ActivityLevel, DietaryPreference, Goal, LifestyleType, MedicalConsideration, Pace, Sex, UserProfile, ValidationIssue } from "../types";
import { goalLabels, medicalLabels, paceLabels } from "../utils/calculations";
import { issuesByField } from "../utils/validation";

interface UserInputFormProps {
  profile: UserProfile;
  issues: ValidationIssue[];
  onChange: (profile: UserProfile) => void;
}

const activityOptions: Array<{ value: ActivityLevel; label: string; helper: string }> = [
  { value: "sedentary", label: "Sedentary", helper: "Little structured activity" },
  { value: "light", label: "Light", helper: "Light activity 1-3 days/week" },
  { value: "moderate", label: "Moderate", helper: "Exercise 3-5 days/week" },
  { value: "active", label: "Active", helper: "Hard exercise most days" },
  { value: "very-active", label: "Very active", helper: "Physical job or intense training" },
];

const dietaryOptions: Array<{ value: DietaryPreference; label: string }> = [
  { value: "balanced", label: "Balanced" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non-vegetarian", label: "Non-vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "high-protein", label: "High-protein" },
  { value: "low-carb", label: "Low-carb" },
];

const lifestyleOptions: Array<{ value: LifestyleType; label: string }> = [
  { value: "sedentary", label: "Sedentary" },
  { value: "lightly-active", label: "Lightly active" },
  { value: "active", label: "Active" },
  { value: "very-active", label: "Very active" },
];

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  helper,
  issue,
}: {
  label: string;
  value: number | undefined;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number | undefined) => void;
  helper?: string;
  issue?: ValidationIssue;
}) {
  const hasError = issue?.severity === "error";
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        className={`field ${hasError ? "border-rose bg-rose/5 focus:border-rose focus:ring-rose/20" : ""}`}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isNaN(value) ? "" : (value ?? "")}
        onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
      />
      {issue && <span className={hasError ? "help-text text-rose" : "help-text text-citrus"}>{issue.message}</span>}
      {helper && <span className="help-text">{helper}</span>}
    </label>
  );
}

export default function UserInputForm({ profile, issues, onChange }: UserInputFormProps) {
  const fieldIssues = issuesByField(issues);
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => onChange({ ...profile, [key]: value });
  const firstIssue = (field: keyof UserProfile) => fieldIssues[field]?.[0];

  const toggleMedical = (value: MedicalConsideration) => {
    if (value === "none") {
      update("medicalConsiderations", ["none"]);
      return;
    }

    const withoutNone = profile.medicalConsiderations.filter((item) => item !== "none");
    const next = withoutNone.includes(value) ? withoutNone.filter((item) => item !== value) : [...withoutNone, value];
    update("medicalConsiderations", next.length ? next : ["none"]);
  };

  return (
    <section className="card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">Intake</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">Enter realistic values. Estimates update instantly.</p>
        </div>
        <Calculator className="h-6 w-6 text-calm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <NumberField label="Age" value={profile.age} min={18} max={100} onChange={(value) => update("age", value ?? Number.NaN)} issue={firstIssue("age")} />
        <label className="block">
          <span className="field-label">Sex</span>
          <select className="field" value={profile.sex} onChange={(event) => update("sex", event.target.value as Sex)}>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>
        </label>
        <NumberField label="Height" value={profile.heightCm} min={120} max={230} onChange={(value) => update("heightCm", value ?? Number.NaN)} helper="Centimeters" issue={firstIssue("heightCm")} />
        <NumberField label="Current weight" value={profile.currentWeightKg} min={35} max={250} step={0.1} onChange={(value) => update("currentWeightKg", value ?? Number.NaN)} helper="Kilograms" issue={firstIssue("currentWeightKg")} />
        <NumberField label="Goal weight" value={profile.goalWeightKg} min={35} max={250} step={0.1} onChange={(value) => update("goalWeightKg", value ?? Number.NaN)} helper="Kilograms" issue={firstIssue("goalWeightKg")} />
        <NumberField label="Exercise frequency" value={profile.exerciseFrequency} min={0} max={14} onChange={(value) => update("exerciseFrequency", value ?? Number.NaN)} helper="Sessions per week" issue={firstIssue("exerciseFrequency")} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="field-label">Activity level</span>
          <select className="field" value={profile.activityLevel} onChange={(event) => update("activityLevel", event.target.value as ActivityLevel)}>
            {activityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.helper}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Lifestyle type</span>
          <select className="field" value={profile.lifestyleType} onChange={(event) => update("lifestyleType", event.target.value as LifestyleType)}>
            {lifestyleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Exercise type</span>
          <input className="field" value={profile.exerciseType} onChange={(event) => update("exerciseType", event.target.value)} placeholder="Strength training, cardio, yoga..." />
        </label>
        <label className="block">
          <span className="field-label">Dietary preference</span>
          <select className="field" value={profile.dietaryPreference} onChange={(event) => update("dietaryPreference", event.target.value as DietaryPreference)}>
            {dietaryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <label className="block">
          <span className="field-label">Goal</span>
          <select className="field" value={profile.goal} onChange={(event) => update("goal", event.target.value as Goal)}>
            {Object.entries(goalLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="field-label">Preferred pace</span>
          <select className="field" value={profile.pace} onChange={(event) => update("pace", event.target.value as Pace)}>
            {Object.entries(paceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <NumberField label="Target timeline" value={profile.targetTimelineWeeks} min={1} max={104} onChange={(value) => update("targetTimelineWeeks", value)} helper="Optional weeks" issue={firstIssue("targetTimelineWeeks")} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <NumberField label="Body fat" value={profile.bodyFatPercentage} min={5} max={60} step={0.1} onChange={(value) => update("bodyFatPercentage", value)} helper="Optional percentage for Katch-McArdle comparison" issue={firstIssue("bodyFatPercentage")} />
        <NumberField label="Waist measurement" value={profile.waistCm} min={40} max={200} step={0.1} onChange={(value) => update("waistCm", value)} helper="Optional centimeters" issue={firstIssue("waistCm")} />
      </div>

      <div className="mt-5 rounded-lg border border-citrus/30 bg-citrus/5 p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold text-ink">
          <ShieldAlert className="h-5 w-5 text-citrus" />
          Medical considerations
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(medicalLabels).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={profile.medicalConsiderations.includes(value as MedicalConsideration)}
                onChange={() => toggleMedical(value as MedicalConsideration)}
              />
              {label}
            </label>
          ))}
        </div>
        {profile.medicalConsiderations.includes("other") && (
          <input className="field mt-3" value={profile.otherMedicalConsideration ?? ""} onChange={(event) => update("otherMedicalConsideration", event.target.value)} placeholder="Optional note" />
        )}
        {firstIssue("otherMedicalConsideration") && <p className="help-text text-citrus">{firstIssue("otherMedicalConsideration")?.message}</p>}
      </div>
    </section>
  );
}
