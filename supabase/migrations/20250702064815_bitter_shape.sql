/*
  # Add work_start_time column to users table

  1. Changes
    - Add `work_start_time` column to `users` table
    - Column type: timestamptz (timestamp with timezone)
    - Column is nullable to allow null when work ends

  2. Notes
    - This column tracks when a user started their work session
    - Gets set to current timestamp when work starts
    - Gets set to null when work ends
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'work_start_time'
  ) THEN
    ALTER TABLE users ADD COLUMN work_start_time timestamptz;
  END IF;
END $$;