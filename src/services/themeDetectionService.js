import { createLogger } from '../utils/logger'

const logger = createLogger('ThemeDetectionService')

// Dicionário de palavras-chave por tema
const THEME_KEYWORDS = {
  defesa_civil: {
    palavras: ['defesa', 'civil', 'desastre', 'emergência', 'calamidade', 'enchente', 'deslizamento', 'terremoto', 'tempestade', 'evacuação', 'risco', 'proteção', 'civil', 'desastres naturais', 'prevenção de desastres', 'proteção civil', 'alerta', 'sirene', 'abrigo', 'resgate'],
    organizacoes: ['CENAD', 'Proteção Civil', 'Bombeiros', 'INPE', 'Defesa Civil']
  },
  agricultura: {
    palavras: ['agricultura', 'plantio', 'colheita', 'safra', 'cultivo', 'culturas', 'agrícola', 'produtor', 'lavoura', 'produção agrícola', 'clima agrícola', 'produtividade', 'plantação', 'grãos', 'trigo', 'milho', 'soja', 'café', 'cana', 'cana-de-açúcar', 'feijão', 'arroz', 'algodão', 'frutas', 'verduras', 'hortaliça', 'agricultura familiar', 'agronegócio', 'rural', 'agricultor', 'fazenda', 'propriedade rural', 'mecanização agrícola', 'fertilizante', 'irrigação', 'produção sustentável', 'agropecuária', 'pecuária', 'gado', 'bovino', 'suíno', 'frango', 'avicultura', 'zootecnia', 'reforma agrária', 'assentamento', 'agrotóxico', 'praguicida', 'produção orgânica', 'agroecologia', 'quotas de produção', 'políticas agrícolas'],
    organizacoes: ['CONAB', 'MAPA', 'Embrapa', 'IBGE', 'Ministério da Agricultura', 'Secretaria da Agricultura', 'SENAR', 'CNA', 'ABAG']
  },
  monitoramento: {
    palavras: ['costeiro', 'marinho', 'oceano', 'praia', 'costa', 'litoral', 'nível do mar', 'erosão costeira', 'monitoramento marinho', 'zona costeira', 'recursos marinhos', 'ecossistema costeiro', 'água', 'aquático', 'fluvial', 'hídrico', 'hidroeléctrico', 'barragem'],
    organizacoes: ['INPE', 'IBAMA', 'Marinha', 'ANA', 'INMET']
  },
  fiscalizacao: {
    palavras: ['ambiental', 'fiscalização', 'meio ambiente', 'degradação', 'desmatamento', 'poluição', 'conservação', 'proteção ambiental', 'sustentabilidade', 'fauna', 'flora', 'preservação', 'biodiversidade', 'floresta', 'cerrado', 'mata atlântica', 'amazônia', 'pantanal', 'caatinga'],
    organizacoes: ['IBAMA', 'ICMBio', 'CONAMA', 'MP', 'Ministério do Meio Ambiente']
  },
  relacoes: {
    palavras: ['internacional', 'diplomacia', 'relações', 'tratado', 'acordo', 'cooperação', 'comércio exterior', 'negociações', 'embaixada', 'consulado', 'soberania', 'geopolítica', 'MERCOSUL', 'países', 'exportação', 'importação', 'tarifa', 'sanção'],
    organizacoes: ['Itamaraty', 'MERCOSUL', 'ONU', 'ALBA', 'Ministério das Relações Exteriores']
  }
}

// Sistema de cores com significado
export const PRIORITY_COLORS = {
  alta: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
    dot: 'bg-red-600',
    description: 'Vermelho: Prioridade Alta - Ação imediata necessária'
  },
  media: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800',
    dot: 'bg-yellow-600',
    description: 'Amarelo: Prioridade Média - Atenção necessária em breve'
  },
  baixa: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800',
    dot: 'bg-green-600',
    description: 'Verde: Prioridade Baixa - Monitoramento contínuo'
  }
}

// Descrição completa de cores
export const COLOR_MEANINGS = {
  red: {
    label: '🔴 Vermelho',
    meaning: 'Prioridade Alta - Ação imediata necessária',
    context: 'Situações críticas, emergências, problemas urgentes'
  },
  yellow: {
    label: '🟡 Amarelo',
    meaning: 'Prioridade Média - Atenção necessária em breve',
    context: 'Situações que requerem acompanhamento, tendências negativas'
  },
  green: {
    label: '🟢 Verde',
    meaning: 'Prioridade Baixa - Monitoramento contínuo',
    context: 'Situações estáveis, informações de rotina, boas práticas'
  }
}

/**
 * Detecta o tema baseado no conteúdo/especificações fornecidas
 * @param {string} conteudo - Especificações ou conteúdo para análise
 * @returns {object} - { tema: string, confianca: number, palavrasDetectadas: array }
 */
