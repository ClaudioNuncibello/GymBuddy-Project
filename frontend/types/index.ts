export interface User {
  id: number;
  username: string;
  is_manager: boolean;
}

export interface Exercise {
  id: number;
  title: string;
  description: string;
  video_url: string;
  default_rest: number;
}

export interface Workout {
  id: number;
  title: string;
  description: string;
}

export interface ExerciseWithWorkload {
  id: number;
  title: string;
  description: string;
  video_url: string;
  sets: number;
  reps: number;
  time_seconds?: number;
  rest_seconds: number;
  notes?: string;
}

export interface WorkoutDetail {
  id: number;
  title: string;
  description: string;
  exercises: ExerciseWithWorkload[];
}

export interface WorkoutSession {
  id: number;
  user_id: number;
  workout_id: number;
  duration_seconds: number;
  created_at: string;
  notes?: string;
  workout_title: string;
}
