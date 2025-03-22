/**
 * Types for Supabase database schema
 * Generated types for TypeScript type safety with the database
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          username: string
          created_at: string
          games_played: number
          times_it: number
          total_survival_time: number
        }
        Insert: {
          id?: string
          username: string
          created_at?: string
          games_played?: number
          times_it?: number
          total_survival_time?: number
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
          games_played?: number
          times_it?: number
          total_survival_time?: number
        }
      }
      game_sessions: {
        Row: {
          id: string
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          started_at: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          started_at?: string
          ended_at?: string | null
        }
      }
      player_rounds: {
        Row: {
          id: string
          player_id: string
          session_id: string
          round_number: number
          was_it: boolean
          survival_time: number
          created_at: string
        }
        Insert: {
          id?: string
          player_id: string
          session_id: string
          round_number: number
          was_it: boolean
          survival_time: number
          created_at?: string
        }
        Update: {
          id?: string
          player_id?: string
          session_id?: string
          round_number?: number
          was_it?: boolean
          survival_time?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment: {
        Args: {
          row_id: string
          table: string
          column_name: string
        }
        Returns: number
      }
      add_to_column: {
        Args: {
          row_id: string
          table: string
          column_name: string
          value_to_add: number
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}