import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDatabase, saveDatabase, addBriefingComment, toggleBriefingReaction } from '../data/database'
import { getCurrentUser } from '../utils/auth'
import { toast } from 'sonner'
import { ArrowLeft, Save, Edit, CheckCircle, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { canApproveBriefings } from '../utils/auth'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import ReactMarkdown from 'react-markdown'
import { getPriorityColors, getThemeName, THEME_KEYWORDS } from '../services/themeDetectionService'

export default function BriefingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editMode = searchParams.get('edit') === 'true'
  const queryClient = useQueryClient()
  const user = getCurrentUser()
  const canApprove = canApproveBriefings()
  const [editing, setEditing] = useState(editMode)
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    tema: '',
    prioridade: 'media',
    status: 'rascunho'
  })

  const { data: briefing, isLoading, error } = useQuery({
    queryKey: ['briefing', id],
    queryFn: () => {
      try {
        const db = getDatabase()
        console.log('BriefingDetail queryFn: fetching id=', id)
        console.log('BriefingDetail queryFn: db.briefings=', db.briefings)
        
        if (!db.briefings || !Array.isArray(db.briefings)) {
          console.error('BriefingDetail: db.briefings is not an array', db.briefings)
          throw new Error('Banco de dados corrupto')
        }
        
        const briefing = db.briefings.find(b => b && b.id === id)
        console.log('BriefingDetail queryFn: found briefing=', briefing)
        
        if (!briefing) {
          throw new Error(`Briefing com ID ${id} não encontrado`)
        }
        
        // Incrementar visualizações
        const briefingIndex = db.briefings.findIndex(b => b && b.id === id)
        if (briefingIndex !== -1) {
          db.briefings[briefingIndex].visualizacoes = (db.briefings[briefingIndex].visualizacoes || 0) + 1
          saveDatabase(db)
        }
        
        return briefing
      } catch (err) {
        console.error('BriefingDetail queryFn error:', err)
        throw err
      }
    },
    enabled: !!id,
    retry: 1
  })

  // Atualizar formData quando briefing muda
  useEffect(() => {
    if (briefing) {
      setFormData({
        titulo: briefing.titulo,
        conteudo: briefing.conteudo,
        tema: briefing.tema,
        prioridade: briefing.prioridade,
        status: briefing.status
      })
    }
  }, [briefing])

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const db = getDatabase()
      const briefingIndex = db.briefings.findIndex(b => b.id === id)
      if (briefingIndex !== -1) {
        const oldBriefing = db.briefings[briefingIndex]
        db.briefings[briefingIndex] = {
          ...oldBriefing,
          ...data,
          editado_por: user?.userId,
          historico_edicoes: [
            ...(oldBriefing.historico_edicoes || []),
            {
              usuario: user?.nome,
              acao: 'Editado',
              data: new Date().toISOString(),
              alteracoes: Object.keys(data)
            }
          ],
          data_atualizacao: new Date().toISOString()
        }
        saveDatabase(db)
      }
      return data
    },
    onSuccess: () => {
      toast.success('Briefing atualizado com sucesso!')
      setEditing(false)
      queryClient.invalidateQueries(['briefing', id])
      queryClient.invalidateQueries(['briefings'])
    },
    onError: () => {
      toast.error('Erro ao atualizar briefing')
    }
  })

  const addCommentMutation = useMutation({
    mutationFn: async (texto) => {
      return addBriefingComment(id, { usuario: user?.nome || 'Anônimo', texto })
    },
    onSuccess: () => {
      toast.success('Comentário adicionado')
      queryClient.invalidateQueries(['briefing', id])
      queryClient.invalidateQueries(['briefings'])
      setCommentText('')
    },
    onError: () => toast.error('Erro ao adicionar comentário')
  })

  const toggleReactionMutation = useMutation({
    mutationFn: async (reaction) => toggleBriefingReaction(id, user?.userId, reaction),
    onSuccess: () => {
      queryClient.invalidateQueries(['briefing', id])
      queryClient.invalidateQueries(['briefings'])
    },
    onError: () => toast.error('Erro ao registrar reação')
  })

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  const handleDownloadPDF = async () => {
    if (!briefing) return

    try {
      toast.info('Gerando PDF...', { duration: 2000 })
      
      // Criar elemento temporário para capturar o conteúdo formatado
      const element = document.createElement('div')
      element.style.width = '794px' // A4 width em pixels (210mm * 3.78px/mm para melhor qualidade)
      element.style.padding = '60px'
      element.style.backgroundColor = '#ffffff'
      element.style.color = '#1f2937'
      element.style.fontFamily = 'Arial, sans-serif'
      element.style.fontSize = '14px'
      
      // Criar conteúdo formatado similar ao site
      const prioridadeEmoji = briefing.prioridade === 'alta' ? '🔴' : briefing.prioridade === 'media' ? '🟡' : '🟢'
      const prioridadeTexto = briefing.prioridade.charAt(0).toUpperCase() + briefing.prioridade.slice(1)
      
      element.innerHTML = `
        <div style="margin-bottom: 30px;">
          <h1 style="font-size: 32px; font-weight: bold; color: #111827; margin-bottom: 20px; line-height: 1.3;">
            ${briefing.titulo}
          </h1>
          <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
            <span style="display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; background-color: ${
              briefing.prioridade === 'alta' ? '#fee2e2' : briefing.prioridade === 'media' ? '#fef3c7' : '#d1fae5'
            }; color: ${
              briefing.prioridade === 'alta' ? '#991b1b' : briefing.prioridade === 'media' ? '#92400e' : '#065f46'
            };">
              ${prioridadeEmoji} ${prioridadeTexto}
            </span>
            <span style="display: inline-flex; align-items: center; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: 600; background-color: #dbeafe; color: #1e40af;">
              📋 ${getThemeName(briefing.tema)}
            </span>
          </div>
          <div style="font-size: 13px; color: #4b5563; line-height: 1.8;">
            <div><strong>Responsável:</strong> ${briefing.responsavel_nome}</div>
            <div><strong>Criado em:</strong> ${format(new Date(briefing.data_criacao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}</div>
            <div><strong>Visualizações:</strong> ${briefing.visualizacoes || 0}</div>
          </div>
        </div>
        <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 30px 0;" />
        <div id="briefing-content" style="line-height: 1.8; color: #374151;">
          ${await convertMarkdownToHTML(briefing.conteudo)}
        </div>
      `
      
      // Adicionar fontes se existirem
      if (briefing.fontes && briefing.fontes.length > 0) {
        let fontesHTML = '<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 40px 0;" /><h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px;">📚 Fontes Utilizadas</h3><ul style="list-style: none; padding: 0; margin: 0;">'
        briefing.fontes.forEach((fonte, index) => {
          const fonteTexto = typeof fonte === 'string' 
            ? fonte 
            : fonte?.url || fonte?.title || fonte?.text || fonte?.nome || JSON.stringify(fonte)
          const fonteDescricao = typeof fonte === 'object' && fonte?.descricao ? ` - ${fonte.descricao}` : ''
          fontesHTML += `<li style="margin-bottom: 10px; color: #374151; padding-left: 20px; font-size: 13px; line-height: 1.6;">
            <span style="color: #00897b; font-weight: bold;">${index + 1}.</span> 
            <span>${fonteTexto}${fonteDescricao}</span>
          </li>`
        })
        fontesHTML += '</ul>'
        element.innerHTML += fontesHTML
      }
      
      // Adicionar ao DOM temporariamente (fora da tela)
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.top = '0'
      document.body.appendChild(element)
      
      // Aguardar renderização
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Capturar como imagem
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })
      
      // Remover elemento temporário
      document.body.removeChild(element)
      
      // Criar PDF
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      // Margens de 10mm
      const pageWidth = pdfWidth - 20
      const pageHeight = pdfHeight - 20
      
      // Calcular dimensões
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = pageWidth / imgWidth
      const imgScaledWidth = pageWidth
      const imgScaledHeight = imgHeight * ratio
      
      // Adicionar imagem ao PDF
      if (imgScaledHeight <= pageHeight) {
        // Cabe em uma página
        pdf.addImage(imgData, 'PNG', 10, 10, imgScaledWidth, imgScaledHeight)
      } else {
        // Precisa de múltiplas páginas
        let heightLeft = imgScaledHeight
        let position = 0
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgScaledWidth, imgScaledHeight, undefined, 'FAST')
        heightLeft -= pageHeight
        
        while (heightLeft > 0) {
          position = heightLeft - imgScaledHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 10, 10 + position, imgScaledWidth, imgScaledHeight, undefined, 'FAST')
          heightLeft -= pageHeight
        }
      }
      
      // Baixar PDF
      const fileName = `Briefing_${briefing.titulo.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}_${format(new Date(), 'yyyy-MM-dd')}.pdf`
      pdf.save(fileName)
      
      toast.success('PDF gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF. Tente novamente.')
    }
  }

  // Função auxiliar para converter Markdown básico em HTML
  const convertMarkdownToHTML = async (markdown) => {
    if (!markdown) return ''
    
    let html = ''
    const lines = markdown.split('\n')
    let inList = false
    let inParagraph = false
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Títulos
      if (line.startsWith('### ')) {
        if (inParagraph) {
          html += '</p>'
          inParagraph = false
        }
        if (inList) {
          html += '</ul>'
          inList = false
        }
        html += `<h3 style="font-size: 18px; font-weight: 600; color: #1f2937; margin-top: 24px; margin-bottom: 12px;">${line.substring(4)}</h3>`
        continue
      }
      if (line.startsWith('## ')) {
        if (inParagraph) {
          html += '</p>'
          inParagraph = false
        }
        if (inList) {
          html += '</ul>'
          inList = false
        }
        html += `<h2 style="font-size: 22px; font-weight: 700; color: #111827; margin-top: 28px; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 2px solid #00897b;">${line.substring(3)}</h2>`
        continue
      }
      if (line.startsWith('# ')) {
        if (inParagraph) {
          html += '</p>'
          inParagraph = false
        }
        if (inList) {
          html += '</ul>'
          inList = false
        }
        html += `<h1 style="font-size: 28px; font-weight: 700; color: #111827; margin-top: 32px; margin-bottom: 18px;">${line.substring(2)}</h1>`
        continue
      }
      
      // Listas
      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (inParagraph) {
          html += '</p>'
          inParagraph = false
        }
        if (!inList) {
          html += '<ul style="list-style-type: disc; margin-bottom: 16px; padding-left: 30px;">'
          inList = true
        }
        const listContent = processInlineMarkdown(line.substring(2))
        html += `<li style="margin-bottom: 8px; color: #374151;">${listContent}</li>`
        continue
      }
      
      // Linha vazia
      if (line === '') {
        if (inParagraph) {
          html += '</p>'
          inParagraph = false
        }
        if (inList) {
          html += '</ul>'
          inList = false
        }
        continue
      }
      
      // Parágrafo normal
      if (inList) {
        html += '</ul>'
        inList = false
      }
      if (!inParagraph) {
        html += '<p style="margin-bottom: 14px; color: #374151; line-height: 1.7; font-size: 14px;">'
        inParagraph = true
      } else {
        html += ' '
      }
      html += processInlineMarkdown(line)
    }
    
    if (inParagraph) {
      html += '</p>'
    }
    if (inList) {
      html += '</ul>'
    }
    
    return html
  }
  
  // Processa markdown inline (negrito, itálico, links)
  const processInlineMarkdown = (text) => {
    if (!text) return ''
    
    // Converter links primeiro para evitar conflitos
    text = text.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>')
    
    // Converter negrito (deve vir antes do itálico)
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 700; color: #111827;">$1</strong>')
    
    // Converter itálico
    text = text.replace(/\*([^*]+)\*/g, '<em style="font-style: italic;">$1</em>')
    
    // Converter código inline
    text = text.replace(/`([^`]+)`/g, '<code style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; color: #dc2626; font-family: monospace; font-size: 0.9em;">$1</code>')
    
    return text
  }

  // Debug: log do estado
  useEffect(() => {
    console.log('BriefingDetail render - id:', id, 'briefing:', briefing, 'isLoading:', isLoading)
  }, [id, briefing, isLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fontea-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando briefing...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Erro ao carregar briefing</h2>
        <p className="text-red-700 mb-4">{error.message}</p>
        <button
          onClick={() => navigate('/briefings')}
          className="text-blue-600 hover:text-blue-700 underline"
        >
          Voltar para Briefings
        </button>
      </div>
    )
  }

  if (!briefing || !briefing.id) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Briefing não encontrado</h2>
        <p className="text-red-700 mb-4">ID buscado: {id}</p>
        <button
          onClick={() => navigate('/briefings')}
          className="text-blue-600 hover:text-blue-700 underline"
        >
          Voltar para Briefings
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/briefings')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </button>
      </div>

      {editing ? (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo (Markdown)
            </label>
            <textarea
              value={formData.conteudo}
              onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
              rows={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tema
              </label>
              <select
                value={formData.tema}
                onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
              >
                <option value="">Selecione um tema</option>
                {Object.keys(THEME_KEYWORDS).map((temaKey) => (
                  <option key={temaKey} value={temaKey}>
                    {getThemeName(temaKey)}
                  </option>
                ))}
                {formData.tema && !THEME_KEYWORDS[formData.tema] && (
                  <option value={formData.tema}>{getThemeName(formData.tema)}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
            >
              <Save className="h-5 w-5" />
              Salvar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header com Badge de Prioridade e Tema */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{briefing.titulo}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getPriorityColors(briefing.prioridade).badge}`}>
                    {briefing.prioridade === 'alta' && '🔴'}
                    {briefing.prioridade === 'media' && '🟡'}
                    {briefing.prioridade === 'baixa' && '🟢'}
                    {' '}
                    {briefing.prioridade.charAt(0).toUpperCase() + briefing.prioridade.slice(1)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    📋 {getThemeName(briefing.tema)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {briefing.status !== 'em_revisao' && briefing.responsavel_id === user?.userId && (
                  <button
                    onClick={() => {
                      if (window.confirm('Deseja enviar este briefing para revisão?')) {
                        updateMutation.mutate({ status: 'em_revisao' })
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition whitespace-nowrap"
                  >
                    Solicitar Revisão
                  </button>
                )}

                {canApprove && briefing.status === 'em_revisao' && (
                  <button
                    onClick={() => {
                      if (window.confirm('Deseja publicar este briefing?')) {
                        updateMutation.mutate({ status: 'aprovado' })
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition whitespace-nowrap"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Publicar
                  </button>
                )}

                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition whitespace-nowrap"
                >
                  <Edit className="h-5 w-5" />
                  Editar
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition whitespace-nowrap"
              >
                <Download className="h-5 w-5" />
                Baixar PDF
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
              <span>
                <strong>Responsável:</strong> {briefing.responsavel_nome}
              </span>
              <span>•</span>
              <span>
                <strong>Criado em:</strong>{' '}
                {format(new Date(briefing.data_criacao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
              <span>•</span>
              <span>
                <strong>Visualizações:</strong> {briefing.visualizacoes || 0}
              </span>
            </div>
          </div>

          {/* Reactions & Comments */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-center gap-3">
              {['like','clap','handshake','love','idea','laugh'].map(r => {
                const labels = { like: '👍', clap: '👏', handshake: '🤝', love: '❤️', idea: '💡', laugh: '😄' }
                const users = briefing.reacoes?.[r] || []
                const active = users.includes(user?.userId)
                return (
                  <button key={r} onClick={() => toggleReactionMutation.mutate(r)} className={`px-3 py-2 rounded ${active ? 'bg-gray-100' : 'bg-transparent'}`}>
                    <span className="text-lg mr-1">{labels[r]}</span>
                    <span className="text-sm text-gray-600">{users.length || ''}</span>
                  </button>
                )
              })}

              <button onClick={() => setShowComments(!showComments)} className="ml-auto text-sm text-gray-600">💬 {briefing.comentarios?.length || 0} Comentários</button>
            </div>

            {showComments && (
              <div>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
                  {(briefing.comentarios || []).map(c => (
                    <div key={c.id} className="border-b border-gray-100 pb-2">
                      <div className="text-sm font-semibold">{c.usuario} <span className="text-xs text-gray-400">{format(new Date(c.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span></div>
                      <div className="text-sm text-gray-700">{c.texto}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input id={`comment-input-detail-${id}`} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Escreva um comentário..." className="flex-1 px-3 py-2 border rounded" />
                  <button onClick={() => { if (commentText.trim()) addCommentMutation.mutate(commentText.trim()) }} className="px-4 py-2 bg-fontea-primary text-white rounded">Comentar</button>
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo Markdown */}
          <div className="bg-white rounded-lg shadow p-8">
            <div className="prose prose-lg max-w-none 
              prose-headings:text-gray-900 
              prose-p:text-gray-700
              prose-a:text-blue-600 hover:prose-a:text-blue-700
              prose-strong:text-gray-900
              prose-code:text-red-600
              prose-pre:bg-gray-100
              prose-ul:text-gray-700
              prose-ol:text-gray-700
              prose-li:text-gray-700
              prose-blockquote:border-l-4
              prose-blockquote:border-blue-500
              prose-blockquote:pl-4
              prose-blockquote:italic
              prose-blockquote:text-gray-600
              min-h-96">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-4xl font-bold mt-8 mb-4 text-gray-900" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-3xl font-bold mt-6 mb-3 text-gray-900 border-b-2 border-fontea-primary pb-2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-2xl font-semibold mt-4 mb-2 text-gray-800" {...props} />,
                  p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700" {...props} />,
                  li: ({node, ...props}) => <li className="ml-2 text-gray-700" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-700 underline" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4" {...props} />,
                  code: ({node, inline, ...props}) => 
                    inline ? (
                      <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono text-sm" {...props} />
                    ) : (
                      <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code {...props} /></pre>
                    ),
                  table: ({node, ...props}) => <table className="border-collapse border border-gray-300 w-full my-4" {...props} />,
                  th: ({node, ...props}) => <th className="border border-gray-300 bg-gray-100 p-2 text-left font-semibold" {...props} />,
                  td: ({node, ...props}) => <td className="border border-gray-300 p-2" {...props} />,
                  hr: ({node, ...props}) => <hr className="border-t-2 border-gray-300 my-6" {...props} />,
                }}
              >
                {briefing.conteudo}
              </ReactMarkdown>
            </div>
          </div>

          {/* Fontes */}
          {briefing.fontes && briefing.fontes.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📚 Fontes Utilizadas</h3>
              <ul className="space-y-2">
                {briefing.fontes.map((fonte, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-fontea-primary font-bold mt-1">{index + 1}.</span>
                        {typeof fonte === 'string' ? (
                          fonte.startsWith('http') ? (
                            <a href={fonte} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline break-all">
                              {fonte}
                            </a>
                          ) : (
                            <span>{fonte}</span>
                          )
                        ) : fonte && typeof fonte === 'object' ? (
                          // Fonte pode ser um objeto vindo da IA: use url ou title/text
                          fonte.url ? (
                            <a href={fonte.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline break-all">
                              {fonte.url}
                            </a>
                          ) : (
                            <span>{fonte.title || fonte.text || JSON.stringify(fonte)}</span>
                          )
                        ) : (
                          <span>{String(fonte)}</span>
                        )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Histórico de Edições */}
          {briefing.historico_edicoes && briefing.historico_edicoes.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">📝 Histórico de Edições</h3>
              <div className="space-y-3">
                {briefing.historico_edicoes.map((edicao, index) => (
                  <div key={index} className="border-l-4 border-fontea-primary pl-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">{edicao.usuario} - {edicao.acao}</p>
                    <p className="text-xs text-gray-600">
                      {format(new Date(edicao.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {edicao.alteracoes && edicao.alteracoes.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">Alterou: {edicao.alteracoes.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

