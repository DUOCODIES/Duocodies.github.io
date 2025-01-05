-- Add kanban_status column to notes table
ALTER TABLE notes ADD COLUMN kanban_status text CHECK (kanban_status IN ('todo', 'in_progress', 'done'));

-- Set default value for existing notes
UPDATE notes SET kanban_status = 'todo' WHERE kanban_status IS NULL; 