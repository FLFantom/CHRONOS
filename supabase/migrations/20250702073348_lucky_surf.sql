/*
  # Ensure work_start_time column exists in users table

  1. Changes
    - Add `work_start_time` column to `users` table if it doesn't exist
    - Column type: timestamptz (timestamp with timezone)
    - Column is nullable to allow null when work ends

  2. Notes
    - This column tracks when a user started their work session
    - Gets set to current timestamp when work starts
    - Gets set to null when work ends
    - Uses IF NOT EXISTS to prevent errors if column already exists
*/

DO $$
BEGIN
  -- Check if work_start_time column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'work_start_time'
  ) THEN
    ALTER TABLE public.users ADD COLUMN work_start_time timestamptz;
    
    -- Add a comment to document the column
    COMMENT ON COLUMN public.users.work_start_time IS 'Timestamp when user started their current work session';
  END IF;
END $$;