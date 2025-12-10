# 🚀 Guia Rápido - Sistema de Cores e Detecção de Tema

## O que mudou?

### ❌ Antes:
```
┌─────────────────────────────────────┐
│ Tema * [Defesa Civil ▼]            │ ← Manual
│ Status Inicial [Rascunho ▼]        │ ← Manual
│ Prioridade * [Média ▼]             │
└─────────────────────────────────────┘
```

### ✨ Depois:
```
┌─────────────────────────────────────┐
│ Prioridade * [🟡 Média ▼]          │
│                                     │
│ ┌─────────────────────────────────┐│
│ │📊 Tema detectado: Agricultura  ││ ← Automático!
│ │     (92% confiança)            ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## 🎨 As 3 Cores e Seus Significados

| Cor | Significado | Quando Usar |
|-----|------------|-----------|
| 🔴 **Vermelho** | **Ação imediata necessária** | Emergências, crises, situações críticas |
| 🟡 **Amarelo** | **Atenção em breve** | Monitoramento, tendências negativas |
| 🟢 **Verde** | **Monitoramento contínuo** | Situações normais, informativas |

---

## 🤖 Como Funciona a Detecção de Tema?

### Exemplo 1: Agricultura
```
Você escreve:
"Análise da produção de soja em Mato Grosso, 
safra 2024, dados CONAB, impactos climáticos"

Sistema detecta:
✅ Palavra "produção" = agricultura
✅ Palavra "safra" = agricultura  
✅ Organização "CONAB" = agricultura (peso 4x)
📊 Resultado: Agricultura (92% confiança) ✓
```

### Exemplo 2: Defesa Civil
```
Você escreve:
"Enchentes em Pernambuco, evacuação de famílias,
coordenação com CENAD, risco de deslizamentos"

Sistema detecta:
✅ Palavra "enchentes" = defesa civil
✅ Palavra "evacuação" = defesa civil
✅ Palavra "risco" = defesa civil
✅ Organização "CENAD" = defesa civil (peso 4x)
📊 Resultado: Defesa Civil (96% confiança) ✓
```

### Exemplo 3: Ambiente Genérico
```
Você escreve:
"Briefing sobre assuntos diversos"

Sistema detecta:
❌ Nenhuma palavra-chave específica
📊 Resultado: Defesa Civil (0% confiança) ⚠️
```

---

## 📱 Como Usar - Passo a Passo

### 1️⃣ Abrir "Novo Briefing"
```
Menu → Novo Briefing
```

### 2️⃣ Preencher Especificações
```
"Descrevo o que quero gerar com detalhes,
incluindo organizações, regiões, contexto..."
```

### 3️⃣ Escolher Prioridade
```
[Prioridade] → 🟡 Média - Atenção necessária
Cores:
  🔴 Alta (emergência)
  🟡 Média (acompanhamento)
  🟢 Baixa (rotina)
```

### 4️⃣ Clicar "Gerar Briefing com IA"
```
[✨ Gerar Briefing com IA]
        ↓
  "Analisando conteúdo..."
        ↓
📊 Tema detectado: Agricultura (92% confiança)
        ↓
  "Gerando briefing... Isso pode levar..."
        ↓
✅ Briefing gerado com sucesso!
```

### 5️⃣ Visualizar Briefing
```
┌─────────────────────────────────────┐
│ Título do Briefing                  │
│ 🟡 Média  │  📋 Agricultura        │ ← Cores!
│                                     │
│ Responsável: João Silva             │
│ Criado em: 08/12/2025 às 14:32     │
│ Visualizações: 5                    │
└─────────────────────────────────────┘

## Resumo Executivo
Texto bem formatado com cores...

## Dados Principais
...dados...

📚 Fontes Utilizadas
- Fonte 1
- Fonte 2

