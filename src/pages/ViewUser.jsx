import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDatabase, findUser } from '../data/database'
import { getCurrentUser, isAdmin, canManageUsers } from '../utils/auth'
import { Navigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Phone, Briefcase, Building, Edit } from 'lucide-react'
import { cn } from '../utils/cn'

export default function ViewUser() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const canManage = canManageUsers()

  if (!canManage) {
    return <Navigate to="/" replace />
  }

  const { data: userData } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => {
      const db = getDatabase()
      return findUser(userId)
    },
    enabled: !!userId
  })

  if (!userData) {
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

  const getTypeBadge = (tipo) => {
    const badges = {
      analista: { text: 'Analista', color: 'bg-blue-100 text-blue-800' },
      gestor: { text: 'Gestor', color: 'bg-green-100 text-green-800' },
      tecnico: { text: 'Técnico', color: 'bg-yellow-100 text-yellow-800' },
      admin: { text: 'Admin', color: 'bg-red-100 text-red-800' }
    }
    return badges[tipo] || { text: tipo, color: 'bg-gray-100 text-gray-800' }
  }

  const accessBadge = getAccessBadge(userData.nivel_acesso, userData.is_admin)
  const typeBadge = getTypeBadge(userData.tipo_usuario)

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
          <h1 className="text-3xl font-bold text-gray-900">Perfil do Usuário</h1>
          <p className="mt-2 text-gray-600">
            Visualize as informações do usuário {userData.nome}
          </p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => navigate(`/users/${userId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition"
          >
            <Edit className="h-4 w-4" />
            Editar Usuário
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-6 mb-6">
          {/* Foto de Perfil */}
          {userData.foto_perfil ? (
            <img
              src={userData.foto_perfil}
              alt={userData.nome}
              className="w-24 h-24 rounded-full object-cover border-4 border-fontea-primary"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-300">
              <User className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{userData.nome}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', accessBadge.color)}>
                {accessBadge.text}
              </span>
              <span className={cn('px-3 py-1 rounded-full text-sm font-medium', typeBadge.color)}>
                {typeBadge.text}
              </span>
              {userData.pendente_aprovacao && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Pendente
                </span>
              )}
              {!userData.ativo && !userData.pendente_aprovacao && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Inativo
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{userData.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Telefone</p>
                <p className="font-medium text-gray-900">{userData.telefone || 'Não informado'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Briefcase className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Cargo</p>
                <p className="font-medium text-gray-900">{userData.cargo}</p>
              </div>
            </div>
            {userData.funcao && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Briefcase className="h-5 w-5 text-fontea-primary" />
                <div>
                  <p className="text-sm text-gray-600">Função</p>
                  <p className="font-medium text-fontea-primary">{userData.funcao}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Departamento</p>
                <p className="font-medium text-gray-900">{userData.departamento}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

