'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Occurrence {
    id: string
    protocolo: string
    titulo: string
    descricao: string
    status: string
    endereco: string
    created_at: string
    usuarios: { nome: string }
    categorias: { nome: string }
}

export default function OcorrenciasPage() {
    const [occurrences, setOccurrences] = useState<Occurrence[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('todas')

    useEffect(() => {
        loadOccurrences()
    }, [])

    const loadOccurrences = async () => {
        try {
            const { data, error } = await supabase
                .from('ocorrencias')
                .select(`
          id,
          protocolo,
          titulo,
          descricao,
          status,
          endereco,
          created_at,
          usuarios (nome),
          categorias (nome)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setOccurrences(data || [])
        } catch (error) {
            console.error('Erro ao carregar ocorrências:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id: string, newStatus: string) => {
        // Confirmar com usuário
        const confirmed = window.confirm(`Alterar status para: ${getStatusText(newStatus)}?`)
        if (!confirmed) return

        try {
            console.log('=== INÍCIO ATUALIZAÇÃO ===')
            console.log('ID:', id)
            console.log('Novo Status:', newStatus)

            // Verificar se usuário está autenticado
            const { data: { session } } = await supabase.auth.getSession()
            console.log('Usuário logado:', session?.user?.email)

            // Tentar atualização
            const { data, error } = await supabase
                .from('ocorrencias')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('id, status, protocolo')

            console.log('Dados retornados:', data)
            console.log('Erro se houver:', error)

            if (error) {
                throw new Error(`Erro do banco: ${error.message}`)
            }

            if (!data || data.length === 0) {
                throw new Error('Nenhum registro foi atualizado')
            }

            console.log('✅ Atualização bem-sucedida!')

            // Atualizar interface
            setOccurrences(prevOccurrences =>
                prevOccurrences.map(occ =>
                    occ.id === id ? { ...occ, status: newStatus } : occ
                )
            )

            alert(`✅ Status alterado para: ${getStatusText(newStatus)}`)

        } catch (error: any) {
            console.error('❌ ERRO COMPLETO:', error)
            alert(`❌ Erro: ${error.message}`)
        }
    }
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'recebido': return 'bg-blue-100 text-blue-800'
            case 'em_analise': return 'bg-yellow-100 text-yellow-800'
            case 'em_atendimento': return 'bg-purple-100 text-purple-800'
            case 'resolvido': return 'bg-green-100 text-green-800'
            case 'rejeitado': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case 'recebido': return 'Recebido'
            case 'em_analise': return 'Em Análise'
            case 'em_atendimento': return 'Em Atendimento'
            case 'resolvido': return 'Resolvido'
            case 'rejeitado': return 'Rejeitado'
            default: return status
        }
    }

    const filteredOccurrences = occurrences.filter(occ => {
        if (filter === 'todas') return true
        return occ.status === filter
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1>
                    <p className="text-gray-600">Gerencie todas as solicitações dos cidadãos</p>
                </div>

                <div className="flex space-x-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 bg-white"
                    >
                        <option value="todas">Todas</option>
                        <option value="recebido">Recebidas</option>
                        <option value="em_analise">Em Análise</option>
                        <option value="em_atendimento">Em Atendimento</option>
                        <option value="resolvido">Resolvidas</option>
                        <option value="rejeitado">Rejeitadas</option>
                    </select>

                    <button
                        onClick={loadOccurrences}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                        🔄 Atualizar
                    </button>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h2 className="font-medium text-gray-900">
                        {filteredOccurrences.length} ocorrência(s) encontrada(s)
                    </h2>
                </div>

                <div className="divide-y divide-gray-200">
                    {filteredOccurrences.map((occurrence) => (
                        <div key={occurrence.id} className="p-6 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="font-mono text-sm text-gray-500">
                                            #{occurrence.protocolo}
                                        </span>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(occurrence.status)}`}>
                                            {getStatusText(occurrence.status)}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                                        {occurrence.titulo}
                                    </h3>

                                    <p className="text-gray-600 mb-2">
                                        {occurrence.descricao}
                                    </p>

                                    <div className="text-sm text-gray-500 space-y-1">
                                        <p>📍 {occurrence.endereco}</p>
                                        <p>👤 Por: {occurrence.usuarios?.nome || 'Usuário'}</p>
                                        <p>📂 Categoria: {occurrence.categorias?.nome || 'N/A'}</p>
                                        <p>📅 {new Date(occurrence.created_at).toLocaleString('pt-BR')}</p>
                                    </div>
                                </div>

                                <div className="ml-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Alterar Status:
                                    </label>
                                    <select
                                        value={occurrence.status}
                                        onChange={(e) => updateStatus(occurrence.id, e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                                    >
                                        <option value="recebido">Recebido</option>
                                        <option value="em_analise">Em Análise</option>
                                        <option value="em_atendimento">Em Atendimento</option>
                                        <option value="resolvido">Resolvido</option>
                                        <option value="rejeitado">Rejeitado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}