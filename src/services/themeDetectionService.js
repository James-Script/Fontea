import { createLogger } from '../utils/logger'

const logger = createLogger('ThemeDetectionService')

// Dicionário de palavras-chave por tema - EXPANDIDO COM MUITOS MAIS TEMAS
const THEME_KEYWORDS = {
  defesa_civil: {
    palavras: ['defesa', 'civil', 'desastre', 'emergência', 'calamidade', 'enchente', 'deslizamento', 'terremoto', 'tempestade', 'evacuação', 'risco', 'proteção', 'civil', 'desastres naturais', 'prevenção de desastres', 'proteção civil', 'alerta', 'sirene', 'abrigo', 'resgate', 'chuva', 'chuvas', 'precipitação', 'precipitacao', 'alagamento', 'inundação', 'inundacao', 'temporal', 'vendaval', 'rajada', 'granizo', 'granizos', 'seca', 'estiagem', 'estresse hídrico', 'escassez', 'racionamento', 'monitoramento climático', 'monitoramento climatico', 'previsão do tempo', 'previsao do tempo', 'clima', 'meteorologia', 'fenômeno', 'fenomeno', 'extremo', 'evento extremo', 'catástrofe', 'catastrofe', 'situação de chuva', 'situacao de chuva', 'chuva em', 'condições climáticas', 'condicoes climaticas'],
    organizacoes: ['CENAD', 'Proteção Civil', 'Bombeiros', 'INPE', 'Defesa Civil', 'INMET', 'CEMADEN', 'CPTEC', 'Monitoramento']
  },
  agricultura: {
    palavras: ['agricultura', 'plantio', 'colheita', 'safra', 'cultivo', 'culturas', 'agrícola', 'produtor', 'lavoura', 'produção agrícola', 'clima agrícola', 'produtividade', 'plantação', 'grãos', 'trigo', 'milho', 'soja', 'café', 'cana', 'cana-de-açúcar', 'feijão', 'arroz', 'algodão', 'frutas', 'verduras', 'hortaliça', 'agricultura familiar', 'agronegócio', 'rural', 'agricultor', 'fazenda', 'propriedade rural', 'mecanização agrícola', 'fertilizante', 'irrigação', 'produção sustentável', 'agropecuária', 'pecuária', 'gado', 'bovino', 'suíno', 'frango', 'avicultura', 'zootecnia', 'reforma agrária', 'assentamento', 'agrotóxico', 'praguicida', 'produção orgânica', 'agroecologia', 'quotas de produção', 'políticas agrícolas', 'solos', 'solo agrícola', 'fertilidade', 'degradação do solo'],
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
  },
  seguranca_publica: {
    palavras: ['segurança', 'pública', 'policiamento', 'criminalidade', 'violência', 'crime', 'delito', 'assalto', 'homicídio', 'homicidio', 'roubo', 'tráfico', 'trafico', 'drogas', 'drogas ilícitas', 'drogas ilicitas', 'terrorismo', 'segurança urbana', 'policia', 'polícia', 'guarda', 'vigilância', 'vigilancia', 'patrulhamento', 'segurança no centro', 'violência urbana', 'segurança comunitária', 'seguranca comunitária'],
    organizacoes: ['Polícia Civil', 'Polícia Militar', 'Força Nacional', 'PRF', 'SENASP', 'Ministério da Justiça', 'Secretaria de Segurança Pública']
  },
  infraestrutura: {
    palavras: ['infraestrutura', 'infra-estrutura', 'estrada', 'rodovia', 'pavimentação', 'pavimentacao', 'ponte', 'viaduto', 'túnel', 'tunel', 'obras públicas', 'obras publicas', 'construção', 'construcao', 'transporte', 'mobilidade', 'trânsito', 'transito', 'viário', 'viario', 'logística', 'logistica', 'rodoviário', 'rodoviario', 'ferrovia', 'aeroporto', 'porto', 'hidrovia'],
    organizacoes: ['DNIT', 'ANTT', 'Ministério da Infraestrutura', 'DER', 'CONDER']
  },
  saude: {
    palavras: ['saúde', 'saude', 'hospital', 'unidade básica', 'unidade basica', 'ubs', 'epidemia', 'pandemia', 'vacinação', 'vacinacao', 'doença', 'doenca', 'tratamento', 'medicamento', 'farmacêutico', 'farmaceutico', 'epidemiologia', 'vigilância sanitária', 'vigilancia sanitaria', 'surto', 'endemia', 'campanha de saúde', 'campanha de saude'],
    organizacoes: ['SUS', 'Ministério da Saúde', 'Fiocruz', 'ANVISA', 'Secretaria de Saúde', 'OPAS', 'OMS']
  },
  educacao: {
    palavras: ['educação', 'educacao', 'escola', 'ensino', 'alfabetização', 'alfabetizacao', 'universidade', 'faculdade', 'professor', 'aluno', 'estudante', 'ensino fundamental', 'ensino médio', 'ensino medio', 'ensino superior', 'pedagogia', 'literacia', 'letramento', 'merenda escolar', 'transporte escolar'],
    organizacoes: ['MEC', 'INEP', 'CAPES', 'FNDE', 'Secretaria de Educação', 'CONSED']
  },
  habitacao: {
    palavras: ['habitação', 'habitacao', 'moradia', 'casa', 'residência', 'residencia', 'morar', 'habitação social', 'habitacao social', 'minha casa minha vida', 'desocupação', 'desocupacao', 'despejo', 'favelização', 'favelizacao', 'precariedade habitacional', 'déficit habitacional', 'deficit habitacional'],
    organizacoes: ['Ministério das Cidades', 'Caixa Econômica Federal', 'Secretaria de Habitação', 'Programa Minha Casa Minha Vida']
  },
  assistencia_social: {
    palavras: ['assistência social', 'assistencia social', 'bolsa família', 'bolsa familia', 'cadastro único', 'cadastro unico', 'benefício', 'beneficio', 'programa social', 'transferência de renda', 'transferencia de renda', 'pobreza', 'extrema pobreza', 'vulnerabilidade', 'proteção social', 'protecao social', 'CRAS', 'CREAS'],
    organizacoes: ['MDS', 'Ministério da Cidadania', 'Secretaria de Assistência Social', 'INSS']
  },
  trabalho_emprego: {
    palavras: ['trabalho', 'emprego', 'desemprego', 'desempregado', 'ocupação', 'ocupacao', 'empreendedorismo', 'qualificação profissional', 'qualificacao profissional', 'sindicato', 'trabalhador', 'CLT', 'carteira de trabalho', 'vaga', 'recrutamento', 'RH', 'recursos humanos'],
    organizacoes: ['MTE', 'Ministério do Trabalho', 'CAGED', 'RAIS', 'SEBRAE', 'SINE']
  },
  economia_financeiro: {
    palavras: ['economia', 'financeiro', 'orçamento', 'orcamento', 'receita', 'despesa', 'investimento', 'PIB', 'inflação', 'inflacao', 'juros', 'taxa de juros', 'crédito', 'credito', 'banco', 'financiamento', 'dívida', 'divida', 'déficit', 'deficit', 'superávit', 'superavit', 'tributo', 'imposto', 'taxa', 'tarifa'],
    organizacoes: ['BACEN', 'Banco Central', 'Ministério da Economia', 'Receita Federal', 'COAF']
  },
  energia: {
    palavras: ['energia', 'elétrica', 'eletrica', 'eletricidade', 'usina', 'hidrelétrica', 'hidreletrica', 'termoelétrica', 'termoeletrica', 'eólica', 'eolica', 'solar', 'energia renovável', 'energia renovavel', 'transmissão', 'transmissao', 'distribuição', 'distribuicao', 'apagão', 'apagao', 'tarifa de energia', 'bandeira tarifária', 'bandeira tarifaria'],
    organizacoes: ['ANEEL', 'EPE', 'ONS', 'Ministério de Minas e Energia', 'CHESF', 'ELETROBRAS']
  },
  comunicacao_midia: {
    palavras: ['comunicação', 'comunicacao', 'mídia', 'midia', 'imprensa', 'jornalismo', 'rádio', 'radio', 'televisão', 'televisao', 'TV', 'jornal', 'notícia', 'noticia', 'informação', 'informacao', 'fake news', 'desinformação', 'desinformacao', 'redes sociais', 'mídia social', 'midia social'],
    organizacoes: ['EBC', 'Ministério das Comunicações', 'ANATEL', 'ABERT']
  },
  tecnologia_inovacao: {
    palavras: ['tecnologia', 'inovação', 'inovacao', 'ciência', 'ciencia', 'pesquisa', 'desenvolvimento', 'P&D', 'cibernética', 'cibernetica', 'ciber segurança', 'ciber seguranca', 'dados', 'big data', 'inteligência artificial', 'inteligencia artificial', 'IA', 'internet', 'banda larga', 'conectividade', 'digitalização', 'digitalizacao', 'transformação digital', 'transformacao digital'],
    organizacoes: ['MCTI', 'Ministério da Ciência e Tecnologia', 'CNPq', 'FINEP', 'CGI.br']
  },
  turismo: {
    palavras: ['turismo', 'turista', 'hotel', 'hospedagem', 'pousada', 'atrativo', 'destino', 'viagem', 'viagem de lazer', 'hospitalidade', 'setor turístico', 'setor turistico', 'economia do turismo', 'patrimônio histórico', 'patrimonio historico', 'cultura'],
    organizacoes: ['Ministério do Turismo', 'EMBRATUR', 'Secretaria de Turismo', 'CONDETUR']
  },
  esporte_lazer: {
    palavras: ['esporte', 'esportes', 'atleta', 'competição', 'competicao', 'olimpíadas', 'olimpiadas', 'campeonato', 'futebol', 'vôlei', 'volei', 'basquete', 'natação', 'natacao', 'lazer', 'recreação', 'recreacao', 'equipamento esportivo'],
    organizacoes: ['Ministério do Esporte', 'COB', 'CBF', 'Secretaria de Esporte']
  },
  cultura: {
    palavras: ['cultura', 'cultural', 'arte', 'artístico', 'artistico', 'museu', 'biblioteca', 'teatro', 'cinema', 'música', 'musica', 'dança', 'danca', 'literatura', 'patrimônio', 'patrimonio', 'folclore', 'tradição', 'tradicao', 'identidade cultural'],
    organizacoes: ['MinC', 'Ministério da Cultura', 'IPHAN', 'FUNARTE', 'Biblioteca Nacional']
  },
  desenvolvimento_social: {
    palavras: ['desenvolvimento social', 'política social', 'politica social', 'inclusão', 'inclusao', 'exclusão', 'exclusao', 'equidade', 'justiça social', 'justica social', 'desigualdade', 'vulnerabilidade social', 'população vulnerável', 'populacao vulneravel'],
    organizacoes: ['MDS', 'Ministério da Cidadania', 'IPEA']
  },
  cidades_urbanismo: {
    palavras: ['cidade', 'urbano', 'urbanização', 'urbanizacao', 'urbanismo', 'planejamento urbano', 'plano diretor', 'zona urbana', 'periferia', 'centro', 'bairro', 'bairros', 'espaço público', 'espaco publico', 'mobilidade urbana', 'transporte público', 'transporte publico', 'saneamento', 'drenagem', 'calçada', 'calcada', 'iluminação pública', 'iluminacao publica'],
    organizacoes: ['Ministério das Cidades', 'ABNT', 'Secretaria de Urbanismo']
  },
  saneamento: {
    palavras: ['saneamento', 'água', 'agua', 'esgoto', 'tratamento de água', 'tratamento de agua', 'tratamento de esgoto', 'abastecimento', 'coleta de lixo', 'coleta seletiva', 'resíduos sólidos', 'residuos solidos', 'aterro', 'reciclagem', 'drenagem', 'drenagem urbana'],
    organizacoes: ['ANA', 'Ministério das Cidades', 'SANEAMENTO', 'SABESP', 'Companhias de Saneamento']
  },
  transporte_mobilidade: {
    palavras: ['transporte', 'mobilidade', 'transporte público', 'transporte publico', 'ônibus', 'onibus', 'metrô', 'metro', 'trem', 'bicicleta', 'ciclovia', 'pedestre', 'calçada', 'calcada', 'trânsito', 'transito', 'congestionamento', 'tarifa de transporte', 'vale transporte', 'tarifa zero'],
    organizacoes: ['ANTT', 'Ministério das Cidades', 'Secretaria de Mobilidade', 'CET']
  },
  meio_ambiente_clima: {
    palavras: ['meio ambiente', 'clima', 'mudanças climáticas', 'mudancas climaticas', 'aquecimento global', 'poluição', 'poluicao', 'qualidade do ar', 'emissão de carbono', 'emissao de carbono', 'carbono zero', 'sustentabilidade', 'preservação', 'preservacao', 'conservação', 'conservacao'],
    organizacoes: ['Ministério do Meio Ambiente', 'MMA', 'IBAMA', 'ICMBio']
  },
  recursos_hidricos: {
    palavras: ['recursos hídricos', 'recursos hidricos', 'água', 'agua', 'hidrografia', 'bacia hidrográfica', 'bacia hidrografica', 'reservatório', 'reservatorio', 'barragem', 'represa', 'aquífero', 'aquifero', 'abastecimento de água', 'abastecimento de agua', 'gestão de água', 'gestao de agua'],
    organizacoes: ['ANA', 'Ministério do Meio Ambiente', 'CBHs', 'Comitês de Bacia']
  },
  mineracao: {
    palavras: ['mineração', 'mineracao', 'minério', 'minerio', 'mineração de ouro', 'mineracao de ouro', 'garimpo', 'lavra', 'jazida', 'extrativismo', 'mineração ilegal', 'mineracao ilegal'],
    organizacoes: ['ANM', 'DNPM', 'Ministério de Minas e Energia']
  },
  desenvolvimento_regional: {
    palavras: ['desenvolvimento regional', 'região', 'regiao', 'regional', 'desenvolvimento econômico regional', 'desenvolvimento economico regional', 'polos de desenvolvimento', 'arranjos produtivos locais', 'APL'],
    organizacoes: ['SUDENE', 'SUDAM', 'Ministério da Integração', 'SEBRAE']
  },
  ciencia_pesquisa: {
    palavras: ['ciência', 'ciencia', 'pesquisa', 'pesquisador', 'pesquisadora', 'científico', 'cientifico', 'universidade', 'laboratório', 'laboratorio', 'inovação', 'inovacao', 'descoberta', 'publicação científica', 'publicacao cientifica'],
    organizacoes: ['MCTI', 'CNPq', 'CAPES', 'FAPs', 'FINEP']
  },
  populacao_indigena: {
    palavras: ['indígena', 'indigena', 'povos indígenas', 'povos indigenas', 'terra indígena', 'terra indigena', 'FUNAI', 'aldeia', 'reserva indígena', 'reserva indigena'],
    organizacoes: ['FUNAI', 'Ministério da Justiça']
  },
  igualdade_genero: {
    palavras: ['gênero', 'genero', 'mulher', 'mulheres', 'feminismo', 'igualdade de gênero', 'igualdade de genero', 'violência contra a mulher', 'violencia contra a mulher', 'Maria da Penha', 'Ligue 180'],
    organizacoes: ['Ministério das Mulheres', 'Secretaria de Políticas para Mulheres']
  },
  racismo_igualdade_racial: {
    palavras: ['racismo', 'negro', 'negra', 'afro-brasileiro', 'afro brasileiro', 'quilombola', 'igualdade racial', 'cotas', 'cota racial', 'discriminação racial', 'discriminacao racial'],
    organizacoes: ['SEPPIR', 'Ministério da Igualdade Racial', 'FCP']
  },
  direito_humanos: {
    palavras: ['direitos humanos', 'violação de direitos', 'violacao de direitos', 'direitos fundamentais', 'cidadania', 'garantias constitucionais'],
    organizacoes: ['Ministério dos Direitos Humanos', 'CONADE']
  },
  planejamento_gestao: {
    palavras: ['planejamento', 'gestão', 'gestao', 'administração pública', 'administracao publica', 'governança', 'governanca', 'políticas públicas', 'politicas publicas', 'PPA', 'LDO', 'LOA', 'orçamento', 'orcamento'],
    organizacoes: ['Ministério do Planejamento', 'SEPLAN', 'IPEA']
  },
  transparencia_controle: {
    palavras: ['transparência', 'transparencia', 'controle', 'auditoria', 'fiscalização', 'fiscalizacao', 'licitações', 'licitacoes', 'corrupção', 'corrupcao', 'lavagem de dinheiro', 'integridade', 'compliance'],
    organizacoes: ['CGU', 'TCU', 'MPF', 'PF', 'COAF']
  },
  trabalho_infantil: {
    palavras: ['trabalho infantil', 'exploração infantil', 'exploracao infantil', 'trabalho de menores', 'proteção da criança', 'protecao da crianca', 'ECA'],
    organizacoes: ['Ministério da Cidadania', 'FNPETI']
  },
  terceira_idade: {
    palavras: ['idoso', 'idosos', 'terceira idade', 'envelhecimento', 'aposentadoria', 'aposentado', 'aposentada', 'melhor idade'],
    organizacoes: ['Ministério da Cidadania', 'Secretaria de Direitos da Pessoa Idosa']
  },
  pessoas_deficiencia: {
    palavras: ['pessoa com deficiência', 'pessoa com deficiencia', 'PcD', 'deficiência', 'deficiencia', 'acessibilidade', 'inclusão de pessoas com deficiência', 'inclusao de pessoas com deficiencia'],
    organizacoes: ['Secretaria de Direitos da Pessoa com Deficiência']
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
      { tema: 'defesa_civil', terms: ['enchent', 'desliz', 'desastre', 'emergenc', 'inunda', 'chuva', 'precipit', 'temporal', 'alagament', 'meteorolog', 'climat', 'tempo', 'tempestade'] },
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
  if (!tema) return 'Tema Não Definido';
  
  const nomes = {
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
    pessoas_deficiencia: 'Pessoas com Deficiência',
    nao_definido: 'Tema Não Definido'
  };
  
  // Se já está mapeado, retornar
  if (nomes[tema]) return nomes[tema];
  
  // Se não está mapeado, formatar o nome do tema de forma amigável
  // Converter de formato snake_case para título formatado
  return tema
    .split('_')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
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
    relacoes: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '🌍' },
    seguranca_publica: { bg: 'bg-red-100', text: 'text-red-800', icon: '🚨' },
    infraestrutura: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '🏗️' },
    saude: { bg: 'bg-pink-100', text: 'text-pink-800', icon: '⚕️' },
    educacao: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '📚' },
    habitacao: { bg: 'bg-orange-100', text: 'text-orange-800', icon: '🏠' },
    assistencia_social: { bg: 'bg-teal-100', text: 'text-teal-800', icon: '🤝' },
    trabalho_emprego: { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: '💼' },
    economia_financeiro: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '💰' },
    energia: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚡' },
    comunicacao_midia: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '📺' },
    tecnologia_inovacao: { bg: 'bg-slate-100', text: 'text-slate-800', icon: '💻' },
    turismo: { bg: 'bg-sky-100', text: 'text-sky-800', icon: '✈️' },
    esporte_lazer: { bg: 'bg-lime-100', text: 'text-lime-800', icon: '⚽' },
    cultura: { bg: 'bg-rose-100', text: 'text-rose-800', icon: '🎭' },
    desenvolvimento_social: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', icon: '🌟' },
    cidades_urbanismo: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🏙️' },
    saneamento: { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: '💧' },
    transporte_mobilidade: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '🚌' },
    meio_ambiente_clima: { bg: 'bg-green-100', text: 'text-green-800', icon: '🌳' },
    recursos_hidricos: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '💦' },
    mineracao: { bg: 'bg-stone-100', text: 'text-stone-800', icon: '⛏️' },
    desenvolvimento_regional: { bg: 'bg-violet-100', text: 'text-violet-800', icon: '🗺️' },
    ciencia_pesquisa: { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: '🔬' },
    populacao_indigena: { bg: 'bg-amber-100', text: 'text-amber-800', icon: '🌾' },
    igualdade_genero: { bg: 'bg-pink-100', text: 'text-pink-800', icon: '👥' },
    racismo_igualdade_racial: { bg: 'bg-amber-100', text: 'text-amber-800', icon: '✊' },
    direito_humanos: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '⚖️' },
    planejamento_gestao: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📊' },
    transparencia_controle: { bg: 'bg-green-100', text: 'text-green-800', icon: '🔒' },
    trabalho_infantil: { bg: 'bg-red-100', text: 'text-red-800', icon: '🚫' },
    terceira_idade: { bg: 'bg-purple-100', text: 'text-purple-800', icon: '👴' },
    pessoas_deficiencia: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '♿' }
  };
  
  return cores[tema] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📋' };
};

// Exportar THEME_KEYWORDS para uso em componentes
export { THEME_KEYWORDS }

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
