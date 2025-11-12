import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { createUser, getDatabase } from '../data/database'
import { canManageUsers } from '../utils/auth'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { UserPlus, ArrowLeft, Save, Shield, FileText, Eye, EyeOff } from 'lucide-react'

export default function RegisterUser() {
  const canManage = canManageUsers()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cargo: '',
    funcao: '',
    departamento: '',
    telefone: '',
    tipo_usuario: 'analista',
    nivel_acesso: 'basico',
    lgpd_consentimento: false,
    lgpd_finalidade: '',
    lgpd_data_consentimento: null
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  if (!canManage) {
    return <Navigate to="/" replace />
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória'
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter no mínimo 6 caracteres'
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem'
    }

    if (!formData.cargo.trim()) {
      newErrors.cargo = 'Cargo é obrigatório'
    }

    if (!formData.funcao.trim()) {
      newErrors.funcao = 'Função é obrigatória'
    }

    if (!formData.departamento.trim()) {
      newErrors.departamento = 'Departamento é obrigatório'
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório'
    }

    if (!formData.lgpd_consentimento) {
      newErrors.lgpd_consentimento = 'É necessário o consentimento para tratamento de dados pessoais'
    }

    if (!formData.lgpd_finalidade.trim()) {
      newErrors.lgpd_finalidade = 'Finalidade do tratamento de dados é obrigatória'
    }

    // Verificar se email já existe (validação adicional no frontend)
    if (formData.email.trim() && !newErrors.email) {
      try {
        const db = getDatabase()
        const emailExists = db.users.some(u => u.email.toLowerCase() === formData.email.toLowerCase().trim())
        if (emailExists) {
          newErrors.email = 'Este email já está cadastrado'
        }
      } catch (error) {
        // Se houver erro ao verificar, continua a validação
        console.error('Erro ao verificar email:', error)
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    setLoading(true)

    try {
      const result = createUser({
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        senha: formData.senha,
        cargo: formData.cargo.trim(),
        funcao: formData.funcao.trim(),
        departamento: formData.departamento.trim(),
        telefone: formData.telefone.trim(),
        tipo_usuario: formData.tipo_usuario,
        nivel_acesso: formData.nivel_acesso,
        lgpd_consentimento: formData.lgpd_consentimento,
        lgpd_finalidade: formData.lgpd_finalidade.trim(),
        lgpd_data_consentimento: new Date().toISOString(),
        ativo: true
      })

      if (result.success) {
        toast.success(`Usuário ${formData.nome} cadastrado com sucesso!`)
        // Invalidar query para atualizar a lista de usuários
        queryClient.invalidateQueries({ queryKey: ['users'] })
        navigate('/users')
      } else {
        toast.error(result.error || 'Erro ao cadastrar usuário')
      }
    } catch (error) {
      toast.error('Erro ao cadastrar usuário. Tente novamente.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/users')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Cadastrar Funcionário</h1>
          <p className="mt-2 text-gray-600">
            Preencha os dados do novo funcionário e configure as permissões de acesso
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Pessoais */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="h-5 w-5 text-fontea-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Informações Pessoais</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                  errors.nome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: João da Silva"
              />
              {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="exemplo@fontea.pe.gov.br"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                  errors.telefone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(81) 99999-9999"
              />
              {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>}
            </div>
          </div>

          {/* Informações Profissionais */}
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-fontea-primary" />
              <h2 className="text-xl font-semibold text-gray-900">Informações Profissionais</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                  errors.cargo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Analista Técnico"
              />
              {errors.cargo && <p className="mt-1 text-sm text-red-600">{errors.cargo}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Função que Exerce <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="funcao"
                value={formData.funcao}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                  errors.funcao ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Análise de dados satelitais, Monitoramento ambiental"
              />
              {errors.funcao && <p className="mt-1 text-sm text-red-600">{errors.funcao}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Descreva a função específica que o funcionário exerce no departamento
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                  errors.departamento ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Assuntos Espaciais"
              />
              {errors.departamento && <p className="mt-1 text-sm text-red-600">{errors.departamento}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Usuário <span className="text-red-500">*</span>
              </label>
              <select
                name="tipo_usuario"
                value={formData.tipo_usuario}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
              >
                <option value="analista">Analista</option>
                <option value="gestor">Gestor</option>
                <option value="tecnico">Técnico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível de Acesso <span className="text-red-500">*</span>
              </label>
              <select
                name="nivel_acesso"
                value={formData.nivel_acesso}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent"
              >
                <option value="basico">Básico</option>
                <option value="mediano">Mediano</option>
                <option value="total">Total</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Básico: Apenas visualização | Mediano: Pode aprovar | Total: Acesso completo
              </p>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-fontea-primary" />
            <h2 className="text-xl font-semibold text-gray-900">Segurança</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                    errors.senha ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.senha && <p className="mt-1 text-sm text-red-600">{errors.senha}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                    errors.confirmarSenha ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmarSenha && <p className="mt-1 text-sm text-red-600">{errors.confirmarSenha}</p>}
            </div>
          </div>
        </div>

        {/* LGPD - Proteção de Dados */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4 border-2 border-fontea-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-fontea-primary" />
            <h2 className="text-xl font-semibold text-gray-900">LGPD - Proteção de Dados Pessoais</h2>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>
            </p>
            <p className="text-sm text-blue-700 mt-2">
              Os dados pessoais coletados serão utilizados exclusivamente para fins de gestão de funcionários, 
              controle de acesso ao sistema e comunicação institucional, conforme previsto na legislação vigente.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Finalidade do Tratamento de Dados <span className="text-red-500">*</span>
            </label>
            <textarea
              name="lgpd_finalidade"
              value={formData.lgpd_finalidade}
              onChange={handleChange}
              rows="4"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                errors.lgpd_finalidade ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Descreva a finalidade do tratamento dos dados pessoais deste funcionário..."
            />
            {errors.lgpd_finalidade && <p className="mt-1 text-sm text-red-600">{errors.lgpd_finalidade}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Exemplo: Gestão de funcionários, controle de acesso ao sistema Fontea, comunicação institucional, 
              elaboração de relatórios administrativos.
            </p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              name="lgpd_consentimento"
              id="lgpd_consentimento"
              checked={formData.lgpd_consentimento}
              onChange={handleChange}
              className="mt-1 h-4 w-4 text-fontea-primary focus:ring-fontea-primary border-gray-300 rounded"
            />
            <label htmlFor="lgpd_consentimento" className="flex-1 text-sm text-gray-700">
              <span className="text-red-500">*</span> Declaro que consinto com o tratamento dos meus dados pessoais 
              para as finalidades descritas acima, de acordo com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). 
              Estou ciente de que posso revogar este consentimento a qualquer momento, bem como solicitar acesso, 
              correção, exclusão ou portabilidade dos meus dados.
            </label>
          </div>
          {errors.lgpd_consentimento && (
            <p className="text-sm text-red-600">{errors.lgpd_consentimento}</p>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-xs text-yellow-800">
              <strong>Importante:</strong> O consentimento e a data de consentimento serão registrados no sistema 
              para fins de auditoria e conformidade com a LGPD. Os dados serão armazenados de forma segura e 
              utilizados apenas para as finalidades declaradas.
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Cadastrando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Cadastrar Funcionário
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

