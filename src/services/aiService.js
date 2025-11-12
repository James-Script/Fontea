// Serviço de IA para geração de briefings
// IMPORTANTE: Configure sua API Key da OpenAI no arquivo .env
// VITE_OPENAI_API_KEY=sua-chave-aqui

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export const generateBriefingWithAI = async (specifications) => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('API Key da OpenAI não configurada. Configure VITE_OPENAI_API_KEY no arquivo .env');
    }

    const prompt = `Você é um especialista em criação de briefings executivos para governo.

Com base nas seguintes especificações, crie um briefing executivo completo e profissional em formato Markdown:

Título: ${specifications.titulo || 'Briefing Executivo'}
Tema: ${specifications.tema || 'Geral'}
Prioridade: ${specifications.prioridade || 'Média'}
Especificações: ${specifications.especificacoes || 'Nenhuma especificação fornecida'}

O briefing deve incluir:
1. Um título claro e descritivo
2. Resumo Executivo (2-3 parágrafos)
3. Dados Principais (dados relevantes e estatísticas)
4. Análise Detalhada (análise aprofundada do tema)
5. Recomendações (recomendações acionáveis)
6. Conclusão (síntese final)

Formato: Use Markdown com títulos (#, ##, ###), listas (-), negrito (**texto**), etc.

Além disso, forneça uma lista de fontes rastreáveis que devem ser citadas no briefing. Cada fonte deve ter:
- Nome completo da fonte
- Data de acesso (use a data atual)
- URL (se aplicável)

Retorne APENAS um JSON válido no seguinte formato:
{
  "conteudo": "conteúdo do briefing em Markdown",
  "fontes": [
    {
      "nome": "Nome da Fonte",
      "url": "https://exemplo.com",
      "data_acesso": "06/11/2025"
    }
  ]
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // ou 'gpt-3.5-turbo' para economia
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente especializado em criar briefings executivos para órgãos governamentais. Sempre retorne JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro ao gerar briefing com IA');
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';

    // Tentar extrair JSON da resposta
    try {
      // Remover markdown code blocks se existirem
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
      const parsed = JSON.parse(jsonString.trim());
      
      return {
        success: true,
        conteudo: parsed.conteudo || aiResponse,
        fontes: parsed.fontes || []
      };
    } catch (parseError) {
      // Se não conseguir parsear, retorna o conteúdo direto
      return {
        success: true,
        conteudo: aiResponse,
        fontes: []
      };
    }
  } catch (error) {
    console.error('Erro ao gerar briefing com IA:', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar briefing com IA. Verifique sua conexão e configuração da API.'
    };
  }
};

// Função mock para desenvolvimento (quando não há API Key)
export const generateBriefingMock = async (specifications) => {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 2000));

  const mockConteudo = `# ${specifications.titulo || 'Briefing Executivo'}

## Resumo Executivo

Este briefing apresenta uma análise detalhada sobre ${specifications.tema || 'o tema especificado'}, com foco em ${specifications.prioridade || 'prioridade média'}.

${specifications.especificacoes ? `\n**Especificações fornecidas:**\n${specifications.especificacoes}\n` : ''}

## Dados Principais

- Dados relevantes serão apresentados aqui
- Estatísticas importantes
- Indicadores-chave

## Análise Detalhada

Análise aprofundada do tema, considerando as especificações fornecidas.

## Recomendações

1. Recomendação 1
2. Recomendação 2
3. Recomendação 3

## Conclusão

Síntese final e próximos passos.`;

  const mockFontes = [
    {
      nome: 'IBGE - Instituto Brasileiro de Geografia e Estatística',
      url: 'https://www.ibge.gov.br',
      data_acesso: new Date().toLocaleDateString('pt-BR')
    },
    {
      nome: 'INPE - Instituto Nacional de Pesquisas Espaciais',
      url: 'https://www.inpe.br',
      data_acesso: new Date().toLocaleDateString('pt-BR')
    }
  ];

  return {
    success: true,
    conteudo: mockConteudo,
    fontes: mockFontes
  };
};

