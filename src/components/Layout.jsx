import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { logout, getCurrentUser } from '../utils/auth'
import { getDatabase } from '../data/database'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  BarChart3,
  User,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import Logo from './Logo'
import Breadcrumb from './Breadcrumb'
import { cn } from '../utils/cn'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Logout realizado com sucesso')
    navigate('/login')
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Briefings', path: '/briefings' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ]

  // Adicionar menu de usuários se tiver permissão (Admin ou nível total)
  if (user?.is_admin || user?.nivel_acesso === 'admin' || user?.nivel_acesso === 'total') {
    menuItems.push({ icon: Users, label: 'Usuários', path: '/users' })
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <Logo size="medium" />
          </div>

          {/* Menu */}
          <nav className="mt-5 flex-1 px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-fontea-primary/10 text-fontea-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          {/* User Info */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center gap-3">
                {/* Foto de Perfil */}
                {(() => {
                  const db = getDatabase()
                  const userData = db.users.find(u => u.id === user?.userId)
                  return userData?.foto_perfil ? (
                    <img
                      src={userData.foto_perfil}
                      alt={user?.nome}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 flex-shrink-0">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  )
                })()}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.nome}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.cargo}
                  </p>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1', badge.color)}>
                    {badge.text}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4 mb-8">
                <Logo size="medium" />
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path)
                        setSidebarOpen(false)
                      }}
                      className={cn(
                        'w-full group flex items-center px-2 py-2 text-base font-medium rounded-md',
                        isActive
                          ? 'bg-fontea-primary/10 text-fontea-primary'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="mr-4 h-6 w-6" />
                      {item.label}
                    </button>
                  )
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full">
                <div className="flex items-center gap-3">
                  {(() => {
                    const db = getDatabase()
                    const userData = db.users.find(u => u.id === user?.userId)
                    return userData?.foto_perfil ? (
                      <img
                        src={userData.foto_perfil}
                        alt={user?.nome}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300 flex-shrink-0">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )
                  })()}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                    <p className="text-xs text-gray-500">{user?.cargo}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-fontea-primary"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="ml-2 md:ml-0 text-xl font-semibold text-gray-900">
                  {location.pathname === '/' && 'Dashboard'}
                  {location.pathname.startsWith('/briefings') && 'Briefings'}
                  
                  {location.pathname === '/analytics' && 'Analytics'}
                  {location.pathname === '/users' && 'Usuários'}
                  {location.pathname.startsWith('/users/register') && 'Cadastrar Funcionário'}
                  {location.pathname === '/profile' && 'Perfil'}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">Perfil</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Breadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  )
}

