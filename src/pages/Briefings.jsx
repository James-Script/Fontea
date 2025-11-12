import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDatabase, saveDatabase } from '../data/database'
import { getCurrentUser, canApproveBriefings, canDeleteBriefings } from '../utils/auth'
import { toast } from 'sonner'
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import { cn } from '../utils/cn'

export default function Briefings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = getCurrentUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const canApprove = canApproveBriefings()
  const canDelete = canDeleteBriefings()

  const { data: briefings } = useQuery({
    queryKey: ['briefings'],
    queryFn: () => {
      const db = getDatabase()
      return db.briefings
        .sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
        .map(briefing => ({
          ...briefing,
          canEdit: briefing.responsavel_id === user?.userId || user?.nivel_acesso === 'mediano' || user?.nivel_acesso === 'total',
          canDelete: canDelete && (briefing.responsavel_id === user?.userId || user?.nivel_acesso === 'total')
        }))
    }
  })

  const approveMutation = useMutation({
    mutationFn: async (briefingId) => {
      const db = getDatabase()
      const briefingIndex = db.briefings.findIndex(b => b.id === briefingId)
      if (briefingIndex !== -1) {
        const briefing = db.briefings[briefingIndex]
        briefing.status = 'aprovado'
        briefing.editado_por = user?.userId
        briefing.historico_edicoes.push({
          usuario: user?.nome,
          acao: 'Aprovado',
          data: new Date().toISOString()
        })
        briefing.data_atualizacao = new Date().toISOString()
        saveDatabase(db)
      }
      return briefingId
    },
    onSuccess: () => {
      toast.success('Briefing aprovado com sucesso!')
      queryClient.invalidateQueries(['briefings'])
    },
    onError: () => {
      toast.error('Erro ao aprovar briefing')
    }
  })

  const rejectMutation = useMutation({
    mutationFn: async (briefingId) => {
      const db = getDatabase()
      const briefingIndex = db.briefings.findIndex(b => b.id === briefingId)
      if (briefingIndex !== -1) {
        const briefing = db.briefings[briefingIndex]
        briefing.status = 'rascunho'
        briefing.editado_por = user?.userId
        briefing.historico_edicoes.push({
          usuario: user?.nome,
          acao: 'Rejeitado - Retornado para rascunho',
          data: new Date().toISOString()
        })
        briefing.data_atualizacao = new Date().toISOString()
        saveDatabase(db)
      }
      return briefingId
    },
    onSuccess: () => {
      toast.success('Briefing rejeitado e retornado para rascunho')
      queryClient.invalidateQueries(['briefings'])
    },
    onError: () => {
      toast.error('Erro ao rejeitar briefing')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (briefingId) => {
      const db = getDatabase()
      db.briefings = db.briefings.filter(b => b.id !== briefingId)
      saveDatabase(db)
      return briefingId
    },
    onSuccess: () => {
      toast.success('Briefing excluído com sucesso!')
      queryClient.invalidateQueries(['briefings'])
    },
    onError: () => {
      toast.error('Erro ao excluir briefing')
    }
  })

  const filteredBriefings = briefings?.filter(briefing => {
    const matchesSearch = briefing.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         briefing.responsavel_nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'todos' || briefing.status === filterStatus
    return matchesSearch && matchesStatus
  }) || []

  const getStatusBadge = (status) => {
    const badges = {
      rascunho: { text: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
      em_revisao: { text: 'Em Revisão', color: 'bg-yellow-100 text-yellow-800' },
      aprovado: { text: 'Aprovado', color: 'bg-green-100 text-green-800' },
      arquivado: { text: 'Arquivado', color: 'bg-blue-100 text-blue-800' },
      cancelado: { text: 'Cancelado', color: 'bg-red-100 text-red-800' }
    }
    return badges[status] || badges.rascunho
  }

  const getPriorityBadge = (prioridade) => {
    const badges = {
      baixa: { text: 'Baixa', color: 'bg-gray-100 text-gray-800' },
      media: { text: 'Média', color: 'bg-yellow-100 text-yellow-800' },
      alta: { text: 'Alta', color: 'bg-red-100 text-red-800' }
    }
    return badges[prioridade] || badges.media
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Briefings</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todos os briefings do sistema
          </p>
        </div>
        <button
          onClick={() => navigate('/briefings/new')}
          className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
        >
          <Plus className="h-5 w-5" />
          Novo Briefing
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por título ou responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
          >
            <option value="todos">Todos os Status</option>
            <option value="rascunho">Rascunho</option>
            <option value="em_revisao">Em Revisão</option>
            <option value="aprovado">Aprovado</option>
            <option value="arquivado">Arquivado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Lista de Briefings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBriefings.map((briefing) => {
          const statusBadge = getStatusBadge(briefing.status)
          const priorityBadge = getPriorityBadge(briefing.prioridade)
          
          return (
            <div
              key={briefing.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {briefing.titulo}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusBadge.color)}>
                      {statusBadge.text}
                    </span>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', priorityBadge.color)}>
                      {priorityBadge.text}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Responsável:</span> {briefing.responsavel_nome}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tema:</span> {briefing.tema.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Criado em:</span>{' '}
                  {format(new Date(briefing.data_criacao), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Visualizações:</span> {briefing.visualizacoes || 0}
                </p>
              </div>

              {/* Ações */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/briefings/${briefing.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </button>
                
                {briefing.canEdit && (
                  <button
                    onClick={() => navigate(`/briefings/${briefing.id}?edit=true`)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}

                {/* Botões de Aprovação (apenas para nível mediano/total e status em_revisao) */}
                {canApprove && briefing.status === 'em_revisao' && (
                  <>
                    <button
                      onClick={() => {
                        if (window.confirm('Deseja aprovar este briefing?')) {
                          approveMutation.mutate(briefing.id)
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition"
                      title="Aprovar"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Deseja rejeitar este briefing? Ele será retornado para rascunho.')) {
                          rejectMutation.mutate(briefing.id)
                        }
                      }}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition"
                      title="Rejeitar"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </>
                )}

                {briefing.canDelete && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja excluir este briefing?')) {
                        deleteMutation.mutate(briefing.id)
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredBriefings.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum briefing encontrado</p>
        </div>
      )}
    </div>
  )
}

