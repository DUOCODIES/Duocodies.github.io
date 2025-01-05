import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Note = Database['public']['Tables']['notes']['Row'];
export type Filter = 'all' | 'favorites' | 'trash' | 'tag';

interface NoteState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  filter: Filter;
  searchQuery: string;
  selectedTagId: string | null;
  setFilter: (filter: Filter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTagId: (tagId: string | null) => void;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  permanentlyDelete: (id: string) => Promise<void>;
  getFilteredNotes: () => Note[];
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,
  filter: 'all',
  searchQuery: '',
  selectedTagId: null,

  setFilter: (filter) => set({ filter, searchQuery: '', selectedTagId: null }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTagId: (tagId) => {
    set({ selectedTagId: tagId, filter: tagId ? 'tag' : 'all', searchQuery: '' });
  },

  fetchNotes: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      set({ notes: data || [], loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch notes', loading: false });
    }
  },

  createNote: async (title: string, content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated to create notes');

    const newNote = {
      user_id: user.id,
      title,
      content,
      is_favorite: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from('notes').insert([newNote]);
      if (error) throw error;
      get().fetchNotes();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create note');
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      get().fetchNotes();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update note');
    }
  },

  toggleFavorite: async (id: string) => {
    const note = get().notes.find(n => n.id === id);
    if (!note) return;

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !note.is_favorite, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      get().fetchNotes();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to toggle favorite');
    }
  },

  moveToTrash: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      get().fetchNotes();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to move note to trash');
    }
  },

  restoreFromTrash: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_deleted: false, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      get().fetchNotes();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to restore note');
    }
  },

  permanentlyDelete: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      get().fetchNotes();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete note');
    }
  },

  getFilteredNotes: () => {
    const { notes, filter, searchQuery, selectedTagId } = get();
    
    let filteredNotes = notes;

    // First apply the main filter
    switch (filter) {
      case 'favorites':
        filteredNotes = notes.filter(note => note.is_favorite && !note.is_deleted);
        break;
      case 'trash':
        filteredNotes = notes.filter(note => note.is_deleted);
        break;
      case 'tag':
        // Tag filtering will be handled by the component using the selectedTagId
        filteredNotes = notes.filter(note => !note.is_deleted);
        break;
      default:
        filteredNotes = notes.filter(note => !note.is_deleted);
    }

    // Then apply search if there's a query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query)
      );
    }

    return filteredNotes;
  },
}));