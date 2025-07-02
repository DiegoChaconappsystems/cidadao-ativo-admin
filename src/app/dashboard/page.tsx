'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    resolvidas: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data: occurrences } = await supabase
        .from('ocorrencias')
        .select('status')

      if (occurrences) {
        const total = occurrences.length
        const resolvidas = occurrences.filter(o => o.status === 'resolvido').length
        const pendentes = total - resolvidas

        setStats({ total, pendentes, resolvidas })
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral das ocorrências</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Total de Ocorrências</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Pendentes</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pendentes}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900">Resolvidas</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.resolvidas}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Bem-vindo ao Painel Administrativo!</h2>
        <p className="text-gray-600">
          Aqui você pode gerenciar todas as ocorrências reportadas pelos cidadãos.
        </p>
      </div>
    </div>
  )
}