export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          role: 'ADMIN' | 'MANAGER' | 'LABORER'
          site_id: string | null
          manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: 'ADMIN' | 'MANAGER' | 'LABORER'
          site_id?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'ADMIN' | 'MANAGER' | 'LABORER'
          site_id?: string | null
          manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sites: {
        Row: {
          id: string
          name: string
          location: string
          manager_id: string
          status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          manager_id: string
          status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          manager_id?: string
          status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD'
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          amount: number
          description: string
          category: string
          date: string
          manager_id: string
          site_id: string
          type: 'EXPENSE' | 'INCOME'
          laborer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          amount: number
          description: string
          category: string
          date: string
          manager_id: string
          site_id: string
          type: 'EXPENSE' | 'INCOME'
          laborer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          amount?: number
          description?: string
          category?: string
          date?: string
          manager_id?: string
          site_id?: string
          type?: 'EXPENSE' | 'INCOME'
          laborer_id?: string | null
          created_at?: string
          updated_at?: string
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
