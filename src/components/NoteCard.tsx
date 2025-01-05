import React from 'react';
import { Star, MoreVertical, Trash2 } from 'lucide-react';
import { useNoteStore } from '../stores/noteStore';
import type { Database } from '../lib/database.types';

type Note = Database['public']['Tables']['notes']['Row'];

export function NoteCard({ id, title, content, updated_at, is_favorite }: Note) {
  const { toggleFavorite, deleteNote } = useNoteStore();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id).catch(console.error);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNote(id).catch(console.error);
    }
  };

  const formattedDate = new Date(updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="group bg-white p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{title}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${
              is_favorite ? 'text-yellow-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'
            }`}
            title={is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star size={18} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
              title="More options"
            >
              <MoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 py-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete note
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-gray-600 mb-4 line-clamp-3">{content}</p>
      <time className="text-sm text-gray-400">{formattedDate}</time>
    </div>
  );
}