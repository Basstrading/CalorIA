import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { ActivitySet, DailyPlan } from '../types';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function useDailyPlan(user: User | null) {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const hasPlanToday = plan !== null;

  const getTodayPlan = useCallback(async () => {
    if (!user) {
      setPlan(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayISO())
      .single();

    if (!error && data) {
      setPlan(data as DailyPlan);
    } else {
      setPlan(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    getTodayPlan();
  }, [getTodayPlan]);

  const createPlan = useCallback(async (
    activities: ActivitySet,
    tdee: number,
    calorie_budget: number,
  ) => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('daily_plans')
      .insert({
        user_id: user.id,
        date: todayISO(),
        activities,
        tdee,
        calorie_budget,
      })
      .select()
      .single();

    if (!error && data) {
      setPlan(data as DailyPlan);
      return true;
    }
    return false;
  }, [user]);

  return { plan, loading, hasPlanToday, createPlan, getTodayPlan };
}
