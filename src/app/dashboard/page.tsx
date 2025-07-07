'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, AlertTriangle, CheckCircle, Clock, FileText, Download, Calendar, MapPin } from 'lucide-react'

interface DashboardStats {
  total: number
  recebido: number
  em_analise: number
  em_atendimento: number
  resolvido: number
  rejeitado: number
}

interface CategoryData {
  categoria: string
  total: number
  resolvidas: number
  pendentes: number
}

interface TimeSeriesData {
  data: string
  criadas: number
  resolvidas: number
}

export default function EnhancedDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    recebido: 0,
    em_analise: 0,
    em_atendimento: 0,
    resolvido: 0,
    rejeitado: 0
  })
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [loading, setLoading] = useState(true)
  const [recentOccurrences, setRecentOccurrences] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Carregar estatísticas gerais
      await loadStats()
      
      // Carregar dados por categoria
      await loadCategoryData()
      
      // Carregar série temporal
      await loadTimeSeriesData()
      
      // Carregar ocorrências recentes
      await loadRecentOccurrences()
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data: occurrences } = await supabase
        .from('ocorrencias')
        .select('status')

      if (occurrences) {
        const total = occurrences.length
        const recebido = occurrences.filter(o => o.status === 'recebido').length
        const em_analise = occurrences.filter(o => o.status === 'em_analise').length
        const em_atendimento = occurrences.filter(o => o.status === 'em_atendimento').length
        const resolvido = occurrences.filter(o => o.status === 'resolvido').length
        const rejeitado = occurrences.filter(o => o.status === 'rejeitado').length

        setStats({ total, recebido, em_analise, em_atendimento, resolvido, rejeitado })
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const loadCategoryData = async () => {
    try {
      const { data: occurrences } = await supabase
        .from('ocorrencias')
        .select(`
          status,
          categorias (nome)
        `)

      if (occurrences) {
        const categoryMap = new Map<string, CategoryData>()
        
        occurrences.forEach(occ => {
          const categoria = occ.categorias?.nome || 'Sem categoria'
          
          if (!categoryMap.has(categoria)) {
            categoryMap.set(categoria, {
              categoria,
              total: 0,
              resolvidas: 0,
              pendentes: 0
            })
          }
          
          const data = categoryMap.get(categoria)!
          data.total++
          
          if (occ.status === 'resolvido') {
            data.resolvidas++
          } else {
            data.pendentes++
          }
        })
        
        setCategoryData(Array.from(categoryMap.values()).sort((a, b) => b.total - a.total))
      }
    } catch (error) {
      console.error('Erro ao carregar dados por categoria:', error)
    }
  }

  const loadTimeSeriesData = async () => {
    try {
      const { data: occurrences } = await supabase
        .from('ocorrencias')
        .select('created_at, status')
        .order('created_at', { ascending: true })

      if (occurrences) {
        const dailyData = new Map<string, { criadas: number; resolvidas: number }>()
        
        occurrences.forEach(occ => {
          const date = new Date(occ.created_at).toLocaleDateString('pt-BR')
          
          if (!dailyData.has(date)) {
            dailyData.set(date, { criadas: 0, resolvidas: 0 })
          }
          
          const data = dailyData.get(date)!
          data.criadas++
          
          if (occ.status === 'resolvido') {
            data.resolvidas++
          }
        })
        
        const sortedData = Array.from(dailyData.entries())
          .slice(-30) // Últimos 30 dias
          .map(([data, values]) => ({
            data,
            criadas: values.criadas,
            resolvidas: values.resolvidas
          }))
        
        setTimeSeriesData(sortedData)
      }
    } catch (error) {
      console.error('Erro ao carregar série temporal:', error)
    }
  }

  const loadRecentOccurrences = async () => {
    try {
      const { data } = await supabase
        .from('ocorrencias')
        .select(`
          id,
          protocolo,
          titulo,
          status,
          created_at,
          endereco,
          usuarios (nome),
          categorias (nome)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (data) {
        setRecentOccurrences(data)
      }
    } catch (error) {
      console.error('Erro ao carregar ocorrências recentes:', error)
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

  const exportToCSV = () => {
    const csvData = [
      ['Status', 'Quantidade'],
      ['Total', stats.total],
      ['Recebido', stats.recebido],
      ['Em Análise', stats.em_analise],
      ['Em Atendimento', stats.em_atendimento],
      ['Resolvido', stats.resolvido],
      ['Rejeitado', stats.rejeitado]
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `relatorio-ocorrencias-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Dados para gráficos
  const statusChartData = [
    { name: 'Recebido', value: stats.recebido, color: '#3B82F6' },
    { name: 'Em Análise', value: stats.em_analise, color: '#F59E0B' },
    { name: 'Em Atendimento', value: stats.em_atendimento, color: '#8B5CF6' },
    { name: 'Resolvido', value: stats.resolvido, color: '#10B981' },
    { name: 'Rejeitado', value: stats.rejeitado, color: '#EF4444' }
  ]

  const resolutionRate = stats.total > 0 ? ((stats.resolvido / stats.total) * 100).toFixed(1) : '0'
  const pendingTotal = stats.recebido + stats.em_analise + stats.em_atendimento

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral e relatórios das ocorrências</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            Atualizar
          </button>
          
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Ocorrências</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Todas as solicitações registradas</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingTotal}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Aguardando resolução</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolvidas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolvido}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Concluídas com sucesso</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Resolução</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{resolutionRate}%</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">Percentual de conclusão</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Status */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: any) => [`${value} ocorrências`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {statusChartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Categorias */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Ocorrências por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="categoria" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#3B82F6" name="Total" />
              <Bar dataKey="resolvidas" fill="#10B981" name="Resolvidas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Tendência Temporal */}
      {timeSeriesData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tendência dos Últimos 30 Dias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="data" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="criadas" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Criadas"
              />
              <Line 
                type="monotone" 
                dataKey="resolvidas" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Resolvidas"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ocorrências Recentes */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Ocorrências Recentes</h3>
          <a 
            href="/dashboard/ocorrencias"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todas →
          </a>
        </div>

        <div className="space-y-4">
          {recentOccurrences.map((occurrence) => (
            <div key={occurrence.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                    #{occurrence.protocolo}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(occurrence.status)}`}>
                    {getStatusText(occurrence.status)}
                  </span>
                </div>
                
                <h4 className="font-medium text-gray-900 truncate mb-1">
                  {occurrence.titulo}
                </h4>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{occurrence.endereco}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(occurrence.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {recentOccurrences.length === 0 && (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma ocorrência encontrada</p>
          </div>
        )}
      </div>

      {/* Resumo de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Eficiência Operacional</h4>
          <p className="text-3xl font-bold mb-1">{resolutionRate}%</p>
          <p className="text-blue-100 text-sm">Taxa de resolução geral</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Demanda Atual</h4>
          <p className="text-3xl font-bold mb-1">{pendingTotal}</p>
          <p className="text-green-100 text-sm">Ocorrências pendentes</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Categorias Ativas</h4>
          <p className="text-3xl font-bold mb-1">{categoryData.length}</p>
          <p className="text-purple-100 text-sm">Tipos de problemas reportados</p>
        </div>
      </div>
    </div>
  )
}