export const detectTheme = (conteudo) => {
  logger.debug('Analisando conteúdo para detecção de tema', { tamanhoConteudo: (conteudo || '').length });

  if (!conteudo || conteudo.trim().length === 0) {
    logger.warn('Conteúdo vazio para detecção de tema');
    // Se vazio, retornar sem tema padrão (deixar o usuário escolher)
    return { tema: null, confianca: 0, palavrasDetectadas: [] };
  }

  // Normalizar: lower case e remover acentos para comparação mais robusta
  const removeAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const textoNormalizado = removeAccents(conteudo.toLowerCase());
  const palavras = textoNormalizado.split(/\s+/);
  
  let pontosPoTema = {};
  let palavrasDetectadas = [];

  // Inicializar pontos para cada tema
  Object.keys(THEME_KEYWORDS).forEach(tema => {
    pontosPoTema[tema] = 0;
  });

  // Analisar cada palavra-chave
  for (const [tema, dados] of Object.entries(THEME_KEYWORDS)) {
    for (const palavraChave of dados.palavras) {
      // Normalizar palavra-chave
      const chaveNormalizada = removeAccents(palavraChave.toLowerCase());
      // Usar includes em vez de \b para pegar palavras compostas e pequenas variações
      const ocorrencias = textoNormalizado.split(chaveNormalizada).length - 1;
      if (ocorrencias > 0) {
        pontosPoTema[tema] += ocorrencias * 2; // Peso 2 para palavras-chave
        palavrasDetectadas.push({ palavra: palavraChave, tema, ocorrencias });
      }
    }

    // Analisar palavras de organizações (peso maior)
    for (const organizacao of dados.organizacoes) {
      const orgNormalizada = removeAccents(organizacao.toLowerCase());
      const ocorrencias = textoNormalizado.split(orgNormalizada).length - 1;
      if (ocorrencias > 0) {
        pontosPoTema[tema] += ocorrencias * 4; // Peso 4 para organizações
        palavrasDetectadas.push({ palavra: organizacao, tema, ocorrencias, tipo: 'organizacao' });
      }
    }
  }

  // Encontrar tema com maior pontuação
  let temaMaiorPontuacao = null;
  let maiorPontuacao = 0;

  for (const [tema, pontos] of Object.entries(pontosPoTema)) {
    if (pontos > maiorPontuacao) {
      maiorPontuacao = pontos;
      temaMaiorPontuacao = tema;
    }
  }

  // Calcular confiança (0-100)
  // Se não houver pontos, confiança = 0 (tema não detectado)
  const confianca = maiorPontuacao === 0 ? 0 : Math.min(100, Math.round((maiorPontuacao / (Math.max(...Object.values(pontosPoTema)) || 1)) * 100));

  // Se nenhum tema obteve pontos, tentar heurística simples: identificar palavras-chave compostas ou substantivos relevantes
  if (maiorPontuacao === 0) {
    // Procurar substantivos/termos curtos que possam indicar infraestrutura, saúde, transporte, etc.
    const fallbackTerms = [
      { tema: 'monitoramento', terms: ['estrada', 'paviment', 'avenida', 'rodovia', 'ponte', 'obras', 'infraestrutur'] },
      { tema: 'agricultura', terms: ['safra', 'plantio', 'colheita', 'conab', 'mapa', 'agrícola'] },
      { tema: 'defesa_civil', terms: ['enchent', 'desliz', 'desastre', 'emergenc', 'inunda'] },
      { tema: 'fiscalizacao', terms: ['desmat', 'ibama', 'fiscal', 'licenciament', 'queimad'] },
      { tema: 'relacoes', terms: ['diploma', 'export', 'acordo', 'mundo', 'internacion'] }
    ];

    for (const item of fallbackTerms) {
      for (const t of item.terms) {
        if (textoNormalizado.includes(t)) {
          temaMaiorPontuacao = item.tema;
          maiorPontuacao = 1;
          palavrasDetectadas.push({ palavra: t, tema: item.tema, ocorrencias: 1, heuristic: true });
          break;
        }
      }
      if (temaMaiorPontuacao) break;
    }
  }

  logger.debug('Tema detectado com sucesso', { 
    tema: temaMaiorPontuacao, 
    confianca,
    palavrasDetectadas: palavrasDetectadas.length,
    pontosPorTema: pontosPoTema
  });

  return {
    tema: temaMaiorPontuacao,
    confianca,
    palavrasDetectadas: palavrasDetectadas.slice(0, 10) // Retornar top 10
  };
};

/**
 * Obtém o nome formatado do tema
 * @param {string} tema - ID do tema
 * @returns {string} - Nome formatado
 */
export const getThemeName = (tema) => {
  const nomes = {
    defesa_civil: 'Defesa Civil',
    agricultura: 'Agricultura',
    monitoramento: 'Monitoramento Costeiro',
    fiscalizacao: 'Fiscalização Ambiental',
    relacoes: 'Relações Internacionais'
  };
  return nomes[tema] || tema;
};

/**
 * Obtém as cores e estilo para uma prioridade
 * @param {string} prioridade - baixa, media, alta
 * @returns {object} - Cores e estilos
 */
export const getPriorityColors = (prioridade) => {
  return PRIORITY_COLORS[prioridade] || PRIORITY_COLORS.media;
};

/**
 * Obtém o significado de uma cor no contexto do sistema
 * @returns {object} - Dicionário com significados
 */
export const getColorMeanings = () => {
  return COLOR_MEANINGS;
};

/**
 * Formata um badge de tema
 * @param {string} tema - ID do tema
 * @returns {object} - Dados do badge
 */
export const getThemeBadge = (tema) => {
  const cores = {
    defesa_civil: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🛡️' },
    agricultura: { bg: 'bg-amber-100', text: 'text-amber-800', icon: '🌾' },
    monitoramento: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🌊' },
    fiscalizacao: { bg: 'bg-green-100', text: 'text-green-800', icon: '🔍' },
    relacoes: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '🌍' }
  };
  
  return cores[tema] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📋' };
};

export default {
  detectTheme,
  getThemeName,
  getPriorityColors,
  getColorMeanings,
  getThemeBadge,
  PRIORITY_COLORS,
  COLOR_MEANINGS,
  THEME_KEYWORDS
}
