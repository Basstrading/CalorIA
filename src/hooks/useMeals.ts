import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Meal } from '../types';

type MealInput = Omit<Meal, 'id' | 'user_id' | 'created_at'>;

export function useMeals(user: User | null, planId: string | null) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const getTodayMeals = useCallback(async () => {
    if (!user || !planId) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMeals(data as Meal[]);
    }
    setLoading(false);
  }, [user, planId]);

  useEffect(() => {
    getTodayMeals();
  }, [getTodayMeals]);

  const addMeal = useCallback(async (data: MealInput) => {
    if (!user) return false;
    const { error } = await supabase
      .from('meals')
      .insert({ ...data, user_id: user.id });

    if (!error) {
      await getTodayMeals();
      return true;
    }
    return false;
  }, [user, getTodayMeals]);

  const deleteMeal = useCallback(async (id: string) => {
    if (!user) return false;
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id);

    if (!error) {
      await getTodayMeals();
      return true;
    }
    return false;
  }, [user, getTodayMeals]);

  const totalCaloriesToday = useMemo(
    () => meals.reduce((sum, m) => sum + m.calories, 0),
    [meals],
  );

  return { meals, loading, totalCaloriesToday, addMeal, deleteMeal };
}
