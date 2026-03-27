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
      contacts: {
        Row: {
          id: string
          company_name: string
          representative: string
          business_number: string
          email: string | null
          phone: string | null
          address: string | null
          memo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          representative: string
          business_number: string
          email?: string | null
          phone?: string | null
          address?: string | null
          memo?: string | null
        }
        Update: {
          id?: string
          company_name?: string
          representative?: string
          business_number?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          memo?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          type:
            | 'quotation'
            | 'transaction_statement'
            | 'tax_invoice'
            | 'receipt'
            | 'contract'
            | 'consent'
            | 'purchase_order'
            | 'delivery_note'
          title: string
          document_number: string
          contact_id: string | null
          issuer_info: Json
          receiver_info: Json
          items: Json
          total_amount: number
          tax_amount: number
          notes: string | null
          status: 'draft' | 'sent' | 'confirmed'
          sent_via: 'sms' | 'email' | null
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type:
            | 'quotation'
            | 'transaction_statement'
            | 'tax_invoice'
            | 'receipt'
            | 'contract'
            | 'consent'
            | 'purchase_order'
            | 'delivery_note'
          title: string
          document_number: string
          contact_id?: string | null
          issuer_info?: Json
          receiver_info?: Json
          items?: Json
          total_amount?: number
          tax_amount?: number
          notes?: string | null
          status?: 'draft' | 'sent' | 'confirmed'
          sent_via?: 'sms' | 'email' | null
          sent_at?: string | null
        }
        Update: {
          id?: string
          type?:
            | 'quotation'
            | 'transaction_statement'
            | 'tax_invoice'
            | 'receipt'
            | 'contract'
            | 'consent'
            | 'purchase_order'
            | 'delivery_note'
          title?: string
          document_number?: string
          contact_id?: string | null
          issuer_info?: Json
          receiver_info?: Json
          items?: Json
          total_amount?: number
          tax_amount?: number
          notes?: string | null
          status?: 'draft' | 'sent' | 'confirmed'
          sent_via?: 'sms' | 'email' | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'documents_contact_id_fkey'
            columns: ['contact_id']
            isOneToOne: false
            referencedRelation: 'contacts'
            referencedColumns: ['id']
          }
        ]
      }
      chat_history: {
        Row: {
          id: string
          role: 'user' | 'assistant'
          content: string
          document_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          role: 'user' | 'assistant'
          content: string
          document_id?: string | null
        }
        Update: {
          id?: string
          role?: 'user' | 'assistant'
          content?: string
          document_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'chat_history_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          }
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          value?: Json
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
