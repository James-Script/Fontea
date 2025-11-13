// Serviço de IA para geração de briefings
// IMPORTANTE: Configure sua API Key da OpenAI no arquivo .env
// VITE_OPENAI_API_KEY=sua-chave-aqui

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
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('API Key da OpenAI não configurada. Configure VITE_OPENAI_API_KEY no arquivo .env');
    }

    const temaNome = getTemaNome(specifications.tema);
    const prioridadeNome = getPrioridadeNome(specifications.prioridade);
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    const prompt = `Você é um especialista em criação de briefings executivos para governo e órgãos públicos brasileiros.

Com base nas seguintes especificações, crie um briefing executivo completo, profissional, formal e com informações concretas em formato Markdown:

**Título:** ${specifications.titulo || 'Briefing Executivo'}
**Tema:** ${temaNome}
**Prioridade:** ${prioridadeNome}
**Especificações do usuário:** ${specifications.especificacoes || 'Nenhuma especificação fornecida'}

**INSTRUÇÕES IMPORTANTES:**
1. O briefing deve ser FORMAL, PROFISSIONAL e conter INFORMAÇÕES CONCRETAS e DADOS REAIS
2. Use linguagem técnica apropriada para órgãos governamentais
3. Inclua estatísticas, dados quantitativos e informações verificáveis quando possível
4. Seja objetivo e direto
5. Use formato Markdown com títulos (#, ##, ###), listas (-, *), negrito (**texto**), etc.

**ESTRUTURA OBRIGATÓRIA DO BRIEFING:**
1. **Resumo Executivo** (2-3 parágrafos): Síntese do briefing
2. **Dados Principais** (seção com dados, estatísticas e números relevantes)
3. **Análise Detalhada** (análise aprofundada do tema com informações técnicas)
4. **Recomendações** (recomendações acionáveis e específicas)
5. **Conclusão** (síntese final e próximos passos)

**FONTES E REFERÊNCIAS:**
Forneça uma lista de fontes oficiais e confiáveis que podem ser usadas para validar as informações:
- Use fontes governamentais brasileiras (IBGE, INPE, CONAB, INMET, etc.)
- Use artigos acadêmicos e publicações científicas quando relevante
- Inclua URLs quando possível
- Formate cada fonte com nome, descrição e URL (se aplicável)

**FORMATO DE RETORNO:**
Retorne APENAS um JSON válido no seguinte formato (sem markdown, apenas JSON puro):
{
  "conteudo": "conteúdo completo do briefing em Markdown (incluindo título, seções e formatação)",
  "fontes": [
    {
      "nome": "Nome da Fonte ou Artigo",
      "descricao": "Descrição breve da fonte",
      "url": "https://exemplo.com (se aplicável)",
      "tipo": "governamental | academico | institucional"
    }
  ]
}

**IMPORTANTE:**
- Retorne APENAS o JSON, sem texto adicional antes ou depois
- O conteúdo deve estar em Markdown válido
- As fontes devem ser reais e verificáveis
- Use informações concretas e dados específicos
- Seja preciso e profissional`;

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
      throw new Error(errorData.error?.message || `Erro na API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('Resposta vazia da API');
    }

    // Tentar extrair JSON da resposta
    let jsonData;
    try {
      // Remover possíveis markdown code blocks
      const cleanedMessage = assistantMessage.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      jsonData = JSON.parse(cleanedMessage);
    } catch (parseError) {
      // Se não conseguir fazer parse, criar estrutura padrão
      console.warn('Erro ao fazer parse do JSON da IA:', parseError);
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

    return {
      success: true,
      conteudo: jsonData.conteudo || assistantMessage,
      fontes: jsonData.fontes || []
    };
  } catch (error) {
    console.error('Erro ao gerar briefing com IA:', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar briefing com IA'
    };
  }
};

// Função para simular geração de briefing (para desenvolvimento sem API key)
export const generateBriefingMock = async (specifications) => {
  // Simular delay da API
  await new Promise(resolve => setTimeout(resolve, 1500));

  const temaNome = getTemaNome(specifications.tema);
  const prioridadeNome = getPrioridadeNome(specifications.prioridade);
  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const especificacoes = specifications.especificacoes || 'Nenhuma especificação fornecida';
  
  // Gerar título baseado nas especificações se não fornecido
  let titulo = specifications.titulo || 'Briefing Executivo';
  if (titulo === 'Briefing Executivo' && especificacoes !== 'Nenhuma especificação fornecida') {
    // Tentar extrair um título das especificações (primeiras palavras)
    const palavras = especificacoes.split(' ').slice(0, 6).join(' ');
    titulo = palavras.length > 50 ? palavras.substring(0, 50) + '...' : palavras;
  }

  // Conteúdo mock mais completo baseado nas especificações
  const conteudo = `# ${titulo}

## Resumo Executivo

Este briefing apresenta uma análise detalhada sobre **${temaNome}**, desenvolvido com base nas especificações: "${especificacoes}".

A análise foi estruturada considerando aspectos técnicos, dados quantitativos e recomendações acionáveis para tomada de decisão estratégica. O documento segue padrões de comunicação executiva, apresentando informações de forma clara, objetiva e fundamentada.

## Dados Principais

### Informações Gerais
- **Período de análise:** ${dataAtual}
- **Tema:** ${temaNome}
- **Prioridade:** ${prioridadeNome}
- **Área de foco:** ${especificacoes.split('.')[0] || temaNome}

### Dados Quantitativos
- Análise baseada em dados oficiais e fontes confiáveis
- Consideração de tendências e padrões identificados
- Avaliação de impactos e implicações

## Análise Detalhada

### Contexto e Situação Atual

Com base nas especificações fornecidas, identificam-se os seguintes aspectos relevantes:

1. **Contexto:** ${especificacoes.substring(0, 100)}...
2. **Situação Atual:** Análise em andamento considerando variáveis específicas do tema
3. **Desafios Identificados:** Requer levantamento de dados complementares

### Aspectos Técnicos

- **Metodologia:** Análise qualitativa e quantitativa
- **Fontes de Dados:** Instituições oficiais e publicações especializadas
- **Abordagem:** Análise sistemática e fundamentada

### Impactos e Implicações

- Impactos potenciais identificados conforme especificações
- Implicações para tomada de decisão
- Necessidade de monitoramento contínuo

## Recomendações

1. **Coleta de Dados Complementares**
   - Realizar levantamento de dados atualizados
   - Validar informações com fontes oficiais
   - Consultar especialistas no tema

2. **Análise Aprofundada**
   - Desenvolver análise mais detalhada considerando as especificações
   - Identificar tendências e padrões
   - Avaliar impactos e implicações

3. **Plano de Ação**
   - Desenvolver plano de ação específico
   - Estabelecer metas e objetivos
   - Definir responsabilidades e prazos

4. **Monitoramento Contínuo**
   - Estabelecer sistema de monitoramento
   - Definir indicadores de acompanhamento
   - Realizar avaliações periódicas

## Conclusão

Este briefing foi gerado com base nas especificações fornecidas sobre ${temaNome}. Recomenda-se a consulta a fontes oficiais, especialistas no tema e dados atualizados para garantir precisão e relevância das informações apresentadas.

As recomendações apresentadas devem ser consideradas no contexto específico da situação analisada, e podem requerer ajustes conforme informações adicionais sejam coletadas.

**Próximos Passos:**
- Revisar e validar informações apresentadas
- Complementar com dados específicos quando necessário
- Aplicar recomendações conforme contexto`;

  // Fontes baseadas no tema
  const fontesPorTema = {
    defesa_civil: [
      { nome: 'CEMADEN - Centro Nacional de Monitoramento e Alertas de Desastres Naturais', descricao: 'Monitoramento de desastres naturais', url: 'https://www.cemaden.gov.br', tipo: 'governamental' },
      { nome: 'INMET - Instituto Nacional de Meteorologia', descricao: 'Dados meteorológicos e climáticos', url: 'https://www.inmet.gov.br', tipo: 'governamental' },
      { nome: 'IBGE - Instituto Brasileiro de Geografia e Estatística', descricao: 'Dados estatísticos e geográficos', url: 'https://www.ibge.gov.br', tipo: 'governamental' }
    ],
    agricultura: [
      { nome: 'IBGE - Instituto Brasileiro de Geografia e Estatística', descricao: 'Dados estatísticos agrícolas', url: 'https://www.ibge.gov.br', tipo: 'governamental' },
      { nome: 'CONAB - Companhia Nacional de Abastecimento', descricao: 'Dados de safra e produção agrícola', url: 'https://www.conab.gov.br', tipo: 'governamental' },
      { nome: 'EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária', descricao: 'Pesquisas e estudos agrícolas', url: 'https://www.embrapa.br', tipo: 'institucional' }
    ],
    monitoramento: [
      { nome: 'INPE - Instituto Nacional de Pesquisas Espaciais', descricao: 'Dados de satélite e monitoramento', url: 'https://www.inpe.br', tipo: 'governamental' },
      { nome: 'MMA - Ministério do Meio Ambiente', descricao: 'Políticas e dados ambientais', url: 'https://www.gov.br/mma', tipo: 'governamental' },
      { nome: 'IBAMA - Instituto Brasileiro do Meio Ambiente', descricao: 'Fiscalização e monitoramento ambiental', url: 'https://www.ibama.gov.br', tipo: 'governamental' }
    ],
    fiscalizacao: [
      { nome: 'IBAMA - Instituto Brasileiro do Meio Ambiente', descricao: 'Fiscalização ambiental', url: 'https://www.ibama.gov.br', tipo: 'governamental' },
      { nome: 'ICMBio - Instituto Chico Mendes', descricao: 'Conservação da biodiversidade', url: 'https://www.icmbio.gov.br', tipo: 'governamental' },
      { nome: 'MMA - Ministério do Meio Ambiente', descricao: 'Políticas ambientais', url: 'https://www.gov.br/mma', tipo: 'governamental' }
    ],
    relacoes: [
      { nome: 'MRE - Ministério das Relações Exteriores', descricao: 'Política externa brasileira', url: 'https://www.gov.br/mre', tipo: 'governamental' },
      { nome: 'IPEA - Instituto de Pesquisa Econômica Aplicada', descricao: 'Pesquisas e estudos econômicos', url: 'https://www.ipea.gov.br', tipo: 'institucional' },
      { nome: 'IBGE - Instituto Brasileiro de Geografia e Estatística', descricao: 'Dados estatísticos', url: 'https://www.ibge.gov.br', tipo: 'governamental' }
    ]
  };

  const fontes = fontesPorTema[specifications.tema] || [
    {
      nome: 'IBGE - Instituto Brasileiro de Geografia e Estatística',
      descricao: 'Dados estatísticos e informações geográficas',
      url: 'https://www.ibge.gov.br',
      tipo: 'governamental'
    },
    {
      nome: 'INPE - Instituto Nacional de Pesquisas Espaciais',
      descricao: 'Dados de satélite e monitoramento ambiental',
      url: 'https://www.inpe.br',
      tipo: 'governamental'
    }
  ];

  return {
    success: true,
    conteudo,
    fontes
  };
};
