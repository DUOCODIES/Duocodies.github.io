import React, { useEffect, useState, useRef } from 'react';
import { Star, MoreVertical, Trash2, Pencil, RotateCcw, ExternalLink, Tag as TagIcon } from 'lucide-react';
import { useNoteStore } from '../stores/noteStore';
import { useTagStore } from '../stores/tagStore';
import type { Database } from '../lib/database.types';
import { EditNoteModal } from './EditNoteModal';
import { ConfirmationModal } from './ConfirmationModal';

type Note = Database['public']['Tables']['notes']['Row'];
type Tag = Database['public']['Tables']['tags']['Row'];

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

export function NoteCard({ id, title, content, updated_at, is_favorite, is_deleted }: Note) {
  const { toggleFavorite, moveToTrash, restoreFromTrash, permanentlyDelete } = useNoteStore();
  const { tags: allTags, getNoteTags, addTagToNote, removeTagFromNote } = useTagStore();
  const [showMenu, setShowMenu] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showTagMenu, setShowTagMenu] = React.useState(false);
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const tagMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNoteTags(id)
      .then(setNoteTags)
      .catch(console.error);
  }, [id, getNoteTags]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (tagMenuRef.current && !tagMenuRef.current.contains(event.target as Node)) {
        setShowTagMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(id).catch(console.error);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
    setShowMenu(false);
  };

  const handleConfirmDelete = () => {
    if (is_deleted) {
      permanentlyDelete(id).catch(console.error);
    } else {
      moveToTrash(id).catch(console.error);
    }
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    restoreFromTrash(id).catch(console.error);
    setShowMenu(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTagMenu(!showTagMenu);
    setShowMenu(false); // Close other menu if open
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
    setShowTagMenu(false); // Close other menu if open
  };

  const toggleTag = async (tagId: string) => {
    try {
      const hasTag = noteTags.some(tag => tag.id === tagId);
      if (hasTag) {
        await removeTagFromNote(id, tagId);
        setNoteTags(noteTags.filter(tag => tag.id !== tagId));
      } else {
        await addTagToNote(id, tagId);
        const newTag = allTags.find(tag => tag.id === tagId);
        if (newTag) {
          setNoteTags([...noteTags, newTag]);
        }
      }
    } catch (error) {
      console.error('Failed to toggle tag:', error);
    }
  };

  const formattedDate = new Date(updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      <div 
        className="group bg-white p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
        onClick={() => {
          setShowMenu(false);
          setShowTagMenu(false);
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{title}</h3>
          <div className="flex gap-2">
            {!is_deleted && (
              <>
                <button
                  onClick={handleToggleFavorite}
                  className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${
                    is_favorite ? 'text-yellow-500' : 'text-gray-400 opacity-0 group-hover:opacity-100'
                  }`}
                  title={is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={18} />
                </button>
                <div className="relative" ref={tagMenuRef}>
                  <button
                    onClick={handleTagClick}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Manage tags"
                  >
                    <TagIcon size={18} />
                  </button>
                  {showTagMenu && (
                    <div className="absolute right-0 mt-1 py-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                      {allTags.map(tag => (
                        <button
                          key={tag.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTag(tag.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="flex-1">{tag.name}</span>
                          {noteTags.some(t => t.id === tag.id) && (
                            <div className="w-4 h-4 rounded-full bg-blue-500" />
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
              </>
            )}
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMoreClick}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="More options"
              >
                <MoreVertical size={18} />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 py-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  {is_deleted ? (
                    <>
                      <button
                        onClick={handleRestore}
                        className="w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                      >
                        <RotateCcw size={16} />
                        Restore note
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete permanently
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEdit}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Pencil size={16} />
                        Edit note
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Move to trash
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        {noteTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {noteTags.map(tag => (
              <div
                key={tag.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
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
        <p className="text-gray-600 mb-4 line-clamp-3 whitespace-pre-wrap">
          {renderContentWithLinks(content)}
        </p>
        <time className="text-sm text-gray-400">{formattedDate}</time>
      </div>

      <EditNoteModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        note={{ id, title, content, updated_at, is_favorite, is_deleted, user_id: '', created_at: '' }}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={is_deleted ? 'Delete Permanently' : 'Move to Trash'}
        message={
          is_deleted
            ? 'Are you sure you want to permanently delete this note? This action cannot be undone.'
            : 'Are you sure you want to move this note to trash?'
        }
        confirmText={is_deleted ? 'Delete Forever' : 'Move to Trash'}
        isDanger={is_deleted}
      />
    </>
  );
}