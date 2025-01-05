import { useEffect } from 'react';
import { useNoteStore } from '../stores/noteStore';

export function useKeyboardShortcuts() {
  const { setSearchQuery } = useNoteStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if not in an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Command/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[type="text"][placeholder*="Search"]');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape to clear search
      if (e.key === 'Escape') {
        setSearchQuery('');
        document.activeElement instanceof HTMLElement && document.activeElement.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setSearchQuery]);
} 