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
  const { profile, loading: profileLoading, hasProfile, createProfile } = useProfile(user);
  const { plan, loading: planLoading, hasPlanToday, createPlan } = useDailyPlan(user);
  const { meals, loading: mealsLoading, totalCaloriesToday, addMeal, deleteMeal } = useMeals(user, plan?.id ?? null);
  const [authPage, setAuthPage] = useState<AuthPage>('login');

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

  // No plan today — daily planner
  if (!hasPlanToday || !plan) {
    return <DailyPlanner profile={profile} onValidate={createPlan} />;
  }

  // Dashboard
  return (
    <DailyDashboard
      profile={profile}
      plan={plan}
      meals={meals}
      totalCaloriesToday={totalCaloriesToday}
      onAddMeal={addMeal}
      onDeleteMeal={deleteMeal}
      onSignOut={signOut}
    />
  );
}

export default App;
