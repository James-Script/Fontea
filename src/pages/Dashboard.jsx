import { useQuery } from '@tanstack/react-query'
import { getDatabase, getUserStats } from '../data/database'
import { getCurrentUser } from '../utils/auth'
import { FileText, CheckCircle, Clock, Eye, TrendingUp, Users } from 'lucide-react'
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

const COLORS = ['#00BFA5', '#00897B', '#004D40', '#B2DFDB', '#FF6B35']

export default function Dashboard() {
  const user = getCurrentUser()
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => {
      const db = getDatabase()
      const userStats = getUserStats(user?.userId)
      
      // Estatísticas gerais
      const totalBriefings = db.briefings.length
      const aprovados = db.briefings.filter(b => b.status === 'aprovado').length
      const emRevisao = db.briefings.filter(b => b.status === 'em_revisao').length
      const rascunho = db.briefings.filter(b => b.status === 'rascunho').length
      
      // Dados para gráficos
      const briefingsPorTema = db.briefings.reduce((acc, b) => {
        acc[b.tema] = (acc[b.tema] || 0) + 1
        return acc
      }, {})
      
      const briefingsPorStatus = [
        { name: 'Aprovados', value: aprovados },
        { name: 'Em Revisão', value: emRevisao },
        { name: 'Rascunho', value: rascunho }
      ]
      
      // Briefings dos últimos 7 dias
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        return format(date, 'dd/MM', { locale: ptBR })
      })
      
      const briefingsPorDia = last7Days.map(day => {
        const date = new Date(day.split('/').reverse().join('-'))
        const count = db.briefings.filter(b => {
          const briefingDate = new Date(b.data_criacao)
          return briefingDate.toDateString() === date.toDateString()
        }).length
        return { dia: day, quantidade: count }
      })
      
      return {
        userStats,
        totalBriefings,
        aprovados,
        emRevisao,
        rascunho,
        briefingsPorTema: Object.entries(briefingsPorTema).map(([name, value]) => ({
          name: name.replace('_', ' ').toUpperCase(),
          value
        })),
        briefingsPorStatus,
        briefingsPorDia
      }
    }
  })

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fontea-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Bem-vindo, {user?.nome}! Aqui está um resumo do sistema.
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Briefings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalBriefings}</p>
            </div>
            <div className="bg-fontea-primary/10 p-3 rounded-lg">
              <FileText className="h-8 w-8 text-fontea-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprovados</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.aprovados}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Revisão</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.emRevisao}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Meus Briefings</p>
              <p className="text-3xl font-bold text-fontea-primary mt-2">{stats.userStats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Briefings por Dia */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Briefings Criados (Últimos 7 Dias)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.briefingsPorDia}>
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
                name="Briefings"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza - Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Distribuição por Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.briefingsPorStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.briefingsPorStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Por Tema */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Briefings por Tema
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.briefingsPorTema}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#00BFA5" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas Pessoais */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Minhas Estatísticas
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-fontea-primary" />
                <span className="text-gray-700">Total Criados</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.userStats.total}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-gray-700">Aprovados</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.userStats.aprovados}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-gray-700">Em Revisão</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{stats.userStats.emRevisao}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">Rascunhos</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.userStats.rascunho}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700">Tempo Médio</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {stats.userStats.tempoMedioAprovacao > 0 ? stats.userStats.tempoMedioAprovacao.toFixed(1) : '0.0'}h
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

