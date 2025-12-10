import { ChevronRight, Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

export default function Breadcrumb() {
  const location = useLocation()
  
  // Configuração de rotas e seus rótulos amigáveis
  const breadcrumbConfig = {
    '/': { label: 'Dashboard', icon: Home },
    '/briefings': { label: 'Briefings', icon: null },
    '/briefings/new': { label: 'Novo Briefing', parent: '/briefings' },
    
    '/analytics': { label: 'Analytics', icon: null },
    '/profile': { label: 'Perfil', icon: null },
    '/users': { label: 'Usuários', icon: null },
    '/users/register': { label: 'Registrar Usuário', parent: '/users' },
  }

  // Gerar breadcrumbs dinamicamente
  const generateBreadcrumbs = () => {
    const pathname = location.pathname
    
    // Caso especial para detalhes de briefing
    if (pathname.match(/^\/briefings\/[A-Z0-9]+$/)) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Briefings', path: '/briefings' },
        { label: 'Detalhes', path: pathname, active: true }
      ]
    }

    // Caso especial para editar usuário
    if (pathname.match(/^\/users\/[A-Z0-9]+\/edit$/)) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Usuários', path: '/users' },
        { label: 'Editar', path: pathname, active: true }
      ]
    }

    // Caso especial para visualizar usuário
    if (pathname.match(/^\/users\/[A-Z0-9]+\/view$/)) {
      return [
        { label: 'Dashboard', path: '/' },
        { label: 'Usuários', path: '/users' },
        { label: 'Visualizar', path: pathname, active: true }
      ]
    }

    // Rotas padrão
    const pathParts = pathname.split('/').filter(Boolean)
    
    let breadcrumbs = [
      { label: 'Dashboard', path: '/' }
    ]

    let currentPath = ''
    for (const part of pathParts) {
      currentPath += '/' + part
      const config = breadcrumbConfig[currentPath]
      
      if (config) {
        breadcrumbs.push({
          label: config.label,
          path: currentPath,
          active: currentPath === pathname
        })
      }
    }

    // Remover duplicatas
    breadcrumbs = breadcrumbs.filter((item, index, self) =>
      index === self.findIndex((t) => t.path === item.path)
    )

    return breadcrumbs.length === 1 ? [] : breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Não mostrar breadcrumb na página inicial ou login
  if (!breadcrumbs.length || location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((item, index) => (
          <li key={item.path} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
            )}
            {item.active ? (
              <span className="text-gray-700 font-medium">{item.label}</span>
            ) : (
              <Link
                to={item.path}
                className="text-fontea-primary hover:text-fontea-secondary hover:underline transition"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
