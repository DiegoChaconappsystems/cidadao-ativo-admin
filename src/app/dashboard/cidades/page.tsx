'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, MapPin, Users } from 'lucide-react'

interface Cidade {
  id: string
  codigo_ibge: string
  nome: string
  estado_id: string
  ativo: boolean
  created_at: string
  estados: {
    nome: string
    uf: string
  }
  prefeituras: Array<{
    id: string
    nome: string
  }>
}

interface Estado {
  id: string
  nome: string
  uf: string
}

export default function CidadesPage() {
  const [cidades, setCidades] = useState<Cidade[]>([])
  const [estados, setEstados] = useState<Estado[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCidade, setEditingCidade] = useState<Cidade | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    estado_id: '',
    codigo_ibge: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carregar cidades
      const { data: cidadesData, error: cidadesError } = await supabase
        .from('municipios')
        .select(`
          id,
          codigo_ibge,
          nome,
          estado_id,
          ativo,
          created_at,
          estados (
            nome,
            uf
          ),
          prefeituras (
            id,
            nome
          )
        `)
        .order('nome')

      if (cidadesError) throw cidadesError

      // Carregar estados
      const { data: estadosData, error: estadosError } = await supabase
        .from('estados')
        .select('id, nome, uf')
        .order('nome')

      if (estadosError) throw estadosError

      setCidades(cidadesData || [])
      setEstados(estadosData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCidade) {
        // Atualizar cidade
        const { error } = await supabase
          .from('municipios')
          .update({
            nome: formData.nome,
            estado_id: formData.estado_id,
            codigo_ibge: formData.codigo_ibge,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCidade.id)

        if (error) throw error
      } else {
        // Criar nova cidade
        const { error } = await supabase
          .from('municipios')
          .insert([{
            nome: formData.nome,
            estado_id: formData.estado_id,
            codigo_ibge: formData.codigo_ibge,
            ativo: true
          }])

        if (error) throw error
      }

      await loadData()
      setShowModal(false)
      setEditingCidade(null)
      setFormData({ nome: '', estado_id: '', codigo_ibge: '' })
    } catch (error: any) {
      console.error('Erro ao salvar cidade:', error)
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const handleEdit = (cidade: Cidade) => {
    setEditingCidade(cidade)
    setFormData({
      nome: cidade.nome,
      estado_id: cidade.estado_id,
      codigo_ibge: cidade.codigo_ibge
    })
    setShowModal(true)
  }

  const handleDelete = async (cidade: Cidade) => {
    if (!confirm(`Tem certeza que deseja excluir a cidade ${cidade.nome}?`)) return

    try {
      const { error } = await supabase
        .from('municipios')
        .delete()
        .eq('id', cidade.id)

      if (error) throw error

      await loadData()
    } catch (error: any) {
      console.error('Erro ao excluir cidade:', error)
      alert(`Erro ao excluir: ${error.message}`)
    }
  }

  const toggleAtivo = async (cidade: Cidade) => {
    try {
      const { error } = await supabase
        .from('municipios')
        .update({ ativo: !cidade.ativo })
        .eq('id', cidade.id)

      if (error) throw error

      await loadData()
    } catch (error: any) {
      console.error('Erro ao alterar status:', error)
      alert(`Erro ao alterar status: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Cidades</h1>
          <p className="text-gray-600">Cadastre e gerencie as cidades do sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Cidade</span>
        </button>
      </div>

      {/* Lista de Cidades */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-medium text-gray-900">
            {cidades.length} cidade(s) cadastrada(s)
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {cidades.map((cidade) => (
            <div key={cidade.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{cidade.nome}</h3>
                    <p className="text-sm text-gray-600">
                      {cidade.estados?.nome} ({cidade.estados?.uf}) • IBGE: {cidade.codigo_ibge}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        cidade.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {cidade.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>{cidade.prefeituras?.length || 0} prefeitura(s)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleAtivo(cidade)}
                  className={`px-3 py-1 rounded text-sm ${
                    cidade.ativo
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {cidade.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleEdit(cidade)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(cidade)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingCidade ? 'Editar Cidade' : 'Nova Cidade'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Cidade
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Ex: Jaú"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  required
                  value={formData.estado_id}
                  onChange={(e) => setFormData({...formData, estado_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Selecione um estado</option>
                  {estados.map((estado) => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nome} ({estado.uf})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código IBGE
                </label>
                <input
                  type="text"
                  required
                  value={formData.codigo_ibge}
                  onChange={(e) => setFormData({...formData, codigo_ibge: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Ex: 3525904"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCidade(null)
                    setFormData({ nome: '', estado_id: '', codigo_ibge: '' })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingCidade ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}