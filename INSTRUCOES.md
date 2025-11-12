# Instruções para Executar o Fontea Briefing Generator

## Pré-requisitos

1. **Node.js instalado** (versão 18 ou superior)
   - Baixe em: https://nodejs.org/
   - Verifique a instalação: `node --version` e `npm --version`

## Passos para Executar

1. **Abra o terminal/PowerShell** no diretório do projeto:
   ```powershell
   cd "C:\Users\Roxana Walesca\fontea-app"
   ```

2. **Instale as dependências**:
   ```powershell
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   ```powershell
   npm run dev
   ```

4. **Acesse a aplicação**:
   - O navegador deve abrir automaticamente em `http://localhost:3000`
   - Se não abrir, acesse manualmente: `http://localhost:3000`

## 🔐 Acesso ao Sistema

### Administrador Principal
- **Credenciais Padrão (se `.env` não estiver configurado):**
  - **ID:** `FONADMIN`
  - **Email:** `admin@fontea.com`
  - **Senha:** `admin123`
- **Credenciais Personalizadas:** Configure no arquivo `.env` (protegidas)
- **Nível de Acesso:** Administrador (acesso total)
- **Permissões:**
  - ✅ Acesso total ao sistema
  - ✅ Cadastrar novos funcionários
  - ✅ Aprovar/rejeitar cadastros pendentes
  - ✅ Gerenciar usuários e permissões
  - ✅ Acessar todas as funcionalidades
  - ✅ Visualizar e editar todos os briefings
- **⚠️ Credenciais protegidas em arquivo `.env` (não commitado no Git)**
- **📄 Consulte `CREDENCIAIS_ADMIN.md` para informações detalhadas**

### Níveis de Acesso

**Administrador:**
- Acesso total ao sistema
- Gerencia usuários e permissões
- Pode aprovar cadastros

**Coordenador (Nível Total):**
- Pode aprovar cadastros de funcionários
- Pode gerenciar usuários
- Pode aprovar briefings
- Acesso completo a analytics

**Gestor (Nível Mediano):**
- Pode aprovar cadastros de funcionários
- Pode aprovar briefings
- Acesso limitado a analytics

**Analista/Técnico (Nível Básico):**
- Criar e editar briefings
- Visualizar próprios briefings
- Acesso básico ao sistema

## Cadastro de Funcionários

### Para Administradores e Coordenadores
1. Faça login com suas credenciais:
   - **Administrador:** Use as credenciais configuradas no arquivo `.env`
   - **Coordenador:** Usuários com nível de acesso "Total"
   - **Gestor:** Usuários com nível de acesso "Mediano"
2. Acesse o menu **Usuários** na barra lateral
3. **Aprovar Cadastros Pendentes:**
   - Veja a seção amarela "Cadastros Pendentes de Aprovação"
   - Clique em **Aprovar** ou **Rejeitar** para cada cadastro
4. **Cadastrar Novo Funcionário:**
   - Clique em **Cadastrar Funcionário**
   - Preencha todos os campos obrigatórios:
     - Nome completo
     - Email
     - Telefone
     - Cargo
     - **Função que exerce** (campo específico)
     - Departamento
     - Tipo de usuário
     - Nível de acesso
     - Dados LGPD (consentimento obrigatório)

### Para Novos Funcionários (Auto-cadastro)
1. Na tela de login, clique em **Cadastre-se aqui**
2. Preencha o formulário com seus dados
3. Seu cadastro ficará **pendente de aprovação**
4. Um administrador precisará ativar sua conta
5. Você receberá notificação quando sua conta for ativada

### Conformidade LGPD
- Todos os cadastros incluem campos obrigatórios de consentimento LGPD
- Data de consentimento é registrada automaticamente
- Finalidade do tratamento de dados deve ser especificada
- Consentimento pode ser revogado a qualquer momento

## 🔐 Segurança e Proteção de Dados

### Variáveis de Ambiente (.env)
As credenciais sensíveis estão protegidas em arquivo `.env`:
- ✅ Arquivo `.env` está no `.gitignore` (não será commitado)
- ✅ Use `.env.example` como template
- ⚠️ **NUNCA** commite o arquivo `.env` no Git

### Como Alterar Credenciais do Admin
1. Edite o arquivo `.env` na raiz do projeto:
   ```env
   VITE_ADMIN_ID=FONADMIN
   VITE_ADMIN_EMAIL=admin@fontea.pe.gov.br
   VITE_ADMIN_PASSWORD=SuaNovaSenhaSegura123!
   ```
2. Reinicie o servidor: `npm run dev`

### Dados Protegidos
- ✅ Senhas não são expostas no código
- ✅ Credenciais do admin carregadas de variáveis de ambiente
- ✅ Banco de dados local (localStorage) para desenvolvimento
- ⚠️ Em produção, use banco de dados real com criptografia

