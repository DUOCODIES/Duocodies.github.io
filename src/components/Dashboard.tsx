import React, { useEffect } from 'react';
import { Grid, List } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { useNoteStore } from '../stores/noteStore';

export function Dashboard() {
  const [isGridView, setIsGridView] = React.useState(true);
  const { notes, loading, fetchNotes } = useNoteStore();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">All Notes</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsGridView(true)}
            className={`p-2 rounded-lg ${isGridView ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setIsGridView(false)}
            className={`p-2 rounded-lg ${!isGridView ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      <div className={`grid gap-4 ${isGridView ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {notes.map((note) => (
          <NoteCard key={note.id} {...note} />
        ))}
      </div>
    </div>
  );
}