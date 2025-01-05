-- Add is_deleted column to notes table
ALTER TABLE notes 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT false;

-- Add an index for faster queries
CREATE INDEX idx_notes_is_deleted ON notes(is_deleted);

-- Update RLS policies to include is_deleted check
CREATE POLICY "Users can view their own non-deleted notes" ON notes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND (NOT is_deleted OR is_deleted IS NULL));

CREATE POLICY "Users can update their own notes" ON notes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); 