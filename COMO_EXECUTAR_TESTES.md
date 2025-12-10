# Como Executar os Testes Unitários

## ✅ Pré-requisitos

Certifique-se de que você já executou:
```bash
npm install
```

Se o `npm install` não foi executado ainda, execute agora para instalar as dependências de teste (Vitest).

## 🚀 Executar os Testes

### 1. **Executar todos os testes**
```bash
npm test
```

Isso vai rodar todos os testes encontrados em `**/*.test.js` e mostrar os resultados no terminal.

### 2. **Executar testes de um arquivo específico**
```bash
npm test aiService.test.js
npm test themeDetectionService.test.js
npm test logger.test.js
npm test researchService.test.js
```

### 3. **Executar testes em modo watch** (detecta mudanças automaticamente)
```bash
npm test -- --watch
```

### 4. **Executar testes com UI visual** (Interface gráfica)
```bash
npm run test:ui
```

Isso abre um navegador com a interface visual dos testes onde você pode:
- Ver todos os testes em tempo real
- Filtrar por status (passando/falhando)
- Ver tempo de execução de cada teste
- Debugar falhas visualmente

### 5. **Gerar relatório de cobertura de testes**
```bash
npm run test:coverage
```

Isso gera um relatório mostrando:
- Percentual de cobertura por arquivo
- Quais linhas de código estão testadas
- Relatório em HTML (abrir em `coverage/index.html`)

---

## 📊 Arquivos de Teste Criados

A aplicação possui testes unitários em:

1. **`src/services/aiService.test.js`** (44 testes)
   - Testa geração de briefings
   - Testa estrutura de fontes
   - Testa dados temáticos
   - Testa validação de entrada

2. **`src/services/themeDetectionService.test.js`** (50+ testes)
   - Testa detecção de temas
   - Testa confiança da detecção
   - Testa cores e badges
   - Testa case-insensitivity

3. **`src/utils/logger.test.js`** (30+ testes)
   - Testa criação de loggers
   - Testa diferentes níveis (DEBUG, INFO, WARN, ERROR)
   - Testa armazenamento e recuperação de logs
   - Testa limpeza de histórico

4. **`src/services/researchService.test.js`**
   - Testa busca de fontes acadêmicas
   - Testa dados temáticos
   - Testa estrutura de dados

---

## ✨ Resultado Esperado

Ao executar `npm test`, você verá algo como:

```
✓ src/services/aiService.test.js (44 testes)
✓ src/services/themeDetectionService.test.js (50+ testes)  
✓ src/utils/logger.test.js (30+ testes)
✓ src/services/researchService.test.js (10+ testes)

✅ Todos os testes passando!
Tempo total: 2-3 segundos
```

---

## 🔧 Troubleshooting

### Erro: "Missing script: test"
**Solução:** Você não executou `npm install` ainda. Execute:
```bash
npm install
```

### Erro: "Cannot find module 'vitest'"
**Solução:** Vitest não foi instalado. Execute:
```bash
npm install
```

### Alguns testes falhando?
**Possível causa:** O banco de dados localStorage pode estar corrompido.
**Solução:** Limpe o localStorage:
1. Abra o navegador (F12 → Application)
2. Delete todos os dados do localStorage
3. Recarregue a página
4. Execute os testes novamente

---

## 📝 Próximos Passos

Para entregar ao professor:

1. ✅ Execute `npm test` para validar que tudo funciona
2. ✅ Execute `npm run test:coverage` para gerar relatório de cobertura
3. ✅ Faça print da saída dos testes
4. ✅ Incluir prints/relatórios na documentação de entrega

---

## 🎯 Objetivo dos Testes

Os testes garantem que:

✅ **Detecção de Tema** funciona corretamente para todas as 5 categorias
✅ **Geração de Briefings** cria conteúdo válido em Markdown
✅ **Cores e Badges** são atribuídos corretamente
✅ **Logger** registra eventos sem erros
✅ **Dados Temáticos** são recuperados corretamente para cada tema

---

## 📚 Referência Rápida

| Comando | O que faz |
|---------|----------|
| `npm test` | Roda todos os testes |
| `npm test -- --watch` | Modo watch (detecta mudanças) |
| `npm run test:ui` | Abre UI visual dos testes |
| `npm run test:coverage` | Gera relatório de cobertura |
| `npm test aiService.test.js` | Roda apenas testes do aiService |

---

**Boa sorte na entrega! 🚀**
