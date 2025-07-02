'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

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

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-blue-600">🏛️ Cidadão Ativo - Painel Admin</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">{user.email}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                            Sair
                        </button>
                    </div>
                </div>

                <div className="flex space-x-6">
                    <a
                        href="/dashboard"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        📊 Dashboard
                    </a>
                    <a
                        href="/dashboard/ocorrencias"
                        className="text-gray-600 hover:text-blue-600 font-medium"
                    >
                        📋 Ocorrências
                    </a>
                </div>
            </div>

            <div className="p-6">
                {children}
            </div>
        </div>
    )
}