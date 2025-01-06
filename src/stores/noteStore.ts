import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Note = Database['public']['Tables']['notes']['Row'];
type Filter = 'all' | 'favorites' | 'trash' | 'tag';

interface NoteCache {
  [tagId: string]: Note[];
}

interface NoteStore {
  notes: Note[];
  filter: Filter;
  searchQuery: string;
  selectedTagId: string | null;
  noteCache: NoteCache;
  setFilter: (filter: Filter) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTagId: (tagId: string | null) => void;
  fetchNotes: () => Promise<void>;
  fetchNotesByTag: (tagId: string) => Promise<void>;
  createNote: (title: string, content: string) => Promise<Note>;
  updateNote: (id: string, title: string, content: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  permanentlyDelete: (id: string) => Promise<void>;
  getFilteredNotes: () => Note[];
  clearCache: () => void;
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: [],
  filter: 'all',
  searchQuery: '',
  selectedTagId: null,
  noteCache: {},

  setFilter: (filter) => set({ filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTagId: async (tagId) => {
    const prevTagId = get().selectedTagId;
    
    // Only fetch if it's a different tag
    if (tagId !== prevTagId) {
      set({ selectedTagId: tagId });
      
      if (tagId) {
        // If we have cached notes for this tag, use them immediately
        const cachedNotes = get().noteCache[tagId];
        if (cachedNotes) {
          set({ notes: cachedNotes });
        } else {
          // Show loading state by clearing notes temporarily
          set({ notes: [] });
        }
        // Then fetch fresh data
        await get().fetchNotesByTag(tagId);
      } else {
        await get().fetchNotes();
      }
    }
  },

  fetchNotes: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated to fetch notes');

      // Always fetch all notes for correct counting
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ notes: data || [] });
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  },

  fetchNotesByTag: async (tagId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated to fetch notes');

      // First fetch all notes for correct counting
      await get().fetchNotes();

      // Then fetch notes for the selected tag
      const { data, error } = await supabase
        .from('notes')
        .select('*, note_tags!inner(tag_id)')
        .eq('note_tags.tag_id', tagId)
        .eq('user_id', user.id)
        .not('is_deleted', 'eq', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Only update the filtered notes, keeping the total notes intact
      const filteredNotes = data || [];
      set(state => ({
        ...state,
        notes: state.filter === 'tag' ? filteredNotes : state.notes
      }));
    } catch (error) {
      console.error('Error fetching notes by tag:', error);
    }
  },

  clearCache: () => set({ noteCache: {} }),

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
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Clear cache as it might be outdated
      get().clearCache();
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
      
      // Clear cache as it might be outdated
      get().clearCache();
      await get().fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
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
      
      // Update the note in the current state and cache
      const updatedNote = { ...note, is_favorite: !note.is_favorite };
      const updatedNotes = get().notes.map(n => n.id === id ? updatedNote : n);
      
      // Update cache for all tags that contain this note
      const cache = get().noteCache;
      const updatedCache = Object.entries(cache).reduce((acc, [tagId, notes]) => {
        acc[tagId] = notes.map(n => n.id === id ? updatedNote : n);
        return acc;
      }, {} as NoteCache);

      set({ notes: updatedNotes, noteCache: updatedCache });
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
      
      // Clear cache as it might be outdated
      get().clearCache();
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
      
      // Clear cache as it might be outdated
      get().clearCache();
      await get().fetchNotes();
    } catch (error) {
      console.error('Error restoring note from trash:', error);
    }
  },

  permanentlyDelete: async (id) => {
    try {
      // First delete all note_tags associations
      await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', id);

      // Then delete the note
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Clear cache as it might be outdated
      get().clearCache();
      await get().fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  },

  getFilteredNotes: () => {
    const { notes, filter, searchQuery } = get();
    let filteredNotes = notes;

    // Apply main filter
    switch (filter) {
      case 'favorites':
        filteredNotes = notes.filter(note => note.is_favorite && !note.is_deleted);
        break;
      case 'trash':
        filteredNotes = notes.filter(note => note.is_deleted);
        break;
      case 'tag':
        // Filtering is already done at the database level
        break;
      default: // 'all'
        filteredNotes = notes.filter(note => !note.is_deleted);
    }

    // Apply search filter if there's a search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.title.toLowerCase().includes(query) ||
        (note.content && note.content.toLowerCase().includes(query))
      );
    }

    return filteredNotes;
  },
}));