import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as Record<string, unknown>).standalone === true);
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosBanner, setShowIosBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed or previously dismissed this session
    if (isStandalone()) return;

    if (isIos()) {
      // On iOS, show manual instructions after a short delay
      const timer = setTimeout(() => setShowIosBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIosBanner(false);
    setDeferredPrompt(null);
  };

  if (dismissed || isStandalone()) return null;

  // Android install banner
  if (deferredPrompt) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 bg-card border-b border-border p-4 animate-slide-down">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold">Installer CalorIA</p>
            <p className="text-xs text-text-secondary">Ajoute l'app sur ton ecran d'accueil</p>
          </div>
          <button
            type="button"
            onClick={handleInstall}
            className="bg-accent text-dark text-xs font-semibold px-4 py-2 rounded-button active:scale-95 transition-transform"
          >
            Installer
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-text-secondary text-lg leading-none"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>
      </div>
    );
  }

  // iOS install banner
  if (showIosBanner) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border p-4 animate-slide-up">
        <div className="max-w-md mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Installer CalorIA</p>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-text-secondary text-lg leading-none"
              aria-label="Fermer"
            >
              &times;
            </button>
          </div>
          <p className="text-xs text-text-secondary">
            Appuie sur le bouton <span className="inline-block align-middle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent inline">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </span> Partager puis <strong>Sur l'ecran d'accueil</strong>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
