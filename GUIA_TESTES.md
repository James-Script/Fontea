# 🧪 Guia de Testes - Sistema de Briefings

## Pré-requisitos
- ✅ Projeto rodando com `npm run dev`
- ✅ Usuário logado no sistema
- ✅ Templates já existentes (criados no setup inicial)

## Teste 1: Breadcrumb Navigation
**Objetivo**: Verificar se breadcrumb funciona em todas as páginas

### Passos:
1. Acesse **Dashboard** (você já deve estar aqui)
   - ❌ Breadcrumb não deve aparecer (página raiz)
   
2. Clique em **Briefings**
   - ✅ Breadcrumb deve mostrar: "Dashboard > Briefings"
   - ✅ "Dashboard" deve ser clicável (volta para home)
   
3. Clique em **Templates**
   - ✅ Breadcrumb deve mostrar: "Dashboard > Templates"
   
4. Clique em **Analytics**
   - ✅ Breadcrumb deve mostrar: "Dashboard > Analytics"
   
5. Clique em **Perfil**
   - ✅ Breadcrumb deve mostrar: "Dashboard > Perfil"

### Resultado Esperado:
- ✅ Breadcrumb aparece em todas as páginas (exceto Dashboard)
- ✅ Texto da página atual não é clicável
- ✅ Páginas anteriores são clicáveis

---

## Teste 2: Visualizar Templates
**Objetivo**: Verificar se Templates carregam corretamente com novos botões

### Passos:
1. Vá para **Templates**
2. Você deve ver 2-3 templates padrão com:
   - ✅ Nome (ex: "Template Defesa Civil")
   - ✅ Descrição
   - ✅ Badge "Ativo/Inativo"
   - ✅ **Três botões**: 🌟 Gerar | ✏️ Editar | 🗑️ Excluir

### Resultado Esperado:
- ✅ Todos os 3 botões aparecem em cada template
- ✅ Layout em cards em 3 colunas (desktop)

---

## Teste 3: Gerar Briefing via Template (SEM API Key)
**Objetivo**: Testar geração de briefing com dados realistas (modo mock)

### Passos:
1. Em **Templates**, clique no botão **"Gerar"** de qualquer template
   - ✅ Modal deve aparecer com:
     - Nome do template
     - Campo textarea para "Especificações do Briefing"
     - Botões: "Gerar com IA" e "Cancelar"

2. No campo de especificações, digite algo como:
   ```
   Análise da situação de chuvas intensas em Pernambuco 
   durante os últimos 15 dias
   ```

3. Clique **"Gerar com IA"**
   - ✅ Botão deve mostrar: "Gerando..." com spinner
   - ✅ Campo desativado durante processamento
   - ✅ Esperado: 1-2 segundos de delay (simulação)

4. Depois de gerado:
   - ✅ Usuário é redirecionado para o briefing
   - ✅ Toast: "Briefing gerado com sucesso!"
   - ✅ URL muda para: `/briefings/BRI00X` (com ID novo)

### Resultado Esperado:
- ✅ Briefing criado com:
  - Título do template
  - Conteúdo em Markdown com múltiplas seções
  - Fontes listadas (INMET, CEMADEN, etc)
  - Status: "rascunho"
  - Data de criação: hoje

---

## Teste 4: Validação do Briefing Gerado
**Objetivo**: Verificar qualidade do briefing gerado

### Passos:
1. Após geração, você está em `/briefings/BRI00X`
2. Verifique o conteúdo:

   ✅ **Deve conter**:
   - Título do briefing
   - Resumo Executivo (2-3 parágrafos)
   - Seção "Dados Principais" com estatísticas reais
   - Análise Detalhada
   - Recomendações numeradas
   - Conclusão
   - Referências/Fontes

   ✅ **Deve ter fontes**:
   - Instituições governamentais (INMET, CEMADEN, etc)
   - Publicações acadêmicas com ISSN
   - URLs para acesso

3. Verifique Breadcrumb:
   - ✅ Deve mostrar: "Dashboard > Briefings > Detalhes"

### Resultado Esperado:
- ✅ Conteúdo formatado em Markdown
- ✅ Estrutura profissional
- ✅ Dados concretos de fontes reais
- ✅ Fácil leitura e interpretação

---

## Teste 5: Voltar a Templates via Breadcrumb
**Objetivo**: Testar navegação breadcrumb

### Passos:
1. Estando em um briefing detalhado
2. Clique em **"Briefings"** no breadcrumb
   - ✅ Volta para lista de briefings
   
3. Clique em **"Dashboard"** no breadcrumb
   - ✅ Volta para dashboard

### Resultado Esperado:
- ✅ Navegação funciona corretamente
- ✅ Sem erros no console

