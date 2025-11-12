import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDatabase, saveDatabase, createProfileChangeRequest, getPendingProfileChangeRequests } from '../data/database'
import { getCurrentUser } from '../utils/auth'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Save,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  Upload,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function Profile() {
  const user = getCurrentUser()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    telefone: '',
    cargo: user?.cargo || '',
    departamento: '',
    nivel_acesso: user?.nivel_acesso || 'basico',
    foto_perfil: null
  })
  const [preview, setPreview] = useState(null)

  const { data: profileData } = useQuery({
    queryKey: ['profile', user?.userId],
    queryFn: () => {
      const db = getDatabase()
      const userData = db.users.find(u => u.id === user?.userId)
      const userBriefings = db.briefings.filter(b => b.responsavel_id === user?.userId)
      const pendingRequests = getPendingProfileChangeRequests()
      const pendingRequest = pendingRequests.find(r => r.userId === user?.userId && r.status === 'pendente')
      
      // Estatísticas
      const stats = {
        total: userBriefings.length,
        aprovados: userBriefings.filter(b => b.status === 'aprovado').length,
        em_revisao: userBriefings.filter(b => b.status === 'em_revisao').length,
        rascunho: userBriefings.filter(b => b.status === 'rascunho').length,
        visualizacoes: userBriefings.reduce((sum, b) => sum + (b.visualizacoes || 0), 0),
        tempo_medio: userBriefings.length > 0
          ? userBriefings.reduce((sum, b) => {
              const diff = new Date(b.data_atualizacao) - new Date(b.data_criacao)
              return sum + diff
            }, 0) / userBriefings.length / (1000 * 60 * 60)
          : 0
      }

      // Gráfico de produtividade (últimos 7 dias)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return format(date, 'dd/MM', { locale: ptBR })
      })

      const productivity = last7Days.map(day => {
        const date = new Date(day.split('/').reverse().join('-'))
        const count = userBriefings.filter(b => {
          const briefingDate = new Date(b.data_criacao)
          return briefingDate.toDateString() === date.toDateString()
        }).length
        return { dia: day, quantidade: count }
      })

      return {
        user: userData,
        stats,
        productivity,
        recentBriefings: userBriefings
          .sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
          .slice(0, 5),
        pendingProfileChange: pendingRequest
      }
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const db = getDatabase()
      const currentUser = db.users.find(u => u.id === user?.userId)
      
      if (!currentUser) {
        throw new Error('Usuário não encontrado')
      }

      // Verificar se cargo, departamento ou nível de acesso foram alterados (comparar com valores atuais do banco)
      // Normalizar valores para comparação (trim e tratar null/undefined)
      const cargoAtual = (currentUser.cargo || '').trim()
      const cargoNovo = (data.cargo || '').trim()
      const departamentoAtual = (currentUser.departamento || '').trim()
      const departamentoNovo = (data.departamento || '').trim()
      const nivelAcessoAtual = currentUser.nivel_acesso || 'basico'
      const nivelAcessoNovo = data.nivel_acesso || 'basico'
      
      // Debug: log para verificar valores
      console.log('Comparação de valores:', {
        cargoAtual,
        cargoNovo,
        cargoMudou: cargoNovo !== cargoAtual,
        departamentoAtual,
        departamentoNovo,
        departamentoMudou: departamentoNovo !== departamentoAtual,
        nivelAcessoAtual,
        nivelAcessoNovo,
        nivelAcessoMudou: nivelAcessoNovo !== nivelAcessoAtual
      })
      
      const cargoMudou = cargoNovo !== cargoAtual
      const departamentoMudou = departamentoNovo !== departamentoAtual
      const nivelAcessoMudou = nivelAcessoNovo !== nivelAcessoAtual
      
      let solicitacaoCriada = false
      
      if (cargoMudou || departamentoMudou || nivelAcessoMudou) {
        console.log('Criando solicitação de alteração...')
        // Criar solicitação de aprovação para cargo/departamento/nível de acesso ANTES de salvar o perfil
        const requestResult = createProfileChangeRequest(user?.userId, {
          cargo: cargoNovo || cargoAtual,
          departamento: departamentoNovo || departamentoAtual,
          nivel_acesso: nivelAcessoNovo || nivelAcessoAtual
        })
        
        console.log('Resultado da criação:', requestResult)
        
        if (!requestResult.success) {
          throw new Error(requestResult.error || 'Erro ao criar solicitação')
        }
        
        solicitacaoCriada = true
        
        // Recarregar o banco após criar a solicitação para garantir que temos a versão atualizada
        const dbUpdated = getDatabase()
        console.log('Banco recarregado após criar solicitação. Total de solicitações:', dbUpdated.profileChangeRequests?.length || 0)
      } else {
        console.log('Nenhuma alteração detectada em cargo, departamento ou nível de acesso')
      }

      // Atualizar campos que não precisam de aprovação
      // Recarregar o banco para garantir que temos a versão mais recente
      const dbFinal = getDatabase()
      const userIndex = dbFinal.users.findIndex(u => u.id === user?.userId)
      if (userIndex !== -1) {
        dbFinal.users[userIndex].nome = data.nome
        dbFinal.users[userIndex].email = data.email
        dbFinal.users[userIndex].telefone = data.telefone
        dbFinal.users[userIndex].foto_perfil = data.foto_perfil
        // Cargo e departamento só serão atualizados após aprovação
        saveDatabase(dbFinal)
        console.log('Perfil atualizado. Total de solicitações no banco final:', dbFinal.profileChangeRequests?.length || 0)
        
        // Atualizar sessão
        const session = JSON.parse(localStorage.getItem('fontea_session') || '{}')
        session.nome = data.nome
        session.email = data.email
        localStorage.setItem('fontea_session', JSON.stringify(session))
      }
      
      return { ...data, solicitacaoCriada }
    },
    onSuccess: (result) => {
      if (result.solicitacaoCriada) {
        toast.success('Alterações salvas! Solicitação de alteração de cargo/departamento enviada para aprovação.')
      } else {
        toast.success('Perfil atualizado com sucesso!')
      }
      setEditing(false)
      queryClient.invalidateQueries(['profile', user?.userId])
      queryClient.invalidateQueries({ queryKey: ['users'] }) // Invalidar para atualizar solicitações
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar perfil')
    }
  })

  const handleSave = () => {
    updateProfileMutation.mutate(formData)
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fontea-primary"></div>
      </div>
    )
  }

  const getAccessBadge = (nivel, isAdmin) => {
    if (isAdmin || nivel === 'admin') {
      return { text: 'Administrador', color: 'bg-red-100 text-red-800' }
    }
    const badges = {
      basico: { text: 'Básico', color: 'bg-blue-100 text-blue-800' },
      mediano: { text: 'Mediano', color: 'bg-purple-100 text-purple-800' },
      total: { text: 'Total', color: 'bg-green-100 text-green-800' }
    }
    return badges[nivel] || badges.basico
  }

  const badge = getAccessBadge(user?.nivel_acesso, user?.is_admin)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="mt-2 text-gray-600">
          Gerencie suas informações pessoais e acompanhe seu desempenho
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Pessoais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Aviso de Solicitação Pendente */}
          {profileData?.pendingProfileChange && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-1">
                    Solicitação de Alteração Pendente
                  </h3>
                  <p className="text-sm text-blue-700 mb-2">
                    Sua solicitação de alteração de cargo/departamento/nível de acesso está aguardando aprovação dos superiores.
                  </p>
                  <div className="text-xs text-blue-600 space-y-1">
                    {profileData.pendingProfileChange.cargo_antigo !== profileData.pendingProfileChange.cargo_novo && (
                      <p><strong>Cargo:</strong> {profileData.pendingProfileChange.cargo_antigo} → {profileData.pendingProfileChange.cargo_novo}</p>
                    )}
                    {profileData.pendingProfileChange.departamento_antigo !== profileData.pendingProfileChange.departamento_novo && (
                      <p><strong>Departamento:</strong> {profileData.pendingProfileChange.departamento_antigo} → {profileData.pendingProfileChange.departamento_novo}</p>
                    )}
                    {profileData.pendingProfileChange.nivel_acesso_antigo && profileData.pendingProfileChange.nivel_acesso_novo && profileData.pendingProfileChange.nivel_acesso_antigo !== profileData.pendingProfileChange.nivel_acesso_novo && (
                      <p><strong>Nível de Acesso:</strong> {profileData.pendingProfileChange.nivel_acesso_antigo.charAt(0).toUpperCase() + profileData.pendingProfileChange.nivel_acesso_antigo.slice(1)} → {profileData.pendingProfileChange.nivel_acesso_novo.charAt(0).toUpperCase() + profileData.pendingProfileChange.nivel_acesso_novo.slice(1)}</p>
                    )}
                    <p className="text-blue-500">
                      Solicitado em: {new Date(profileData.pendingProfileChange.data_solicitacao).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2>
              {!editing && (
                <button
                  onClick={() => {
                    setFormData({
                      nome: profileData.user?.nome || '',
                      email: profileData.user?.email || '',
                      telefone: profileData.user?.telefone || '',
                      cargo: profileData.user?.cargo || '',
                      departamento: profileData.user?.departamento || '',
                      nivel_acesso: profileData.user?.nivel_acesso || 'basico',
                      foto_perfil: profileData.user?.foto_perfil || null
                    })
                    setPreview(profileData.user?.foto_perfil || null)
                    setEditing(true)
                  }}
                  className="text-fontea-primary hover:text-fontea-secondary font-medium"
                >
                  Editar
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                {/* Foto de Perfil */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foto de Perfil
                  </label>
                  <div className="flex items-center gap-4">
                    {preview ? (
                      <div className="relative">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPreview(null)
                            setFormData({ ...formData, foto_perfil: null })
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                        <User className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition">
                        <Upload className="h-4 w-4" />
                        <span>Upload Foto</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
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
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Máximo 2MB</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
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
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
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
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    A alteração do nível de acesso requer aprovação dos superiores
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
                  >
                    <Save className="h-4 w-4" />
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
              <div className="space-y-4">
                {/* Foto de Perfil */}
                <div className="flex justify-center mb-4">
                  {profileData.user?.foto_perfil ? (
                    <img
                      src={profileData.user.foto_perfil}
                      alt={profileData.user.nome}
                      className="w-24 h-24 rounded-full object-cover border-4 border-fontea-primary"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-medium text-gray-900">{profileData.user?.nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{profileData.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium text-gray-900">{profileData.user?.telefone || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Cargo</p>
                    <p className="font-medium text-gray-900">{profileData.user?.cargo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Departamento</p>
                    <p className="font-medium text-gray-900">{profileData.user?.departamento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Nível de Acesso</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${badge.color}`}>
                      {badge.text}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gráfico de Produtividade */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Produtividade (Últimos 7 Dias)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={profileData.productivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="quantidade"
                  stroke="#00BFA5"
                  strokeWidth={2}
                  name="Briefings Criados"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Estatísticas</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-gray-700">Total</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">{profileData.stats.total}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Aprovados</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{profileData.stats.aprovados}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-gray-700">Em Revisão</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{profileData.stats.em_revisao}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Visualizações</span>
                </div>
                <span className="text-2xl font-bold text-purple-600">{profileData.stats.visualizacoes}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-teal-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  <span className="text-gray-700">Tempo Médio</span>
                </div>
                <span className="text-2xl font-bold text-teal-600">
                  {profileData.stats.tempo_medio.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>

          {/* Briefings Recentes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Briefings Recentes</h2>
            <div className="space-y-3">
              {profileData.recentBriefings.length > 0 ? (
                profileData.recentBriefings.map((briefing) => (
                  <div key={briefing.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm text-gray-900 truncate">{briefing.titulo}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(briefing.data_criacao), "dd 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhum briefing criado ainda</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

