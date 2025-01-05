import React, { useState, useCallback } from 'react';
import { Menu, Plus, Search, Star, Trash2, LogOut, User, Command } from 'lucide-react';
import { NewNoteModal } from './NewNoteModal';
import { useAuthStore } from '../stores/authStore';
import { useNoteStore } from '../stores/noteStore';
import type { Filter } from '../stores/noteStore';

export function Sidebar() {
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const { user, signOut } = useAuthStore();
  const { notes, filter, searchQuery, setFilter, setSearchQuery } = useNoteStore();

  const favoriteNotesCount = notes.filter(note => note.is_favorite).length;

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      signOut().catch(console.error);
    }
  };

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);

  const handleFilterClick = (newFilter: Filter) => {
    setFilter(newFilter);
    setSearchQuery(''); // Clear search when changing filters
  };

  const getFilterClass = (filterType: Filter) => {
    const baseClass = "flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors";
    return filter === filterType ? `${baseClass} bg-gray-200` : baseClass;
  };

  return (
    <aside className="w-64 h-screen bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Duo</h1>
          <button
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Toggle menu"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search notes..."
            className="w-full pl-10 pr-16 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-2 flex items-center gap-1 text-gray-400">
            <Command size={16} />
            <span className="text-sm">K</span>
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
            <span className="ml-auto text-sm text-gray-500">{notes.length}</span>
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
          </button>
        </nav>
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
  );
}