---

## Teste 6: Editar Template
**Objetivo**: Verificar se edição de template ainda funciona

### Passos:
1. Em **Templates**, clique no botão **"Editar"** de um template
   - ✅ Formulário deve aparecer com dados do template
   - ✅ Campo título preenchido
   - ✅ Descrição preenchida
   - ✅ Conteúdo preenchido
   - ✅ Tema selecionado

2. Modifique algum campo (ex: nome)
3. Clique **"Atualizar"**
   - ✅ Toast: "Template atualizado com sucesso!"
   - ✅ Formulário fecha
   - ✅ Card atualizado com novo nome

### Resultado Esperado:
- ✅ Edição funciona normalmente
- ✅ Dados salvos corretamente

---

## Teste 7: Criar Novo Template
**Objetivo**: Testar criação de novo template

### Passos:
1. Em **Templates**, clique **"Novo Template"**
   - ✅ Formulário vazio aparece
   - ✅ Título: "Novo Template"

2. Preencha os campos:
   - Nome: "Template Teste"
   - Descrição: "Template para testes"
   - Conteudo: "# Template\n\n## Seção 1"
   - Tema: "agricultura"
   - Ativo: checked

3. Clique **"Criar"**
   - ✅ Toast: "Template criado com sucesso!"
   - ✅ Novo card aparece na grade
   - ✅ Status: "Ativo"

4. Agora clique **"Gerar"** no novo template
   - ✅ Deve funcionar como qualquer outro

### Resultado Esperado:
- ✅ Template criado com sucesso
- ✅ Aparece na lista
- ✅ Pode gerar briefing a partir dele

---

## Teste 8: Verificar Dados por Tema
**Objetivo**: Confirmar que cada tema tem seus próprios dados

### Passos:
1. Gere um briefing de cada tema:
   - **Defesa Civil** → Deve incluir CEMADEN, INMET
   - **Agricultura** → Deve incluir CONAB, EMBRAPA, IBGE
   - **Monitoramento** → Deve incluir INPE, MMA, IBAMA
   - **Fiscalização** → Deve incluir IBAMA, ICMBio
   - **Relações** → Deve incluir MRE, IPEA

2. Compare as fontes em cada briefing
   - ✅ Fontes são diferentes por tema
   - ✅ Dados são específicos do tema

### Resultado Esperado:
- ✅ Cada tema tem suas próprias fontes
- ✅ Dados são relevantes ao tema
- ✅ Sem mistura de temas

---

## Teste 9: Error Handling
**Objetivo**: Testar tratamento de erros

### Passos:
1. Clique **"Gerar"** mas deixe campo vazio
   - ✅ Botão deve estar desativado
   - Toast: "Por favor, descreva o briefing..."

2. No breadcrumb, teste navegação para páginas que não existem
   - ✅ Deve redirecionar ou mostrar página vazia

### Resultado Esperado:
- ✅ Validações funcionam
- ✅ Erros são mostrados ao usuário
- ✅ Sem crashes

---

## Teste 10: Responsividade
**Objetivo**: Testar em diferentes tamanhos de tela

### Desktop (> 1024px):
- ✅ Templates em 3 colunas
- ✅ Sidebar visível
- ✅ Breadcrumb em linha

### Tablet (768px - 1024px):
- ✅ Templates em 2 colunas
- ✅ Sidebar colapsável
- ✅ Breadcrumb visível

### Mobile (< 768px):
- ✅ Templates em 1 coluna
- ✅ Botões grande o suficiente
- ✅ Breadcrumb adaptado
- ✅ Menu mobile funciona

### Resultado Esperado:
- ✅ Layout responsivo
- ✅ Tudo funciona em qualquer tamanho

---

## Checklist Final

- [ ] Breadcrumb aparece em todas as páginas (exceto login)
- [ ] Templates têm 3 botões (Gerar, Editar, Excluir)
- [ ] Gerar abre modal com campo de especificações
- [ ] Briefing é criado com dados realistas
- [ ] Briefing contém fontes citadas
- [ ] Cada tema tem suas próprias fontes
- [ ] Editar template funciona
- [ ] Criar novo template funciona
- [ ] Navegação breadcrumb funciona
- [ ] Responsividade OK
- [ ] Sem erros no console

---

## Notas

- 🟢 **Modo Mock**: Sistema gera dados realistas sem API key
- 🟡 **Modo IA Real**: Ativa com VITE_OPENAI_API_KEY em .env
- 📝 **Dados**: Todos de instituições brasileiras reais
- 🚀 **Performance**: Modo mock é instantâneo

---

**Quando todos os testes passarem: Sistema pronto para produção! ✅**
