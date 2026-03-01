import { useState } from 'react';

export type FabAction = 'scan' | 'manual' | 'ideas';

interface FloatingActionButtonProps {
  onAction: (action: FabAction) => void;
}

export function FloatingActionButton({ onAction }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: FabAction) => {
    setOpen(false);
    onAction(action);
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-up menu */}
      <div
        className={`fixed bottom-24 right-6 z-50 flex flex-col gap-2 transition-all duration-300 ease-out ${
          open
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={() => handleAction('scan')}
          className="flex items-center gap-3 bg-card border border-border rounded-button px-4 py-3 text-sm font-medium text-text-primary hover:border-accent/40 transition-colors"
        >
          <span className="text-lg">{'\u{1F4F7}'}</span>
          Scanner un plat
        </button>
        <button
          type="button"
          onClick={() => handleAction('manual')}
          className="flex items-center gap-3 bg-card border border-border rounded-button px-4 py-3 text-sm font-medium text-text-primary hover:border-accent/40 transition-colors"
        >
          <span className="text-lg">{'\u{270F}'}</span>
          Ajouter manuellement
        </button>
        <button
          type="button"
          onClick={() => handleAction('ideas')}
          className="flex items-center gap-3 bg-card border border-border rounded-button px-4 py-3 text-sm font-medium text-text-primary hover:border-accent/40 transition-colors"
        >
          <span className="text-lg">{'\u{1F4A1}'}</span>
          Idees de repas
        </button>
      </div>

      {/* FAB button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`fixed bottom-8 right-6 z-50 w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/25 transition-transform duration-200 active:scale-90 ${
          open ? 'rotate-45' : ''
        }`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#0A0A0F" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
