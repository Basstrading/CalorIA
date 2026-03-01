import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface RegisterProps {
  onRegister: (email: string, password: string) => Promise<boolean>;
  onNavigateLogin: () => void;
  error: string | null;
}

export function Register({ onRegister, onNavigateLogin, error }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password.length < 6) {
      setLocalError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (password !== confirm) {
      setLocalError('Les mots de passe ne correspondent pas');
      return;
    }

    setSubmitting(true);
    await onRegister(email, password);
    setSubmitting(false);
  };

  const displayError = localError || error;

  return (
    <div className="max-w-md mx-auto min-h-screen min-h-dvh flex flex-col justify-center p-6">
      <div className="flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Calor<span className="text-accent">IA</span>
          </h1>
          <p className="text-text-secondary text-sm">
            Créez votre compte
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
            autoComplete="new-password"
          />
          <Input
            id="confirm"
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />

          {displayError && (
            <p className="text-danger text-sm text-center">{displayError}</p>
          )}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full mt-2">
            {submitting ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Déjà un compte ?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="text-accent font-medium hover:underline"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
