import React, { useEffect } from 'react';
import { Grid, List, Plus, AlertCircle } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { useNoteStore } from '../stores/noteStore';

function EmptyState() {
  const { createNote } = useNoteStore();

  const handleCreateNote = () => {
    createNote('Untitled Note', '').catch(console.error);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <Plus size={24} className="text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
      <p className="text-gray-500 mb-4">Create your first note to get started</p>
      <button
        onClick={handleCreateNote}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Create Note
      </button>
    </div>
  );
}

function EmptySearch() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <AlertCircle size={24} className="text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No matching notes</h3>
      <p className="text-gray-500">Try adjusting your search or filter</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="bg-red-100 rounded-full p-4 mb-4">
        <AlertCircle size={24} className="text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
      <p className="text-gray-500 mb-4">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Retry
      </button>
    </div>
  );
}

export function Dashboard() {
  const [isGridView, setIsGridView] = React.useState(true);
  const { loading, error, fetchNotes, filter, searchQuery, getFilteredNotes } = useNoteStore();

  useEffect(() => {
    fetchNotes().catch(console.error);
  }, [fetchNotes]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const filteredNotes = getFilteredNotes();
  const hasNotes = useNoteStore.getState().notes.length > 0;

  const getTitle = () => {
    switch (filter) {
      case 'favorites':
        return 'Favorite Notes';
      case 'trash':
        return 'Trash';
      default:
        return searchQuery ? 'Search Results' : 'All Notes';
    }
  };

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{getTitle()}</h2>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-1">
              Showing results for "{searchQuery}"
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsGridView(true)}
            className={`p-2 rounded-lg transition-colors ${
              isGridView ? 'bg-gray-200' : 'hover:bg-gray-200'
            }`}
            title="Grid view"
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setIsGridView(false)}
            className={`p-2 rounded-lg transition-colors ${
              !isGridView ? 'bg-gray-200' : 'hover:bg-gray-200'
            }`}
            title="List view"
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {!hasNotes && !searchQuery ? (
        <EmptyState />
      ) : filteredNotes.length === 0 ? (
        <EmptySearch />
      ) : (
        <div
          className={`grid gap-4 ${
            isGridView
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          }`}
        >
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} {...note} />
          ))}
        </div>
      )}
    </div>
  );
}