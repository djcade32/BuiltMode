import { ExerciseMetricType, ExerciseType } from "@/packages/shared/src";

type Exercise = {
  name: string;
  type: ExerciseType;
  metricType: ExerciseMetricType;
};

export const EXERCISES: Exercise[] = [
  // Strength - Upper
  { name: "Bench Press", type: "strength", metricType: "weight_reps" },
  { name: "Incline Dumbbell Press", type: "strength", metricType: "weight_reps" },
  { name: "Push Ups", type: "strength", metricType: "reps_only" },
  { name: "Pull Ups", type: "strength", metricType: "reps_only" },
  { name: "Lat Pulldown", type: "strength", metricType: "weight_reps" },
  { name: "Barbell Row", type: "strength", metricType: "weight_reps" },
  { name: "Seated Cable Row", type: "strength", metricType: "weight_reps" },
  { name: "Overhead Shoulder Press", type: "strength", metricType: "weight_reps" },
  { name: "Lateral Raises", type: "strength", metricType: "weight_reps" },
  { name: "Face Pulls", type: "strength", metricType: "weight_reps" },

  // Strength - Arms
  { name: "Barbell Bicep Curl", type: "strength", metricType: "weight_reps" },
  { name: "Dumbbell Hammer Curl", type: "strength", metricType: "weight_reps" },
  { name: "Tricep Pushdown", type: "strength", metricType: "weight_reps" },
  { name: "Skull Crushers", type: "strength", metricType: "weight_reps" },
  { name: "Dips", type: "strength", metricType: "reps_only" },

  // Strength - Lower
  { name: "Back Squat", type: "strength", metricType: "weight_reps" },
  { name: "Front Squat", type: "strength", metricType: "weight_reps" },
  { name: "Leg Press", type: "strength", metricType: "weight_reps" },
  { name: "Romanian Deadlift", type: "strength", metricType: "weight_reps" },
  { name: "Deadlift", type: "strength", metricType: "weight_reps" },
  { name: "Walking Lunges", type: "strength", metricType: "weight_reps" },
  { name: "Leg Curl", type: "strength", metricType: "weight_reps" },
  { name: "Leg Extension", type: "strength", metricType: "weight_reps" },
  { name: "Calf Raises", type: "strength", metricType: "weight_reps" },

  // Conditioning
  { name: "Burpees", type: "conditioning", metricType: "reps_only" },
  { name: "Box Jumps", type: "conditioning", metricType: "reps_only" },
  { name: "Kettlebell Swings", type: "conditioning", metricType: "weight_reps" },
  { name: "Battle Ropes", type: "conditioning", metricType: "duration" },
  { name: "Sled Push", type: "conditioning", metricType: "distance" },
  { name: "Sled Pull", type: "conditioning", metricType: "distance" },
  { name: "Jump Squats", type: "conditioning", metricType: "reps_only" },
  { name: "Mountain Climbers", type: "conditioning", metricType: "reps_only" },
  { name: "Medicine Ball Slams", type: "conditioning", metricType: "reps_only" },
  { name: "Farmer’s Carry", type: "conditioning", metricType: "distance" },

  // Cardio
  { name: "Running (Treadmill)", type: "cardio", metricType: "distance" },
  { name: "Outdoor Running", type: "cardio", metricType: "distance" },
  { name: "Walking (Treadmill)", type: "cardio", metricType: "distance" },
  { name: "Outdoor Walking", type: "cardio", metricType: "distance" },
  { name: "Cycling", type: "cardio", metricType: "distance" },
  { name: "Stationary Bike", type: "cardio", metricType: "distance" },
  { name: "Rowing Machine", type: "cardio", metricType: "duration" },
  { name: "Stair Climber", type: "cardio", metricType: "duration" },
  { name: "Elliptical", type: "cardio", metricType: "duration" },
  { name: "Jump Rope", type: "cardio", metricType: "duration" },
  { name: "Swimming", type: "cardio", metricType: "distance" },
  { name: "Hiking", type: "cardio", metricType: "distance" },
];

export const EXERCISES_GROUPED: Record<string, Exercise[]> = {
  strength: EXERCISES.filter((e) => e.type === "strength"),
  conditioning: EXERCISES.filter((e) => e.type === "conditioning"),
  cardio: EXERCISES.filter((e) => e.type === "cardio"),
};
