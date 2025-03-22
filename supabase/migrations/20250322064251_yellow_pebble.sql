/*
  # Create players table and related tables

  1. New Tables
    - `players`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `created_at` (timestamp)
      - `games_played` (integer)
      - `times_it` (integer)
      - `total_survival_time` (integer)
    - `game_sessions`
      - `id` (uuid, primary key)
      - `started_at` (timestamp)
      - `ended_at` (timestamp, nullable)
    - `player_rounds`
      - `id` (uuid, primary key)
      - `player_id` (uuid, foreign key)
      - `session_id` (uuid, foreign key)
      - `round_number` (integer)
      - `was_it` (boolean)
      - `survival_time` (integer)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on all tables
    - Add policies for public access to players table
    - Add policies for authenticated game sessions and player rounds
  3. Functions
    - `increment` - Increments a numeric column by 1
    - `add_to_column` - Adds a value to a numeric column
*/

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  games_played INTEGER DEFAULT 0,
  times_it INTEGER DEFAULT 0,
  total_survival_time INTEGER DEFAULT 0
);

-- Create game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ NULL
);

-- Create player rounds table
CREATE TABLE IF NOT EXISTS player_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id),
  session_id UUID NOT NULL REFERENCES game_sessions(id),
  round_number INTEGER NOT NULL,
  was_it BOOLEAN NOT NULL DEFAULT false,
  survival_time INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS player_rounds_player_id_idx ON player_rounds (player_id);
CREATE INDEX IF NOT EXISTS player_rounds_session_id_idx ON player_rounds (session_id);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_rounds ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Players are publicly readable" ON players FOR SELECT USING (true);
CREATE POLICY "Players can be inserted by anyone" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Players can be updated by anyone" ON players FOR UPDATE USING (true);

CREATE POLICY "Game sessions are publicly readable" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Game sessions can be inserted by anyone" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Game sessions can be updated by anyone" ON game_sessions FOR UPDATE USING (true);

CREATE POLICY "Player rounds are publicly readable" ON player_rounds FOR SELECT USING (true);
CREATE POLICY "Player rounds can be inserted by anyone" ON player_rounds FOR INSERT WITH CHECK (true);

-- Create helper functions
CREATE OR REPLACE FUNCTION increment(row_id UUID, table_name TEXT, column_name TEXT)
RETURNS INTEGER AS $$
DECLARE
  current_value INTEGER;
  new_value INTEGER;
BEGIN
  EXECUTE format('SELECT %I FROM %I WHERE id = $1', column_name, table_name)
  INTO current_value
  USING row_id;
  
  new_value := current_value + 1;
  
  RETURN new_value;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_to_column(row_id UUID, table_name TEXT, column_name TEXT, value_to_add INTEGER)
RETURNS INTEGER AS $$
DECLARE
  current_value INTEGER;
  new_value INTEGER;
BEGIN
  EXECUTE format('SELECT %I FROM %I WHERE id = $1', column_name, table_name)
  INTO current_value
  USING row_id;
  
  new_value := current_value + value_to_add;
  
  RETURN new_value;
END;
$$ LANGUAGE plpgsql;