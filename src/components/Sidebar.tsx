import React, { useState } from 'react';
import { Menu, Plus, Search } from 'lucide-react';
import { NewNoteModal } from './NewNoteModal';

export function Sidebar() {
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);

  return (
    <div className="w-64 h-screen bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Duo</h1>
        <button className="p-2 hover:bg-gray-200 rounded-lg">
          <Menu size={20} />
        </button>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search notes..."
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button 
        onClick={() => setIsNewNoteModalOpen(true)}
        className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={20} />
        New Note
      </button>

      <nav className="mt-6 space-y-2">
        <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">All Notes</a>
        <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Favorites</a>
        <a href="#" className="block px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Trash</a>
      </nav>

      <NewNoteModal 
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
      />
    </div>
  );
}