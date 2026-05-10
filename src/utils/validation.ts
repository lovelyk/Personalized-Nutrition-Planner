import type { UserProfile, ValidationIssue } from "../types";

function isBlankNumber(value: number | undefined): value is undefined {
  return value === undefined || Number.isNaN(value);
}

function addRangeIssue(
  issues: ValidationIssue[],
  field: keyof UserProfile,
  value: number | undefined,
  min: number,
  max: number,
  label: string,
  unit = "",
) {
  if (isBlankNumber(value)) {
    issues.push({ field, message: `${label} is required.`, severity: "error" });
    return;
  }

  const numericValue = value;

  if (numericValue < min || numericValue > max) {
    issues.push({
      field,
      message: `${label} should be between ${min} and ${max}${unit ? ` ${unit}` : ""}.`,
      severity: "error",
    });
  }
}

export function validateUserProfile(profile: UserProfile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  addRangeIssue(issues, "age", profile.age, 18, 100, "Age");
  addRangeIssue(issues, "heightCm", profile.heightCm, 120, 230, "Height", "cm");
  addRangeIssue(issues, "currentWeightKg", profile.currentWeightKg, 35, 250, "Current weight", "kg");
  addRangeIssue(issues, "goalWeightKg", profile.goalWeightKg, 35, 250, "Goal weight", "kg");
  addRangeIssue(issues, "exerciseFrequency", profile.exerciseFrequency, 0, 14, "Exercise frequency", "sessions/week");

  if (profile.bodyFatPercentage !== undefined) {
    addRangeIssue(issues, "bodyFatPercentage", profile.bodyFatPercentage, 5, 60, "Body fat", "%");
  }

  if (profile.waistCm !== undefined) {
    addRangeIssue(issues, "waistCm", profile.waistCm, 40, 200, "Waist measurement", "cm");
  }

  if (profile.targetTimelineWeeks !== undefined) {
    addRangeIssue(issues, "targetTimelineWeeks", profile.targetTimelineWeeks, 1, 104, "Target timeline", "weeks");
  }

  if (profile.goal === "fat-loss" && profile.goalWeightKg >= profile.currentWeightKg) {
    issues.push({
      field: "goalWeightKg",
      message: "For fat loss, goal weight should be lower than current weight.",
      severity: "warning",
    });
  }

  if (profile.goal === "muscle-gain" && profile.goalWeightKg <= profile.currentWeightKg) {
    issues.push({
      field: "goalWeightKg",
      message: "For muscle gain, a higher goal weight usually matches the selected goal.",
      severity: "warning",
    });
  }

  if (profile.medicalConsiderations.includes("other") && !profile.otherMedicalConsideration?.trim()) {
    issues.push({
      field: "otherMedicalConsideration",
      message: "Add a short note for the selected medical consideration.",
      severity: "warning",
    });
  }

  return issues;
}

export function issuesByField(issues: ValidationIssue[]) {
  return issues.reduce<Partial<Record<keyof UserProfile, ValidationIssue[]>>>((grouped, issue) => {
    grouped[issue.field] = [...(grouped[issue.field] ?? []), issue];
    return grouped;
  }, {});
}
