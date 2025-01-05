import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuthStore } from './authStore';

type Note = Database['public']['Tables']['notes']['Row'];
export type Filter = 'all' | 'favorites' | 'trash';

interface NoteState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  filter: Filter;
  searchQuery: string;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  setError: (error: string | null) => void;
  setFilter: (filter: Filter) => void;
  setSearchQuery: (query: string) => void;
  getFilteredNotes: () => Note[];
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,
  filter: 'all',
  searchQuery: '',

  setError: (error: string | null) => set({ error }),
  setFilter: (filter: Filter) => set({ filter }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),

  getFilteredNotes: () => {
    const { notes, filter, searchQuery } = get();
    
    let filteredNotes = notes;
    
    // Apply filter
    switch (filter) {
      case 'favorites':
        filteredNotes = filteredNotes.filter(note => note.is_favorite);
        break;
      case 'trash':
        // For now, we don't have trash functionality
        filteredNotes = [];
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content?.toLowerCase().includes(query)
      );
    }

    return filteredNotes;
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
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User must be authenticated to create notes');

    const newNote = {
      title,
      content,
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_favorite: false
    };

    // Optimistic update
    set({ notes: [newNote as Note, ...get().notes], error: null });

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([newNote])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update with actual server data
      set({
        notes: get().notes.map(note => 
          note === newNote ? data : note
        )
      });
    } catch (error) {
      // Rollback on error
      set({
        notes: get().notes.filter(note => note !== newNote),
        error: error instanceof Error ? error.message : 'Failed to create note'
      });
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    const originalNote = get().notes.find(note => note.id === id);
    if (!originalNote) return;

    // Optimistic update
    set({
      notes: get().notes.map(note =>
        note.id === id ? { ...note, ...updates, updated_at: new Date().toISOString() } : note
      ),
      error: null
    });

    try {
      const { error } = await supabase
        .from('notes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      // Rollback on error
      set({
        notes: get().notes.map(note =>
          note.id === id ? originalNote : note
        ),
        error: error instanceof Error ? error.message : 'Failed to update note'
      });
    }
  },

  deleteNote: async (id: string) => {
    const noteToDelete = get().notes.find(note => note.id === id);
    if (!noteToDelete) return;

    // Optimistic update
    set({
      notes: get().notes.filter(note => note.id !== id),
      error: null
    });

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      // Rollback on error
      set({
        notes: [...get().notes, noteToDelete],
        error: error instanceof Error ? error.message : 'Failed to delete note'
      });
    }
  },

  toggleFavorite: async (id: string) => {
    const note = get().notes.find(note => note.id === id);
    if (!note) return;

    const newFavoriteStatus = !note.is_favorite;

    // Optimistic update
    set({
      notes: get().notes.map(note =>
        note.id === id ? { ...note, is_favorite: newFavoriteStatus } : note
      ),
      error: null
    });

    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: newFavoriteStatus })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      // Rollback on error
      set({
        notes: get().notes.map(note =>
          note.id === id ? { ...note, is_favorite: !newFavoriteStatus } : note
        ),
        error: error instanceof Error ? error.message : 'Failed to update favorite status'
      });
    }
  }
}));