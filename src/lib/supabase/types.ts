export type Database = {
  public: {
    Tables: {
      codes: {
        Row: {
          id: string
          name: string
          memo: string | null
          original_url: string
          short_code: string
          notification_enabled: boolean
          notification_email: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          memo?: string | null
          original_url: string
          short_code: string
          notification_enabled?: boolean
          notification_email?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          memo?: string | null
          original_url?: string
          short_code?: string
          notification_enabled?: boolean
          notification_email?: string | null
          user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          id: string
          code_id: string
          scanned_at: string
          ip_address: string | null
          user_agent: string | null
          country: string | null
          region: string | null
          city: string | null
        }
        Insert: {
          id?: string
          code_id: string
          scanned_at?: string
          ip_address?: string | null
          user_agent?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
        }
        Update: {
          id?: string
          code_id?: string
          scanned_at?: string
          ip_address?: string | null
          user_agent?: string | null
          country?: string | null
          region?: string | null
          city?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Code = Database['public']['Tables']['codes']['Row']
export type Scan = Database['public']['Tables']['scans']['Row']
