import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qhhagcqxfuekugtrtctl.supabase.co' // ← Sua URL do app mobile
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoaGFnY3F4ZnVla3VndHJ0Y3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzODYzODgsImV4cCI6MjA2Njk2MjM4OH0.vr7EXxx77xSNEdCzBg5Kbt4nImzASoQ7m-kU0GcRoMQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos TypeScript
export interface Occurrence {
  id: string
  protocolo: string
  titulo: string
  descricao: string
  status: 'recebido' | 'em_analise' | 'em_atendimento' | 'resolvido' | 'rejeitado'
  endereco: string
  latitude: number
  longitude: number
  fotos: string[]
  created_at: string
  updated_at: string
  usuarios: {
    nome: string
    telefone?: string
  }
  categorias: {
    nome: string
    icone: string
    cor: string
  }
}