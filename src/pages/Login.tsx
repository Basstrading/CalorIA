import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onNavigateRegister: () => void;
  error: string | null;
}

export function Login({ onLogin, onNavigateRegister, error }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onLogin(email, password);
    setSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen min-h-dvh flex flex-col justify-center p-6">
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Calor<span className="text-accent">IA</span>
          </h1>
          <p className="text-text-secondary text-sm">
            Connectez-vous pour continuer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full mt-2">
            {submitting ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Pas encore de compte ?{' '}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="text-accent font-medium hover:underline"
          >
            Créer un compte
          </button>
        </p>
      </div>
    </div>
  );
}
