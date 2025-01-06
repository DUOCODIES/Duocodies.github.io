import React, { useState } from 'react';
import { Star, Trash2, RotateCcw, Tag as TagIcon, Pencil, ExternalLink } from 'lucide-react';
import { useNoteStore } from '../stores/noteStore';
import { useTagStore } from '../stores/tagStore';
import { ConfirmationModal } from './ConfirmationModal';
import { EditNoteModal } from './EditNoteModal';
import type { Database } from '../lib/database.types';

type Note = Database['public']['Tables']['notes']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

interface NoteCardProps extends Note {
  onEdit?: (note: Note) => void;
}

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;

function renderContentWithLinks(content: string | null) {
  if (!content) return null;

  const parts = content.split(URL_REGEX);
  return parts.map((part, index) => {
    if (part.match(URL_REGEX)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 group"
        >
          {part}
          <ExternalLink size={14} className="inline opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      );
    }
    return part;
  });
}

export function NoteCard({ id, title, content, is_favorite, is_deleted, created_at, updated_at, user_id }: NoteCardProps) {
  const { toggleFavorite, moveToTrash, restoreFromTrash, permanentlyDelete } = useNoteStore();
  const { tags: allTags, getNoteTags, addTagToNote, removeTagFromNote } = useTagStore();
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getNoteTags(id);
        setNoteTags(tags);
      } catch (error) {
        console.error('Error fetching note tags:', error);
      }
    };
    fetchTags();
  }, [id, getNoteTags]);

  const handleTagClick = async (tagId: string) => {
    setIsLoading(true);
    try {
      const hasTag = noteTags.some(tag => tag.id === tagId);
      if (hasTag) {
        await removeTagFromNote(id, tagId);
      } else {
        await addTagToNote(id, tagId);
      }
      const updatedTags = await getNoteTags(id);
      setNoteTags(updatedTags);
    } catch (error) {
      console.error('Error updating note tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (is_deleted) {
      await permanentlyDelete(id);
    } else {
      await moveToTrash(id);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`relative group bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md ${
        is_deleted ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900 line-clamp-2">{title}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEditModal(true);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition-colors"
            title="Edit note"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(id);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              is_favorite
                ? 'text-yellow-500 hover:bg-yellow-50'
                : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100'
            }`}
          >
            <Star size={18} fill={is_favorite ? 'currentColor' : 'none'} />
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTagMenu(!showTagMenu);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition-colors"
            >
              <TagIcon size={18} />
            </button>
            {showTagMenu && (
              <div className="absolute right-0 mt-1 py-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="px-4 py-1.5 text-xs font-medium text-gray-500 border-b border-gray-100">
                  Add or remove tags
                </div>
                {allTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagClick(tag.id);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1">{tag.name}</span>
                    {noteTags.some(t => t.id === tag.id) && (
                      <span className="text-blue-500">✓</span>
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
            onClick={(e) => {
              e.stopPropagation();
              if (is_deleted) {
                restoreFromTrash(id);
              } else {
                setShowDeleteConfirm(true);
              }
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              is_deleted
                ? 'text-green-500 hover:bg-green-50'
                : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
            }`}
          >
            {is_deleted ? <RotateCcw size={18} /> : <Trash2 size={18} />}
          </button>
        </div>
      </div>

      <div className="text-gray-600 text-sm line-clamp-3 whitespace-pre-wrap mb-2">
        {renderContentWithLinks(content)}
      </div>

      {noteTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {noteTags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={is_deleted ? 'Delete Note Permanently' : 'Move to Trash'}
        message={
          is_deleted
            ? 'Are you sure you want to permanently delete this note? This action cannot be undone.'
            : 'Are you sure you want to move this note to trash?'
        }
        confirmText={is_deleted ? 'Delete Forever' : 'Move to Trash'}
        isDanger={is_deleted}
      />

      <EditNoteModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        note={{
          id,
          title,
          content,
          is_favorite,
          is_deleted,
          created_at,
          updated_at,
          user_id
        }}
      />
    </div>
  );
}