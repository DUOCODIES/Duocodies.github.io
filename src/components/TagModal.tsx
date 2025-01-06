import React, { useState } from 'react';
import { Modal } from './Modal';
import { useTagStore } from '../stores/tagStore';

const COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#84CC16', // lime
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
];

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTag?: {
    id: string;
    name: string;
    color: string;
  };
}

export function TagModal({ isOpen, onClose, editTag }: TagModalProps) {
  const { createTag, updateTag } = useTagStore();
  const [name, setName] = useState(editTag?.name || '');
  const [color, setColor] = useState(editTag?.color || COLORS[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!name.trim()) {
      setError('Tag name is required');
      setIsLoading(false);
      return;
    }

    try {
      if (editTag) {
        await updateTag(editTag.id, { name: name.trim(), color });
      } else {
        await createTag({ name: name.trim(), color });
      }
      onClose();
      setName('');
      setColor(COLORS[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tag');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTag ? 'Edit Tag' : 'Create New Tag'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-1">
            Tag Name
          </label>
          <input
            type="text"
            id="tagName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter tag name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full ${
                  color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                }`}
                style={{ backgroundColor: c }}
                title={`Select ${c} color`}
              />
            ))}
          </div>
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
            {isLoading ? 'Saving...' : editTag ? 'Save Changes' : 'Create Tag'}
          </button>
        </div>
      </form>
    </Modal>
  );
} 