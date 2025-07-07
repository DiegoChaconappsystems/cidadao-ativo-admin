'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Filter, RefreshCw, MapPin, User, Calendar, Eye } from 'lucide-react'

interface Occurrence {
    id: string
    protocolo: string
    titulo: string
    descricao: string
    status: string
    endereco: string
    latitude?: number
    longitude?: number
    fotos?: string[]
    created_at: string
    updated_at?: string
    usuarios: { nome: string; telefone?: string }
    categorias: { nome: string; icone?: string; cor?: string }
}

export default function OcorrenciasPage() {
    const [occurrences, setOccurrences] = useState<Occurrence[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('todas')
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedOccurrence, setSelectedOccurrence] = useState<Occurrence | null>(null)

    useEffect(() => {
        loadOccurrences()
    }, [])

    const loadOccurrences = async () => {
        setLoading(true)
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
                    latitude,
                    longitude,
                    fotos,
                    created_at,
                    updated_at,
                    usuarios (nome, telefone),
                    categorias (nome, icone, cor)
                `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setOccurrences(data || [])
        } catch (error) {
            console.error('Erro ao carregar ocorrências:', error)
            alert('Erro ao carregar ocorrências. Verifique a conexão.')
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id: string, newStatus: string) => {
        const statusText = getStatusText(newStatus)
        const confirmed = window.confirm(`Alterar status para: ${statusText}?`)
        if (!confirmed) return

        try {
            // Verificar autenticação
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                alert('Sessão expirada. Faça login novamente.')
                return
            }

            // Atualizar no banco
            const { data, error } = await supabase
                .from('ocorrencias')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('id, status, protocolo')

            if (error) {
                throw new Error(`Erro do banco: ${error.message}`)
            }

            if (!data || data.length === 0) {
                throw new Error('Nenhum registro foi atualizado')
            }

            // Atualizar interface
            setOccurrences(prevOccurrences =>
                prevOccurrences.map(occ =>
                    occ.id === id ? { ...occ, status: newStatus, updated_at: new Date().toISOString() } : occ
                )
            )

            alert(`✅ Status alterado para: ${statusText}`)

        } catch (error: any) {
            console.error('Erro completo:', error)
            alert(`❌ Erro: ${error.message}`)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'recebido': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'em_analise': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'em_atendimento': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'resolvido': return 'bg-green-100 text-green-800 border-green-200'
            case 'rejeitado': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
        const matchesFilter = filter === 'todas' || occ.status === filter
        const matchesSearch = searchTerm === '' || 
            occ.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            occ.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            occ.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
            occ.usuarios?.nome.toLowerCase().includes(searchTerm.toLowerCase())
        
        return matchesFilter && matchesSearch
    })

    const getStatusCount = (status: string) => {
        if (status === 'todas') return occurrences.length
        return occurrences.filter(occ => occ.status === status).length
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando ocorrências...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Ocorrências</h1>
                    <p className="text-gray-600">Visualize e gerencie todas as solicitações dos cidadãos</p>
                </div>

                <button
                    onClick={loadOccurrences}
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-600">Total</h3>
                    <p className="text-2xl font-bold text-blue-600">{getStatusCount('todas')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-600">Recebidas</h3>
                    <p className="text-2xl font-bold text-blue-600">{getStatusCount('recebido')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-600">Em Análise</h3>
                    <p className="text-2xl font-bold text-yellow-600">{getStatusCount('em_analise')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-600">Em Atendimento</h3>
                    <p className="text-2xl font-bold text-purple-600">{getStatusCount('em_atendimento')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-600">Resolvidas</h3>
                    <p className="text-2xl font-bold text-green-600">{getStatusCount('resolvido')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow border">
                    <h3 className="text-sm font-medium text-gray-600">Rejeitadas</h3>
                    <p className="text-2xl font-bold text-red-600">{getStatusCount('rejeitado')}</p>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Busca */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por protocolo, título, endereço ou usuário..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Filtro de Status */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="todas">Todas ({getStatusCount('todas')})</option>
                            <option value="recebido">Recebidas ({getStatusCount('recebido')})</option>
                            <option value="em_analise">Em Análise ({getStatusCount('em_analise')})</option>
                            <option value="em_atendimento">Em Atendimento ({getStatusCount('em_atendimento')})</option>
                            <option value="resolvido">Resolvidas ({getStatusCount('resolvido')})</option>
                            <option value="rejeitado">Rejeitadas ({getStatusCount('rejeitado')})</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de Ocorrências */}
            <div className="bg-white shadow rounded-lg border overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50">
                    <h2 className="font-semibold text-gray-900">
                        {filteredOccurrences.length} ocorrência(s) encontrada(s)
                    </h2>
                </div>

                {filteredOccurrences.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">Nenhuma ocorrência encontrada com os filtros aplicados.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredOccurrences.map((occurrence) => (
                            <div key={occurrence.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                    {/* Informações principais */}
                                    <div className="flex-1 space-y-3">
                                        {/* Header da ocorrência */}
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                #{occurrence.protocolo}
                                            </span>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(occurrence.status)}`}>
                                                {getStatusText(occurrence.status)}
                                            </span>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {occurrence.categorias?.nome || 'Sem categoria'}
                                            </span>
                                        </div>

                                        {/* Título e descrição */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {occurrence.titulo}
                                            </h3>
                                            <p className="text-gray-600 text-sm line-clamp-2">
                                                {occurrence.descricao}
                                            </p>
                                        </div>

                                        {/* Metadados */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate">{occurrence.endereco}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 flex-shrink-0" />
                                                <span>{occurrence.usuarios?.nome || 'Usuário anônimo'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                                <span>{new Date(occurrence.created_at).toLocaleString('pt-BR')}</span>
                                            </div>
                                        </div>

                                        {/* Fotos (se houver) */}
                                        {occurrence.fotos && occurrence.fotos.length > 0 && (
                                            <div className="text-sm text-blue-600">
                                                📸 {occurrence.fotos.length} foto(s) anexada(s)
                                            </div>
                                        )}
                                    </div>

                                    {/* Ações */}
                                    <div className="flex flex-col gap-3 lg:w-48">
                                        {/* Alterar Status */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Alterar Status:
                                            </label>
                                            <select
                                                value={occurrence.status}
                                                onChange={(e) => updateStatus(occurrence.id, e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="recebido">Recebido</option>
                                                <option value="em_analise">Em Análise</option>
                                                <option value="em_atendimento">Em Atendimento</option>
                                                <option value="resolvido">Resolvido</option>
                                                <option value="rejeitado">Rejeitado</option>
                                            </select>
                                        </div>

                                        {/* Botão Ver Detalhes */}
                                        <button
                                            onClick={() => setSelectedOccurrence(occurrence)}
                                            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                        >
                                            <Eye className="h-4 w-4" />
                                            Ver Detalhes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Detalhes (Simples) */}
            {selectedOccurrence && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Detalhes da Ocorrência #{selectedOccurrence.protocolo}
                                </h2>
                                <button
                                    onClick={() => setSelectedOccurrence(null)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{selectedOccurrence.titulo}</h3>
                                    <p className="text-gray-600 mt-1">{selectedOccurrence.descricao}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Status:</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedOccurrence.status)}`}>
                                            {getStatusText(selectedOccurrence.status)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Categoria:</span>
                                        <span className="ml-2 text-gray-600">{selectedOccurrence.categorias?.nome || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Usuário:</span>
                                        <span className="ml-2 text-gray-600">{selectedOccurrence.usuarios?.nome || 'N/A'}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Telefone:</span>
                                        <span className="ml-2 text-gray-600">{selectedOccurrence.usuarios?.telefone || 'N/A'}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="font-medium text-gray-700">Endereço:</span>
                                    <p className="text-gray-600 mt-1">{selectedOccurrence.endereco}</p>
                                </div>

                                {selectedOccurrence.latitude && selectedOccurrence.longitude && (
                                    <div>
                                        <span className="font-medium text-gray-700">Coordenadas:</span>
                                        <p className="text-gray-600 mt-1">
                                            Lat: {selectedOccurrence.latitude}, Lng: {selectedOccurrence.longitude}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Criado em:</span>
                                        <p className="text-gray-600 mt-1">
                                            {new Date(selectedOccurrence.created_at).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                    {selectedOccurrence.updated_at && (
                                        <div>
                                            <span className="font-medium text-gray-700">Atualizado em:</span>
                                            <p className="text-gray-600 mt-1">
                                                {new Date(selectedOccurrence.updated_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {selectedOccurrence.fotos && selectedOccurrence.fotos.length > 0 && (
                                    <div>
                                        <span className="font-medium text-gray-700">Fotos anexadas:</span>
                                        <p className="text-gray-600 mt-1">
                                            {selectedOccurrence.fotos.length} arquivo(s) de imagem
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setSelectedOccurrence(null)}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}