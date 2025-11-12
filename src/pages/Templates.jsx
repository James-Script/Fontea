import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDatabase, saveDatabase } from '../data/database'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, FileText } from 'lucide-react'
import { cn } from '../utils/cn'

export default function Templates() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    conteudo: '',
    tema: 'defesa_civil',
    ativo: true
  })

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => {
      const db = getDatabase()
      return db.templates
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const db = getDatabase()
      const newId = `TMP${String(db.templates.length + 1).padStart(3, '0')}`
      const newTemplate = { id: newId, ...data }
      db.templates.push(newTemplate)
      saveDatabase(db)
      return newTemplate
    },
    onSuccess: () => {
      toast.success('Template criado com sucesso!')
      setShowForm(false)
      setFormData({
        nome: '',
        descricao: '',
        conteudo: '',
        tema: 'defesa_civil',
        ativo: true
      })
      queryClient.invalidateQueries(['templates'])
    },
    onError: () => {
      toast.error('Erro ao criar template')
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const db = getDatabase()
      const templateIndex = db.templates.findIndex(t => t.id === id)
      if (templateIndex !== -1) {
        db.templates[templateIndex] = { ...db.templates[templateIndex], ...data }
        saveDatabase(db)
      }
      return id
    },
    onSuccess: () => {
      toast.success('Template atualizado com sucesso!')
      setEditing(null)
      setShowForm(false)
      queryClient.invalidateQueries(['templates'])
    },
    onError: () => {
      toast.error('Erro ao atualizar template')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const db = getDatabase()
      db.templates = db.templates.filter(t => t.id !== id)
      saveDatabase(db)
      return id
    },
    onSuccess: () => {
      toast.success('Template excluído com sucesso!')
      queryClient.invalidateQueries(['templates'])
    },
    onError: () => {
      toast.error('Erro ao excluir template')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) {
      updateMutation.mutate({ id: editing, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const startEdit = (template) => {
    setEditing(template.id)
    setFormData({
      nome: template.nome,
      descricao: template.descricao,
      conteudo: template.conteudo,
      tema: template.tema,
      ativo: template.ativo
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="mt-2 text-gray-600">
            Gerencie templates de briefings
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setFormData({
              nome: '',
              descricao: '',
              conteudo: '',
              tema: 'defesa_civil',
              ativo: true
            })
            setShowForm(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
        >
          <Plus className="h-5 w-5" />
          Novo Template
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editing ? 'Editar Template' : 'Novo Template'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo (Markdown) *
              </label>
              <textarea
                value={formData.conteudo}
                onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent font-mono text-sm"
                required
              />
            </div>
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-4 h-4 text-fontea-primary border-gray-300 rounded focus:ring-fontea-primary"
              />
              <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
                Template Ativo
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
              >
                {editing ? 'Atualizar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{template.nome}</h3>
                <p className="text-sm text-gray-600 mb-2">{template.descricao}</p>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  template.ativo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                )}>
                  {template.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Tema:</span> {template.tema.replace('_', ' ').toUpperCase()}
            </div>
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => startEdit(template)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja excluir este template?')) {
                    deleteMutation.mutate(template.id)
                  }
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(!templates || templates.length === 0) && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum template criado ainda</p>
        </div>
      )}
    </div>
  )
}

