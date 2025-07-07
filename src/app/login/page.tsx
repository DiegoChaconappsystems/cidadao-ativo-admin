'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Building2, Mail, Lock, LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Fazer login no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Verificar se é usuário administrativo de alguma prefeitura
        const { data: userData, error: userError } = await supabase
          .rpc('get_current_user_data')

        if (userError) {
          console.error('Erro ao buscar dados do usuário:', userError)
          throw new Error('Erro ao verificar permissões do usuário')
        }

        if (!userData || userData.length === 0) {
          // Usuário não é admin de nenhuma prefeitura
          await supabase.auth.signOut()
          throw new Error('Acesso negado. Este usuário não tem permissão para acessar o painel administrativo.')
        }

        // 3. Salvar dados do usuário no localStorage para uso no sistema
        const userInfo = userData[0]
        localStorage.setItem('user_prefeitura', JSON.stringify({
          prefeitura_id: userInfo.prefeitura_id,
          prefeitura_nome: userInfo.prefeitura_nome,
          cidade: userInfo.cidade,
          nome: userInfo.nome,
          cargo: userInfo.cargo
        }))

        // 4. Redirecionar para dashboard
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Erro no login:', error)
      setError(error.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-4">
      <div className="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Building2 className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            Cidadão Ativo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Painel Administrativo - Prefeituras
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Acesso restrito a administradores municipais
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email da prefeitura"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="sr-only">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro de acesso:</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
              </span>
              {loading ? 'Verificando acesso...' : 'Entrar no Painel'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>Acesso para administradores de prefeituras cadastradas</p>
          <p className="mt-1">Cada prefeitura visualiza apenas suas ocorrências</p>
        </div>

        {/* Informações de Teste */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">🔧 Ambiente de Desenvolvimento</h3>
            <div className="text-xs text-yellow-700 space-y-1">
              <p><strong>Para testar:</strong></p>
              <p>1. Crie usuários no Auth do Supabase</p>
              <p>2. Execute a função SQL para criar perfil</p>
              <p>3. Cada usuário verá apenas ocorrências da sua cidade</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}