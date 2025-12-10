import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDatabase, saveDatabase, addBriefingComment, toggleBriefingReaction } from '../data/database'
import { generateBriefingWithAI, generateBriefingMock } from '../services/aiService'
import { detectTheme, getThemeName } from '../services/themeDetectionService'
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
  console.log('Briefings component rendered, user:', user)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [showCreateFromZero, setShowCreateFromZero] = useState(false)
  const [briefingSpec, setBriefingSpec] = useState('')
  const [scratchTitle, setScratchTitle] = useState('')
  const [scratchPriority, setScratchPriority] = useState('media')
  const [isGenerating, setIsGenerating] = useState(false)
  const [openCommentsId, setOpenCommentsId] = useState(null)
  const canApprove = canApproveBriefings()
  const canDelete = canDeleteBriefings()

  const { data: briefings = [] } = useQuery({
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

  // Helpers
  const extractTitleFromContent = (content, specFallback) => {
    if (!content) return null
    // Try to find a Markdown H1 or H2
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
    for (const line of lines) {
      if (line.startsWith('# ')) return line.replace('# ', '').trim()
      if (line.startsWith('## ')) return line.replace('## ', '').trim()
    }
    // Fallback: first non-empty line without markdown
    if (lines.length > 0) {
      const first = lines[0].replace(/^#+\s*/, '').trim()
      if (first.length > 0) return first.split(/[\.\?\!]/)[0].trim()
    }
    // As last resort, use part of the spec
    if (specFallback) {
      const s = specFallback.trim()
      const firstSentence = s.split(/[\.\?\!]/)[0]
      const words = firstSentence.split(/\s+/).slice(0, 8)
      return words.join(' ').replace(/[\n\r]/g, '').trim()
    }
    return 'Briefing Executivo'
  }

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

  const requestReviewMutation = useMutation({
    mutationFn: async (briefingId) => {
      const db = getDatabase()
      const briefingIndex = db.briefings.findIndex(b => b.id === briefingId)
      if (briefingIndex !== -1) {
        const briefing = db.briefings[briefingIndex]
        briefing.status = 'em_revisao'
        briefing.editado_por = user?.userId
        if (!briefing.historico_edicoes) briefing.historico_edicoes = []
        briefing.historico_edicoes.push({
          usuario: user?.nome,
          acao: 'Solicitado revisão',
          data: new Date().toISOString()
        })
        briefing.data_atualizacao = new Date().toISOString()
        saveDatabase(db)
      }
      return briefingId
    },
    onSuccess: () => {
      toast.success('Solicitação de revisão enviada!')
      queryClient.invalidateQueries(['briefings'])
    },
    onError: () => {
      toast.error('Erro ao solicitar revisão')
    }
  })

  const addCommentMutation = useMutation({
    mutationFn: async ({ briefingId, texto }) => {
      const userId = user?.userId
      const usuario = user?.nome || 'Anônimo'
      return addBriefingComment(briefingId, { usuario, texto })
    },
    onSuccess: () => {
      toast.success('Comentário adicionado')
      queryClient.invalidateQueries(['briefings'])
    },
    onError: () => toast.error('Erro ao adicionar comentário')
  })

  const toggleReactionMutation = useMutation({
    mutationFn: async ({ briefingId, reaction }) => {
      return toggleBriefingReaction(briefingId, user?.userId, reaction)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['briefings'])
    },
    onError: () => toast.error('Erro ao registrar reação')
  })

  const handleGenerateFromScratch = async () => {
    if (!briefingSpec.trim()) {
      toast.error('Por favor, descreva o briefing que deseja gerar')
      return
    }
    setIsGenerating(true)
    toast.info('Gerando briefing com IA...')
    try {
      const deteccao = detectTheme(briefingSpec)

      // Se não detectar tema, não bloquear a geração: avisar e prosseguir com fallback
      if (!deteccao.tema) {
        toast.warning('Não foi possível detectar o tema automaticamente. Irei gerar um briefing genérico — por favor revise e ajuste o tema depois.')
      }

      const temaParaGerar = deteccao.tema || 'nao_definido'

      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      const result = apiKey
        ? await generateBriefingWithAI({
            titulo: scratchTitle || 'Briefing Executivo',
            tema: temaParaGerar,
            prioridade: scratchPriority,
            especificacoes: briefingSpec
          })
        : await generateBriefingMock({
            titulo: scratchTitle || 'Briefing Executivo',
            tema: temaParaGerar,
            prioridade: scratchPriority,
            especificacoes: briefingSpec
          })
      console.log('AI generation result:', result)

      // Se a IA retornou um tema detectado, atualizamos a deteccao para usar esse tema
      if (result?.detected_tema) {
        // sobrescreve deteccao.tema para o tema que a IA detectou
        // mantendo a confiança quando disponível
        deteccao.tema = result.detected_tema
        deteccao.confianca = result.detected_confianca || deteccao.confianca || 0
        toast.success(`Tema detectado automaticamente: ${deteccao.tema}`)
      }
      if (result.success) {
        const db = getDatabase()
        const newId = `BRI${String(db.briefings.length + 1).padStart(3, '0')}`
        // Normalize title and content
        const inferredTitle = scratchTitle || result.titulo || extractTitleFromContent(result.conteudo, briefingSpec)
        let content = result.conteudo || ''
        // Ensure content starts with an H1 using the inferred title
        const hasH1 = /(^|\n)\s*#\s+/.test(content)
        if (!hasH1) {
          content = `# ${inferredTitle}\n\n${content}`
        }

        // Normalize fontes (could be strings or objects)
        const fontes = (result.fontes || []).map(f => {
          if (typeof f === 'string') return f
          if (f && typeof f === 'object') return f.url || f.title || f.text || JSON.stringify(f)
          return String(f)
        })

        // Priorizar tema detectado pela IA
        const temaFinal = result?.detected_tema || deteccao.tema || 'nao_definido';
        
        const newBriefing = {
          id: newId,
          titulo: inferredTitle,
          conteudo: content,
          tema: temaFinal, // Usar tema identificado pela IA
          status: 'em_revisao',
          prioridade: scratchPriority,
          responsavel_id: user?.userId,
          responsavel_nome: user?.nome,
          editado_por: null,
          historico_edicoes: [],
          fontes: fontes,
          data_criacao: new Date().toISOString(),
          data_atualizacao: new Date().toISOString(),
          visualizacoes: 0,
          template_origem: null,
          comentarios: [],
          reacoes: {}
        }
        db.briefings.push(newBriefing)
        saveDatabase(db)
        toast.success('Briefing gerado com sucesso!')
        queryClient.invalidateQueries(['briefings'])
        setShowCreateFromZero(false)
        setBriefingSpec('')
        setScratchTitle('')
        // navigate to briefing
        setTimeout(() => navigate(`/briefings/${newBriefing.id}`), 500)
      } else {
        toast.error(result.error || 'Erro ao gerar briefing')
      }
    } catch (error) {
      toast.error('Erro ao gerar briefing: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

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

  console.log('Briefings rendering main content, briefings count:', briefings?.length || 0)

  return (
    <div className="space-y-6">
      {/* Modal: Gerar do Zero */}
      {showCreateFromZero && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Gerar Briefing do Zero</h2>
              <button onClick={() => setShowCreateFromZero(false)} className="text-gray-500">Fechar</button>
            </div>

            <div className="space-y-3">
              <input type="text" placeholder="Título (opcional)" value={scratchTitle} onChange={(e) => setScratchTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
              <div className="flex gap-3">
                <select value={scratchPriority} onChange={(e) => setScratchPriority(e.target.value)} className="px-3 py-2 border border-gray-300 rounded">
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
                <div className="flex-1">
                  <textarea value={briefingSpec} onChange={(e) => setBriefingSpec(e.target.value)} rows={6} placeholder="Descreva as especificações do briefing..." className="w-full px-3 py-2 border border-gray-300 rounded" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowCreateFromZero(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={handleGenerateFromScratch} disabled={isGenerating} className="px-4 py-2 bg-fontea-primary text-white rounded">{isGenerating ? 'Gerando...' : 'Gerar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Briefings</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todos os briefings do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateFromZero(true)}
            className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
          >
            <Plus className="h-5 w-5" />
            Novo Briefing
          </button>
        </div>
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
                  <span className="font-medium">Tema:</span> {getThemeName(briefing.tema)}
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

                {briefing.canEdit && briefing.status !== 'em_revisao' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Deseja enviar este briefing para revisão?')) {
                        requestReviewMutation.mutate(briefing.id)
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-yellow-800 bg-yellow-100 rounded-lg hover:bg-yellow-200 transition"
                    title="Solicitar Revisão"
                  >
                    <Clock className="h-4 w-4" />
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

              {/* Reações e comentários resumo */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {/* Reactions: thumbs up, clap, handshake, heart, idea, laugh */}
                    {['like','clap','handshake','love','idea','laugh'].map((r) => {
                      const labels = { like: '👍', clap: '👏', handshake: '🤝', love: '❤️', idea: '💡', laugh: '😄' }
                      const users = briefing.reacoes?.[r] || []
                      const active = users.includes(user?.userId)
                      return (
                        <button
                          key={r}
                          onClick={() => toggleReactionMutation.mutate({ briefingId: briefing.id, reaction: r })}
                          className={`px-2 py-1 rounded text-sm ${active ? 'bg-gray-200' : 'bg-transparent'} hover:bg-gray-100`}
                          title={r}
                        >
                          <span className="text-base mr-1">{labels[r]}</span>
                          <span className="text-xs text-gray-600">{users.length || ''}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setOpenCommentsId(openCommentsId === briefing.id ? null : briefing.id)}
                      className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-2"
                    >
                      💬 {briefing.comentarios?.length || 0}
                    </button>
                  </div>
                </div>

                {openCommentsId === briefing.id && (
                  <div className="mt-3">
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                      {(briefing.comentarios || []).map((c) => (
                        <div key={c.id} className="text-sm text-gray-700 border-b border-gray-100 pb-2 mb-2">
                          <div className="font-semibold">{c.usuario} <span className="text-xs text-gray-400">{new Date(c.data).toLocaleString()}</span></div>
                          <div>{c.texto}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        id={`comment-input-${briefing.id}`}
                        type="text"
                        placeholder="Escreva um comentário..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const texto = e.target.value.trim()
                            if (texto) {
                              addCommentMutation.mutate({ briefingId: briefing.id, texto })
                              e.target.value = ''
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.querySelector(`#comment-input-${briefing.id}`)
                          if (input) {
                            const texto = input.value.trim()
                            if (texto) {
                              addCommentMutation.mutate({ briefingId: briefing.id, texto })
                              input.value = ''
                            }
                          }
                        }}
                        className="px-3 py-2 bg-fontea-primary text-white rounded-lg"
                      >
                        Comentar
                      </button>
                    </div>
                  </div>
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

