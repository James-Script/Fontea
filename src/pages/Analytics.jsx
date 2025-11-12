import { useQuery } from '@tanstack/react-query'
import { getDatabase } from '../data/database'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
import { format } from 'date-fns'
import ptBR from 'date-fns/locale/pt-BR'

const COLORS = ['#00BFA5', '#00897B', '#004D40', '#B2DFDB', '#FF6B35']

export default function Analytics() {
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => {
      const db = getDatabase()
      
      // Briefings por tema
      const porTema = db.briefings.reduce((acc, b) => {
        acc[b.tema] = (acc[b.tema] || 0) + 1
        return acc
      }, {})
      
      // Briefings por status
      const porStatus = db.briefings.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1
        return acc
      }, {})
      
      // Briefings por responsável
      const porResponsavel = db.briefings.reduce((acc, b) => {
        acc[b.responsavel_nome] = (acc[b.responsavel_nome] || 0) + 1
        return acc
      }, {})
      
      // Briefings por mês (últimos 6 meses)
      const ultimos6Meses = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        return format(date, 'MMM yyyy', { locale: ptBR })
      })
      
      const porMes = ultimos6Meses.map(mes => {
        const [mesNome, ano] = mes.split(' ')
        const mesNum = new Date(`${mesNome} 1, ${ano}`).getMonth() + 1
        const count = db.briefings.filter(b => {
          const briefingDate = new Date(b.data_criacao)
          return briefingDate.getMonth() + 1 === mesNum && briefingDate.getFullYear() === parseInt(ano)
        }).length
        return { mes, quantidade: count }
      })
      
      // Taxa de aprovação
      const total = db.briefings.length
      const aprovados = db.briefings.filter(b => b.status === 'aprovado').length
      const taxaAprovacao = total > 0 ? (aprovados / total) * 100 : 0
      
      // Tempo médio de aprovação
      const aprovadosComData = db.briefings.filter(b => b.status === 'aprovado')
      const tempoMedioAprovacao = aprovadosComData.length > 0
        ? aprovadosComData.reduce((sum, b) => {
            const diff = new Date(b.data_atualizacao) - new Date(b.data_criacao)
            return sum + diff
          }, 0) / aprovadosComData.length / (1000 * 60 * 60 * 24) // em dias
        : 0
      
      return {
        porTema: Object.entries(porTema).map(([name, value]) => ({
          name: name.replace('_', ' ').toUpperCase(),
          value
        })),
        porStatus: Object.entries(porStatus).map(([name, value]) => ({
          name: name.replace('_', ' ').toUpperCase(),
          value
        })),
        porResponsavel: Object.entries(porResponsavel)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
        porMes,
        taxaAprovacao: taxaAprovacao.toFixed(1),
        tempoMedioAprovacao: tempoMedioAprovacao.toFixed(1),
        total,
        aprovados,
        emRevisao: db.briefings.filter(b => b.status === 'em_revisao').length,
        rascunho: db.briefings.filter(b => b.status === 'rascunho').length
      }
    }
  })

  if (!analytics) {
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
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">
          Análise detalhada do desempenho do sistema
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total de Briefings</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{analytics.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{analytics.taxaAprovacao}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Tempo Médio de Aprovação</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{analytics.tempoMedioAprovacao} dias</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Em Revisão</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{analytics.emRevisao}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Briefings por Mês */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Briefings Criados (Últimos 6 Meses)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.porMes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
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

        {/* Distribuição por Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Distribuição por Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.porStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.porStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Briefings por Tema */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Briefings por Tema
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.porTema}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#00BFA5" name="Quantidade" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Responsáveis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top 10 Responsáveis
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.porResponsavel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#00897B" name="Briefings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

