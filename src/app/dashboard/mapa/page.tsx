'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MapPin, Filter, RotateCcw, Eye, ExternalLink } from 'lucide-react'

interface OccurrenceMapData {
  id: string
  protocolo: string
  titulo: string
  descricao: string
  status: string
  endereco: string
  latitude: number
  longitude: number
  created_at: string
  usuarios: { nome: string } | null
  categorias: { nome: string; cor?: string } | null
}

interface MapFilters {
  status: string
  categoria: string
  periodo: string
}

export default function MapaPage() {
  const [occurrences, setOccurrences] = useState<OccurrenceMapData[]>([])
  const [filteredOccurrences, setFilteredOccurrences] = useState<OccurrenceMapData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrenceMapData | null>(null)
  const [categorias, setCategorias] = useState<string[]>([])
  const [filters, setFilters] = useState<MapFilters>({
    status: 'todas',
    categoria: 'todas',
    periodo: '30'
  })
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    loadMapData()
    loadCategorias()
    loadMap()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [occurrences, filters])

  useEffect(() => {
    if (mapLoaded && filteredOccurrences.length > 0) {
      updateMapWithMarkers()
    }
  }, [filteredOccurrences, mapLoaded])

  const loadMap = () => {
    // Carregar mapa usando HTML simples com iframe do OpenStreetMap
    setTimeout(() => {
      setMapLoaded(true)
    }, 1000)
  }

  const updateMapWithMarkers = () => {
    // Atualizar o iframe com as coordenadas
    const mapContainer = document.getElementById('map-iframe') as HTMLIFrameElement
    if (mapContainer && filteredOccurrences.length > 0) {
      const firstOcc = filteredOccurrences[0]
      const lat = firstOcc.latitude
      const lng = firstOcc.longitude
      const zoom = 13
      
      // URL do OpenStreetMap com marcador
      const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`
      mapContainer.src = mapUrl
    }
  }

  const loadMapData = async () => {
    setLoading(true)
    try {
      const daysAgo = parseInt(filters.periodo)
      const dateLimit = new Date()
      dateLimit.setDate(dateLimit.getDate() - daysAgo)

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
          created_at,
          usuarios (nome),
          categorias (nome, cor)
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .gte('created_at', dateLimit.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      const validOccurrences: OccurrenceMapData[] = (data || [])
        .filter(occ => 
          occ.latitude && occ.longitude && 
          Math.abs(occ.latitude) <= 90 && Math.abs(occ.longitude) <= 180
        )
        .map(occ => ({
          id: occ.id,
          protocolo: occ.protocolo,
          titulo: occ.titulo,
          descricao: occ.descricao,
          status: occ.status,
          endereco: occ.endereco,
          latitude: Number(occ.latitude),
          longitude: Number(occ.longitude),
          created_at: occ.created_at,
          usuarios: Array.isArray(occ.usuarios) && occ.usuarios.length > 0 ? occ.usuarios[0] : null,
          categorias: Array.isArray(occ.categorias) && occ.categorias.length > 0 ? occ.categorias[0] : null
        }))

      console.log('Ocorrências carregadas:', validOccurrences.length)
      setOccurrences(validOccurrences)

    } catch (error) {
      console.error('Erro ao carregar dados do mapa:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const applyFilters = () => {
    let filtered = [...occurrences]

    if (filters.status !== 'todas') {
      filtered = filtered.filter(occ => occ.status === filters.status)
    }

    if (filters.categoria !== 'todas') {
      filtered = filtered.filter(occ => occ.categorias?.nome === filters.categoria)
    }

    setFilteredOccurrences(filtered)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'recebido': return '🔵'
      case 'em_analise': return '🟡'
      case 'em_atendimento': return '🟣'
      case 'resolvido': return '🟢'
      case 'rejeitado': return '🔴'
      default: return '⚪'
    }
  }

  const openInGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, '_blank')
  }

  const centerMapOnOccurrence = (occurrence: OccurrenceMapData) => {
    const mapContainer = document.getElementById('map-iframe') as HTMLIFrameElement
    if (mapContainer) {
      const lat = occurrence.latitude
      const lng = occurrence.longitude
      const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.005},${lat-0.005},${lng+0.005},${lat+0.005}&layer=mapnik&marker=${lat},${lng}`
      mapContainer.src = mapUrl
    }
    setSelectedOccurrence(occurrence)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-8 w-8 text-blue-600" />
            Mapa de Ocorrências
          </h1>
          <p className="text-gray-600 mt-1">Visualização geográfica e interativa das solicitações</p>
        </div>
        
        <button
          onClick={loadMapData}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">Total no Mapa</h3>
          <p className="text-2xl font-bold text-blue-600">{filteredOccurrences.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">🔵 Recebidas</h3>
          <p className="text-2xl font-bold text-blue-600">
            {filteredOccurrences.filter(o => o.status === 'recebido').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">🟡 Em Análise</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {filteredOccurrences.filter(o => o.status === 'em_analise').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">🟣 Em Atendimento</h3>
          <p className="text-2xl font-bold text-purple-600">
            {filteredOccurrences.filter(o => o.status === 'em_atendimento').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">🟢 Resolvidas</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredOccurrences.filter(o => o.status === 'resolvido').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-600">🔴 Rejeitadas</h3>
          <p className="text-2xl font-bold text-red-600">
            {filteredOccurrences.filter(o => o.status === 'rejeitado').length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros do Mapa</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="todas">Todos os Status</option>
            <option value="recebido">🔵 Recebido</option>
            <option value="em_analise">🟡 Em Análise</option>
            <option value="em_atendimento">🟣 Em Atendimento</option>
            <option value="resolvido">🟢 Resolvido</option>
            <option value="rejeitado">🔴 Rejeitado</option>
          </select>

          <select
            value={filters.categoria}
            onChange={(e) => setFilters({...filters, categoria: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="todas">Todas as Categorias</option>
            {categorias.map(categoria => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>

          <select
            value={filters.periodo}
            onChange={(e) => setFilters({...filters, periodo: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
        </div>
      </div>

      {/* Layout: Mapa + Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapa */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Mapa Interativo - {filteredOccurrences.length} ocorrência(s)
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              O mapa mostra a primeira ocorrência da lista. Clique em uma ocorrência à direita para centralizar no mapa.
            </p>
          </div>

          <div className="relative">
            {loading ? (
              <div className="h-96 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Carregando mapa...</p>
                </div>
              </div>
            ) : filteredOccurrences.length > 0 ? (
              <iframe
                id="map-iframe"
                width="100%"
                height="400"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${filteredOccurrences[0].longitude-0.01},${filteredOccurrences[0].latitude-0.01},${filteredOccurrences[0].longitude+0.01},${filteredOccurrences[0].latitude+0.01}&layer=mapnik&marker=${filteredOccurrences[0].latitude},${filteredOccurrences[0].longitude}`}
                className="rounded-b-lg"
              ></iframe>
            ) : (
              <div className="h-96 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma ocorrência com coordenadas</p>
                  <p className="text-sm text-gray-400 mt-1">Ajuste os filtros para ver ocorrências no mapa</p>
                </div>
              </div>
            )}
          </div>

          {filteredOccurrences.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={() => openInGoogleMaps(filteredOccurrences[0].latitude, filteredOccurrences[0].longitude)}
                  className="flex items-center gap-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir no Google Maps
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Ocorrências */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              Lista de Ocorrências ({filteredOccurrences.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Clique em uma ocorrência para centralizar no mapa
            </p>
          </div>

          <div className="h-96 overflow-y-auto">
            {filteredOccurrences.length === 0 ? (
              <div className="p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma ocorrência encontrada</p>
                <p className="text-sm text-gray-400 mt-1">
                  Ajuste os filtros ou verifique se há dados com coordenadas
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredOccurrences.map((occurrence) => (
                  <div 
                    key={occurrence.id} 
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedOccurrence?.id === occurrence.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => centerMapOnOccurrence(occurrence)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getStatusIcon(occurrence.status)}</span>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            #{occurrence.protocolo}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(occurrence.status)}`}>
                            {getStatusText(occurrence.status)}
                          </span>
                        </div>

                        <h4 className="font-medium text-gray-900 mb-1 text-sm">
                          {occurrence.titulo}
                        </h4>

                        <p className="text-gray-600 text-xs mb-2">
                          {occurrence.descricao.length > 80 
                            ? occurrence.descricao.substring(0, 80) + '...'
                            : occurrence.descricao
                          }
                        </p>

                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{occurrence.endereco}</span>
                          </div>
                          <div>
                            📂 {occurrence.categorias?.nome || 'Sem categoria'}
                          </div>
                          <div>
                            📅 {new Date(occurrence.created_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="bg-gray-100 p-1 rounded text-xs">
                            📍 {occurrence.latitude.toFixed(4)}, {occurrence.longitude.toFixed(4)}
                          </div>
                        </div>
                      </div>

                      <div className="ml-2 flex flex-col gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openInGoogleMaps(occurrence.latitude, occurrence.longitude)
                          }}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                          title="Ver no Google Maps"
                        >
                          🗺️
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOccurrence(occurrence)
                          }}
                          className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                          title="Ver detalhes"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedOccurrence && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
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
                    <span className="font-medium text-gray-700">Data:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(selectedOccurrence.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Endereço:</span>
                  <p className="text-gray-600 mt-1">{selectedOccurrence.endereco}</p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Coordenadas:</span>
                  <p className="text-gray-600 mt-1">
                    Latitude: {selectedOccurrence.latitude.toFixed(6)}, 
                    Longitude: {selectedOccurrence.longitude.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedOccurrence(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Fechar
                </button>
                <button
                  onClick={() => openInGoogleMaps(selectedOccurrence.latitude, selectedOccurrence.longitude)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  Abrir no Google Maps
                </button>
                <a
                  href={`/dashboard/ocorrencias`}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  Gerenciar Ocorrência
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}