// Serviço de IA para geração de briefings
// IMPORTANTE: Configure sua API Key da OpenAI no arquivo .env
// VITE_OPENAI_API_KEY=sua-chave-aqui

import { enrichPromptWithData, getAcademicSources, getThematicData } from './researchService'
import { detectTheme as detectThemeLocal } from './themeDetectionService'
import { fetchGovernmentData } from './governmentApiService'
import { createLogger } from '../utils/logger'

const logger = createLogger('AIService')
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Função para obter o nome do tema formatado
const getTemaNome = (tema) => {
  if (!tema) return 'Tema a Ser Identificado';
  if (tema === 'nao_definido') return 'Tema Não Detectado';
  
  // Importar getThemeName do themeDetectionService para manter consistência
  // Por enquanto, usar fallback básico - o themeDetectionService já tem a lógica completa
  const temasConhecidos = {
    defesa_civil: 'Defesa Civil',
    agricultura: 'Agricultura',
    monitoramento: 'Monitoramento Costeiro',
    fiscalizacao: 'Fiscalização Ambiental',
    relacoes: 'Relações Internacionais',
    seguranca_publica: 'Segurança Pública',
    infraestrutura: 'Infraestrutura',
    saude: 'Saúde',
    educacao: 'Educação',
    habitacao: 'Habitação',
    assistencia_social: 'Assistência Social',
    trabalho_emprego: 'Trabalho e Emprego',
    economia_financeiro: 'Economia e Finanças',
    energia: 'Energia',
    comunicacao_midia: 'Comunicação e Mídia',
    tecnologia_inovacao: 'Tecnologia e Inovação',
    turismo: 'Turismo',
    esporte_lazer: 'Esporte e Lazer',
    cultura: 'Cultura',
    desenvolvimento_social: 'Desenvolvimento Social',
    cidades_urbanismo: 'Cidades e Urbanismo',
    saneamento: 'Saneamento',
    transporte_mobilidade: 'Transporte e Mobilidade',
    meio_ambiente_clima: 'Meio Ambiente e Clima',
    recursos_hidricos: 'Recursos Hídricos',
    mineracao: 'Mineração',
    desenvolvimento_regional: 'Desenvolvimento Regional',
    ciencia_pesquisa: 'Ciência e Pesquisa',
    populacao_indigena: 'População Indígena',
    igualdade_genero: 'Igualdade de Gênero',
    racismo_igualdade_racial: 'Igualdade Racial',
    direito_humanos: 'Direitos Humanos',
    planejamento_gestao: 'Planejamento e Gestão',
    transparencia_controle: 'Transparência e Controle',
    trabalho_infantil: 'Trabalho Infantil',
    terceira_idade: 'Terceira Idade',
    pessoas_deficiencia: 'Pessoas com Deficiência'
  };
  
  // Se está nos temas conhecidos, retornar
  if (temasConhecidos[tema]) return temasConhecidos[tema];
  
  // Se não está, formatar de snake_case para título formatado
  return tema
    .split('_')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
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
    
    // Usar tema fornecido ou deixar que a IA detecte
    // NÃO forçar tema se não faz sentido
    let temaParaUsar = specifications.tema;
    if (!temaParaUsar || temaParaUsar === 'nao_definido') {
      // Deixar a IA detectar
      temaParaUsar = null;
    }
    
    const temaNome = temaParaUsar ? getTemaNome(temaParaUsar) : 'Tema a Ser Identificado';
    const prioridadeNome = getPrioridadeNome(specifications.prioridade);
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Buscar dados governamentais reais das APIs (só se tiver tema válido)
    let governmentData = { fontes: [], dados: [] };
    let dadosEnriquecidos = '';
    let thematicData = { dados: [] };
    let academicSources = { institucional: [], academico: [] };
    
    if (temaParaUsar && temaParaUsar !== 'nao_definido') {
      logger.info('Buscando dados de APIs governamentais', { tema: temaParaUsar });
      governmentData = await fetchGovernmentData(temaParaUsar, specifications.especificacoes || '');
      dadosEnriquecidos = enrichPromptWithData(temaParaUsar, specifications.especificacoes);
      thematicData = getThematicData(temaParaUsar);
      academicSources = getAcademicSources(temaParaUsar);
    } else {
      // Se não tem tema, buscar dados genéricos baseados nas especificações
      logger.info('Tema não definido, buscando dados baseados nas especificações');
      // Tentar buscar dados baseados nas especificações diretamente
      const temaDetectadoLocal = detectThemeLocal(specifications.especificacoes || '');
      if (temaDetectadoLocal?.tema) {
        governmentData = await fetchGovernmentData(temaDetectadoLocal.tema, specifications.especificacoes || '');
        dadosEnriquecidos = enrichPromptWithData(temaDetectadoLocal.tema, specifications.especificacoes);
        thematicData = getThematicData(temaDetectadoLocal.tema);
        academicSources = getAcademicSources(temaDetectadoLocal.tema);
      }
    }
    
    // Adicionar dados governamentais às fontes
    const fontesCombinadas = [
      ...academicSources.institucional,
      ...academicSources.academico,
      ...(governmentData.fontes || [])
    ];

    // Criar texto com dados governamentais obtidos
    let dadosGovernamentaisTexto = '';
    if (governmentData.dados && governmentData.dados.length > 0) {
      dadosGovernamentaisTexto = `
## Dados Governamentais em Tempo Real (APIs Oficiais):

${governmentData.dados.map(d => `- **${d.titulo}** (Fonte: ${d.fonte}): ${d.conteudo}
  - URL: ${d.url}`).join('\n\n')}

⚠️ **IMPORTANTE**: Use estes dados reais nas suas análises. Consulte as URLs fornecidas para informações atualizadas e verificáveis.
`;
    }

    logger.debug('Dados acadêmicos e governamentais enriquecidos', { 
      fontes: fontesCombinadas.length,
      metricas: thematicData.dados.length,
      dadosGovernamentais: governmentData.dados?.length || 0
    });

    const prompt = `# =====================================================================

# SISTEMA DE GERADOR DE BRIEFINGS GOVERNAMENTAIS – MODO EXECUTIVO ESTADUAL

# Secretaria de Assessoria Especial à Governadora

# (Assuntos Especiais e Relações Internacionais)

# =====================================================================



Você é um Analista Governamental Sênior, especializado em redigir briefings técnicos, estratégicos e institucionais para a Governadora e para os órgãos de alto nível do Poder Executivo Estadual.



Seu papel é produzir BRIEFINGS COMPLETOS, PRAGMÁTICOS, OBJETIVOS e 100% CONTEXTUALIZADOS ao pedido do usuário.



A estrutura abaixo é OBRIGATÓRIA.  

O briefing deve sempre ser formulado para auxiliar decisões de alto impacto.



================================================================================

1. IDENTIFICAÇÃO E CONTEXTO DO PEDIDO

================================================================================

Antes de iniciar o documento, identifique:

- Tema e escopo exato solicitados pelo usuário  

- Localidade (estado, município, região, comunidades, zonas administrativas)  

- Populações envolvidas  

- Tempo (data, período, vigência, situação atual)  

- Relevância governamental  

- Potenciais impactos políticos, sociais, econômicos ou internacionais  



NUNCA altere o tema.  

NUNCA gere conteúdo genérico.

**ESPECIFICAÇÕES DO BRIEFING:**
- Solicitação do Usuário: "${specifications.especificacoes || 'Nenhuma especificação fornecida'}"
- Tema Identificado: ${temaNome}
- Prioridade: ${prioridadeNome}
- Data de Elaboração: ${dataAtual}

================================================================================

2. ESTRUTURA OBRIGATÓRIA DO BRIEFING GOVERNAMENTAL

================================================================================



Todo briefing deve seguir EXACTAMENTE esta estrutura:



1. Título Institucional  

2. Objetivo do Documento  

3. Sumário Executivo  

4. Contexto e Diagnóstico Geral  

5. Situação Atual (com dados, estatísticas, indicadores e regiões afetadas)

6. Públicos Envolvidos:

      - População mais afetada  

      - População menos afetada  

      - Setores estratégicos impactados  

      - Grupos vulneráveis  

7. Atores Institucionais:

      - Órgãos estaduais envolvidos  

      - Órgãos municipais  

      - Órgãos federais (quando aplicável)  

      - Organismos internacionais relevantes  

8. Análise Técnica e Estratégica:

      - Riscos imediatos  

      - Riscos potenciais  

      - Vulnerabilidades  

      - Oportunidades  

9. Recomendações:

      - Ações urgentes (0–24h)  

      - Ações de curto prazo (48h – 7 dias)  

      - Ações de médio prazo (8–60 dias)  

      - Ações de longo prazo (60+ dias)  

10. Impactos Esperados:

      - Impacto social  

      - Impacto econômico  

      - Impacto institucional  

      - Impacto operacional  

11. Indicadores de Monitoramento:

      - Metas  

      - KPIs  

      - Indicadores de risco  

12. Anexo:

      - Tabelas de dados  

      - Fontes técnicas  

      - Escopo para PDF (se solicitado)



================================================================================

3. REDAÇÃO GOVERNAMENTAL – PADRÕES OBRIGATÓRIOS

================================================================================

- Linguagem institucional, diplomática e técnica.  

- Tom profissional, objetivo e direto.  

- Termos adequados ao Poder Executivo Estadual.  

- Evite especulação.  

- Utilize dados plausíveis e contextualizados.  

- Sempre apresente:

    * onde,  

    * quem,  

    * quanto,  

    * por que,  

    * e quais riscos.  

- Priorize clareza para tomada de decisão da Governadora.



================================================================================

4. FOCOS DESTA SECRETARIA (APLICAR SEMPRE QUE FOR PERTINENTE)

================================================================================

Como órgão de Assuntos Especiais e Relações Internacionais, considere em suas análises:



- Riscos à imagem institucional do Governo  

- Impactos regionais, interestaduais ou internacionais  

- Possibilidades de cooperação com:

      • ONU  

      • OEA  

      • Banco Mundial  

      • BID  

      • Consulados e embaixadas  

- Interface com políticas públicas estaduais  

- Articulação intergovernamental (união, estado, municípios)



================================================================================

5. MODO DE DECISÃO ESTRATÉGICA

================================================================================

O briefing deve permitir que a governadora entenda rapidamente:

- A gravidade da situação  

- Onde agir  

- Quem acionar  

- Quais recursos priorizar  

- Quais riscos políticos e institucionais estão presentes  



================================================================================

6. ITENS PROIBIDOS

================================================================================

❌ Textos genéricos  

❌ Respostas que não correspondem ao tema  

❌ Foco técnico sem contexto governamental  

❌ Omissão de dados relevantes  

❌ Substituir assunto solicitado por temas aleatórios  

❌ Falta de atores envolvidos  

❌ Ausência de públicos afetados  



================================================================================

7. OBJETIVO FINAL

================================================================================

Gerar BRIEFINGS GOVERNAMENTAIS de alta precisão, profundidade e relevância executiva, capazes de orientar imediatamente decisões da Governadora, seus assessores diretos e órgãos estratégicos.



Sempre entregue o melhor documento possível.

${dadosEnriquecidos}

**REQUISITOS ADICIONAIS CRÍTICOS:**

1. **CONTEXTO BRASILEIRO ESPECÍFICO:**
   - Refletir legislação brasileira, diretrizes do governo federal, organismos como CONAB, MAPA, IBAMA, INPE, SINPDEC (Sistema Nacional de Proteção e Defesa Civil);
   - Referenciar MARCOS BRASILEIROS relevantes: Lei de Proteção de Dados, Plano Plurianual (PPA), diretrizes do governo federal
   - Para Defesa Civil: mencionar SINPDEC, CENAD, estrutura de Defesa Civil em estados e municípios
   - Para Agricultura: mencionar Zoneamento Agrícola de Risco (ZAR), Programa de Crédito Rural (PRONAF, Banco do Brasil), CONAB
   - Para Meio Ambiente: mencionar IBAMA, licenciamento ambiental, legislação de proteção ambiental brasileira
   - Considerar REGIONALIZAÇÕES: Caatinga, Cerrado, Amazônia, Mata Atlântica, Pantanal conforme relevante
   - Reconhecer competências: federal (MAPA, IBAMA, INPE), estadual (Secretarias), municipal (Prefeituras)

2. **DADOS E VERIFICABILIDADE:**
   - NUNCA inventar números ou estatísticas
   - Se usar dados: SEMPRE CITAR FONTE explicitamente (instituição, ano, documento)
   - Fontes aceitáveis: IBGE, CONAB, MAPA, INPE, EMBRAPA, CENAD, bancos de dados oficiais, estudos acadêmicos publicados
   - Se usar estimativas: INDICAR CLARAMENTE "Estimativa baseada em..." ou "Projeção de..."
   - Quando dados exatos não estão disponíveis: DESCREVER QUALITATIVAMENTE com base em literatura técnica
   - Se precisar de número: usar intervalos (ex: "estima-se entre 1,5 e 2,0 milhões") em vez de número fictício

3. **PROFUNDIDADE E COMPLETUDE:**
   - Tamanho MÍNIMO: 3000-4000 palavras (não menos)
   - Todas as 12 seções obrigatórias com desenvolvimento COMPLETO e PROFUNDO
   - Cada seção com densidade informativa ALTA
   - Análise multidimensional (institucional, técnica, operacional, social, ambiental conforme tema)
   - NÃO CORTE INFORMAÇÕES - complete todas as frases e seções
   - Seja ESPECÍFICO ao que o usuário pediu nas especificações: "${specifications.especificacoes || ''}"

4. **INSTRUÇÕES PARA O TÍTULO:**
   - O título DEVE ser formal, descritivo e específico, baseado EXATAMENTE no que o usuário solicitou nas especificações
   - NÃO use títulos genéricos como "Briefing Executivo" ou apenas o nome do tema
   - Se o usuário pediu "situação dos solos agrícolas da região rural de Pernambuco", o título deve ser algo como: "Situação dos Solos Agrícolas na Região Rural de Pernambuco: Análise Técnica e Estratégica"
   - O título deve refletir o escopo específico e a localização/contexto mencionado nas especificações
   - Use linguagem formal e técnica apropriada para documentos governamentais

**DADOS PARA ENRIQUECIMENTO:**
${dadosEnriquecidos}

${dadosGovernamentaisTexto}

**FONTES GOVERNAMENTAIS DISPONÍVEIS:**
${fontesCombinadas.map(f => `- **${f.nome}**: ${f.descricao || ''} ${f.url ? `(${f.url})` : ''}`).join('\n')}

**FORMATO DE RETORNO JSON:**
{
  "titulo": "[TÍTULO INSTITUCIONAL FORMAL E ESPECÍFICO BASEADO NAS ESPECIFICAÇÕES - NÃO GENÉRICO]",
  "conteudo": "Conteúdo PROFISSIONAL, ESPECÍFICO e BRASILEIRO em Markdown seguindo EXATAMENTE a estrutura obrigatória de 12 seções. MÍNIMO de 3000-4000 palavras. Todas as seções completas e desenvolvidas. Dados VERIFICÁVEIS com fontes brasileiras explícitas. Análise profunda. ZERO vagueza. Contexto específico baseado nas especificações do usuário: '${specifications.especificacoes || ''}'. NÃO CORTE INFORMAÇÕES - complete todas as frases e seções.",
  "fontes": [
    {
      "nome": "Instituição/Publicação Brasileira",
      "descricao": "Descrição e relevância para o briefing",
      "url": "https://url-brasileira.gov.br ou acadêmica",
      "tipo": "governamental | academico | institucional"
    }
  ],
  "detected_tema": "[IDENTIFICAR O TEMA CORRETO baseado no pedido do usuário - pode ser qualquer tema que faça sentido]",
  "detected_confianca": 85,
  "detected_palavras": ["palavra1", "palavra2"]
}

⚠️ **REGRA CRÍTICA - ESPECIFICIDADE:**
- NUNCA gere conteúdo genérico sobre um tema amplo
- SEMPRE responda DIRETAMENTE ao que o usuário pediu: "${specifications.especificacoes || ''}"
- Identifique: O que o usuário quer saber? O que precisa ser feito? Qual a situação específica?
- Cada seção deve abordar a SITUAÇÃO ESPECÍFICA solicitada, não um tema genérico
- Se o pedido é sobre "X em Y", o briefing é sobre "X em Y", não sobre "X em geral"
- DESENVOLVA COMPLETAMENTE cada seção - não deixe frases pela metade
- Use MÍNIMO 3000 palavras - conteúdo substancial e completo
- Foque em: ANÁLISE ESPECÍFICA + O QUE FAZER + COMO FAZER + QUEM FAZ + QUANDO FAZER

**REQUISITOS NÃO-NEGOCIÁVEIS:**
- ✅ TEMA COERENTE: Identifique e use o tema CORRETO que faz sentido com o pedido do usuário. Você PODE criar QUALQUER tema que faça sentido, não se limite a uma lista restrita.
- ✅ DADOS VERIFICÁVEIS: Todos os números com fonte brasileira ou CLARAMENTE INDICADOS como estimativa
- ✅ CONTEXTO BRASILEIRO: Instituições, legislação, políticas públicas brasileiras reais
- ✅ ZERO INSTITUIÇÕES INVÁLIDAS: Nenhuma referência a órgãos estrangeiros não pertinentes
- ✅ LINGUAGEM TÉCNICA: Formal, apropriada para governo federal/estadual
- ✅ ANÁLISE PROFUNDA: Explicação de relações, causas, impactos
- ✅ RECOMENDAÇÕES VIÁVEIS: Específicas, fundamentadas, alinhadas com realidade brasileira
- ✅ MÍNIMO 3000 PALAVRAS: Conteúdo substancial e completo
- ✅ ESTRUTURA COMPLETA: Todas as 12 seções obrigatórias desenvolvidas`;
    
    // SEMPRE pedir à IA para identificar o tema correto baseado no pedido
    // NÃO restringir aos temas pré-definidos - permitir QUALQUER tema que faça sentido
    prompt += `\n\n**TAREFA CRÍTICA - IDENTIFICAÇÃO DO TEMA CORRETO:** 
      
As especificações do usuário são: "${specifications.especificacoes || ''}"

⚠️ **IMPORTANTE**: Identifique o TEMA CORRETO que REALMENTE FAZ SENTIDO com o pedido do usuário. 

**VOCÊ PODE E DEVE IDENTIFICAR QUALQUER TEMA QUE FAÇA SENTIDO** - NÃO se limite a uma lista restrita.

Temas de referência (você pode criar QUALQUER OUTRO que faça sentido):
- **defesa_civil**: Para desastres, emergências, chuvas, enchentes, deslizamentos, tempestades, alertas meteorológicos, proteção civil
- **agricultura**: Para produção agrícola, safras, plantio, cultivo, produção rural, agronegócio, solos agrícolas
- **monitoramento**: Para monitoramento costeiro, marinho, ambiental
- **fiscalizacao**: Para questões ambientais, fiscalização, desmatamento, proteção ambiental
- **relacoes**: Para relações internacionais, diplomacia, acordos comerciais
- **seguranca_publica**: Para segurança pública, policiamento, criminalidade, violência urbana, segurança no centro/cidade
- **infraestrutura**: Para infraestrutura viária, estradas, rodovias, pavimentação, obras públicas, transporte
- **saude**: Para saúde pública, hospitais, epidemias, campanhas de saúde
- **educacao**: Para educação, escolas, ensino, alfabetização
- **habitacao**: Para habitação, moradia, habitação social
- **assistencia_social**: Para assistência social, programas sociais, bolsa família
- **trabalho_emprego**: Para trabalho, emprego, desemprego, qualificação profissional
- **economia_financeiro**: Para economia, finanças, orçamento, investimento
- **energia**: Para energia elétrica, usinas, distribuição de energia
- **comunicacao_midia**: Para comunicação, mídia, imprensa
- **tecnologia_inovacao**: Para tecnologia, inovação, ciência, pesquisa
- **turismo**: Para turismo, destinos, hotelaria
- **esporte_lazer**: Para esporte, lazer, recreação
- **cultura**: Para cultura, arte, patrimônio cultural
- **desenvolvimento_social**: Para desenvolvimento social, inclusão, desigualdade
- **cidades_urbanismo**: Para planejamento urbano, urbanismo, cidade
- **saneamento**: Para saneamento, água, esgoto, coleta de lixo
- **transporte_mobilidade**: Para transporte público, mobilidade urbana, ciclovias
- **meio_ambiente_clima**: Para meio ambiente, mudanças climáticas, preservação
- **recursos_hidricos**: Para recursos hídricos, bacias hidrográficas, barragens
- **mineracao**: Para mineração, garimpo, jazidas
- **desenvolvimento_regional**: Para desenvolvimento regional, polos econômicos
- **ciencia_pesquisa**: Para ciência, pesquisa científica, universidades
- **populacao_indigena**: Para povos indígenas, terras indígenas
- **igualdade_genero**: Para igualdade de gênero, políticas para mulheres
- **racismo_igualdade_racial**: Para igualdade racial, políticas para população negra
- **direito_humanos**: Para direitos humanos, violação de direitos
- **planejamento_gestao**: Para planejamento, gestão pública, políticas públicas
- **transparencia_controle**: Para transparência, controle, auditoria
- **trabalho_infantil**: Para trabalho infantil, proteção da criança
- **terceira_idade**: Para idosos, políticas para terceira idade
- **pessoas_deficiencia**: Para pessoas com deficiência, acessibilidade

**MAS VOCÊ PODE CRIAR QUALQUER OUTRO TEMA QUE FAÇA SENTIDO:**
- Use sua análise inteligente para identificar o tema CORRETO baseado no CONTEÚDO REAL do pedido
- Se o pedido é sobre algo que não se encaixa perfeitamente nos exemplos acima, CRIE um tema descritivo adequado
- Exemplos de temas que você pode criar: "seguranca_urbana", "mobilidade_urbana", "saude_publica", "infraestrutura_rodoviaria", etc.

**REGRAS OBRIGATÓRIAS:**
- O tema DEVE fazer sentido com o título que você vai gerar
- O tema DEVE fazer sentido com o conteúdo que você vai gerar
- O tema DEVE refletir REALMENTE o que o usuário pediu
- Use formato: palavras_em_minusculas_separadas_por_underscore (ex: seguranca_publica, infraestrutura_urbana)
- Se não tiver certeza, use um tema descritivo genérico baseado nas palavras-chave principais do pedido

No JSON de retorno inclua os campos:
- "detected_tema": "<nome_do_tema_correto>" (o tema que REALMENTE faz sentido para o pedido - pode ser qualquer tema)
- "detected_confianca": <0-100> (confiança na detecção)
- "detected_palavras": ["palavra1","palavra2"] (palavras-chave que indicaram o tema)

EXEMPLOS CORRETOS: 
- Pedido: "segurança no centro de Recife" → detected_tema: "seguranca_publica" (NÃO "monitoramento_costiero")
- Pedido: "chuva em Pernambuco" → detected_tema: "defesa_civil"
- Pedido: "situação dos solos agrícolas" → detected_tema: "agricultura"
- Pedido: "análise de segurança urbana" → detected_tema: "seguranca_publica" ou "seguranca_urbana"
- Pedido: "infraestrutura rodoviária" → detected_tema: "infraestrutura" ou "infraestrutura_rodoviaria"

⚠️ **CRÍTICO**: O tema identificado deve ser COERENTE com o título e conteúdo gerados. Se você gerar um título sobre "Segurança no Centro de Recife", o tema NÃO pode ser "Monitoramento Costeiro" - isso não faz sentido! Use sua inteligência para identificar o tema CORRETO baseado no que o usuário REALMENTE pediu.`;

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
        max_tokens: 8000
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

    // Combinar fontes da IA com fontes governamentais
    const todasAsFontes = [
      ...(jsonData.fontes || []),
      ...governmentData.fontes
    ];
    
    // Remover duplicatas por URL
    const fontesUnicas = todasAsFontes.filter((fonte, index, self) => 
      index === self.findIndex(f => 
        (f.url && fonte.url && f.url === fonte.url) ||
        (f.nome && fonte.nome && f.nome === fonte.nome)
      )
    );

    // Priorizar tema detectado pela IA sobre o tema fornecido (se houver)
    const temaFinal = detectedTema || temaParaUsar || specifications.tema;
    
    const output = {
      success: true,
      conteudo: jsonData.conteudo || assistantMessage,
      fontes: fontesUnicas
    };
    
    // Sempre retornar o tema detectado/correto
    if (temaFinal) output.detected_tema = temaFinal;
    if (detectedConfianca !== null) output.detected_confianca = detectedConfianca;

    logger.info('Briefing gerado', { 
      tema_original: specifications.tema,
      tema_detectado_ia: detectedTema,
      tema_final_usado: temaFinal
    });

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
  
  // Gerar título formal baseado nas especificações
  let titulo = specifications.titulo;
  
  if (!titulo || titulo === 'Briefing Executivo' || titulo.trim() === '') {
    // Criar título formal baseado nas especificações
    const especificacoesLower = especificacoes.toLowerCase().trim();
    
    // Padronizar título - primeira letra maiúscula de cada palavra importante
    const palavras = especificacoes.split(' ');
    let tituloFormatado = palavras
      .slice(0, 10) // Limitar palavras relevantes
      .map((palavra, idx) => {
        const p = palavra.toLowerCase();
        // Não capitalizar artigos/preposições no meio, mas sim no início e palavras importantes
        if (idx === 0 || ['dos', 'das', 'do', 'da', 'de', 'em', 'no', 'na', 'para', 'com'].indexOf(p) === -1) {
          return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
        }
        return p;
      })
      .join(' ');
    
    // Adicionar subtítulo formal se necessário
    if (tituloFormatado.length < 60) {
      tituloFormatado += ': Análise Técnica e Estratégica';
    }
    
    // Limitar tamanho e garantir formalidade
    titulo = tituloFormatado.length > 80 
      ? tituloFormatado.substring(0, 77) + '...' 
      : tituloFormatado;
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

  // Analisar especificamente o que foi pedido
  const especificacoesLower = especificacoes.toLowerCase()
  let focoEspecifico = ''
  let acoesNecessarias = ''
  
  // Detectar elementos específicos do pedido
  const localizacoes = ['pernambuco', 'bahia', 'são paulo', 'rio de janeiro', 'minas gerais', 'paraná', 'rio grande do sul', 'goiás', 'mato grosso', 'amazonas', 'nordeste', 'sudeste', 'sul', 'norte', 'centro-oeste']
  const acoes = ['situação', 'análise', 'monitoramento', 'avaliação', 'estratégia', 'ações', 'medidas', 'soluções', 'problemas', 'desafios']
  
  let localizacaoDetectada = localizacoes.find(loc => especificacoesLower.includes(loc))
  let acaoDetectada = acoes.find(acao => especificacoesLower.includes(acao))
  
  if (localizacaoDetectada || acaoDetectada) {
    focoEspecifico = `O presente briefing aborda ESPECIFICAMENTE a solicitação: "${especificacoes}". 
    
Este documento foi elaborado para responder DIRETAMENTE ao que foi solicitado, fornecendo análise, dados e recomendações específicas relacionadas à situação mencionada, não um estudo genérico sobre ${temaNome}.`
    
    acoesNecessarias = `Com base na solicitação específica "${especificacoes}", este briefing identifica ações concretas, análises necessárias e estratégias direcionadas para atender ao pedido.`
  } else {
    focoEspecifico = `O presente briefing analisa **${temaNome}** conforme especificações fornecidas: "${especificacoes}".`
    acoesNecessarias = `Este documento oferece análise técnica e estratégica específica relacionada ao pedido, com foco em identificar o que deve ser feito para atender à solicitação.`
  }

  const conteudo = `# ${titulo || 'Briefing: ' + temaNome}

## Resumo Executivo

${focoEspecifico}

**Solicitação Específica do Usuário:** "${especificacoes}"

${acoesNecessarias}

**Contexto do Documento:**
- **Data de Elaboração:** ${dataAtual}
- **Prioridade:** ${prioridadeNome}
- **Tema:** ${temaNome}
- **Fontes Consultadas:** ${institucional.length + academico.length} instituições especializadas e publicações técnicas

O briefing foi desenvolvido com base em informações oficiais de órgãos federais, estaduais e institutos de pesquisa brasileiros, garantindo que as análises e recomendações sejam específicas para atender à solicitação realizada.

${conteudoEspecifico}

### Análise Estratégica

A compreensão adequada de **${temaNome}** requer análise multidimensional considerando aspectos institucionais, técnicos, operacionais e sociais.

**Desafios Identificados:**

A análise do contexto de **${temaNome}** revela desafios estruturais e operacionais que demandam atenção estratégica:

- **Coordenação Institucional:** A necessidade de alinhamento entre instituições em diferentes níveis federativos (federal, estadual e municipal) apresenta-se como desafio permanente. A fragmentação de competências e a falta de protocolos claros de comunicação podem comprometer a efetividade das políticas públicas relacionadas.

- **Capacidades Técnicas e Financeiras:** A implementação efetiva de ações estratégicas depende diretamente da disponibilidade de recursos técnicos especializados e financeiros adequados. Investimentos em capacitação e infraestrutura são fundamentais para superar limitações operacionais.

- **Sustentabilidade Política:** A continuidade de políticas e programas através de diferentes ciclos políticos e administrativos representa desafio significativo. Estruturas permanentes e legislação robusta são essenciais para garantir perenidade das ações.

- **Integração Técnica-Política:** A tradução efetiva do conhecimento técnico e acadêmico em políticas públicas práticas e implementáveis requer processos estruturados de diálogo entre pesquisadores, gestores públicos e tomadores de decisão.

**Oportunidades Estratégicas:**

Identificam-se oportunidades relevantes para avanço em **${temaNome}**:

- **Alinhamento com Diretrizes Nacionais:** A existência de marcos legais e diretrizes federais estabelecidas oferece base sólida para desenvolvimento de ações estratégicas alinhadas com objetivos nacionais e compromissos internacionais.

- **Tecnologia e Inovação:** Avanços tecnológicos recentes, especialmente em áreas de monitoramento, análise de dados e comunicação, apresentam potencial significativo para modernização e aprimoramento de processos e metodologias.

- **Sinergias Programáticas:** O potencial de integração e sinergia com programas governamentais relacionados e em curso pode potencializar resultados e otimizar uso de recursos públicos disponíveis.

- **Fortalecimento Institucional:** Oportunidades de fortalecimento de capacidades institucionais através de parcerias estratégicas, programas de capacitação e modernização de estruturas organizacionais.

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
