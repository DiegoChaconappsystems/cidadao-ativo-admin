'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  email: string
  nome: string
  tipo_admin: 'super_admin' | 'admin_prefeitura'
  prefeitura?: {
    nome: string
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      setUser(session.user)

      // Buscar perfil do usuário
      const { data: profileData } = await supabase
        .from('usuarios_admin')
        .select(`
          email,
          nome,
          tipo_admin,
          prefeituras (
            nome
          )
        `)
        .eq('email', session.user.email)
        .maybeSingle()

      if (profileData) {
        setUserProfile({
          email: profileData.email,
          nome: profileData.nome,
          tipo_admin: profileData.tipo_admin,
          prefeitura: profileData.prefeituras
        })
      }

      setLoading(false)
    }
    
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const isSuperAdmin = userProfile?.tipo_admin === 'super_admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold text-blue-600">🏛️ Cidadão Ativo</h1>
              <p className="text-sm text-gray-600">
                {isSuperAdmin ? 'Painel Super Administrador' : `Painel ${userProfile?.prefeitura?.nome || 'Prefeitura'}`}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="block text-sm font-medium text-gray-900">{userProfile?.nome}</span>
                <span className="block text-xs text-gray-500">{userProfile?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Menu de Navegação */}
          <nav className="flex space-x-6">
            <a
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 font-medium py-2 px-1 border-b-2 border-blue-600"
            >
              📊 Dashboard
            </a>
            
            <a
              href="/dashboard/ocorrencias"
              className="text-gray-600 hover:text-blue-600 font-medium py-2 px-1 border-b-2 border-transparent hover:border-blue-300"
            >
              📋 Ocorrências
            </a>

            {/* Menus exclusivos do Super Admin */}
            {isSuperAdmin && (
              <>
                <a
                  href="/dashboard/cidades"
                  className="text-gray-600 hover:text-blue-600 font-medium py-2 px-1 border-b-2 border-transparent hover:border-blue-300"
                >
                  🏙️ Cidades
                </a>
                
                <a
                  href="/dashboard/prefeituras"
                  className="text-gray-600 hover:text-blue-600 font-medium py-2 px-1 border-b-2 border-transparent hover:border-blue-300"
                >
                  🏛️ Prefeituras
                </a>
                
                <a
                  href="/dashboard/administradores"
                  className="text-gray-600 hover:text-blue-600 font-medium py-2 px-1 border-b-2 border-transparent hover:border-blue-300"
                >
                  👥 Administradores
                </a>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  )
}