import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { LayoutGrid, List, Star, Trash2, Tag as TagIcon, X, Bookmark, CheckSquare, FileSpreadsheet, FileText } from 'lucide-react';
import { useNoteStore } from '../stores/noteStore';
import { useTagStore } from '../stores/tagStore';
import { NoteCard } from './NoteCard';
import { ConfirmationModal } from './ConfirmationModal';
import type { Database } from '../lib/database.types';
import { ImportBookmarksModal } from './ImportBookmarksModal';

type Note = Database['public']['Tables']['notes']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

const NoteCardWrapper = memo(function NoteCardWrapper({ 
  note, 
  isSelected, 
  onToggleSelect 
}: { 
  note: Note; 
  isSelected: boolean; 
  onToggleSelect: (id: string) => void;
}) {
  return (
    <div className="relative group">
      <div
        className={`absolute top-2 left-2 z-10 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } transition-opacity`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(note.id)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>
      <NoteCard {...note} />
    </div>
  );
});

export function Dashboard() {
  const { notes, getFilteredNotes, fetchNotes, filter, selectedTagId, toggleFavorite, moveToTrash, permanentlyDelete } = useNoteStore();
  const { tags: allTags, getNoteTags, addTagToNote, removeTagFromNote } = useTagStore();
  const [isGridView, setIsGridView] = useState(true);
  const [tagFilteredNotes, setTagFilteredNotes] = useState(notes);
  const [loading, setLoading] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [showBulkTagMenu, setShowBulkTagMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportBookmarks, setShowImportBookmarks] = useState(false);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  const displayedNotes = useMemo(() => 
    filter === 'tag' ? tagFilteredNotes : getFilteredNotes(),
    [filter, tagFilteredNotes, getFilteredNotes]
  );

  const selectedCount = useMemo(() => selectedNotes.size, [selectedNotes]);
  const hasSelectedNotes = selectedCount > 0;
  const allSelected = selectedCount === displayedNotes.length;

  useEffect(() => {
    fetchNotes().catch(console.error);
  }, [fetchNotes]);

  useEffect(() => {
    async function filterNotesByTag() {
      if (filter === 'tag' && selectedTagId) {
        setLoading(true);
        try {
          const allNotes = getFilteredNotes();
          // Fetch all note-tag relationships at once
          const allNoteTags = await Promise.all(allNotes.map(note => getNoteTags(note.id)));
          const filteredNotes = allNotes.filter((note, index) => 
            allNoteTags[index].some(tag => tag.id === selectedTagId)
          );
          
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setShowBulkTagMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleNoteSelection = useCallback((noteId: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  }, []);

  const handleBulkFavorite = useCallback(async () => {
    try {
      await Promise.all(
        Array.from(selectedNotes).map(noteId => toggleFavorite(noteId))
      );
      setSelectedNotes(new Set());
    } catch (error) {
      console.error('Failed to update favorites:', error);
    }
  }, [selectedNotes, toggleFavorite]);

  const handleBulkDelete = useCallback(async () => {
    try {
      if (filter === 'trash') {
        await Promise.all(
          Array.from(selectedNotes).map(noteId => permanentlyDelete(noteId))
        );
      } else {
        await Promise.all(
          Array.from(selectedNotes).map(noteId => moveToTrash(noteId))
        );
      }
      setSelectedNotes(new Set());
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete notes:', error);
    }
  }, [filter, selectedNotes, permanentlyDelete, moveToTrash]);

  const handleBulkAddTag = useCallback(async (tagId: string) => {
    try {
      setLoading(true);
      
      const selectedNotesArray = Array.from(selectedNotes);
      const allNoteTags = await Promise.all(
        selectedNotesArray.map(noteId => getNoteTags(noteId))
      );
      
      const allHaveTag = allNoteTags.every(noteTags => 
        noteTags.some(tag => tag.id === tagId)
      );
      
      await Promise.all(
        selectedNotesArray.map(noteId => 
          allHaveTag ? removeTagFromNote(noteId, tagId) : addTagToNote(noteId, tagId)
        )
      );
      
      setShowBulkTagMenu(false);
      await fetchNotes();
    } catch (error) {
      console.error('Failed to toggle tags:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedNotes, getNoteTags, removeTagFromNote, addTagToNote, fetchNotes]);

  const handleSelectAll = useCallback(() => {
    const currentNotes = displayedNotes;
    setSelectedNotes(prev => 
      prev.size === currentNotes.length ? new Set() : new Set(currentNotes.map(note => note.id))
    );
  }, [displayedNotes]);

  const renderNotes = useMemo(() => (
    <div className={`grid gap-4 ${isGridView ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {displayedNotes.map(note => (
        <NoteCardWrapper
          key={note.id}
          note={note}
          isSelected={selectedNotes.has(note.id)}
          onToggleSelect={toggleNoteSelection}
        />
      ))}
    </div>
  ), [displayedNotes, isGridView, selectedNotes, toggleNoteSelection]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGridView(true)}
            className={`p-2 rounded-lg transition-colors ${
              isGridView ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setIsGridView(false)}
            className={`p-2 rounded-lg transition-colors ${
              !isGridView ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setShowImportBookmarks(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors ml-2"
            title="Import bookmarks"
          >
            <Bookmark size={20} />
          </button>
          <button
            onClick={() => window.open('https://docs.google.com/document/create', '_blank')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Create Google Doc"
          >
            <FileText size={20} />
          </button>
          <button
            onClick={() => window.open('https://docs.google.com/spreadsheets/create', '_blank')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Create Excel Sheet"
          >
            <FileSpreadsheet size={20} />
          </button>
          {displayedNotes.length > 0 && (
            <button
              onClick={handleSelectAll}
              className={`p-2 rounded-lg transition-colors ${
                hasSelectedNotes ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={allSelected ? 'Deselect all' : 'Select all'}
            >
              <CheckSquare size={20} />
            </button>
          )}
        </div>

        {hasSelectedNotes && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedCount} of {displayedNotes.length} selected
            </span>
            <button
              onClick={handleBulkFavorite}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Toggle favorite for selected notes"
            >
              <Star size={20} />
            </button>
            <div className="relative" ref={tagMenuRef}>
              <button
                onClick={() => setShowBulkTagMenu(!showBulkTagMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title="Add tags to selected notes"
              >
                <TagIcon size={20} />
              </button>
              {showBulkTagMenu && (
                <div className="absolute right-0 mt-1 py-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="px-4 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
                    Toggle tags for selected notes
                  </div>
                  {allTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBulkAddTag(tag.id);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      disabled={loading}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1">{tag.name}</span>
                      {loading && (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      )}
                    </button>
                  ))}
                  {allTags.length === 0 && (
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No tags available
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
              title={filter === 'trash' ? 'Delete selected notes permanently' : 'Move selected notes to trash'}
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={() => setSelectedNotes(new Set())}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              title="Clear selection"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : displayedNotes.length === 0 ? (
        <div className="text-center text-gray-500 mt-12">
          <p className="text-lg">No notes found</p>
          <p className="text-sm mt-1">Create a new note to get started</p>
        </div>
      ) : renderNotes}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={filter === 'trash' ? 'Delete Notes Permanently' : 'Move to Trash'}
        message={
          filter === 'trash'
            ? `Are you sure you want to permanently delete ${selectedNotes.size} notes? This action cannot be undone.`
            : `Are you sure you want to move ${selectedNotes.size} notes to trash?`
        }
        confirmText={filter === 'trash' ? 'Delete Forever' : 'Move to Trash'}
        isDanger={filter === 'trash'}
      />

      <ImportBookmarksModal
        isOpen={showImportBookmarks}
        onClose={() => setShowImportBookmarks(false)}
      />
    </div>
  );
}