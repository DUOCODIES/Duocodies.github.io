import React, { useEffect } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useNoteStore } from '../stores/noteStore';
import { useTagStore } from '../stores/tagStore';
import { NoteCard } from './NoteCard';

export function Dashboard() {
  const { notes, getFilteredNotes, fetchNotes, filter, selectedTagId } = useNoteStore();
  const { getNoteTags } = useTagStore();
  const [isGridView, setIsGridView] = React.useState(true);
  const [tagFilteredNotes, setTagFilteredNotes] = React.useState(notes);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    fetchNotes().catch(console.error);
  }, [fetchNotes]);

  useEffect(() => {
    async function filterNotesByTag() {
      if (filter === 'tag' && selectedTagId) {
        setLoading(true);
        try {
          const filteredNotes = [];
          const allNotes = getFilteredNotes();
          
          for (const note of allNotes) {
            const noteTags = await getNoteTags(note.id);
            if (noteTags.some(tag => tag.id === selectedTagId)) {
              filteredNotes.push(note);
            }
          }
          
          setTagFilteredNotes(filteredNotes);
        } catch (error) {
          console.error('Failed to filter notes by tag:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setTagFilteredNotes(getFilteredNotes());
      }
    }

    filterNotesByTag();
  }, [filter, selectedTagId, getFilteredNotes, getNoteTags, notes]);

  const displayedNotes = tagFilteredNotes;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            {filter === 'favorites' && 'Favorite Notes'}
            {filter === 'trash' && 'Trash'}
            {filter === 'tag' && 'Tagged Notes'}
            {filter === 'all' && 'All Notes'}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-2 rounded-lg transition-colors ${
                isGridView ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Grid view"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-2 rounded-lg transition-colors ${
                !isGridView ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List view"
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {displayedNotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No notes found</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${isGridView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {displayedNotes.map(note => (
              <NoteCard key={note.id} {...note} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}