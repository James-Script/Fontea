# Fontea Briefing Generator

Sistema de geração automatizada de briefings executivos para a Secretaria de Assessoria Especial à Governadora, focada em assuntos espaciais e relações internacionais.

## 🚀 Funcionalidades

### Sistema de Autenticação
- Login por ID do funcionário ou email
- Identificação automática de cargo e nível de acesso
- Controle de sessão com localStorage

### Níveis de Acesso

#### 🔵 Básico
- Dashboard
- Criar e visualizar próprios briefings
- Gerenciar templates
- Ver analytics

#### 🟣 Mediano
- Todas as funcionalidades do básico
- **Aprovar/Rejeitar briefings** (decisão final)
- Editar briefings de outros usuários

#### 🟢 Total
- Todas as funcionalidades do mediano
- Gerenciar usuários
- Deletar briefings
- Controle completo do sistema

### Geração de Briefings
- Criação de briefings com suporte a Markdown
- Templates personalizáveis por tema
- Sistema de aprovação com histórico
- Rastreabilidade completa de fontes
- Status: Rascunho → Em Revisão → Aprovado/Rejeitado

### Dashboard e Analytics
- Gráficos de desempenho em tempo real
- Estatísticas por tema, status e responsável
- Análise de produtividade (últimos 7 dias)
- Taxa de aprovação e tempo médio
- Visualizações interativas com Recharts

### Perfil do Usuário
- Edição de informações pessoais
- Estatísticas pessoais de desempenho
- Gráfico de produtividade
- Histórico de briefings criados

## 🛠️ Tecnologias

- **React 18** - Framework frontend
- **Vite** - Build tool
- **React Router** - Roteamento
- **TanStack Query** - Gerenciamento de estado
- **Recharts** - Gráficos e visualizações
- **Tailwind CSS** - Estilização
- **date-fns** - Formatação de datas
- **React Markdown** - Renderização de Markdown
- **Sonner** - Notificações toast
- **Lucide React** - Ícones

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🔐 Acesso ao Sistema

**⚠️ IMPORTANTE:** As credenciais de acesso são configuradas através de variáveis de ambiente no arquivo `.env`. 

Para configurar o sistema:
1. Copie o arquivo `.env.example` para `.env`
2. Configure as variáveis de ambiente necessárias
3. **NUNCA** commite o arquivo `.env` no repositório

Consulte `INSTRUCOES.md` para mais detalhes sobre configuração e acesso.

## 📊 Estrutura do Banco de Dados

### Entidade User
- `id`: ID único do funcionário (ex: FON001)
- `nome`, `email`, `senha`
- `cargo`, `departamento`, `telefone`
- `tipo_usuario`: analista, gestor, tecnico, admin
- `nivel_acesso`: basico, mediano, total
- `briefings_criados`, `ultimo_acesso`, `ativo`

### Entidade Briefing
- `id`: ID único do briefing
- `titulo`, `conteudo` (Markdown)
- `tema`: defesa_civil, agricultura, monitoramento, etc.
- `status`: rascunho, em_revisao, aprovado, arquivado, cancelado
- `prioridade`: baixa, media, alta
- `responsavel_id`, `responsavel_nome`
- `editado_por`, `historico_edicoes`
- `fontes`: array de fontes oficiais
- `data_criacao`, `data_atualizacao`, `visualizacoes`

### Entidade Template
- `id`, `nome`, `descricao`
- `conteudo` (Markdown)
- `tema`, `ativo`

## 🔄 Fluxo de Trabalho

1. **Criação**: Analista/Técnico cria briefing → Status: Rascunho
2. **Envio**: Envia para revisão → Status: Em Revisão
3. **Aprovação**: Gestor (nível mediano/total) aprova ou rejeita
   - Aprovado → Status: Aprovado ✅
   - Rejeitado → Retorna para: Rascunho ❌

## 📁 Estrutura de Arquivos

```
fontea-app/
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   └── Logo.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Briefings.jsx
│   │   ├── BriefingDetail.jsx
│   │   ├── NewBriefing.jsx
│   │   ├── Templates.jsx
│   │   ├── Analytics.jsx
│   │   ├── Profile.jsx
│   │   └── Users.jsx
│   ├── data/
│   │   └── database.js
│   ├── utils/
│   │   ├── auth.js
│   │   └── cn.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎨 Design

- Cores principais: Verde-água (#00BFA5) e Teal (#00897B)
- Logo: Foguete com órbita e pontos de dados
- Layout responsivo (mobile-first)
- Componentes acessíveis

## 🔒 Segurança

- Autenticação baseada em sessão (localStorage)
- Controle de acesso por níveis
- Validação de permissões em todas as rotas
- Histórico de edições rastreável

## 📝 Notas

- O banco de dados atual usa localStorage (mock)
- Em produção, substituir por API real ou ORM
- Senhas não são hasheadas (apenas para desenvolvimento)
- Sistema pronto para migração para servidor backend

## 🚀 Próximos Passos

- [ ] Integração com API backend real
- [ ] Sistema de hash de senhas
- [ ] Integração com fontes oficiais (IBGE, INPE, etc.)
- [ ] Geração automática com IA
- [ ] Exportação de briefings (PDF, Word)
- [ ] Notificações por email
- [ ] Sistema de comentários nos briefings

## 📄 Licença

Este projeto foi desenvolvido para a Secretaria de Assessoria Especial à Governadora de Pernambuco.

