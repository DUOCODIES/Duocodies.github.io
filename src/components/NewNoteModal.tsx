import React, { useState } from 'react';
import { Modal } from './Modal';
import { useNoteStore } from '../stores/noteStore';
import { useTagStore } from '../stores/tagStore';
import { Star, Tag as TagIcon } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Tag = Database['public']['Tables']['tags']['Row'];

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewNoteModal({ isOpen, onClose }: NewNoteModalProps) {
  const { createNote } = useNoteStore();
  const { tags: allTags } = useTagStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      const note = await createNote(title.trim(), content.trim());
      if (isFavorite) {
        await useNoteStore.getState().toggleFavorite(note.id);
      }
      // Add tags to the newly created note
      if (selectedTags.length > 0) {
        await Promise.all(
          selectedTags.map(tag => useTagStore.getState().addTagToNote(note.id, tag.id))
        );
      }
      onClose();
      setTitle('');
      setContent('');
      setSelectedTags([]);
      setIsFavorite(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    }
  };

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev => {
      const hasTag = prev.some(t => t.id === tag.id);
      if (hasTag) {
        return prev.filter(t => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Note">
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
              onClick={() => setIsFavorite(!isFavorite)}
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
                      onClick={() => toggleTag(tag)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <div className="flex items-center justify-center w-4 h-4 border border-gray-300 rounded">
                        {selectedTags.some(t => t.id === tag.id) && (
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

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedTags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </div>
            ))}
          </div>
        )}

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none whitespace-pre-wrap"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Note
          </button>
        </div>
      </form>
    </Modal>
  );
}