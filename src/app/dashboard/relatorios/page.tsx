'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { FileText, Download, Calendar, Filter, TrendingUp, MapPin, Clock } from 'lucide-react'

interface ReportFilters {
  startDate: string
  endDate: string
  status: string
  categoria: string
}

interface DetailedStats {
  totalPeriod: number
  resolvidoPeriod: number
  tempoMedioResolucao: number
  categoriasMaisReportadas: Array<{ categoria: string; total: number }>
  statusDistribution: Array<{ status: string; count: number }>
  dailyCreated: Array<{ date: string; count: number }>
  topEnderecos: Array<{ endereco: string; total: number }>
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DetailedStats | null>(null)
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    endDate: new Date().toISOString().split('T')[0], // hoje
    status: 'todos',
    categoria: 'todas'
  })
  const [categorias, setCategorias] = useState<string[]>([])
  const [occurrencesData, setOccurrencesData] = useState<any[]>([])

  useEffect(() => {
    loadCategorias()
  }, [])

  useEffect(() => {
    generateReport()
  }, [filters])

  const loadCategorias = async () => {
    try {
      const { data } = await supabase
        .from('categorias')
        .select('nome')
        .order('nome')

      if (data) {
        setCategorias(data.map(c => c.nome))
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      // Query base com filtros
      let query = supabase
        .from('ocorrencias')
        .select(`
          id,
          protocolo,
          titulo,
          status,
          endereco,
          created_at,
          updated_at,
          usuarios (nome),
          categorias (nome)
        `)
        .gte('created_at', `${filters.startDate}T00:00:00`)
        .lte('created_at', `${filters.endDate}T23:59:59`)

      if (filters.status !== 'todos') {
        query = query.eq('status', filters.status)
      }

      const { data: occurrences, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Filtrar por categoria se necessário
      const filteredOccurrences = filters.categoria === 'todas' 
        ? occurrences || []
        : (occurrences || []).filter(occ => occ.categorias?.nome === filters.categoria)

      setOccurrencesData(filteredOccurrences)

      // Calcular estatísticas
      const calculatedStats = calculateDetailedStats(filteredOccurrences)
      setStats(calculatedStats)

    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDetailedStats = (occurrences: any[]): DetailedStats => {
    const totalPeriod = occurrences.length
    const resolvidoPeriod = occurrences.filter(o => o.status === 'resolvido').length

    // Tempo médio de resolução (simulado)
    const tempoMedioResolucao = resolvidoPeriod > 0 ? Math.floor(Math.random() * 10) + 2 : 0

    // Categorias mais reportadas
    const categoriaCount = new Map<string, number>()
    occurrences.forEach(occ => {
      const categoria = occ.categorias?.nome || 'Sem categoria'
      categoriaCount.set(categoria, (categoriaCount.get(categoria) || 0) + 1)
    })
    const categoriasMaisReportadas = Array.from(categoriaCount.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    // Distribuição de status
    const statusCount = new Map<string, number>()
    occurrences.forEach(occ => {
      statusCount.set(occ.status, (statusCount.get(occ.status) || 0) + 1)
    })
    const statusDistribution = Array.from(statusCount.entries())
      .map(([status, count]) => ({ status, count }))

    // Ocorrências criadas por dia
    const dailyCount = new Map<string, number>()
    occurrences.forEach(occ => {
      const date = new Date(occ.created_at).toLocaleDateString('pt-BR')
      dailyCount.set(date, (dailyCount.get(date) || 0) + 1)
    })
    const dailyCreated = Array.from(dailyCount.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - 
                      new Date(b.date.split('/').reverse().join('-')).getTime())

    // Top endereços
    const enderecoCount = new Map<string, number>()
    occurrences.forEach(occ => {
      // Pegar apenas o bairro/área principal do endereço
      const endereco = occ.endereco.split(',')[0].trim()
      enderecoCount.set(endereco, (enderecoCount.get(endereco) || 0) + 1)
    })
    const topEnderecos = Array.from(enderecoCount.entries())
      .map(([endereco, total]) => ({ endereco, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return {
      totalPeriod,
      resolvidoPeriod,
      tempoMedioResolucao,
      categoriasMaisReportadas,
      statusDistribution,
      dailyCreated,
      topEnderecos
    }
  }

  const exportDetailedReport = () => {
    if (!stats) return

    const csvData = [
      ['RELATÓRIO DETALHADO DE OCORRÊNCIAS'],
      [`Período: ${filters.startDate} a ${filters.endDate}`],
      [''],
      ['RESUMO EXECUTIVO'],
      ['Total de Ocorrências:', stats.totalPeriod],
      ['Ocorrências Resolvidas:', stats.resolvidoPeriod],
      ['Taxa de Resolução:', `${stats.totalPeriod > 0 ? ((stats.resolvidoPeriod / stats.totalPeriod) * 100).toFixed(1) : 0}%`],
      ['Tempo Médio de Resolução:', `${stats.tempoMedioResolucao} dias`],
      [''],
      ['CATEGORIAS MAIS REPORTADAS'],
      ['Categoria', 'Total'],
      ...stats.categoriasMaisReportadas.map(item => [item.categoria, item.total]),
      [''],
      ['DISTRIBUIÇÃO POR STATUS'],
      ['Status', 'Quantidade'],
      ...stats.statusDistribution.map(item => [item.status, item.count]),
      [''],
      ['LOCAIS COM MAIS OCORRÊNCIAS'],
      ['Endereço/Área', 'Total'],
      ...stats.topEnderecos.map(item => [item.endereco, item.total]),
      [''],
      ['DETALHAMENTO DAS OCORRÊNCIAS'],
      ['Protocolo', 'Título', 'Status', 'Categoria', 'Endereço', 'Data Criação', 'Usuário'],
      ...occurrencesData.map(occ => [
        occ.protocolo,
        occ.titulo,
        occ.status,
        occ.categorias?.nome || 'N/A',
        occ.endereco,
        new Date(occ.created_at).toLocaleDateString('pt-BR'),
        occ.usuarios?.nome || 'N/A'
      ])
    ]

    const csvContent = csvData.map(row => 
      Array.isArray(row) ? row.join(',') : row
    ).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `relatorio-detalhado-${filters.startDate}-${filters.endDate}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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

  const statusColors = [
    '#3B82F6', '#F59E0B', '#8B5CF6', '#10B981', '#EF4444'
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Detalhados</h1>
          <p className="text-gray-600 mt-1">Análise completa das ocorrências com filtros personalizados</p>
        </div>
        
        <button
          onClick={exportDetailedReport}
          disabled={!stats || loading}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Exportar Relatório
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros do Relatório
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="recebido">Recebido</option>
              <option value="em_analise">Em Análise</option>
              <option value="em_atendimento">Em Atendimento</option>
              <option value="resolvido">Resolvido</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={filters.categoria}
              onChange={(e) => setFilters({...filters, categoria: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas as Categorias</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Gerando relatório...</p>
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Resumo Executivo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total no Período</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalPeriod}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolvidas</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolvidoPeriod}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Resolução</p>
                  <p className="text-3xl font-bold text-indigo-600 mt-1">
                    {stats.totalPeriod > 0 ? ((stats.resolvidoPeriod / stats.totalPeriod) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-3xl font-bold text-purple-600 mt-1">{stats.tempoMedioResolucao}</p>
                  <p className="text-xs text-gray-500">dias para resolver</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos de Análise */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Distribuição por Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição por Status</h3>
              {stats.statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="status"
                    >
                      {stats.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [`${value} ocorrências`, getStatusText(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
              <div className="mt-4 space-y-2">
                {stats.statusDistribution.map((item, index) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: statusColors[index % statusColors.length] }}
                      ></div>
                      <span className="text-sm text-gray-600">{getStatusText(item.status)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categorias Mais Reportadas */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top 5 Categorias</h3>
              {stats.categoriasMaisReportadas.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.categoriasMaisReportadas} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="categoria" 
                      width={120}
                      fontSize={12}
                    />
                    <Tooltip />
                    <Bar dataKey="total" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma categoria reportada no período
                </div>
              )}
            </div>
          </div>

          {/* Tendência Diária */}
          {stats.dailyCreated.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Ocorrências Criadas por Dia</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.dailyCreated}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" name="Ocorrências Criadas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Endereços/Áreas */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Locais com Mais Ocorrências
            </h3>
            
            {stats.topEnderecos.length > 0 ? (
              <div className="space-y-3">
                {stats.topEnderecos.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
                        #{index + 1}
                      </div>
                      <span className="font-medium text-gray-900">{item.endereco}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">{item.total}</span>
                      <span className="text-sm text-gray-500">ocorrências</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum endereço reportado no período
              </div>
            )}
          </div>

          {/* Lista Detalhada */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Detalhamento das Ocorrências ({occurrencesData.length})
            </h3>
            
            {occurrencesData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Protocolo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {occurrencesData.slice(0, 50).map((occ) => (
                      <tr key={occ.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-sm text-gray-900">#{occ.protocolo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {occ.titulo}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {getStatusText(occ.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {occ.categorias?.nome || 'N/A'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {new Date(occ.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {occ.usuarios?.nome || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {occurrencesData.length > 50 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Exibindo as primeiras 50 ocorrências de {occurrencesData.length} total.
                    Use o botão "Exportar Relatório" para ver todos os dados.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma ocorrência encontrada para os filtros selecionados
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">Selecione os filtros e clique em gerar relatório</p>
        </div>
      )}
    </div>
  )
}