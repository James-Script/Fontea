import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDatabase, approveUser, getPendingUsers, getPendingProfileChangeRequests, approveProfileChangeRequest, deleteUser } from '../data/database'
import { getCurrentUser, canManageUsers, canApproveUsers, isAdmin } from '../utils/auth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { Users as UsersIcon, Search, User, Mail, Phone, Briefcase, Building, UserPlus, Edit, Trash2 } from 'lucide-react'
import { cn } from '../utils/cn'

export default function Users() {
  const user = getCurrentUser()
  const canManage = canManageUsers()
  const canApprove = canApproveUsers()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')

  if (!canManage) {
    return <Navigate to="/" replace />
  }

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => {
      const db = getDatabase()
      const users = db.users.map(u => {
        const userBriefings = db.briefings.filter(b => b.responsavel_id === u.id)
        return {
          ...u,
          totalBriefings: userBriefings.length,
          aprovados: userBriefings.filter(b => b.status === 'aprovado').length,
          emRevisao: userBriefings.filter(b => b.status === 'em_revisao').length
        }
      })
      
      const pendingUsers = getPendingUsers()
      const pendingProfileChanges = getPendingProfileChangeRequests()
      
      console.log('Users.jsx - Solicitações encontradas:', pendingProfileChanges.length, pendingProfileChanges)
      
      return {
        users,
        total: users.length,
        ativos: users.filter(u => u.ativo).length,
        pendentes: pendingUsers.length,
        pendentesPerfil: pendingProfileChanges.length,
        pendingProfileChanges: pendingProfileChanges, // Incluir as solicitações no retorno
        porTipo: users.reduce((acc, u) => {
          acc[u.tipo_usuario] = (acc[u.tipo_usuario] || 0) + 1
          return acc
        }, {})
      }
    },
    refetchInterval: 2000 // Atualizar a cada 2 segundos para ver novas solicitações
  })

  const handleApproveUser = async (userId, approved) => {
    const result = approveUser(userId, approved)
    if (result.success) {
      toast.success(approved ? 'Usuário aprovado com sucesso!' : 'Cadastro rejeitado')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } else {
      toast.error(result.error || 'Erro ao processar aprovação')
    }
  }

  const handleApproveProfileChange = async (requestId, approved) => {
    const result = approveProfileChangeRequest(requestId, approved)
    if (result.success) {
      toast.success(approved ? 'Alteração de perfil aprovada com sucesso!' : 'Alteração de perfil rejeitada')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } else {
      toast.error(result.error || 'Erro ao processar aprovação')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return
    }
    const result = deleteUser(userId)
    if (result.success) {
      toast.success('Usuário excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } else {
      toast.error(result.error || 'Erro ao excluir usuário')
    }
  }

  // Usar as solicitações da query para garantir atualização
  const pendingProfileChanges = canApprove && usersData?.pendingProfileChanges ? usersData.pendingProfileChanges : []

  const filteredUsers = usersData?.users.filter(u =>
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.departamento.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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

  const getTypeBadge = (tipo) => {
    const badges = {
      analista: { text: 'Analista', color: 'bg-blue-100 text-blue-800' },
      gestor: { text: 'Gestor', color: 'bg-green-100 text-green-800' },
      tecnico: { text: 'Técnico', color: 'bg-yellow-100 text-yellow-800' },
      admin: { text: 'Admin', color: 'bg-red-100 text-red-800' }
    }
    return badges[tipo] || badges.analista
  }

  if (!usersData) {
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todos os usuários do sistema
          </p>
        </div>
        <button
          onClick={() => navigate('/users/register')}
          className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
        >
          <UserPlus className="h-5 w-5" />
          Cadastrar Funcionário
        </button>
      </div>

      {/* Usuários Pendentes de Aprovação */}
      {canApprove && usersData?.pendentes > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-yellow-900">
                Cadastros Pendentes de Aprovação
              </h2>
              <p className="text-sm text-yellow-700 mt-1">
                {usersData.pendentes} usuário(s) aguardando aprovação
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {getPendingUsers().map((pendingUser) => (
              <div
                key={pendingUser.id}
                className="bg-white rounded-lg p-4 border border-yellow-300 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{pendingUser.nome}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendente
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Email:</strong> {pendingUser.email}</p>
                    <p><strong>Cargo:</strong> {pendingUser.cargo}</p>
                    <p><strong>Departamento:</strong> {pendingUser.departamento}</p>
                    {pendingUser.funcao && (
                      <p><strong>Função:</strong> {pendingUser.funcao}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Cadastrado em: {new Date(pendingUser.data_cadastro).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleApproveUser(pendingUser.id, true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleApproveUser(pendingUser.id, false)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solicitações de Alteração de Cargo/Departamento */}
      {canApprove && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-blue-900">
                Solicitações de Alteração de Cargo/Departamento
              </h2>
              <p className="text-sm text-blue-700 mt-1">
                {pendingProfileChanges?.length || 0} solicitação(ões) aguardando aprovação
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {pendingProfileChanges && pendingProfileChanges.length > 0 ? (
              pendingProfileChanges.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg p-4 border border-blue-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-semibold text-gray-900">{request.nome_usuario}</h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Pendente
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {request.cargo_antigo !== request.cargo_novo && (
                        <div>
                          <p className="text-gray-600 mb-2"><strong>Cargo:</strong></p>
                          <div className="space-y-1">
                            <p className="text-gray-500 line-through">{request.cargo_antigo}</p>
                            <p className="text-fontea-primary font-medium">→ {request.cargo_novo}</p>
                          </div>
                        </div>
                      )}
                      {request.departamento_antigo !== request.departamento_novo && (
                        <div>
                          <p className="text-gray-600 mb-2"><strong>Departamento:</strong></p>
                          <div className="space-y-1">
                            <p className="text-gray-500 line-through">{request.departamento_antigo}</p>
                            <p className="text-fontea-primary font-medium">→ {request.departamento_novo}</p>
                          </div>
                        </div>
                      )}
                      {request.nivel_acesso_antigo && request.nivel_acesso_novo && request.nivel_acesso_antigo !== request.nivel_acesso_novo && (
                        <div>
                          <p className="text-gray-600 mb-2"><strong>Nível de Acesso:</strong></p>
                          <div className="space-y-1">
                            <p className="text-gray-500 line-through capitalize">{request.nivel_acesso_antigo}</p>
                            <p className="text-fontea-primary font-medium">→ {request.nivel_acesso_novo.charAt(0).toUpperCase() + request.nivel_acesso_novo.slice(1)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Solicitado em: {new Date(request.data_solicitacao).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleApproveProfileChange(request.id, true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleApproveProfileChange(request.id, false)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
              ))
            ) : (
              <div className="bg-white rounded-lg p-4 border border-blue-300 text-center text-gray-500">
                Nenhuma solicitação pendente no momento
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{usersData.total}</p>
            </div>
            <div className="bg-fontea-primary/10 p-3 rounded-lg">
              <UsersIcon className="h-8 w-8 text-fontea-primary" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{usersData.ativos}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <User className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {canApprove ? 'Pendentes de Aprovação' : 'Tipos de Usuário'}
              </p>
              {canApprove ? (
                <p className="text-3xl font-bold text-yellow-600 mt-2">{usersData.pendentes || 0}</p>
              ) : (
                <p className="text-sm text-gray-600 mt-2">
                  {Object.entries(usersData.porTipo).map(([tipo, count]) => (
                    <span key={tipo} className="mr-2">
                      {tipo}: {count}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar por nome, email, cargo ou departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((userData) => {
          const accessBadge = getAccessBadge(userData.nivel_acesso, userData.is_admin)
          const typeBadge = getTypeBadge(userData.tipo_usuario)
          
          return (
            <div
              key={userData.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  {/* Foto de Perfil */}
                  {userData.foto_perfil ? (
                    <img
                      src={userData.foto_perfil}
                      alt={userData.nome}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 cursor-pointer" onClick={() => navigate(`/users/${userData.id}/view`)}>
                    <h3 className="font-semibold text-gray-900 mb-2 hover:text-fontea-primary transition">{userData.nome}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', accessBadge.color)}>
                      {accessBadge.text}
                    </span>
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', typeBadge.color)}>
                      {typeBadge.text}
                    </span>
                    {userData.pendente_aprovacao && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pendente
                      </span>
                    )}
                    {!userData.ativo && !userData.pendente_aprovacao && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inativo
                      </span>
                    )}
                  </div>
                  </div>
                  {/* Botões Admin */}
                  {isAdmin() && !userData.pendente_aprovacao && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/users/${userData.id}/edit`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Editar usuário"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!userData.is_admin && userData.nivel_acesso !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(userData.id, userData.nome)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{userData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{userData.telefone || 'Não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  <span>{userData.cargo}</span>
                </div>
                {userData.funcao && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 text-fontea-primary" />
                    <span className="text-fontea-primary font-medium">{userData.funcao}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>{userData.departamento}</span>
                </div>
              </div>

              {canApprove && userData.pendente_aprovacao && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveUser(userData.id, true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleApproveUser(userData.id, false)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar
                    </button>
                  </div>
                </div>
              )}
              {!userData.pendente_aprovacao && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-600">Total</p>
                      <p className="text-lg font-bold text-gray-900">{userData.totalBriefings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Aprovados</p>
                      <p className="text-lg font-bold text-green-600">{userData.aprovados}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Em Revisão</p>
                      <p className="text-lg font-bold text-yellow-600">{userData.emRevisao}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum usuário encontrado</p>
        </div>
      )}
    </div>
  )
}

