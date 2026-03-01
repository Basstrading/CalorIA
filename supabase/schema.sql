-- ================================================
-- CalorIA — Database Schema
-- ================================================

-- Table profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sex TEXT NOT NULL CHECK (sex IN ('M', 'F')),
  age INTEGER NOT NULL CHECK (age > 0 AND age < 120),
  weight REAL NOT NULL CHECK (weight > 20 AND weight < 300),
  height REAL NOT NULL CHECK (height > 100 AND height < 250),
  activity_profile TEXT NOT NULL CHECK (activity_profile IN ('sportif', 'peu_sportif')),
  goal TEXT NOT NULL DEFAULT 'maintain' CHECK (goal IN ('lose_weight', 'gain_muscle', 'maintain')),
  bmr REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table daily_plans
CREATE TABLE daily_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activities JSONB NOT NULL DEFAULT '{}',
  tdee REAL NOT NULL,
  calorie_budget REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Table meals
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES daily_plans(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'collation_am', 'lunch', 'collation_pm', 'dinner')),
  food_name TEXT NOT NULL,
  calories REAL NOT NULL,
  proteins REAL DEFAULT 0,
  carbs REAL DEFAULT 0,
  fats REAL DEFAULT 0,
  quantity_grams REAL NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_daily_plans_user_date ON daily_plans(user_id, date);
CREATE INDEX idx_meals_plan ON meals(plan_id);
CREATE INDEX idx_meals_user ON meals(user_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "plans_self" ON daily_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meals_self" ON meals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
