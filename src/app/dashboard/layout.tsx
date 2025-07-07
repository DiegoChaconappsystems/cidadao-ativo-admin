'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Building2, BarChart3, FileText, List, LogOut, User,MapPin  } from 'lucide-react'


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/login')
                return
            }
            setUser(session.user)
        }
        checkAuth()
    }, [router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
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

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verificando autenticação...</p>
                </div>
            </div>
        )
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
                                    <p className="text-xs text-gray-500">Painel Administrativo</p>
                                </div>
                            </div>
                        </div>

                        {/* User Info e Logout */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <User className="h-4 w-4" />
                                <span className="hidden sm:block">{user.email}</span>
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
                            © 2025 Cidadão Ativo - Sistema de Gestão de Ocorrências Urbanas
                        </div>
                        <div className="text-sm text-gray-500">
                            Versão 1.0.0
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}