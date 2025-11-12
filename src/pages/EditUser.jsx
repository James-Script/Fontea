import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDatabase, updateUserProfile, findUser } from '../data/database'
import { getCurrentUser, isAdmin, canManageUsers } from '../utils/auth'
import { toast } from 'sonner'
import { ArrowLeft, Save, Upload, X, User, Mail, Phone, Briefcase, Building, Trash2 } from 'lucide-react'
import { Navigate } from 'react-router-dom'

export default function EditUser() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = getCurrentUser()
  const [preview, setPreview] = useState(null)

  // Verificar se é admin ou gestor (mediano/total)
  const canEdit = isAdmin() || canManageUsers()
  if (!canEdit) {
    return <Navigate to="/users" replace />
  }

  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => {
      const db = getDatabase()
      return findUser(userId)
    },
    enabled: !!userId
  })

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    funcao: '',
    departamento: '',
    tipo_usuario: 'analista',
    nivel_acesso: 'basico',
    ativo: true,
    foto_perfil: null
  })

  useEffect(() => {
    if (userData) {
      setFormData({
        nome: userData.nome || '',
        email: userData.email || '',
        telefone: userData.telefone || '',
        cargo: userData.cargo || '',
        funcao: userData.funcao || '',
        departamento: userData.departamento || '',
        tipo_usuario: userData.tipo_usuario || 'analista',
        nivel_acesso: userData.nivel_acesso || 'basico',
        ativo: userData.ativo !== undefined ? userData.ativo : true,
        foto_perfil: userData.foto_perfil || null
      })
      setPreview(userData.foto_perfil)
    }
  }, [userData])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setFormData({ ...formData, foto_perfil: base64String })
        setPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, foto_perfil: null })
    setPreview(null)
  }

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const result = updateUserProfile(userId, data)
      if (!result.success) {
        throw new Error(result.error)
      }
      return result.user
    },
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!')
      queryClient.invalidateQueries(['user', userId])
      queryClient.invalidateQueries(['users'])
      navigate('/users')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar perfil')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fontea-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/users')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Editar Usuário</h1>
          <p className="mt-2 text-gray-600">
            Edite as informações do usuário {userData.nome}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Foto de Perfil */}
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de Perfil
            </label>
            <div className="flex flex-col items-center">
              <div className="relative">
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                    <User className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="mt-4 cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition">
                  <Upload className="h-4 w-4" />
                  <span>Upload Foto</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">Máximo 2MB</p>
            </div>
          </div>

          {/* Formulário */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
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
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Função
                </label>
                <input
                  type="text"
                  value={formData.funcao}
                  onChange={(e) => setFormData({ ...formData, funcao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.departamento}
                  onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuário
                </label>
                <select
                  value={formData.tipo_usuario}
                  onChange={(e) => setFormData({ ...formData, tipo_usuario: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
                >
                  <option value="analista">Analista</option>
                  <option value="gestor">Gestor</option>
                  <option value="tecnico">Técnico</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nível de Acesso
                </label>
                <select
                  value={formData.nivel_acesso}
                  onChange={(e) => setFormData({ ...formData, nivel_acesso: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
                >
                  <option value="basico">Básico</option>
                  <option value="mediano">Mediano</option>
                  <option value="total">Total</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
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
                Usuário Ativo
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

