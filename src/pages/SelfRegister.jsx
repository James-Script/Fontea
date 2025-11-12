import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUser, getDatabase } from '../data/database'
import { toast } from 'sonner'
import { UserPlus, ArrowLeft, Shield, Lock, User, Mail, Phone, Briefcase, Building, Eye, EyeOff } from 'lucide-react'
import Logo from '../components/Logo'

export default function SelfRegister() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    id_empresa: '',
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    telefone: '',
    cargo: '',
    departamento: '',
    lgpd_consentimento: false,
    lgpd_finalidade: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    const newErrors = {}

    // Validar ID da empresa (6 dígitos)
    if (!formData.id_empresa.trim()) {
      newErrors.id_empresa = 'ID da empresa é obrigatório'
    } else if (!/^\d{6}$/.test(formData.id_empresa)) {
      newErrors.id_empresa = 'ID deve conter exatamente 6 dígitos numéricos'
    } else {
      // Verificar se ID já existe
      const db = getDatabase()
      const idExists = db.users.some(u => u.id_empresa === formData.id_empresa.trim())
      if (idExists) {
        newErrors.id_empresa = 'Este ID já está cadastrado'
      }
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    } else {
      const db = getDatabase()
      const emailExists = db.users.some(u => u.email.toLowerCase() === formData.email.toLowerCase().trim())
      if (emailExists) {
        newErrors.email = 'Este email já está cadastrado'
      }
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória'
    } else if (formData.senha.length < 8) {
      newErrors.senha = 'Senha deve ter no mínimo 8 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.senha)) {
      newErrors.senha = 'Senha deve conter letras maiúsculas, minúsculas e números'
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem'
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório'
    }

    if (!formData.cargo.trim()) {
      newErrors.cargo = 'Cargo é obrigatório'
    } else {
      // Validação de segurança: cargos que não podem ter nível total
      const cargosRestritos = ['administrador', 'admin', 'coordenador', 'diretor', 'gerente', 'gestor']
      const cargoLower = formData.cargo.toLowerCase()
      if (cargosRestritos.some(c => cargoLower.includes(c))) {
        newErrors.cargo = 'Este cargo requer aprovação administrativa. Entre em contato com o administrador.'
      }
    }

    if (!formData.departamento.trim()) {
      newErrors.departamento = 'Departamento é obrigatório'
    }

    if (!formData.lgpd_consentimento) {
      newErrors.lgpd_consentimento = 'É necessário o consentimento para tratamento de dados pessoais'
    }

    if (!formData.lgpd_finalidade.trim()) {
      newErrors.lgpd_finalidade = 'Finalidade do tratamento de dados é obrigatória'
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
      // Gerar ID único baseado no ID da empresa
      const idFormatado = `FON${formData.id_empresa}`

      const result = createUser({
        id: idFormatado,
        id_empresa: formData.id_empresa.trim(),
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        senha: formData.senha,
        cargo: formData.cargo.trim(),
        departamento: formData.departamento.trim(),
        telefone: formData.telefone.trim(),
        tipo_usuario: 'analista', // Sempre começa como analista
        nivel_acesso: 'basico', // Sempre começa como básico (segurança)
        lgpd_consentimento: formData.lgpd_consentimento,
        lgpd_finalidade: formData.lgpd_finalidade.trim(),
        lgpd_data_consentimento: new Date().toISOString(),
        ativo: false, // Inativo até aprovação do admin
        pendente_aprovacao: true,
        data_cadastro: new Date().toISOString()
      })

      if (result.success) {
        toast.success('Cadastro realizado com sucesso! Aguarde aprovação do administrador.')
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      } else {
        toast.error(result.error || 'Erro ao realizar cadastro')
      }
    } catch (error) {
      toast.error('Erro ao realizar cadastro. Tente novamente.')
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
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fontea-primary via-fontea-secondary to-fontea-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-fontea-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-fontea-secondary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="flex justify-center mb-6">
            <Logo size="medium" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Cadastro de Funcionário
            </h1>
            <p className="text-gray-600">
              Preencha seus dados para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ID da Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID da Empresa (6 dígitos) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="id_empresa"
                  value={formData.id_empresa}
                  onChange={handleChange}
                  maxLength={6}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                    errors.id_empresa ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="000000"
                />
              </div>
              {errors.id_empresa && <p className="mt-1 text-sm text-red-600">{errors.id_empresa}</p>}
              <p className="mt-1 text-xs text-gray-500">Digite o ID de 6 dígitos fornecido pela empresa</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                      errors.nome ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                      errors.telefone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(81) 99999-9999"
                  />
                </div>
                {errors.telefone && <p className="mt-1 text-sm text-red-600">{errors.telefone}</p>}
              </div>

              {/* Cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                      errors.cargo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ex: Analista Técnico"
                  />
                </div>
                {errors.cargo && <p className="mt-1 text-sm text-red-600">{errors.cargo}</p>}
              </div>

              {/* Departamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                      errors.departamento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.departamento && <p className="mt-1 text-sm text-red-600">{errors.departamento}</p>}
              </div>
            </div>

            {/* Senhas */}
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
                    placeholder="Mínimo 8 caracteres"
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

            {/* LGPD */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">LGPD - Proteção de Dados</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Finalidade do Tratamento de Dados <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="lgpd_finalidade"
                  value={formData.lgpd_finalidade}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-fontea-primary focus:border-transparent ${
                    errors.lgpd_finalidade ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Gestão de funcionários, controle de acesso ao sistema..."
                />
                {errors.lgpd_finalidade && <p className="mt-1 text-sm text-red-600">{errors.lgpd_finalidade}</p>}
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="lgpd_consentimento"
                  id="lgpd_consentimento"
                  checked={formData.lgpd_consentimento}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 text-fontea-primary focus:ring-fontea-primary border-gray-300 rounded"
                />
                <label htmlFor="lgpd_consentimento" className="text-sm text-gray-700">
                  <span className="text-red-500">*</span> Concordo com o tratamento dos meus dados pessoais conforme a LGPD (Lei nº 13.709/2018)
                </label>
              </div>
              {errors.lgpd_consentimento && <p className="text-sm text-red-600">{errors.lgpd_consentimento}</p>}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Importante:</strong> Seu cadastro será analisado por um administrador. 
                Você receberá um email quando sua conta for ativada.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Voltar ao Login
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-fontea-primary text-white rounded-lg hover:bg-fontea-secondary transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Cadastrar
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}

