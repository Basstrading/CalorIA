import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useDailyPlan } from './hooks/useDailyPlan';
import { useMeals } from './hooks/useMeals';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Onboarding } from './pages/Onboarding';
import { DailyPlanner } from './components/planner/DailyPlanner';
import { DailyDashboard } from './components/dashboard/DailyDashboard';
import { InstallPrompt } from './components/ui/InstallPrompt';

type AuthPage = 'login' | 'register';

function App() {
  const { user, loading: authLoading, error, signUp, signIn, signOut } = useAuth();
  const { profile, loading: profileLoading, hasProfile, createProfile, updateProfile } = useProfile(user);
  const { plan, loading: planLoading, hasPlanToday, createPlan, resetPlan } = useDailyPlan(user);
  const { meals, loading: mealsLoading, totalCaloriesToday, addMeal, deleteMeal } = useMeals(user, plan?.id ?? null);
  const [authPage, setAuthPage] = useState<AuthPage>('login');
  const [editingProfile, setEditingProfile] = useState(false);

  // Loading state
  if (authLoading || (user && (profileLoading || planLoading || (hasPlanToday && mealsLoading)))) {
    return (
      <div className="max-w-md mx-auto min-h-screen min-h-dvh flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <h1 className="text-4xl font-bold tracking-tight">
            Calor<span className="text-accent">IA</span>
          </h1>
          <p className="text-text-secondary text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    if (authPage === 'register') {
      return (
        <>
          <InstallPrompt />
          <Register
            onRegister={signUp}
            onNavigateLogin={() => setAuthPage('login')}
            error={error}
          />
        </>
      );
    }
    return (
      <>
        <InstallPrompt />
        <Login
          onLogin={signIn}
          onNavigateRegister={() => setAuthPage('register')}
          error={error}
        />
      </>
    );
  }

  // No profile — onboarding
  if (!hasProfile || !profile) {
    return <Onboarding onComplete={createProfile} />;
  }

  // Editing profile — onboarding in edit mode
  if (editingProfile) {
    const handleEditComplete = async (data: Parameters<typeof updateProfile>[0]) => {
      const result = await updateProfile(data);
      if (result === true) {
        await resetPlan();
        setEditingProfile(false);
        return true;
      }
      return result; // error message string
    };
    return (
      <Onboarding
        onComplete={handleEditComplete}
        initialData={{
          sex: profile.sex,
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          activity_profile: profile.activity_profile,
          goal: profile.goal,
        }}
      />
    );
  }

  // No plan today — daily planner
  if (!hasPlanToday || !plan) {
    return (
      <DailyPlanner
        profile={profile}
        onValidate={createPlan}
        onEditProfile={() => setEditingProfile(true)}
      />
    );
  }

  // Dashboard
  return (
    <>
    <InstallPrompt />
    <DailyDashboard
      profile={profile}
      plan={plan}
      meals={meals}
      totalCaloriesToday={totalCaloriesToday}
      onAddMeal={addMeal}
      onDeleteMeal={deleteMeal}
      onResetPlan={resetPlan}
      onEditProfile={() => setEditingProfile(true)}
      onSignOut={signOut}
    />
    </>
  );
}

export default App;
