export type Goal = 'lose_weight' | 'gain_muscle' | 'maintain';

export type FoodCategory =
  | 'complete_dish'
  | 'protein'
  | 'starch'
  | 'vegetable'
  | 'dairy'
  | 'fruit'
  | 'snack'
  | 'drink'
  | 'sauce_condiment';

export interface UserProfile {
  id: string;
  sex: 'M' | 'F';
  age: number;
  weight: number;
  height: number;
  activity_profile: 'sportif' | 'peu_sportif';
  goal: Goal;
  bmr: number;
  created_at: string;
}

export interface DailyPlan {
  id: string;
  user_id: string;
  date: string;
  activities: ActivitySet;
  tdee: number;
  calorie_budget: number;
  created_at: string;
}

export interface ActivitySet {
  marche?: number;
  footing?: number;
  musculation?: number;
  sport_collectif?: number;
  travail_physique?: number;
  travail_bureau?: number;
  journee_inactive?: boolean;
}

export interface Meal {
  id: string;
  user_id: string;
  plan_id: string;
  meal_type: 'breakfast' | 'collation_am' | 'lunch' | 'collation_pm' | 'dinner';
  food_name: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  quantity_grams: number;
  photo_url?: string;
  created_at: string;
}

export interface FoodAnalysis {
  food_name: string;
  calories_per_100g: number;
  proteins_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  confidence: 'high' | 'medium' | 'low';
  food_category: FoodCategory;
}

export interface RecipeSuggestion {
  name: string;
  description: string;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  ingredients: string[];
}

export interface FoodDatabaseEntry {
  name: string;
  calories_per_100g: number;
  proteins_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  source: 'ciqual' | 'off';
  barcode?: string;
}

export interface CiqualRawEntry {
  alim_nom_fr: string;
  energie_kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
}
