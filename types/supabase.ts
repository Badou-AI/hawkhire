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
      organizations: {
        Row: {
          id: string
          name: string
          tier: 'free' | 'professional' | 'enterprise'
          created_at: string
          updated_at: string
          storage_used: number
          storage_limit: number
        }
        Insert: {
          id?: string
          name: string
          tier?: 'free' | 'professional' | 'enterprise'
          created_at?: string
          updated_at?: string
          storage_used?: number
          storage_limit?: number
        }
        Update: {
          id?: string
          name?: string
          tier?: 'free' | 'professional' | 'enterprise'
          created_at?: string
          updated_at?: string
          storage_used?: number
          storage_limit?: number
        }
      }
      jobs: {
        Row: {
          id: string
          organization_id: string
          title: string
          description: string
          requirements: string[]
          skills: string[]
          status: 'draft' | 'published' | 'closed'
          created_at: string
          updated_at: string
          search_index_name: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          description: string
          requirements?: string[]
          skills?: string[]
          status?: 'draft' | 'published' | 'closed'
          created_at?: string
          updated_at?: string
          search_index_name?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          description?: string
          requirements?: string[]
          skills?: string[]
          status?: 'draft' | 'published' | 'closed'
          created_at?: string
          updated_at?: string
          search_index_name?: string | null
        }
      }
      resumes: {
        Row: {
          id: string
          job_id: string
          file_path: string
          file_name: string
          file_size: number
          mime_type: string
          status: 'pending' | 'processing' | 'processed' | 'failed'
          error_message: string | null
          processed_data: Json | null
          matching_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          file_path: string
          file_name: string
          file_size: number
          mime_type: string
          status?: 'pending' | 'processing' | 'processed' | 'failed'
          error_message?: string | null
          processed_data?: Json | null
          matching_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          file_path?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          status?: 'pending' | 'processing' | 'processed' | 'failed'
          error_message?: string | null
          processed_data?: Json | null
          matching_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      processing_logs: {
        Row: {
          id: string
          resume_id: string
          event_type: 'start' | 'progress' | 'complete' | 'error'
          message: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          resume_id: string
          event_type: 'start' | 'progress' | 'complete' | 'error'
          message: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          resume_id?: string
          event_type?: 'start' | 'progress' | 'complete' | 'error'
          message?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 