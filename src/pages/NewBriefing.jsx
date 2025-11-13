import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getDatabase, saveDatabase } from '../data/database'
import { getCurrentUser } from '../utils/auth'
import { toast } from 'sonner'
import { Save, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { generateBriefingWithAI, generateBriefingMock } from '../services/aiService'

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
  const [especificacoes, setEspecificacoes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [useAI, setUseAI] = useState(false)

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

  const handleGenerateWithAI = async () => {
    if (!especificacoes.trim()) {
      toast.error('Por favor, descreva o que você deseja no briefing')
      return
    }

    setIsGenerating(true)
    toast.info('Gerando briefing com IA... Isso pode levar alguns segundos.')

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      const result = apiKey 
        ? await generateBriefingWithAI({
            titulo: formData.titulo || 'Briefing Executivo',
            tema: formData.tema,
            prioridade: formData.prioridade,
            especificacoes: especificacoes
          })
        : await generateBriefingMock({
            titulo: formData.titulo || 'Briefing Executivo',
            tema: formData.tema,
            prioridade: formData.prioridade,
            especificacoes: especificacoes
          })

      if (result.success) {
        // Processar fontes (pode ser array de objetos ou array de strings)
        const fontesProcessadas = result.fontes?.map(f => {
          if (typeof f === 'string') {
            return f
          }
          return f.nome || f
        }) || []

        // Extrair título do conteúdo gerado se não foi fornecido
        const conteudoGerado = result.conteudo || ''
        let tituloGerado = formData.titulo
        
        if (!formData.titulo.trim() && conteudoGerado) {
          // Tentar extrair título do markdown (primeira linha após #)
          const tituloMatch = conteudoGerado.match(/^#\s+(.+)$/m)
          if (tituloMatch) {
            tituloGerado = tituloMatch[1].trim()
          }
        }

        setFormData({
          ...formData,
          titulo: tituloGerado || formData.titulo,
          conteudo: conteudoGerado,
          fontes: [...new Set([...formData.fontes, ...fontesProcessadas])] // Evitar duplicatas
        })
        toast.success('Briefing gerado com sucesso! Revise o conteúdo e as fontes antes de salvar.')
        
        // Mostrar informações sobre as fontes geradas
        if (fontesProcessadas.length > 0) {
          toast.info(`${fontesProcessadas.length} fonte(s) adicionada(s) automaticamente`)
        }
      } else {
        toast.error(result.error || 'Erro ao gerar briefing com IA')
      }
    } catch (error) {
      console.error('Erro ao gerar briefing:', error)
      toast.error('Erro ao gerar briefing com IA: ' + (error.message || 'Tente novamente.'))
    } finally {
      setIsGenerating(false)
    }
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
          Crie um novo briefing executivo. Use a IA para gerar o conteúdo automaticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Seção de IA */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">Assistente de IA</h2>
          </div>
          <p className="text-sm text-blue-700">
            Descreva o que você deseja no briefing e a IA irá gerar o conteúdo completo com informações concretas, formais e referências de artigos.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especificações do Briefing
            </label>
            <textarea
              value={especificacoes}
              onChange={(e) => setEspecificacoes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Análise da produção agrícola de Pernambuco em 2024, incluindo dados de crescimento, principais culturas, impactos climáticos e projeções para 2025..."
            />
          </div>
          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isGenerating || !especificacoes.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Briefing com IA
              </>
            )}
          </button>
        </div>

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

