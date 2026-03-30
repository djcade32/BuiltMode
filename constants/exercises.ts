import { ExerciseType } from "@/packages/shared/src";

export const EXERCISES: { name: string; type: ExerciseType }[] = [
  // Strength - Upper
  { name: "Bench Press", type: "strength" },
  { name: "Incline Dumbbell Press", type: "strength" },
  { name: "Push Ups", type: "strength" },
  { name: "Pull Ups", type: "strength" },
  { name: "Lat Pulldown", type: "strength" },
  { name: "Barbell Row", type: "strength" },
  { name: "Seated Cable Row", type: "strength" },
  { name: "Overhead Shoulder Press", type: "strength" },
  { name: "Lateral Raises", type: "strength" },
  { name: "Face Pulls", type: "strength" },

  // Strength - Arms
  { name: "Barbell Bicep Curl", type: "strength" },
  { name: "Dumbbell Hammer Curl", type: "strength" },
  { name: "Tricep Pushdown", type: "strength" },
  { name: "Skull Crushers", type: "strength" },
  { name: "Dips", type: "strength" },

  // Strength - Lower
  { name: "Back Squat", type: "strength" },
  { name: "Front Squat", type: "strength" },
  { name: "Leg Press", type: "strength" },
  { name: "Romanian Deadlift", type: "strength" },
  { name: "Deadlift", type: "strength" },
  { name: "Walking Lunges", type: "strength" },
  { name: "Leg Curl", type: "strength" },
  { name: "Leg Extension", type: "strength" },
  { name: "Calf Raises", type: "strength" },

  // Conditioning
  { name: "Burpees", type: "conditioning" },
  { name: "Box Jumps", type: "conditioning" },
  { name: "Kettlebell Swings", type: "conditioning" },
  { name: "Battle Ropes", type: "conditioning" },
  { name: "Sled Push", type: "conditioning" },
  { name: "Sled Pull", type: "conditioning" },
  { name: "Jump Squats", type: "conditioning" },
  { name: "Mountain Climbers", type: "conditioning" },
  { name: "Medicine Ball Slams", type: "conditioning" },
  { name: "Farmer’s Carry", type: "conditioning" },

  // Cardio
  { name: "Running (Treadmill)", type: "cardio" },
  { name: "Outdoor Running", type: "cardio" },
  { name: "Walking (Treadmill)", type: "cardio" },
  { name: "Outdoor Walking", type: "cardio" },
  { name: "Cycling", type: "cardio" },
  { name: "Stationary Bike", type: "cardio" },
  { name: "Rowing Machine", type: "cardio" },
  { name: "Stair Climber", type: "cardio" },
  { name: "Elliptical", type: "cardio" },
  { name: "Jump Rope", type: "cardio" },
  { name: "Swimming", type: "cardio" },
  { name: "Hiking", type: "cardio" },
];

export const EXERCISES_GROUPED: Record<string, { name: string; type: ExerciseType }[]> = {
  strength: EXERCISES.filter((e) => e.type === "strength"),
  conditioning: EXERCISES.filter((e) => e.type === "conditioning"),
  cardio: EXERCISES.filter((e) => e.type === "cardio"),
};
