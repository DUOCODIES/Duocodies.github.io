import React, { useState, useCallback, useEffect } from 'react';
import { Search, Command, X, Plus, Settings, Trash2, Menu, Star, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useNoteStore } from '../stores/noteStore';
import { useTagStore } from '../stores/tagStore';
import { NewNoteModal } from './NewNoteModal';
import { TagModal } from './TagModal';
import { ConfirmationModal } from './ConfirmationModal';
import type { Database } from '../lib/database.types';
type Tag = Database['public']['Tables']['tags']['Row'];

type Filter = 'all' | 'favorites' | 'trash' | 'tag';

export function Sidebar() {
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string } | null>(null);
  const { user, signOut } = useAuthStore();
  const { notes, filter, searchQuery, selectedTagId, setFilter, setSearchQuery, setSelectedTagId } = useNoteStore();
  const { tags, fetchTags, deleteTag } = useTagStore();
  const [showTagModal, setShowTagModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  // Fetch tags on mount
  useEffect(() => {
    fetchTags().catch(console.error);
  }, [fetchTags]);

  // Count calculations
  const activeNotesCount = notes.filter(note => !note.is_deleted).length;
  const favoriteNotesCount = notes.filter(note => note.is_favorite && !note.is_deleted).length;
  const trashedNotesCount = notes.filter(note => note.is_deleted).length;

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const handleConfirmSignOut = () => {
    signOut().catch(console.error);
  };

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, [setSearchQuery]);

  const handleFilterClick = (newFilter: Filter) => {
    setFilter(newFilter);
    setSelectedTagId(null); // Clear tag filter when changing main filter
  };

  const handleTagClick = (tagId: string) => {
    if (filter === 'tag' && selectedTagId === tagId) {
      // If clicking the same tag again, clear the filter
      setFilter('all');
      setSelectedTagId(null);
    } else {
      // Set to tag filter and select the tag
      setFilter('tag');
      setSelectedTagId(tagId);
    }
  };

  const handleEditTag = (tag: typeof tags[0]) => {
    setEditingTag({
      id: tag.id,
      name: tag.name,
      color: tag.color,
    });
    setIsTagModalOpen(true);
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      if (selectedTagId === tagId) {
        setFilter('all');
        setSelectedTagId(null);
      }
      // Note: Tag deletion is handled by the TagModal component
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, tag: Tag) => {
    e.stopPropagation();
    setTagToDelete(tag);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (tagToDelete) {
      try {
        await deleteTag(tagToDelete.id);
        setShowDeleteConfirm(false);
        setTagToDelete(null);
      } catch (error) {
        console.error('Error deleting tag:', error);
      }
    }
  };

  const getFilterClass = (filterType: Filter) => {
    const baseClass = "flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors";
    return filter === filterType ? `${baseClass} bg-gray-200` : baseClass;
  };

  return (
    <>
      <aside className="w-64 h-screen bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4">          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search notes..."
              className="w-full pl-10 pr-24 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-3 top-2 flex items-center gap-2">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <div className="flex items-center gap-1 text-gray-400 border-l pl-2">
                <Command size={16} />
                <span className="text-sm">K</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsNewNoteModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            New Note
          </button>

          <nav className="mt-6 space-y-1">
            <button
              onClick={() => handleFilterClick('all')}
              className={getFilterClass('all')}
            >
              <Menu size={18} />
              All Notes
              <span className="ml-auto text-sm text-gray-500">{activeNotesCount}</span>
            </button>
            <button
              onClick={() => handleFilterClick('favorites')}
              className={getFilterClass('favorites')}
            >
              <Star size={18} />
              Favorites
              <span className="ml-auto text-sm text-gray-500">{favoriteNotesCount}</span>
            </button>
            <button
              onClick={() => handleFilterClick('trash')}
              className={getFilterClass('trash')}
            >
              <Trash2 size={18} />
              Trash
              <span className="ml-auto text-sm text-gray-500">{trashedNotesCount}</span>
            </button>
          </nav>

          <div className="mt-8">
            <div className="flex items-center justify-between px-4 mb-2">
              <h2 className="text-sm font-semibold text-gray-600">Tags</h2>
              <button
                onClick={() => {
                  setEditingTag(null);
                  setIsTagModalOpen(true);
                }}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                title="Add new tag"
              >
                <Plus size={16} className="text-gray-600" />
              </button>
            </div>
            <div className="space-y-1">
              {tags.map(tag => (
                <div
                  key={tag.id}
                  className={`group flex items-center px-4 py-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer ${
                    filter === 'tag' && tag.id === selectedTagId ? 'bg-gray-200' : ''
                  }`}
                  onClick={() => handleTagClick(tag.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm text-gray-700 flex-1">{tag.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTag(tag);
                      }}
                      className="p-1 hover:bg-gray-300 rounded-lg transition-colors"
                      title="Edit tag"
                    >
                      <Settings size={14} className="text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(e, tag);
                      }}
                      className="p-1 hover:bg-gray-300 rounded-lg transition-colors"
                      title="Delete tag"
                    >
                      <Trash2 size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>

        <NewNoteModal 
          isOpen={isNewNoteModalOpen}
          onClose={() => setIsNewNoteModalOpen(false)}
        />
      </aside>

      <ConfirmationModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleConfirmSignOut}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
      />

      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => {
          setIsTagModalOpen(false);
          setEditingTag(null);
        }}
        editTag={editingTag || undefined}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTagToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${tagToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Tag"
        isDanger={true}
      />
    </>
  );
}