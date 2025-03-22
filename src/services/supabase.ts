/**
 * Supabase service to handle database connections and operations
 * Creates a singleton client instance to interact with Supabase
 */
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Check connection
export const checkConnection = async (): Promise<boolean> => {
  try {
    // If Supabase URL or key is not provided, don't attempt to connect
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or anonymous key not provided.');
      return false;
    }
    
    const { data, error } = await supabase.from('players').select('count');
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    console.log('Supabase connected successfully');
    return true;
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
    return false;
  }
};

// Player functions
export const createOrGetPlayer = async (username: string) => {
  try {
    // Check if Supabase is available
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured, returning mock player');
      return { id: 'local-' + Math.random().toString(36).substring(2, 9), username };
    }
    
    // Check if player exists by username - don't use .single() as it will throw an error if no player is found
    const { data: existingPlayers, error: queryError } = await supabase
      .from('players')
      .select('*')
      .eq('username', username);

    if (queryError) {
      console.error('Error checking for existing player:', queryError);
      return null;
    }

    // If player exists, return the first matching player
    if (existingPlayers && existingPlayers.length > 0) {
      return existingPlayers[0];
    }

    // Create a new player
    const { data: newPlayer, error: insertError } = await supabase
      .from('players')
      .insert([{ username, games_played: 0, times_it: 0, total_survival_time: 0 }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating new player:', insertError);
      return null;
    }

    return newPlayer;
  } catch (err) {
    console.error('Error in createOrGetPlayer:', err);
    return null;
  }
};

// Game session functions
export const createGameSession = async () => {
  try {
    // Check if Supabase is available
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured, returning mock game session');
      return { id: 'local-' + Math.random().toString(36).substring(2, 9), started_at: new Date().toISOString() };
    }
    
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([{ started_at: new Date().toISOString() }])
      .select()
      .single();

    if (error) {
      console.error('Error creating game session:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error in createGameSession:', err);
    return null;
  }
};

export const endGameSession = async (sessionId: string) => {
  try {
    // Check if Supabase is available
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured, skipping endGameSession');
      return true;
    }
    
    const { error } = await supabase
      .from('game_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('Error ending game session:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in endGameSession:', err);
    return false;
  }
};

// Player stats functions
export const recordPlayerRound = async (
  playerId: string, 
  sessionId: string, 
  roundNumber: number, 
  wasIt: boolean, 
  survivalTime: number
) => {
  try {
    // Check if Supabase is available
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured, skipping recordPlayerRound');
      return true;
    }
    
    const { error } = await supabase
      .from('player_rounds')
      .insert([{
        player_id: playerId,
        session_id: sessionId,
        round_number: roundNumber,
        was_it: wasIt,
        survival_time: survivalTime
      }]);

    if (error) {
      console.error('Error recording player round:', error);
      return false;
    }

    // Update player stats
    const { error: updateError } = await supabase
      .from('players')
      .update({
        games_played: supabase.rpc('increment', { row_id: playerId, table_name: 'players', column_name: 'games_played' }),
        times_it: wasIt ? supabase.rpc('increment', { row_id: playerId, table_name: 'players', column_name: 'times_it' }) : undefined,
        total_survival_time: supabase.rpc('add_to_column', { row_id: playerId, table_name: 'players', column_name: 'total_survival_time', value_to_add: survivalTime })
      })
      .eq('id', playerId);

    if (updateError) {
      console.error('Error updating player stats:', updateError);
    }

    return true;
  } catch (err) {
    console.error('Error in recordPlayerRound:', err);
    return false;
  }
};

// Leaderboard functions
export const getTopPlayers = async (limit = 10) => {
  try {
    // Check if Supabase is available
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured, returning empty leaderboard');
      return [];
    }
    
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('total_survival_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting top players:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error in getTopPlayers:', err);
    return [];
  }
};