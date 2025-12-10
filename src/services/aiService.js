// Serviço de IA para geração de briefings
// IMPORTANTE: Configure sua API Key da OpenAI no arquivo .env
// VITE_OPENAI_API_KEY=sua-chave-aqui

import { enrichPromptWithData, getAcademicSources, getThematicData } from './researchService'
import { detectTheme as detectThemeLocal } from './themeDetectionService'
import { createLogger } from '../utils/logger'

const logger = createLogger('AIService')
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Função para obter o nome do tema formatado
const getTemaNome = (tema) => {
  const temas = {
    defesa_civil: 'Defesa Civil',
    agricultura: 'Agricultura',
    monitoramento: 'Monitoramento Costeiro',
    fiscalizacao: 'Fiscalização Ambiental',
    relacoes: 'Relações Internacionais'
  };
  if (!tema) return 'Geral';
  if (tema === 'nao_definido') return 'Tema Não Detectado';
  return temas[tema] || tema;
};

// Função para obter o nome da prioridade formatado
const getPrioridadeNome = (prioridade) => {
  const prioridades = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta'
  };
  return prioridades[prioridade] || prioridade;
};

export const generateBriefingWithAI = async (specifications) => {
  const startTime = performance.now();
  logger.info('Iniciando geração de briefing com IA', { 
    tema: specifications.tema, 
    prioridade: specifications.prioridade 
  });

  try {
    if (!OPENAI_API_KEY) {
      logger.warn('API Key da OpenAI não configurada');
      throw new Error('API Key da OpenAI não configurada. Configure VITE_OPENAI_API_KEY no arquivo .env');
    }

    logger.debug('Enriquecendo prompt com dados acadêmicos');
    const temaNome = getTemaNome(specifications.tema);
    const prioridadeNome = getPrioridadeNome(specifications.prioridade);
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Enriquecer prompt com dados reais e fontes acadêmicas
    const dadosEnriquecidos = enrichPromptWithData(specifications.tema, specifications.especificacoes);
    const thematicData = getThematicData(specifications.tema);
    const academicSources = getAcademicSources(specifications.tema);

    logger.debug('Dados acadêmicos enriquecidos', { 
      fontes: academicSources.institucional.length + academicSources.academico.length,
      metricas: thematicData.dados.length
    });

    const prompt = `Você é um especialista sênior em análise estratégica, políticas públicas brasileiras e elaboração de briefings executivos para órgãos governamentais federais e estaduais. Sua experiência inclui comunicação técnica, análise fundamentada em evidências e produção de documentos de alto padrão profissional adaptados ao contexto brasileiro.

**CONTEXTO CRÍTICO:**
Este briefing deve ser:
- **ESPECÍFICO DO CONTEXTO BRASILEIRO:** Refletir legislação brasileira, diretrizes do governo federal, organismos como CONAB, MAPA, IBAMA, INPE, SINPDEC (Sistema Nacional de Proteção e Defesa Civil);
- **PROFUNDAMENTE FUNDAMENTADO:** Todos os dados e afirmações DEVEM SER VERIFICÁVEIS ou CLARAMENTE INDICADOS COMO ESTIMATIVAS/PROJEÇÕES;
- **EVITAR DADOS FICTÍCIOS:** Não inventar números. Se não tiver dado exato, indicar intervalo provável, fonte de onde veio a estimativa, ou descrever qualitativamente;
- **COERÊNCIA TEMÁTICA ABSOLUTA:** O briefing deve tratar exclusivamente do tema detectado, mantendo foco consistente;
- **CONTEXTO REGIONAL BRASILEIRO:** Considerar particularidades regionais (Norte, Nordeste, Centro-Oeste, Sudeste, Sul), diretrizes de descentralização, competências federais/estaduais/municipais.

**ESPECIFICAÇÕES DO BRIEFING:**
- Título Proposto: ${specifications.titulo || 'Briefing Executivo'}
- Tema: ${temaNome}
- Prioridade: ${prioridadeNome}
- Data de Elaboração: ${dataAtual}
- Descrição/Especificações: ${specifications.especificacoes || 'Nenhuma especificação fornecida'}

${dadosEnriquecidos}

**INSTRUÇÕES CRÍTICAS:**

1. **TEMA E COERÊNCIA:**
   - O briefing trata EXCLUSIVAMENTE de: **${temaNome}**
   - NENHUMA mistura de temas não relacionados
   - Se há intersecções (ex: impacto de desastres naturais em agricultura), deixar ABSOLUTAMENTE CLARO e justificado
   - Manter foco temático em TODAS as seções

2. **DADOS E VERIFICABILIDADE:**
   - NUNCA inventar números ou estatísticas
   - Se usar dados: SEMPRE CITAR FONTE explicitamente (instituição, ano, documento)
   - Fontes aceitáveis: IBGE, CONAB, MAPA, INPE, EMBRAPA, CENAD, bancos de dados oficiais, estudos acadêmicos publicados
   - Se usar estimativas: INDICAR CLARAMENTE "Estimativa baseada em..." ou "Projeção de..."
   - Quando dados exatos não estão disponíveis: DESCREVER QUALITATIVAMENTE com base em literatura técnica
   - Se precisar de número: usar intervalos (ex: "estima-se entre 1,5 e 2,0 milhões") em vez de número fictício

3. **CONTEXTO BRASILEIRO ESPECÍFICO:**
   - Referenciar MARCOS BRASILEIROS relevantes: Lei de Proteção de Dados, Plano Plurianual (PPA), diretrizes do governo federal
   - Para Defesa Civil: mencionar SINPDEC, CENAD, estrutura de Defesa Civil em estados e municípios
   - Para Agricultura: mencionar Zoneamento Agrícola de Risco (ZAR), Programa de Crédito Rural (PRONAF, Banco do Brasil), CONAB
   - Para Meio Ambiente: mencionar IBAMA, licenciamento ambiental, legislação de proteção ambiental brasileira
   - Considerar REGIONALIZAÇÕES: Caatinga, Cerrado, Amazônia, Mata Atlântica, Pantanal conforme relevante
   - Reconhecer competências: federal (MAPA, IBAMA, INPE), estadual (Secretarias), municipal (Prefeituras)

4. **INSTITUIÇÕES CORRETAS:**
   - PROTECÇÃO CIVIL de Portugal: NÃO relevante para briefing brasileiro
   - Usar CENAD (Centro Nacional de Monitoramento e Alertas de Desastres Naturais) para defesa civil
   - Usar CONAB (Companhia Nacional de Abastecimento) e MAPA (Ministério da Agricultura) para agricultura
   - Usar INPE (Instituto Nacional de Pesquisas Espaciais) para monitoramento climático
   - Usar EMBRAPA para pesquisa agrícola
   - Usar IBAMA para questões ambientais

5. **LINGUAGEM TÉCNICA BRASILEIRA:**
   - Usar termos apropriados: "Desastres naturais", "Proteção e Defesa Civil", "Produção agrícola", "Segurança alimentar", "Zoneamento agrícola"
   - Evitar genéricos: não usar "stakeholders" indefinidos—nomear instituições brasileiras reais
   - Usar siglas brasileiras corretas: SINPDEC, CENAD, CONAB, MAPA, EMBRAPA, IBGE, INPE

6. **ESTRUTURA E PROFUNDIDADE:**
   - Tamanho MÍNIMO: 1800-2200 palavras
   - 6 seções fundamentais com desenvolvimento profissional
   - Cada seção com densidade informativa alta
   - Análise multidimensional (institucional, técnica, operacional, social, ambiental conforme tema)

**ESTRUTURA OBRIGATÓRIA (6 SEÇÕES):**

# [TÍTULO ESPECÍFICO E DESCRITIVO - ${temaNome}]

## Resumo Executivo
- Síntese formal da situação atual de ${temaNome}
- Principais achados com dados verificáveis (com fontes brasileiras)
- Contexto de importância estratégica para o Brasil
- Recomendações prioritárias resumidas
- 3-4 parágrafos densos e substanciais

## Situação Atual no Brasil
- Contexto histórico e regulatório brasileiro
- Situação presente de ${temaNome} no Brasil (dados verificáveis)
- Marcos legais, diretrizes federais, políticas públicas relevantes
- Competências institucionais (federal/estadual/municipal)
- Atores e stakeholders BRASILEIROS (instituições nomeadas e reais)
- DESENVOLVIMENTO: 5-6 parágrafos bem estruturados

## Dados, Indicadores e Estatísticas
- Tabela Markdown com indicadores brasileiros VERIFICÁVEIS
- Cada dado com fonte brasileira (IBGE, CONAB, INPE, etc.)
- Comparações entre regiões brasileiras quando relevante
- Tendências temporais baseadas em histórico disponível
- Interpretação clara dos dados apresentados
- DESENVOLVIMENTO: 4-5 parágrafos + tabela(s)

## Análise Estratégica
- Análise técnica profunda de ${temaNome} no contexto brasileiro
- Desafios reais com fundamentação em dados e legislação
- Oportunidades identificadas com viabilidade técnica e institucional
- Impactos em dimensões relevantes (econômica, social, ambiental, operacional)
- Considerações regionais (variações Norte-Nordeste-Centro-Sul)
- DESENVOLVIMENTO: 6-8 parágrafos

## Recomendações Estratégicas
- 4-5 recomendações prioritárias, específicas de ${temaNome}
- Cada recomendação com: objetivo claro, justificativa, ações concretas, cronograma, indicadores
- Recomendações viáveis e alinhadas com legislação/políticas brasileiras
- Atores responsáveis claramente identificados (ministérios, secretarias, órgãos)
- DESENVOLVIMENTO: Recomendações estruturadas com profundidade

## Referências Brasileiras
- Lista de fontes VERIFICÁVEIS e BRASILEIRAS
- Instituições, publicações, documentos oficiais
- URLs e datas de acesso/publicação
- Tipos de fonte: governamental federal, estadual, municipal, acadêmica, institucional

**DADOS PARA ENRIQUECIMENTO:**
${dadosEnriquecidos}

**FORMATO DE RETORNO JSON:**
{
  "titulo": "Título específico de ${temaNome} no Brasil",
  "conteudo": "Conteúdo PROFISSIONAL e BRASILEIRO em Markdown (1800-2200 palavras, 6 seções, dados VERIFICÁVEIS com fontes brasileiras, análise profunda, zero vagueza, contexto brasileiro específico)",
  "fontes": [
    {
      "nome": "Instituição/Publicação Brasileira",
      "descricao": "Descrição e relevância para o briefing",
      "url": "https://url-brasileira.gov.br ou acadêmica",
      "tipo": "governamental | academico | institucional"
    }
  ]
}

**REQUISITOS NÃO-NEGOCIÁVEIS:**
- ✅ TEMA COERENTE: Briefing sobre ${temaNome} exclusivamente, sem mistura confusa
- ✅ DADOS VERIFICÁVEIS: Todos os números com fonte brasileira ou CLARAMENTE INDICADOS como estimativa
- ✅ CONTEXTO BRASILEIRO: Instituições, legislação, políticas públicas brasileiras reais
- ✅ ZERO INSTITUIÇÕES INVÁLIDAS: Nenhuma referência a órgãos estrangeiros não pertinentes
- ✅ LINGUAGEM TÉCNICA: Formal, apropriada para governo federal/estadual
- ✅ ANÁLISE PROFUNDA: Explicação de relações, causas, impactos
- ✅ RECOMENDAÇÕES VIÁVEIS: Específicas, fundamentadas, alinhadas com realidade brasileira
- ✅ MÍNIMO 1800 PALAVRAS: Conteúdo substancial em cada seção`;
    
    // Se o tema não foi fornecido ou é 'nao_definido', peça explicitamente à IA
    // para identificar o tema mais apropriado e incluir no JSON de resposta.
    const temaSolicitado = (specifications.tema || '').toString();
    if (!temaSolicitado || temaSolicitado === 'nao_definido') {
      // Acrescentar instrução de detecção de tema no prompt
      prompt += `\n\n**TAREFA ADICIONAL:** Se o campo "Tema" não for claro ou for 'nao_definido', identifique o TEMA MAIS APROPRIADO que descreve o conteúdo das especificações dadas. No JSON de retorno inclua os campos adicionais: ` +
        `"detected_tema": "<id_do_tema>", "detected_confianca": <0-100>, "detected_palavras": ["palavra1","palavra2"] . Use um id curto (ex: 'agricultura', 'defesa_civil', 'fiscalizacao', 'monitoramento', 'relacoes' ou um id descritivo se necessário).`;
    }

    logger.debug('Enviando requisição para OpenAI API');
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em criação de briefings executivos para governo. Sempre retorne apenas JSON válido, sem texto adicional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || `Erro na API: ${response.status} ${response.statusText}`;
      logger.error('Erro na API OpenAI', { status: response.status, message: errorMsg });
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      logger.error('Resposta vazia da API');
      throw new Error('Resposta vazia da API');
    }

    logger.debug('Resposta recebida da OpenAI');

    // Tentar extrair JSON da resposta
    let jsonData;
    try {
      // Remover possíveis markdown code blocks
      const cleanedMessage = assistantMessage.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      jsonData = JSON.parse(cleanedMessage);
      logger.debug('JSON parseado com sucesso');
    } catch (parseError) {
      // Se não conseguir fazer parse, criar estrutura padrão
      logger.warn('Erro ao fazer parse do JSON da IA, usando conteúdo bruto:', parseError);
      jsonData = {
        conteudo: assistantMessage,
        fontes: [
          {
            nome: 'Informações geradas por IA',
            descricao: 'Conteúdo gerado automaticamente',
            url: '',
            tipo: 'institucional'
          }
        ]
      };
    }

    // Se a IA retornou um tema detectado, repassá-lo no retorno para uso posterior
    const detectedTema = jsonData.detected_tema || jsonData.detectedTema || null;
    const detectedConfianca = jsonData.detected_confianca || jsonData.detectedConfianca || null;

    const duration = performance.now() - startTime;
    logger.performance('Geração de briefing com IA concluída', duration, {
      tema: specifications.tema,
      tamanhoConteudo: jsonData.conteudo?.length || 0,
      fontes: jsonData.fontes?.length || 0
    });

    const output = {
      success: true,
      conteudo: jsonData.conteudo || assistantMessage,
      fontes: jsonData.fontes || []
    };
    if (detectedTema) output.detected_tema = detectedTema;
    if (detectedConfianca !== null) output.detected_confianca = detectedConfianca;

    return output;
  } catch (error) {
    logger.error('Erro ao gerar briefing com IA', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar briefing com IA'
    };
  }
};