📝 Histórico de Edições
Usuario - Ação - Data
```

---

## 🎯 Temas e Palavras-chave

### 🛡️ Defesa Civil
**Use palavras como:**
- Enchente, deslizamento, terremoto, tempestade
- Defesa, emergência, calamidade, proteção
- CENAD, Bombeiros, Proteção Civil

**Exemplo completo:**
```
"Análise de risco de deslizamentos em São Paulo,
coordenação com Bombeiros e CENAD para evacuação
de áreas de risco"
```

### 🌾 Agricultura
**Use palavras como:**
- Plantio, colheita, safra, cultivo, produção
- Produtividade, clima agrícola, lavoura
- CONAB, MAPA, Embrapa, IBGE

**Exemplo completo:**
```
"Análise de produção agrícola em Mato Grosso,
safra 2024, dados CONAB, impactos das chuvas
e produtividade esperada para 2025"
```

### 🌊 Monitoramento Costeiro
**Use palavras como:**
- Costeiro, marinho, oceano, praia, litoral
- Costa, erosão costeira, nível do mar
- INPE, IBAMA, Marinha

**Exemplo completo:**
```
"Monitoramento da erosão costeira em Alagoas,
análise de nível do mar com dados INPE,
impactos em recursos marinhos"
```

### 🔍 Fiscalização Ambiental
**Use palavras como:**
- Ambiental, desmatamento, poluição, fauna
- Fiscalização, conservação, degradação
- IBAMA, ICMBio, CONAMA

**Exemplo completo:**
```
"Análise de desmatamento na Amazônia,
fiscalização IBAMA, proteção de fauna
e flora, impactos ambientais"
```

### 🌍 Relações Internacionais
**Use palavras como:**
- Internacional, diplomacia, tratado, acordo
- Cooperação, comércio, negociações
- Itamaraty, MERCOSUL, ONU

**Exemplo completo:**
```
"Análise de acordos comerciais internacionais,
negociações MERCOSUL, cooperação diplomática
com países sul-americanos"
```

---

## ⚡ Dicas Práticas

### ✅ Faça assim:
```
"Análise de produção agrícola de milho em Goiás,
safra 2024, dados CONAB, impactos do clima
seco e projeções MAPA para 2025"
```
✓ Específico ✓ Inclui organizações ✓ Claro

### ❌ Não faça assim:
```
"Briefing sobre coisas"
```
✗ Genérico ✗ Sem contexto ✗ Não detecta

---

## 📊 Tabela de Cores na Visualização

Quando você **visualiza um briefing**, você vê:

```
Topo do Briefing:
┌────────────────────────────────────┐
│ 🔴 Alta    📋 Defesa Civil       │ ← Badge com cores
│ 🟡 Média   📋 Agricultura        │
│ 🟢 Baixa   📋 Monitoramento      │
└────────────────────────────────────┘

Conteúdo (estilos):
═══════════════════════════════════════
# Título (Preto grande e negrito)
════════════════════════════════════════
## Seção (Azul com linha embaixo)
────────────────────────────────────────
Parágrafo normal em cinza claro
• Itens em lista com espaço
**Texto em negrito**
```

---

## 🧪 Testar a Detecção

```bash
# Executar testes de detecção
npm test themeDetectionService.test.js

# Ver cobertura
npm test -- --coverage

# Watch mode (atualiza ao editar)
npm test -- --watch
```

---

## 🔄 Fluxo Completo

```
1. NOVO BRIEFING
   └─→ Escrever especificações com contexto
       └─→ Escolher prioridade (🔴/🟡/🟢)
           └─→ Clicar "Gerar com IA"
               └─→ SISTEMA DETECTA TEMA AUTOMATICAMENTE
                   └─→ IA GERA CONTEÚDO
                       └─→ BRIEFING CRIADO
                           └─→ VISUALIZAR BRIEFING
                               └─→ VER CORES E TEMA
```

---

## 📞 Suporte

**Problema: Tema não é detectado corretamente**
```
Solução: Inclua mais palavras-chave específicas 
e nomes de organizações no seu texto
```

**Problema: Confiança muito baixa**
```
Solução: Use termos mais específicos do tema
Exemplo: ao invés de "análise", use 
"análise de produção", "análise de enchentes", etc.
```

**Problema: Cor não aparece**
```
Solução: Atualize o navegador (F5)
Verifica se JavaScript está habilitado
```

---

**Tudo pronto! Comece a criar briefings com tema automático e cores intuitivas! 🚀✨**
