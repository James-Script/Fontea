import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDatabase, saveDatabase } from '../data/database'
import { getCurrentUser } from '../utils/auth'
import { toast } from 'sonner'
import { Save, ArrowLeft } from 'lucide-react'

export default function NewBriefing() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = getCurrentUser()
  const [formData, setFormData] = useState({
    titulo: '',
    conteudo: '# Novo Briefing\n\n## Resumo Executivo\n\n## Dados Principais\n\n## Recomendações',
    tema: 'defesa_civil',
    prioridade: 'media',
    status: 'rascunho',
    fontes: []
  })
  const [fonteInput, setFonteInput] = useState('')

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const db = getDatabase()
      const newId = `BRI${String(db.briefings.length + 1).padStart(3, '0')}`
      
      const newBriefing = {
        id: newId,
        ...data,
        responsavel_id: user?.userId,
        responsavel_nome: user?.nome,
        editado_por: null,
        historico_edicoes: [],
        motivo_cancelamento: null,
        data_criacao: new Date().toISOString(),
        data_atualizacao: new Date().toISOString(),
        visualizacoes: 0
      }
      
      db.briefings.push(newBriefing)
      saveDatabase(db)
      return newBriefing
    },
    onSuccess: (briefing) => {
      toast.success('Briefing criado com sucesso!')
      queryClient.invalidateQueries(['briefings'])
      navigate(`/briefings/${briefing.id}`)
    },
    onError: () => {
      toast.error('Erro ao criar briefing')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const addFonte = () => {
    if (fonteInput.trim()) {
      setFormData({
        ...formData,
        fontes: [...formData.fontes, fonteInput.trim()]
      })
      setFonteInput('')
    }
  }

  const removeFonte = (index) => {
    setFormData({
      ...formData,
      fontes: formData.fontes.filter((_, i) => i !== index)
    })
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

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Novo Briefing</h1>
        <p className="mt-2 text-gray-600">
          Crie um novo briefing executivo
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título *
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
            required
            placeholder="Ex: Análise de Dados Satelitais - Defesa Civil"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conteúdo (Markdown) *
          </label>
          <textarea
            value={formData.conteudo}
            onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
            rows={20}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent font-mono text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema *
            </label>
            <select
              value={formData.tema}
              onChange={(e) => setFormData({ ...formData, tema: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
              required
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
              Prioridade *
            </label>
            <select
              value={formData.prioridade}
              onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
              required
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Inicial
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
          >
            <option value="rascunho">Rascunho</option>
            <option value="em_revisao">Enviar para Revisão</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fontes (IBGE, INPE, etc.)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={fonteInput}
              onChange={(e) => setFonteInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFonte())}
              placeholder="Digite uma fonte e pressione Enter"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
            />
            <button
              type="button"
              onClick={addFonte}
              className="px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
            >
              Adicionar
            </button>
          </div>
          {formData.fontes.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.fontes.map((fonte, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-fontea-primary/10 text-fontea-primary rounded-full text-sm"
                >
                  {fonte}
                  <button
                    type="button"
                    onClick={() => removeFonte(index)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
          >
            <Save className="h-5 w-5" />
            Criar Briefing
          </button>
          <button
            type="button"
            onClick={() => navigate('/briefings')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

