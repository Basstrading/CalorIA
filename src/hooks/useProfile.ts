import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { calculateBMR } from '../lib/calories';
import type { UserProfile } from '../types';

export type ProfileInput = Omit<UserProfile, 'id' | 'bmr' | 'created_at'>;

export function useProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const hasProfile = profile !== null;

  const getProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  const createProfile = useCallback(async (data: ProfileInput) => {
    if (!user) return false;
    const bmr = calculateBMR(data.sex, data.weight, data.height, data.age);
    const { error } = await supabase
      .from('profiles')
      .insert({ ...data, id: user.id, bmr });

    if (!error) {
      await getProfile();
      return true;
    }
    return false;
  }, [user, getProfile]);

  const updateProfile = useCallback(async (data: Partial<ProfileInput>) => {
    if (!user || !profile) return false;
    const merged = { ...profile, ...data };
    const bmr = calculateBMR(merged.sex, merged.weight, merged.height, merged.age);
    const { error } = await supabase
      .from('profiles')
      .update({ ...data, bmr })
      .eq('id', user.id);

    if (!error) {
      await getProfile();
      return true;
    }
    return false;
  }, [user, profile, getProfile]);

  return { profile, loading, hasProfile, createProfile, updateProfile };
}
