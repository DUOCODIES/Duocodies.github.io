import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { useAuthStore } from './authStore';

type Tag = Database['public']['Tables']['tags']['Row'];
type NoteTag = Database['public']['Tables']['note_tags']['Row'];

interface TagState {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  addTagToNote: (noteId: string, tagId: string) => Promise<void>;
  removeTagFromNote: (noteId: string, tagId: string) => Promise<void>;
  getNoteTags: (noteId: string) => Promise<Tag[]>;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  loading: false,
  error: null,

  fetchTags: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      set({ tags: data || [], loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch tags', loading: false });
    }
  },

  createTag: async (name: string, color: string) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('User must be authenticated to create tags');

    const newTag = {
      user_id: user.id,
      name,
      color,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('tags')
        .insert([newTag])
        .select()
        .single();
      
      if (error) throw error;
      set({ tags: [...get().tags, data] });
      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create tag');
    }
  },

  updateTag: async (id: string, updates: Partial<Tag>) => {
    const originalTag = get().tags.find(tag => tag.id === id);
    if (!originalTag) return;

    // Optimistic update
    set({
      tags: get().tags.map(tag =>
        tag.id === id ? { ...tag, ...updates } : tag
      ),
    });

    try {
      const { error } = await supabase
        .from('tags')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      // Rollback on error
      set({
        tags: get().tags.map(tag =>
          tag.id === id ? originalTag : tag
        ),
      });
      throw error;
    }
  },

  deleteTag: async (id: string) => {
    const tagToDelete = get().tags.find(tag => tag.id === id);
    if (!tagToDelete) return;

    // Optimistic update
    set({ tags: get().tags.filter(tag => tag.id !== id) });

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      // Rollback on error
      set({ tags: [...get().tags, tagToDelete] });
      throw error;
    }
  },

  addTagToNote: async (noteId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('note_tags')
        .insert([{ note_id: noteId, tag_id: tagId }]);
      
      if (error) throw error;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to add tag to note');
    }
  },

  removeTagFromNote: async (noteId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('note_tags')
        .delete()
        .match({ note_id: noteId, tag_id: tagId });
      
      if (error) throw error;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to remove tag from note');
    }
  },

  getNoteTags: async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('note_tags')
        .select('tag_id')
        .eq('note_id', noteId);
      
      if (error) throw error;

      if (!data.length) return [];

      const tagIds = data.map(nt => nt.tag_id);
      const { data: tags, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds);

      if (tagsError) throw tagsError;
      return tags || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch note tags');
    }
  },
})); 