### Documentação Completa
Consulte o arquivo **`CREDENCIAIS_ADMIN.md`** para informações detalhadas sobre:
- Credenciais de acesso
- Permissões por nível
- Boas práticas de segurança

## Solução de Problemas

### Erro: "npm não é reconhecido"
- Instale o Node.js: https://nodejs.org/
- Reinicie o terminal após a instalação

### Erro: "Porta 3000 já está em uso"
- Feche outros aplicativos usando a porta 3000
- Ou altere a porta no arquivo `vite.config.js`

### Erro: "Execution Policy" do PowerShell (npm.ps1 não pode ser carregado)

Este erro ocorre quando o PowerShell bloqueia a execução de scripts. Existem 3 soluções:

**Solução 1: Alterar a Execution Policy (Recomendado)**
1. Abra o PowerShell **como Administrador** (clique com botão direito > "Executar como administrador")
2. Execute o comando:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Digite `S` quando solicitado para confirmar
4. Feche e reabra o terminal normal
5. Tente `npm install` novamente

**Solução 2: Usar o CMD ao invés do PowerShell**
1. Abra o **Prompt de Comando (CMD)** ao invés do PowerShell
2. Navegue até o diretório do projeto:
   ```cmd
   cd C:\fontea-app
   ```
3. Execute `npm install` normalmente

**Solução 3: Usar npm.cmd diretamente**
No PowerShell, use:
```powershell
npm.cmd install
```

### Erro ao instalar dependências
- Limpe o cache: `npm cache clean --force`
- Delete a pasta `node_modules` e `package-lock.json`
- Execute `npm install` novamente

### Problema: Tela Branca no Navegador

Se a aplicação abrir mas mostrar apenas uma tela branca, siga estes passos:

**Passo 1: Verificar o Console do Navegador**
1. Abra o navegador (Chrome, Edge, Firefox)
2. Pressione `F12` ou `Ctrl+Shift+I` para abrir as Ferramentas de Desenvolvedor
3. Clique na aba **Console**
4. Procure por erros em vermelho
5. Copie e anote os erros encontrados

**Passo 2: Verificar se o Servidor está Rodando**
1. No terminal, verifique se o servidor está rodando
2. Você deve ver uma mensagem como: `Local: http://localhost:3000`
3. Se não estiver rodando, execute: `npm run dev`

**Passo 3: Limpar Cache e Reinstalar Dependências**
1. Pare o servidor (pressione `Ctrl+C` no terminal)
2. Execute os seguintes comandos:
   ```powershell
   # Limpar cache do npm
   npm cache clean --force
   
   # Deletar node_modules e package-lock.json
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   
   # Reinstalar dependências
   npm install
   
   # Iniciar servidor novamente
   npm run dev
   ```

**Passo 4: Verificar a Porta**
- Se a porta 3000 estiver em uso, o Vite pode usar outra porta (ex: 3001)
- Verifique no terminal qual porta está sendo usada
- Acesse a URL correta no navegador (ex: `http://localhost:3001`)

**Passo 5: Verificar Erros Comuns**

**Erro: "Cannot find module"**
- Execute `npm install` novamente
- Verifique se todas as dependências estão instaladas

**Erro: "Failed to resolve import"**
- Verifique se o caminho do arquivo está correto
- Verifique se o arquivo existe no local especificado

**Erro: "Uncaught SyntaxError"**
- Verifique se há erros de sintaxe nos arquivos JavaScript/JSX
- Verifique se todas as chaves e parênteses estão fechados

**Passo 6: Hard Refresh no Navegador**
1. Pressione `Ctrl+Shift+R` (ou `Ctrl+F5`) para fazer um hard refresh
2. Isso limpa o cache do navegador e recarrega todos os arquivos

**Passo 7: Verificar se o Arquivo index.html está Correto**
- Certifique-se de que o arquivo `index.html` contém:
  ```html
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
  ```

**Passo 8: Verificar Logs do Terminal**
- No terminal onde o servidor está rodando, verifique se há erros
- Erros aparecem em vermelho ou com mensagens de erro

**Se nada funcionar:**
1. Feche completamente o terminal e o navegador
2. Abra um novo terminal
3. Navegue até o diretório do projeto
4. Execute `npm run dev` novamente
5. Abra um navegador em modo anônimo/privado e acesse `http://localhost:3000`

## Estrutura do Projeto

```
fontea-app/
├── src/
│   ├── components/    # Componentes React
│   ├── pages/        # Páginas da aplicação
│   ├── data/         # Banco de dados (mock)
│   ├── utils/        # Funções utilitárias
│   ├── App.jsx       # Componente principal
│   ├── main.jsx      # Ponto de entrada
│   └── index.css     # Estilos globais
├── package.json      # Dependências do projeto
├── vite.config.js    # Configuração do Vite
└── index.html        # HTML principal
```

## Comandos Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção

