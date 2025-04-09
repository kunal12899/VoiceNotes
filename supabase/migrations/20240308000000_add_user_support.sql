-- Add user_id to notes table
ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add new columns for enhanced note features
ALTER TABLE notes ADD COLUMN category VARCHAR(50);
ALTER TABLE notes ADD COLUMN tags TEXT[];
ALTER TABLE notes ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN shared_with UUID[] DEFAULT '{}';
ALTER TABLE notes ADD COLUMN audio_url TEXT;
ALTER TABLE notes ADD COLUMN formatted_content TEXT;

-- Create an index for faster user-specific queries
CREATE INDEX idx_notes_user_id ON notes(user_id);

-- Create a function to handle note sharing
CREATE OR REPLACE FUNCTION share_note(note_id UUID, target_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notes
  SET shared_with = array_append(shared_with, target_user_id)
  WHERE id = note_id;
END;
$$ LANGUAGE plpgsql; 