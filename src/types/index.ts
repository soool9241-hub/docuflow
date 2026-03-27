import type { Database } from './database'

export type DocumentType =
  | 'quotation'
  | 'transaction_statement'
  | 'tax_invoice'
  | 'receipt'
  | 'contract'
  | 'consent'
  | 'purchase_order'
  | 'delivery_note'

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  quotation: '견적서',
  transaction_statement: '거래명세서',
  tax_invoice: '세금계산서',
  receipt: '영수증',
  contract: '계약서',
  consent: '동의서',
  purchase_order: '발주서',
  delivery_note: '납품서',
}

export interface Contact {
  id: string
  user_id?: string
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

export interface Document {
  id: string
  user_id?: string
  type: DocumentType
  title: string
  document_number: string
  contact_id: string | null
  issuer_info: Record<string, any>
  receiver_info: Record<string, any>
  items: DocumentItem[]
  total_amount: number
  tax_amount: number
  notes: string | null
  status: 'draft' | 'sent' | 'confirmed'
  sent_via: 'sms' | 'email' | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

export interface DocumentItem {
  name: string
  specification: string
  quantity: number
  unit_price: number
  amount: number
  tax: number
  note?: string
}

export interface ChatMessage {
  id: string
  user_id?: string
  role: 'user' | 'assistant'
  content: string
  document_id: string | null
  created_at: string
}

export interface CompanyProfile {
  id: string
  user_id: string
  company_name: string | null
  representative: string | null
  business_number: string | null
  business_type: string | null
  business_category: string | null
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export type DocumentStatus = Document['status']

// Re-export database types
export type { Database } from './database'

// Table row type helpers
export type ContactRow = Database['public']['Tables']['contacts']['Row']
export type DocumentRow = Database['public']['Tables']['documents']['Row']
export type ChatHistoryRow = Database['public']['Tables']['chat_history']['Row']
export type SettingsRow = Database['public']['Tables']['settings']['Row']
export type CompanyProfileRow = Database['public']['Tables']['company_profiles']['Row']