// Função para simular geração de briefing (para desenvolvimento sem API key)
export const generateBriefingMock = async (specifications) => {
  const startTime = performance.now();
  logger.info('Iniciando geração de briefing (modo mock)', { 
    tema: specifications.tema, 
    prioridade: specifications.prioridade 
  });

  // Simular delay da API
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Tentar inferir tema se nao definido usando detector local
  let inferredTema = specifications.tema;
  if (!inferredTema || inferredTema === 'nao_definido') {
    try {
      const det = detectThemeLocal(specifications.especificacoes || '');
      if (det && det.tema) inferredTema = det.tema;
    } catch (e) {
      // ignore
    }
  }

  const temaNome = getTemaNome(inferredTema || specifications.tema);
  const prioridadeNome = getPrioridadeNome(specifications.prioridade);
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const especificacoes = specifications.especificacoes || 'Nenhuma especificação fornecida';
  
  logger.debug('Gerando estrutura de briefing mock');
  
  // Gerar título baseado nas especificações se não fornecido
  let titulo = specifications.titulo || 'Briefing Executivo';
  if (titulo === 'Briefing Executivo' && especificacoes !== 'Nenhuma especificação fornecida') {
    const palavras = especificacoes.split(' ').slice(0, 6).join(' ');
    titulo = palavras.length > 50 ? palavras.substring(0, 50) + '...' : palavras;
  }

  // Obter dados temáticos
  const thematicData = getThematicData(specifications.tema);
  const { institucional, academico } = getAcademicSources(specifications.tema);

  logger.debug('Dados temáticos coletados', {
    dataPoints: thematicData.dados.length,
    institutoesGovernamentais: institucional.length,
    publicacoesAcademicas: academico.length
  });

  // Gerar conteúdo específico por tema (evitando dados fictícios)
  let conteudoEspecifico = '';
  
  if (specifications.tema === 'agricultura') {
    conteudoEspecifico = `## Situação Atual da Agricultura Brasileira

### Contexto Institucional e Regulatório

O setor agrícola brasileiro é regulado primariamente pelo Ministério da Agricultura, Pecuária e Abastecimento (MAPA) em nível federal, com participação de secretarias estaduais de agricultura em estados como São Paulo, Minas Gerais, Rio Grande do Sul e Goiás—principais produtores nacionais. Documentos-chave incluem a Política Agrícola Nacional e o Zoneamento Agrícola de Risco (ZAR), que definem parâmetros de produção por região e cultura.

A Companhia Nacional de Abastecimento (CONAB) monitora safras, estoques e preços de produtos agrícolas. A Empresa Brasileira de Pesquisa Agropecuária (EMBRAPA) conduz pesquisa aplicada em tecnologias de produção, sustentabilidade e adaptação climática.

### Dimensões Regionais

A produção agrícola brasileira distribui-se de forma heterogênea:

- **Centro-Oeste (GO, MT, MS):** Maior produtor de grãos (soja, milho, algodão); aproximadamente 40% da produção nacional
- **Sul (RS, PR, SC):** Produtor diversificado (grãos, tabaco, vinho); competitividade baseada em tecnologia
- **Sudeste (SP, MG):** Café, açúcar, laranja; agricultura mais consolidada
- **Nordeste:** Agricultura familiar, seca cíclica, desafios de adaptação climática
- **Norte:** Pecuária extensiva, agricultura familiar, questões de sustentabilidade ambiental

### Indicadores de Relevância Pública

Conforme dados disponibilizados pela CONAB e pelo IBGE:

- A agricultura emprega diretamente milhões de trabalhadores e milhões mais na cadeia de valor
- O agronegócio representa proporção significativa do PIB (estimado entre 20-30% em ciclos de preços favoráveis)
- Exportações agrícolas consistem em proporção substancial da pauta de exportações brasileiras
- Programas de crédito como PRONAF e Moderagro subsidiam produção em milhões de propriedades`;

  } else if (specifications.tema === 'defesa_civil') {
    conteudoEspecifico = `## Situação Atual de Proteção e Defesa Civil no Brasil

### Contexto Institucional e Sistema Nacional

A Proteção e Defesa Civil brasileira é coordenada pelo Sistema Nacional de Proteção e Defesa Civil (SINPDEC), subordinado ao Ministério da Integração e Desenvolvimento Regional. O Centro Nacional de Monitoramento e Alertas de Desastres Naturais (CENAD) opera em nível federal, com estruturas estaduais (coordenadorias estaduais) e municipais (núcleos de proteção civil).

O INPE (Instituto Nacional de Pesquisas Espaciais) fornece monitoramento por satélite. O sistema reconhece desastres naturais (terremoto, enchente, deslizamento, tempestade) e tecnológicos (industrial, químico).

### Panorama de Riscos Naturais no Brasil

Por região:

- **Nordeste:** Secas recorrentes na região do Semiárido (Caatinga), impactando agricultura e abastecimento de água
- **Sudeste:** Enchentes sazonais em áreas urbanas de São Paulo, Rio de Janeiro e Minas Gerais; deslizamentos em encostas
- **Sul:** Tempestades severas, granizo, enchentes de curta duração (Paraná, Rio Grande do Sul)
- **Norte:** Inundações sazonais no rio Amazonas; secas extremas (El Niño)
- **Centro-Oeste:** Estiagens prolongadas afetando produção agrícola

### Legislação Relevante

- Lei 12.608/2012 institui a Política Nacional de Proteção e Defesa Civil
- Decreto 7.257/2010 regulamenta ações de proteção e defesa civil
- Estados e municípios têm competências descentralizadas de prevenção e resposta`;

  } else if (specifications.tema === 'fiscalizacao' || specifications.tema === 'ambiental') {
    conteudoEspecifico = `## Situação Atual de Proteção Ambiental no Brasil

### Contexto Institucional e Regulatório

A proteção ambiental é competência compartilhada entre União (Ministério do Meio Ambiente e Mudança do Clima), estados e municípios conforme a Constituição Federal de 1988. O IBAMA (Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis) é o órgão executor federal de fiscalização ambiental. O ICMBio (Instituto Chico Mendes de Conservação da Biodiversidade) gerencia unidades de conservação.

Marcos legais incluem: Lei de Crimes Ambientais (Lei 9.605/1998), Lei da Mata Atlântica (Lei 11.428/2006), Lei de Proteção da Amazônia, Lei da Biodiversidade.

### Biomas e Prioridades de Conservação

- **Amazônia:** Maior bioma de floresta tropical; desmatamento é desafio crítico; pressão econômica de grilagem e exploração ilegal
- **Cerrado:** Savana tropical; 50%+ convertido em agricultura; biodiversidade ameaçada
- **Mata Atlântica:** Fragmentado; 12% da cobertura original; biodiversidade única
- **Pantanal:** Maior zona úmida; impactado por agropecuária e incêndios
- **Caatinga:** Ecossistema semiárido do Nordeste; ameaçado por desertificação`;

  } else {
    // Genérico para outros temas
    const institucoesLista = institucional.slice(0, 3).map(s => `- **${s.nome}:** ${s.descricao}`).join('\n');
    const pesquisaLista = academico.length > 0 ? `### Pesquisa e Conhecimento\n\nPublicações acadêmicas especializadas (${academico.length} estudos) contribuem com conhecimento técnico, metodologias inovadoras e análise crítica para o tema.` : '';
    
    conteudoEspecifico = `## Situação Atual

### Contexto Institucional

No contexto brasileiro, **${temaNome}** é gerida através de um arcabouço institucional que envolve múltiplos níveis de governo e organizações especializadas. As instituições federais relevantes exercem papéis estratégicos na formulação de políticas, estabelecimento de normas e monitoramento.

### Atores Principais

${institucoesLista}

${pesquisaLista}`;
  }

  // Construir a tabela de dados
  const tabelaDados = thematicData.dados.slice(0, 4).map(d => 
    `| ${d.metrica} | ${d.valor} | ${d.fonte} |`
  ).join('\n');

  // Construir referências institucionais
  const referenciasInstitucionais = institucional.map((s, i) => 
    `${i + 1}. **${s.nome}**\n   ${s.descricao}\n   [${s.url}](${s.url})`
  ).join('\n\n');

  // Construir referências acadêmicas
  const referenciasAcademicas = academico.slice(0, 3).map((s, i) => 
    `${i + 1}. **${s.nome}**\n   ${s.descricao}`
  ).join('\n\n');

  const conteudo = `# ${titulo || 'Briefing: ' + temaNome}

## Resumo Executivo

O presente briefing analisa **${temaNome}** conforme especificações fornecidas: "${especificacoes}".

**Documento:**
- **Data:** ${dataAtual}
- **Prioridade:** ${prioridadeNome}
- **Tema:** ${temaNome}
- **Fontes Consultadas:** ${institucional.length + academico.length} instituições especializadas

Este documento integra análise institucional, dados brasileiros e recomendações estratégicas fundamentadas em literatura técnica.

${conteudoEspecifico}

### Análise Estratégica

A compreensão adequada de **${temaNome}** requer análise multidimensional considerando aspectos institucionais, técnicos, operacionais e sociais.

**Desafios Identificados:**
- Coordenação e alinhamento entre instituições em diferentes níveis federativos
- Capacidade técnica e recursos financeiros para implementação efetiva
- Sustentabilidade de ações através de ciclos políticos
- Integração de conhecimento técnico com políticas públicas

**Oportunidades Estratégicas:**
- Alinhamento com diretrizes federais e compromissos internacionais
- Aproveitamento de avanços tecnológicos e metodológicos
- Potencial de sinergia com programas governamentais relacionados
- Fortalecimento de capacidades institucionais

## Dados Principais

| Aspecto | Descrição | Fonte |
|--------|-----------|-------|
${tabelaDados}

**Nota sobre dados:** Os valores apresentados são baseados em fontes governamentais brasileiras (IBGE, CONAB, INPE, CENAD, IBAMA conforme tema). Para dados específicos atualizados, consulte os órgãos federais responsáveis.

## Recomendações Estratégicas

### Recomendação 1: Fortalecimento de Coordenação Institucional

**Objetivo:** Estabelecer mecanismos claros de articulação entre órgãos federais, estaduais e municipais envolvidos com ${temaNome}.

**Justificativa:** A fragmentação institucional é desafio recorrente em políticas públicas brasileiras. Coordenação efetiva reduz duplicação de esforços e melhora efetividade.

**Ações:**
- Criar fórum permanente entre órgãos federais (MAPA, IBAMA, INPE, CENAD conforme tema)
- Estabelecer protocolos de comunicação com estados e municípios
- Definir responsabilidades claras e indicadores de desempenho

### Recomendação 2: Investimento em Capacidades Técnicas

**Objetivo:** Fortalecer expertise técnica e infraestrutura de sistemas de informação.

**Justificativa:** A qualidade da execução depende diretamente de capacidades técnicas disponíveis.

**Ações:**
- Programas de treinamento contínuo para equipes técnicas
- Modernização de sistemas de informação e monitoramento
- Parcerias com universidades e institutos de pesquisa

### Recomendação 3: Monitoramento Contínuo e Adaptação

**Objetivo:** Implementar sistema robusto de monitoramento que permita ajustes estratégicos ágeis.

**Justificativa:** O ambiente político, econômico e ambiental é dinâmico; políticas devem ser adaptativas.

**Ações:**
- Estabelecer dashboard com indicadores-chave
- Realizar avaliações periódicas (semestrais/anuais)
- Ajustar ações conforme aprendizados

## Referências Brasileiras

### Instituições e Órgãos Federais

${referenciasInstitucionais}

### Publicações Técnicas e Acadêmicas

${referenciasAcademicas}

---

**Documento preparado em:** ${dataAtual}
**Tema:** ${temaNome} | **Prioridade:** ${prioridadeNome}
**Status:** Para decisões críticas, consulte órgãos federais responsáveis`;

  // Compilar fontes com enriquecimento
  const todasAsFontes = [
    ...institucional.map(s => ({
      nome: s.nome,
      descricao: s.descricao,
      url: s.url,
      tipo: s.tipo
    })),
    ...academico.map(s => ({
      nome: s.nome,
      descricao: s.descricao,
      issn: s.issn,
      tipo: s.tipo
    }))
  ];

  const duration = performance.now() - startTime;
  logger.performance('Geração de briefing mock concluída', duration, {
    tema: specifications.tema,
    tamanhoConteudo: conteudo.length,
    fontes: todasAsFontes.length
  });

  const result = {
    success: true,
    conteudo,
    fontes: todasAsFontes
  };
  // Incluir detecção de tema simulada
  if (!specifications.tema || specifications.tema === 'nao_definido') {
    result.detected_tema = inferredTema || null;
    result.detected_confianca = inferredTema ? 65 : 0;
  }
  return result;
};
