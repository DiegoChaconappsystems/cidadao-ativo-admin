'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Building2, BarChart3, FileText, List, LogOut, User, MapPin } from 'lucide-react'

interface UserPrefeituraData {
  prefeitura_id: string
  prefeitura_nome: string
  cidade: string
  nome: string
  cargo: string
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const [userPrefeitura, setUserPrefeitura] = useState<UserPrefeituraData | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        checkAuth()
    }, [router])

    const checkAuth = async () => {
        try {
            // Verificar sessão do Supabase
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }

            setUser(session.user)

            // Buscar dados da prefeitura do usuário
            const { data: userData, error } = await supabase
                .rpc('get_current_user_data')

            if (error) {
                console.error('Erro ao buscar dados do usuário:', error)
                await supabase.auth.signOut()
                router.push('/login')
                return
            }

            if (!userData || userData.length === 0) {
                console.error('Usuário sem permissão de acesso')
                await supabase.auth.signOut()
                router.push('/login')
                return
            }

            const userInfo = userData[0]
            const prefeituraData: UserPrefeituraData = {
                prefeitura_id: userInfo.prefeitura_id,
                prefeitura_nome: userInfo.prefeitura_nome,
                cidade: userInfo.cidade,
                nome: userInfo.nome,
                cargo: userInfo.cargo
            }

            setUserPrefeitura(prefeituraData)

            // Salvar no localStorage para uso em outros componentes
            localStorage.setItem('user_prefeitura', JSON.stringify(prefeituraData))

        } catch (error) {
            console.error('Erro na verificação de auth:', error)
            router.push('/login')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('user_prefeitura')
        router.push('/login')
    }

    const navigation = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: BarChart3,
            current: pathname === '/dashboard'
        },
        {
            name: 'Ocorrências',
            href: '/dashboard/ocorrencias',
            icon: List,
            current: pathname === '/dashboard/ocorrencias'
        },
        {
            name: 'Mapa',
            href: '/dashboard/mapa',
            icon: MapPin,
            current: pathname === '/dashboard/mapa'
        },
        {
            name: 'Relatórios',
            href: '/dashboard/relatorios',
            icon: FileText,
            current: pathname === '/dashboard/relatorios'
        }
    ]

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando permissões...</p>
                </div>
            </div>
        )
    }

    if (!user || !userPrefeitura) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo e Título */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-8 w-8 text-blue-600" />
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Cidadão Ativo</h1>
                                    <p className="text-xs text-gray-500">
                                        {userPrefeitura.prefeitura_nome}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info da Prefeitura */}
                        <div className="hidden md:flex items-center gap-4 text-sm">
                            <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-medium">{userPrefeitura.cidade}</span>
                                </div>
                            </div>
                        </div>

                        {/* User Info e Logout */}
                        <div className="flex items-center gap-4">
                            <div className="text-right text-sm">
                                <p className="font-medium text-gray-900">{userPrefeitura.nome}</p>
                                <p className="text-gray-500 text-xs">{userPrefeitura.cargo}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:block">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="bg-white border-b">
                <div className="px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {navigation.map((item) => {
                            const Icon = item.icon
                            return (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className={`
                                        flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${item.current
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.name}
                                </a>
                            )
                        })}
                    </nav>
                </div>
            </div>

            {/* Breadcrumb com informações da cidade */}
            <div className="bg-blue-50 border-b border-blue-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-blue-800">
                            <Building2 className="h-4 w-4" />
                            <span>Visualizando dados de:</span>
                            <span className="font-semibold">{userPrefeitura.cidade}</span>
                            <span className="text-blue-600">•</span>
                            <span>Apenas ocorrências desta cidade são exibidas</span>
                        </div>
                        <div className="text-xs text-blue-600">
                            ID da Prefeitura: {userPrefeitura.prefeitura_id.slice(0, 8)}...
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            © 2025 Cidadão Ativo - {userPrefeitura.prefeitura_nome}
                        </div>
                        <div className="text-sm text-gray-500">
                            Sistema multitenancy ativo
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}