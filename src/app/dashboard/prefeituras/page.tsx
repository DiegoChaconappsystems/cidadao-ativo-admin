'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, Building2, MapPin, Mail, Phone, Users } from 'lucide-react'

interface Prefeitura {
  id: string
  nome: string
  municipio_id: string
  cnpj?: string
  email?: string
  telefone?: string
  endereco?: string
  responsavel?: string
  is_active: boolean
  created_at: string
  municipios: {
    nome: string
    estados: {
      uf: string
    }
  }
  usuarios_admin: Array<{
    nome: string
    email: string
    ativo: boolean
  }>
}

interface Municipio {
  id: string
  nome: string
  estados: {
    nome: string
    uf: string
  }
}

export default function PrefeiturasPage() {
  const [prefeituras, setPrefeituras] = useState<Prefeitura[]>([])
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPrefeitura, setEditingPrefeitura] = useState<Prefeitura | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    municipio_id: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    responsavel: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carregar prefeituras
      const { data: prefeiturasData, error: prefeiturasError } = await supabase
        .from('prefeituras')
        .select(`
          id,
          nome,
          municipio_id,
          cnpj,
          email,
          telefone,
          endereco,
          responsavel,
          is_active,
          created_at,
          municipios (
            nome,
            estados (
              uf
            )
          ),
          usuarios_admin (
            nome,
            email,
            ativo
          )
        `)
        .order('nome')

      if (prefeiturasError) throw prefeiturasError

      // Carregar municípios para o select
      const { data: municipiosData, error: municipiosError } = await supabase
        .from('municipios')
        .select(`
          id,
          nome,
          estados (
            nome,
            uf
          )
        `)
        .eq('ativo', true)
        .order('nome')

      if (municipiosError) throw municipiosError

      setPrefeituras(prefeiturasData || [])
      setMunicipios(municipiosData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingPrefeitura) {
        // Atualizar prefeitura
        const { error } = await supabase
          .from('prefeituras')
          .update({
            nome: formData.nome,
            municipio_id: formData.municipio_id,
            cnpj: formData.cnpj,
            email: formData.email,
            telefone: formData.telefone,
            endereco: formData.endereco,
            responsavel: formData.responsavel,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingPrefeitura.id)

        if (error) throw error
      } else {
        // Criar nova prefeitura
        const { error } = await supabase
          .from('prefeituras')
          .insert([{
            nome: formData.nome,
            municipio_id: formData.municipio_id,
            cnpj: formData.cnpj,
            email: formData.email,
            telefone: formData.telefone,
            endereco: formData.endereco,
            responsavel: formData.responsavel,
            is_active: true
          }])

        if (error) throw error
      }

      await loadData()
      setShowModal(false)
      setEditingPrefeitura(null)
      setFormData({
        nome: '',
        municipio_id: '',
        cnpj: '',
        email: '',
        telefone: '',
        endereco: '',
        responsavel: ''
      })
      
      alert(editingPrefeitura ? 'Prefeitura atualizada com sucesso!' : 'Prefeitura criada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar prefeitura:', error)
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const handleEdit = (prefeitura: Prefeitura) => {
    setEditingPrefeitura(prefeitura)
    setFormData({
      nome: prefeitura.nome,
      municipio_id: prefeitura.municipio_id,
      cnpj: prefeitura.cnpj || '',
      email: prefeitura.email || '',
      telefone: prefeitura.telefone || '',
      endereco: prefeitura.endereco || '',
      responsavel: prefeitura.responsavel || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (prefeitura: Prefeitura) => {
    if (!confirm(`Tem certeza que deseja excluir a prefeitura ${prefeitura.nome}?`)) return

    try {
      const { error } = await supabase
        .from('prefeituras')
        .delete()
        .eq('id', prefeitura.id)

      if (error) throw error

      await loadData()
      alert('Prefeitura excluída com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir prefeitura:', error)
      alert(`Erro ao excluir: ${error.message}`)
    }
  }

  const toggleAtivo = async (prefeitura: Prefeitura) => {
    try {
      const { error } = await supabase
        .from('prefeituras')
        .update({ is_active: !prefeitura.is_active })
        .eq('id', prefeitura.id)

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
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Prefeituras</h1>
          <p className="text-gray-600">Cadastre e gerencie as prefeituras do sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Prefeitura</span>
        </button>
      </div>

      {/* Lista de Prefeituras */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-medium text-gray-900">
            {prefeituras.length} prefeitura(s) cadastrada(s)
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {prefeituras.map((prefeitura) => (
            <div key={prefeitura.id} className="px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                      <Building2 className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{prefeitura.nome}</h3>
                      
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {prefeitura.municipios.nome}/{prefeitura.municipios.estados.uf}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        {prefeitura.email && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span>{prefeitura.email}</span>
                          </div>
                        )}
                        
                        {prefeitura.telefone && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{prefeitura.telefone}</span>
                          </div>
                        )}
                        
                        {prefeitura.responsavel && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Users className="h-4 w-4" />
                            <span>Responsável: {prefeitura.responsavel}</span>
                          </div>
                        )}
                        
                        {prefeitura.cnpj && (
                          <div className="text-sm text-gray-600">
                            <span>CNPJ: {prefeitura.cnpj}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 mt-3">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          prefeitura.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {prefeitura.is_active ? 'Ativo' : 'Inativo'}
                        </span>

                        <div className="text-sm text-gray-500">
                          {prefeitura.usuarios_admin?.length || 0} administrador(es)
                        </div>
                      </div>

                      {/* Lista de Administradores */}
                      {prefeitura.usuarios_admin && prefeitura.usuarios_admin.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Administradores:</h4>
                          <div className="space-y-1">
                            {prefeitura.usuarios_admin.map((admin, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <span className="text-gray-900">{admin.nome}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500">{admin.email}</span>
                                  <span className={`px-1 py-0.5 text-xs rounded ${
                                    admin.ativo 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {admin.ativo ? 'Ativo' : 'Inativo'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => toggleAtivo(prefeitura)}
                    className={`px-3 py-1 rounded text-sm ${
                      prefeitura.is_active
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {prefeitura.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleEdit(prefeitura)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(prefeitura)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingPrefeitura ? 'Editar Prefeitura' : 'Nova Prefeitura'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Prefeitura *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Prefeitura Municipal de..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Município *
                </label>
                <select
                  required
                  value={formData.municipio_id}
                  onChange={(e) => setFormData({...formData, municipio_id: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Selecione um município</option>
                  {municipios.map((municipio) => (
                    <option key={municipio.id} value={municipio.id}>
                      {municipio.nome} - {municipio.estados.nome} ({municipio.estados.uf})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="(14) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="contato@prefeitura.gov.br"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <textarea
                  value={formData.endereco}
                  onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Endereço completo da prefeitura"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingPrefeitura(null)
                    setFormData({
                      nome: '',
                      municipio_id: '',
                      cnpj: '',
                      email: '',
                      telefone: '',
                      endereco: '',
                      responsavel: ''
                    })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingPrefeitura ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}