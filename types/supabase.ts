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
          slug: string
          description: string | null
          company_type: string
          industry: string[] | null
          founded_year: number | null
          size_range: string | null
          website_url: string | null
          logo_url: string | null
          cover_image_url: string | null
          primary_location: string
          additional_locations: string[] | null
          languages: string[] | null
          verification_status: 'pending' | 'verified' | 'rejected'
          verified_at: string | null
          tier: 'free' | 'pro' | 'enterprise'
          members: string[]
          storage_used: number | null
          storage_limit: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string
          description?: string | null
          company_type: string
          industry?: string[] | null
          founded_year?: number | null
          size_range?: string | null
          website_url?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          primary_location: string
          additional_locations?: string[] | null
          languages?: string[] | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          verified_at?: string | null
          tier?: 'free' | 'pro' | 'enterprise'
          members?: string[]
          storage_used?: number | null
          storage_limit?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          company_type?: string
          industry?: string[] | null
          founded_year?: number | null
          size_range?: string | null
          website_url?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          primary_location?: string
          additional_locations?: string[] | null
          languages?: string[] | null
          verification_status?: 'pending' | 'verified' | 'rejected'
          verified_at?: string | null
          tier?: 'free' | 'pro' | 'enterprise'
          members?: string[]
          storage_used?: number | null
          storage_limit?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      organization_verifications: {
        Row: {
          id: string
          organization_id: string
          status: 'pending' | 'verified' | 'rejected'
          verified_by: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          status: 'pending' | 'verified' | 'rejected'
          verified_by: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          status?: 'pending' | 'verified' | 'rejected'
          verified_by?: string
          notes?: string | null
          created_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          title: string | null
          permissions: Json
          invited_by: string
          status: 'pending' | 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          title?: string | null
          permissions?: Json
          invited_by: string
          status?: 'pending' | 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          title?: string | null
          permissions?: Json
          invited_by?: string
          status?: 'pending' | 'active' | 'inactive'
          created_at?: string
          updated_at?: string
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