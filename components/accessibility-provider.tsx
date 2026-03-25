// components/accessibility-provider.tsx - Accessibility features
'use client';

import { useEffect } from 'react';

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add keyboard navigation support
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip to main content on Alt+M
      if ((e.altKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        const main = document.querySelector('main');
        if (main) {
          main.focus();
          main.scrollIntoView();
        }
      }

      // Close dialogs with Escape
      if (e.key === 'Escape') {
        const dialogs = document.querySelectorAll('[role="dialog"]');
        dialogs.forEach((dialog) => {
          if ((dialog as any).close) {
            (dialog as any).close();
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <>{children}</>;
}

// Add skip link to navigation
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-0 left-0 z-50 bg-black text-white px-4 py-2 rounded"
    >
      Skip to main content
    </a>
  );
}
