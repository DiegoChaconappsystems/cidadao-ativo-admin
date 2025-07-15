import { supabase } from './supabase'

export interface UserProfile {
  email: string
  nome: string
  tipo_admin: 'super_admin' | 'admin_prefeitura' | 'nao_admin'
  prefeitura_id?: string
  prefeitura?: {
    nome: string
    municipio: {
      nome: string
    }
  }
}

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user?.email) return null

    const { data, error } = await supabase
      .from('usuarios_admin')
      .select(`
        email,
        nome,
        tipo_admin,
        prefeitura_id,
        prefeituras (
          nome,
          municipios (
            nome
          )
        )
      `)
      .eq('email', session.user.email)
      .eq('ativo', true)
      .single()

    if (error || !data) {
      return {
        email: session.user.email,
        nome: session.user.email,
        tipo_admin: 'nao_admin'
      }
    }

    return {
      email: data.email,
      nome: data.nome,
      tipo_admin: data.tipo_admin,
      prefeitura_id: data.prefeitura_id,
      prefeitura: data.prefeituras ? {
        nome: data.prefeituras.nome,
        municipio: {
          nome: data.prefeituras.municipios?.nome || 'N/A'
        }
      } : undefined
    }
  } catch (error) {
    console.error('Erro ao buscar perfil:', error)
    return null
  }
}