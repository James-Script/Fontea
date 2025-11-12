import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDatabase, saveDatabase } from '../data/database'
import { getCurrentUser } from '../utils/auth'
import { toast } from 'sonner'
import { ArrowLeft, Save, Edit } from 'lucide-react'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import ReactMarkdown from 'react-markdown'

export default function BriefingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editMode = searchParams.get('edit') === 'true'
  const queryClient = useQueryClient()
  const user = getCurrentUser()
  const [editing, setEditing] = useState(editMode)
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '',
    tema: '',
    prioridade: 'media',
    status: 'rascunho'
  })

  const { data: briefing } = useQuery({
    queryKey: ['briefing', id],
    queryFn: () => {
      const db = getDatabase()
      const briefing = db.briefings.find(b => b.id === id)
      if (briefing) {
        setFormData({
          titulo: briefing.titulo,
          conteudo: briefing.conteudo,
          tema: briefing.tema,
          prioridade: briefing.prioridade,
          status: briefing.status
        })
        
        // Incrementar visualizações
        const briefingIndex = db.briefings.findIndex(b => b.id === id)
        if (briefingIndex !== -1) {
          db.briefings[briefingIndex].visualizacoes = (db.briefings[briefingIndex].visualizacoes || 0) + 1
          saveDatabase(db)
        }
      }
      return briefing
    },
    enabled: !!id
  })

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
            ...oldBriefing.historico_edicoes,
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

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  if (!briefing) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fontea-primary"></div>
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
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
          >
            <Edit className="h-5 w-5" />
            Editar
          </button>
        )}
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
                <option value="defesa_civil">Defesa Civil</option>
                <option value="agricultura">Agricultura</option>
                <option value="monitoramento">Monitoramento Costeiro</option>
                <option value="fiscalizacao">Fiscalização Ambiental</option>
                <option value="relacoes">Relações Internacionais</option>
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
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{briefing.titulo}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                <strong>Responsável:</strong> {briefing.responsavel_nome}
              </span>
              <span>
                <strong>Criado em:</strong>{' '}
                {format(new Date(briefing.data_criacao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
              <span>
                <strong>Visualizações:</strong> {briefing.visualizacoes || 0}
              </span>
            </div>
          </div>

          <div className="prose max-w-none mb-6">
            <ReactMarkdown>{briefing.conteudo}</ReactMarkdown>
          </div>

          {briefing.fontes && briefing.fontes.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Fontes:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {briefing.fontes.map((fonte, index) => (
                  <li key={index}>{fonte}</li>
                ))}
              </ul>
            </div>
          )}

          {briefing.historico_edicoes && briefing.historico_edicoes.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Histórico de Edições:</h3>
              <div className="space-y-2">
                {briefing.historico_edicoes.map((edicao, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    <strong>{edicao.usuario}</strong> - {edicao.acao} em{' '}
                    {format(new Date(edicao.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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

