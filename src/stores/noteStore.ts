import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Note = Database['public']['Tables']['notes']['Row'];

interface NoteState {
  notes: Note[];
  loading: boolean;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loading: false,
  fetchNotes: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    set({ notes: data || [], loading: false });
  },
  createNote: async (title: string, content: string) => {
    const { data, error } = await supabase
      .from('notes')
      .insert([{ title, content }])
      .select()
      .single();
    
    if (error) throw error;
    set({ notes: [data, ...get().notes] });
  },
  updateNote: async (id: string, updates: Partial<Note>) => {
    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
    set({
      notes: get().notes.map(note =>
        note.id === id ? { ...note, ...updates } : note
      )
    });
  },
  deleteNote: async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    set({ notes: get().notes.filter(note => note.id !== id) });
  },
  toggleFavorite: async (id: string) => {
    const note = get().notes.find(n => n.id === id);
    if (!note) return;
    
    await get().updateNote(id, { is_favorite: !note.is_favorite });
  },
}));