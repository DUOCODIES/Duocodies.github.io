import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useNoteStore } from '../stores/noteStore';
import { useTagStore } from '../stores/tagStore';
import { Star, Tag as TagIcon } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Note = Database['public']['Tables']['notes']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note;
}

export function EditNoteModal({ isOpen, onClose, note }: EditNoteModalProps) {
  const { updateNote, toggleFavorite } = useNoteStore();
  const { tags: allTags, getNoteTags, addTagToNote, removeTagFromNote } = useTagStore();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content || '');
  const [isFavorite, setIsFavorite] = useState(note.is_favorite);
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content || '');
    setIsFavorite(note.is_favorite);
  }, [note]);

  // Fetch tags when modal opens
  useEffect(() => {
    if (isOpen) {
      getNoteTags(note.id)
        .then(setNoteTags)
        .catch(console.error);
    }
  }, [isOpen, note.id, getNoteTags]);

  const handleFavoriteClick = async () => {
    try {
      await toggleFavorite(note.id);
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!title.trim()) {
        throw new Error('Title is required');
      }

      await updateNote(note.id, title.trim(), content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = async (tagId: string) => {
    try {
      const hasTag = noteTags.some(tag => tag.id === tagId);
      if (hasTag) {
        await removeTagFromNote(note.id, tagId);
      } else {
        await addTagToNote(note.id, tagId);
      }
      const updatedTags = await getNoteTags(note.id);
      setNoteTags(updatedTags);
    } catch (error) {
      console.error('Error updating note tags:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter note title"
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                isFavorite ? 'text-yellow-500' : 'text-gray-400'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star size={20} />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTagMenu(!showTagMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                title="Manage tags"
              >
                <TagIcon size={20} />
              </button>
              {showTagMenu && (
                <div className="absolute right-0 mt-1 py-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="px-4 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
                    Select tags
                  </div>
                  {allTags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <div className="flex items-center justify-center w-4 h-4 border border-gray-300 rounded">
                        {noteTags.some(t => t.id === tag.id) && (
                          <div className="w-2 h-2 rounded-sm bg-blue-500" />
                        )}
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1">{tag.name}</span>
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
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Enter note content"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
} 