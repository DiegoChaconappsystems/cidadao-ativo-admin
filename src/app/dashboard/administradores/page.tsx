'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Edit2, Trash2, User, Shield, Mail, Building2 } from 'lucide-react'

interface Administrador {
  id: string
  email: string
  nome: string
  tipo_admin: 'super_admin' | 'admin_prefeitura'
  prefeitura_id?: string
  ativo: boolean
  created_at: string
  prefeituras?: {
    nome: string
    municipios: {
      nome: string
      estados: {
        uf: string
      }
    }
  }
}

interface Prefeitura {
  id: string
  nome: string
  municipios: {
    nome: string
    estados: {
      uf: string
    }
  }
}

export default function AdministradoresPage() {
  const [administradores, setAdministradores] = useState<Administrador[]>([])
  const [prefeituras, setPrefeituras] = useState<Prefeitura[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Administrador | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    tipo_admin: 'admin_prefeitura' as 'super_admin' | 'admin_prefeitura',
    prefeitura_id: '',
    senha: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carregar administradores
      const { data: adminsData, error: adminsError } = await supabase
        .from('usuarios_admin')
        .select(`
          id,
          email,
          nome,
          tipo_admin,
          prefeitura_id,
          ativo,
          created_at,
          prefeituras (
            nome,
            municipios (
              nome,
              estados (
                uf
              )
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (adminsError) throw adminsError

      // Carregar prefeituras para o select
      const { data: prefeiturasData, error: prefeiturasError } = await supabase
        .from('prefeituras')
        .select(`
          id,
          nome,
          municipios (
            nome,
            estados (
              uf
            )
          )
        `)
        .eq('is_active', true)
        .order('nome')

      if (prefeiturasError) throw prefeiturasError

      setAdministradores(adminsData || [])
      setPrefeituras(prefeiturasData || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingAdmin) {
        // Atualizar administrador
        const updateData: any = {
          nome: formData.nome,
          tipo_admin: formData.tipo_admin,
          prefeitura_id: formData.tipo_admin === 'super_admin' ? null : formData.prefeitura_id,
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('usuarios_admin')
          .update(updateData)
          .eq('id', editingAdmin.id)

        if (error) throw error
      } else {
        // Criar novo administrador via API
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('Sessão expirada. Faça login novamente.')
        }

        const response = await fetch('/api/admin/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            email: formData.email,
            nome: formData.nome,
            tipo_admin: formData.tipo_admin,
            prefeitura_id: formData.tipo_admin === 'super_admin' ? null : formData.prefeitura_id,
            senha: formData.senha || '123456'
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Erro ao criar administrador')
        }

        console.log('✅ Administrador criado:', result.user)
      }

      await loadData()
      setShowModal(false)
      setEditingAdmin(null)
      setFormData({ email: '', nome: '', tipo_admin: 'admin_prefeitura', prefeitura_id: '', senha: '' })
      
      alert(editingAdmin ? 'Administrador atualizado com sucesso!' : 'Administrador criado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao salvar administrador:', error)
      alert(`Erro ao salvar: ${error.message}`)
    }
  }

  const handleEdit = (admin: Administrador) => {
    setEditingAdmin(admin)
    setFormData({
      email: admin.email,
      nome: admin.nome,
      tipo_admin: admin.tipo_admin,
      prefeitura_id: admin.prefeitura_id || '',
      senha: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (admin: Administrador) => {
    if (!confirm(`Tem certeza que deseja excluir o administrador ${admin.nome}?`)) return

    try {
      // Excluir da tabela usuarios_admin
      const { error: adminError } = await supabase
        .from('usuarios_admin')
        .delete()
        .eq('id', admin.id)

      if (adminError) throw adminError

      await loadData()
      alert('Administrador excluído com sucesso!')
    } catch (error: any) {
      console.error('Erro ao excluir administrador:', error)
      alert(`Erro ao excluir: ${error.message}`)
    }
  }

  const toggleAtivo = async (admin: Administrador) => {
    try {
      const { error } = await supabase
        .from('usuarios_admin')
        .update({ ativo: !admin.ativo })
        .eq('id', admin.id)

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
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Administradores</h1>
          <p className="text-gray-600">Cadastre e gerencie os administradores do sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Administrador</span>
        </button>
      </div>

      {/* Lista de Administradores */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-medium text-gray-900">
            {administradores.length} administrador(es) cadastrado(s)
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {administradores.map((admin) => (
            <div key={admin.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-full ${
                    admin.tipo_admin === 'super_admin' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {admin.tipo_admin === 'super_admin' ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{admin.nome}</h3>
                    
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                      <Mail className="h-4 w-4" />
                      <span>{admin.email}</span>
                    </div>

                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        admin.tipo_admin === 'super_admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.tipo_admin === 'super_admin' ? 'Super Admin' : 'Admin Prefeitura'}
                      </span>

                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        admin.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.ativo ? 'Ativo' : 'Inativo'}
                      </span>

                      {admin.prefeituras && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Building2 className="h-4 w-4" />
                          <span>
                            {admin.prefeituras.nome} - {admin.prefeituras.municipios.nome}/{admin.prefeituras.municipios.estados.uf}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleAtivo(admin)}
                  className={`px-3 py-1 rounded text-sm ${
                    admin.ativo
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {admin.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleEdit(admin)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(admin)}
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
              {editingAdmin ? 'Editar Administrador' : 'Novo Administrador'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingAdmin}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 disabled:bg-gray-100"
                  placeholder="admin@prefeitura.gov.br"
                />
                {editingAdmin && (
                  <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Administrador
                </label>
                <select
                  required
                  value={formData.tipo_admin}
                  onChange={(e) => setFormData({
                    ...formData, 
                    tipo_admin: e.target.value as 'super_admin' | 'admin_prefeitura',
                    prefeitura_id: e.target.value === 'super_admin' ? '' : formData.prefeitura_id
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="admin_prefeitura">Admin Prefeitura</option>
                  <option value="super_admin">Super Administrador</option>
                </select>
              </div>

              {formData.tipo_admin === 'admin_prefeitura' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prefeitura
                  </label>
                  <select
                    required
                    value={formData.prefeitura_id}
                    onChange={(e) => setFormData({...formData, prefeitura_id: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Selecione uma prefeitura</option>
                    {prefeituras.map((prefeitura) => (
                      <option key={prefeitura.id} value={prefeitura.id}>
                        {prefeitura.nome} - {prefeitura.municipios.nome}/{prefeitura.municipios.estados.uf}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!editingAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha (mínimo 6 caracteres)
                  </label>
                  <input
                    type="password"
                    required={!editingAdmin}
                    minLength={6}
                    value={formData.senha}
                    onChange={(e) => setFormData({...formData, senha: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingAdmin(null)
                    setFormData({ email: '', nome: '', tipo_admin: 'admin_prefeitura', prefeitura_id: '', senha: '' })
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingAdmin ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}