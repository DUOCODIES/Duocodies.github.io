import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Tag = Database['public']['Tables']['tags']['Row'];
type NoteTag = Database['public']['Tables']['note_tags']['Row'];

interface CreateTagParams {
  name: string;
  color: string;
}

interface UpdateTagParams {
  name: string;
  color: string;
}

interface TagStore {
  tags: Tag[];
  fetchTags: () => Promise<void>;
  createTag: (params: CreateTagParams) => Promise<Tag>;
  updateTag: (id: string, params: UpdateTagParams) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  getNoteTags: (noteId: string) => Promise<Tag[]>;
  addTagToNote: (noteId: string, tagId: string) => Promise<NoteTag>;
  removeTagFromNote: (noteId: string, tagId: string) => Promise<void>;
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: [],

  fetchTags: async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      set({ tags: data || [] });
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  },

  createTag: async ({ name, color }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated to create tags');

      const { data, error } = await supabase
        .from('tags')
        .insert([{ name, color, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      await get().fetchTags();
      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  },

  updateTag: async (id, { name, color }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated to update tags');

      const { data, error } = await supabase
        .from('tags')
        .update({ name, color })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await get().fetchTags();
      return data;
    } catch (error) {
      console.error('Error updating tag:', error);
      throw error;
    }
  },

  deleteTag: async (id) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User must be authenticated to delete tags');

      // First delete all note_tags associations
      await supabase
        .from('note_tags')
        .delete()
        .eq('tag_id', id);

      // Then delete the tag
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchTags();
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  },

  getNoteTags: async (noteId) => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*, note_tags!inner(*)')
        .eq('note_tags.note_id', noteId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching note tags:', error);
      return [];
    }
  },

  addTagToNote: async (noteId, tagId) => {
    try {
      const { data, error } = await supabase
        .from('note_tags')
        .insert([{ note_id: noteId, tag_id: tagId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding tag to note:', error);
      throw error;
    }
  },

  removeTagFromNote: async (noteId, tagId) => {
    try {
      const { error } = await supabase
        .from('note_tags')
        .delete()
        .match({ note_id: noteId, tag_id: tagId });

      if (error) throw error;
    } catch (error) {
      console.error('Error removing tag from note:', error);
    }
  },
})); 