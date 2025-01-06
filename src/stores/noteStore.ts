import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Note = Database['public']['Tables']['notes']['Row'];

interface NoteStore {
  notes: Note[];
  filter: 'all' | 'favorites' | 'trash' | 'tag';
  selectedTagId: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: 'all' | 'favorites' | 'trash' | 'tag') => void;
  setSelectedTagId: (tagId: string | null) => void;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<Note>;
  updateNote: (id: string, title: string, content: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  permanentlyDelete: (id: string) => Promise<void>;
  getFilteredNotes: () => Note[];
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  filter: 'all',
  selectedTagId: null,
  searchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilter: (filter) => set({ filter }),
  setSelectedTagId: (tagId) => set({ selectedTagId: tagId }),

  fetchNotes: async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ notes: data || [] });
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  },

  createNote: async (title, content) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated to create notes');

      const { data, error } = await supabase
        .from('notes')
        .insert([{
          title,
          content,
          user_id: user.id,
          is_favorite: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      await get().fetchNotes();
      return data;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  },

  updateNote: async (id, title, content) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      await get().fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
    }
  },

  toggleFavorite: async (id) => {
    try {
      const note = get().notes.find(n => n.id === id);
      if (!note) return;

      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !note.is_favorite })
        .eq('id', id);

      if (error) throw error;
      await get().fetchNotes();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  },

  moveToTrash: async (id) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;
      await get().fetchNotes();
    } catch (error) {
      console.error('Error moving note to trash:', error);
    }
  },

  restoreFromTrash: async (id) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_deleted: false })
        .eq('id', id);

      if (error) throw error;
      await get().fetchNotes();
    } catch (error) {
      console.error('Error restoring note from trash:', error);
    }
  },

  permanentlyDelete: async (id) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchNotes();
    } catch (error) {
      console.error('Error deleting note permanently:', error);
    }
  },

  getFilteredNotes: () => {
    const { notes, filter, searchQuery } = get();
    let filteredNotes = notes;

    // Apply filter
    switch (filter) {
      case 'favorites':
        filteredNotes = filteredNotes.filter(note => note.is_favorite);
        break;
      case 'trash':
        filteredNotes = filteredNotes.filter(note => note.is_deleted);
        break;
      case 'all':
      default:
        filteredNotes = filteredNotes.filter(note => !note.is_deleted);
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(
        note =>
          note.title.toLowerCase().includes(query) ||
          (note.content?.toLowerCase() || '').includes(query)
      );
    }

    return filteredNotes;
  },
}));