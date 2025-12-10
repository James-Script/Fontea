// Serviço para buscar dados em APIs governamentais brasileiras
// Fonte exclusivamente de órgãos governamentais confiáveis

import { createLogger } from '../utils/logger'

const logger = createLogger('GovernmentApiService')

// URLs de APIs governamentais brasileiras
const GOVERNMENT_APIS = {
  // IBGE - Instituto Brasileiro de Geografia e Estatística
  ibge: {
    baseUrl: 'https://servicodados.ibge.gov.br/api/v1',
    endpoints: {
      localidades: '/localidades',
      indicadores: '/indicadores',
      projecoes: '/projecoes/populacao'
    }
  },
  
  // INMET - Instituto Nacional de Meteorologia
  inmet: {
    baseUrl: 'https://apitempo.inmet.gov.br',
    endpoints: {
      estacoes: '/estacoes',
      previsao: '/previsao',
      alertas: '/alertas'
    }
  },
  
  // CEMADEN - Centro Nacional de Monitoramento e Alertas de Desastres Naturais
  cemaden: {
    baseUrl: 'https://www.cemaden.gov.br',
    endpoints: {
      alertas: '/alertas'
    }
  },
  
  // Dados Abertos do Governo
  dadosGovBr: {
    baseUrl: 'https://dados.gov.br/api',
    endpoints: {
      datasets: '/action/package_search'
    }
  }
}

/**
 * Busca dados meteorológicos do INMET
 * @param {string} cidade - Nome da cidade ou código IBGE
 * @param {string} estado - Sigla do estado (ex: PE)
 * @returns {Promise<object>} Dados meteorológicos
 */
export const fetchWeatherData = async (cidade, estado) => {
  try {
    logger.info('Buscando dados meteorológicos do INMET', { cidade, estado })
    
    // Buscar código da estação INMET mais próxima
    const estacoesUrl = `${GOVERNMENT_APIS.inmet.baseUrl}${GOVERNMENT_APIS.inmet.endpoints.estacoes}`
    const estacoesResponse = await fetch(estacoesUrl)
    
    if (!estacoesResponse.ok) {
      throw new Error('Erro ao buscar estações do INMET')
    }
    
    const estacoes = await estacoesResponse.json()
    
    // Filtrar estação por estado/cidade
    const estacao = estacoes.find(e => 
      e.SG_ESTADO === estado?.toUpperCase() || 
      e.DC_NOME?.toLowerCase().includes(cidade?.toLowerCase())
    )
    
    if (!estacao) {
      logger.warn('Estação INMET não encontrada para', { cidade, estado })
      return null
    }
    
    // Buscar dados atuais (últimos 7 dias)
    const codigoEstacao = estacao.CD_ESTACAO
    const dadosUrl = `${GOVERNMENT_APIS.inmet.baseUrl}/estacao/dados/${codigoEstacao}`
    
    const response = await fetch(dadosUrl)
    if (!response.ok) {
      throw new Error('Erro ao buscar dados meteorológicos')
    }
    
    const dados = await response.json()
    
    logger.info('Dados meteorológicos obtidos com sucesso', { 
      estacao: estacao.DC_NOME,
      registros: dados.length 
    })
    
    return {
      fonte: 'INMET',
      estacao: estacao.DC_NOME,
      municipio: estacao.DC_NOME,
      estado: estacao.SG_ESTADO,
      dados: dados.slice(0, 30), // Últimos 30 registros
      url: `https://portal.inmet.gov.br/estacoes/${codigoEstacao}`
    }
  } catch (error) {
    logger.error('Erro ao buscar dados meteorológicos', error)
    return null
  }
}

/**
 * Busca alertas de desastres do CEMADEN
 * @param {string} estado - Sigla do estado (ex: PE)
 * @returns {Promise<object>} Alertas de desastres
 */
export const fetchDisasterAlerts = async (estado) => {
  try {
    logger.info('Buscando alertas do CEMADEN', { estado })
    
    // CEMADEN não tem API pública aberta, então retornamos informações estruturadas
    // baseadas nas fontes oficiais disponíveis
    return {
      fonte: 'CEMADEN',
      estado: estado?.toUpperCase(),
      url: 'https://www.cemaden.gov.br',
      observacao: 'Para dados em tempo real, consulte o portal do CEMADEN'
    }
  } catch (error) {
    logger.error('Erro ao buscar alertas do CEMADEN', error)
    return null
  }
}

/**
 * Busca dados do IBGE por localidade
 * @param {string} termo - Termo de busca (cidade, estado, etc)
 * @returns {Promise<object>} Dados do IBGE
 */
export const fetchIBGEData = async (termo) => {
  try {
    logger.info('Buscando dados do IBGE', { termo })
    
    // Buscar municípios
    const municipiosUrl = `${GOVERNMENT_APIS.ibge.baseUrl}/localidades/municipios`
    const response = await fetch(municipiosUrl)
    
    if (!response.ok) {
      throw new Error('Erro ao buscar dados do IBGE')
    }
    
    const municipios = await response.json()
    
    // Filtrar por termo
    const resultado = municipios.filter(m => 
      m.nome.toLowerCase().includes(termo?.toLowerCase()) ||
      m.microrregiao.mesorregiao.UF.sigla === termo?.toUpperCase()
    )
    
    logger.info('Dados do IBGE obtidos com sucesso', { resultados: resultado.length })
    
    return {
      fonte: 'IBGE',
      termo,
      municipios: resultado.slice(0, 10), // Top 10
      url: 'https://www.ibge.gov.br'
    }
  } catch (error) {
    logger.error('Erro ao buscar dados do IBGE', error)
    return null
  }
}

/**
 * Busca dados governamentais baseado no tema e especificações
 * @param {string} tema - Tema do briefing
 * @param {string} especificacoes - Especificações do usuário
 * @returns {Promise<object>} Dados governamentais relevantes
 */
export const fetchGovernmentData = async (tema, especificacoes = '') => {
  try {
    logger.info('Buscando dados governamentais', { tema, especificacoes })
    
    const resultados = {
      tema,
      fontes: [],
      dados: [],
      urls: []
    }
    
    // Extrair localização das especificações
    const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
                     'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
                     'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
    
    let estadoDetectado = null
    let cidadeDetectada = null
    
    // Detectar estado
    for (const estado of estados) {
      if (especificacoes.toLowerCase().includes(estado.toLowerCase()) ||
          especificacoes.toLowerCase().includes(estado.toLowerCase().replace(/^(.{2}).*/, '$1'))) {
        estadoDetectado = estado
        break
      }
    }
    
    // Detectar cidade (buscar por nomes comuns de cidades)
    const cidadesComuns = ['recife', 'olinda', 'caruaru', 'petrolina', 'paulista', 
                          'jaboatão', 'camaragibe', 'garanhuns', 'vitória', 'serra',
                          'são paulo', 'rio de janeiro', 'belo horizonte', 'brasília',
                          'salvador', 'fortaleza', 'curitiba', 'porto alegre']
    
    for (const cidade of cidadesComuns) {
      if (especificacoes.toLowerCase().includes(cidade)) {
        cidadeDetectada = cidade
        break
      }
    }
    
    // Buscar dados baseado no tema
    if (tema === 'defesa_civil') {
      // Buscar dados meteorológicos se houver localização
      if (estadoDetectado || cidadeDetectada) {
        const weatherData = await fetchWeatherData(cidadeDetectada, estadoDetectado)
        if (weatherData) {
          resultados.dados.push({
            tipo: 'meteorologia',
            titulo: 'Dados Meteorológicos',
            fonte: 'INMET',
            conteudo: `Dados meteorológicos da estação ${weatherData.estacao}, ${weatherData.municipio}-${weatherData.estado}`,
            url: weatherData.url
          })
          resultados.fontes.push({
            nome: 'INMET - Instituto Nacional de Meteorologia',
            url: weatherData.url,
            tipo: 'governamental'
          })
          resultados.urls.push(weatherData.url)
        }
        
        // Buscar alertas de desastres
        if (estadoDetectado) {
          const alerts = await fetchDisasterAlerts(estadoDetectado)
          if (alerts) {
            resultados.dados.push({
              tipo: 'alertas',
              titulo: 'Monitoramento de Desastres',
              fonte: 'CEMADEN',
              conteudo: `Monitoramento de desastres naturais no estado de ${estadoDetectado}`,
              url: alerts.url
            })
            resultados.fontes.push({
              nome: 'CEMADEN - Centro Nacional de Monitoramento e Alertas de Desastres Naturais',
              url: alerts.url,
              tipo: 'governamental'
            })
            resultados.urls.push(alerts.url)
          }
        }
      }
    }
    
    if (tema === 'agricultura') {
      // Buscar dados do IBGE sobre produção agrícola
      if (estadoDetectado || cidadeDetectada) {
        const ibgeData = await fetchIBGEData(estadoDetectado || cidadeDetectada)
        if (ibgeData) {
          resultados.dados.push({
            tipo: 'dados_municipais',
            titulo: 'Dados Municipais',
            fonte: 'IBGE',
            conteudo: `Informações municipais do IBGE para ${ibgeData.termo}`,
            url: ibgeData.url
          })
          resultados.fontes.push({
            nome: 'IBGE - Instituto Brasileiro de Geografia e Estatística',
            url: ibgeData.url,
            tipo: 'governamental'
          })
          resultados.urls.push(ibgeData.url)
        }
      }
    }
    
    logger.info('Busca de dados governamentais concluída', { 
      fontes: resultados.fontes.length,
      dados: resultados.dados.length
    })
    
    return resultados
  } catch (error) {
    logger.error('Erro ao buscar dados governamentais', error)
    return {
      tema,
      fontes: [],
      dados: [],
      urls: [],
      erro: error.message
    }
  }
}

/**
 * Busca informações complementares de portais governamentais
 * @param {string} termo - Termo de busca
 * @returns {Promise<Array>} Lista de URLs e informações de portais governamentais
 */
export const searchGovernmentPortals = async (termo) => {
  const portais = [
    {
      nome: 'Portal Brasil',
      url: 'https://www.gov.br',
      descricao: 'Portal oficial do governo brasileiro'
    },
    {
      nome: 'Dados Abertos',
      url: 'https://dados.gov.br',
      descricao: 'Portal de dados abertos do governo federal'
    },
    {
      nome: 'IBGE',
      url: 'https://www.ibge.gov.br',
      descricao: 'Instituto Brasileiro de Geografia e Estatística'
    },
    {
      nome: 'INMET',
      url: 'https://portal.inmet.gov.br',
      descricao: 'Instituto Nacional de Meteorologia'
    },
    {
      nome: 'CEMADEN',
      url: 'https://www.cemaden.gov.br',
      descricao: 'Centro Nacional de Monitoramento e Alertas de Desastres Naturais'
    },
    {
      nome: 'CONAB',
      url: 'https://www.conab.gov.br',
      descricao: 'Companhia Nacional de Abastecimento'
    },
    {
      nome: 'EMBRAPA',
      url: 'https://www.embrapa.br',
      descricao: 'Empresa Brasileira de Pesquisa Agropecuária'
    },
    {
      nome: 'IBAMA',
      url: 'https://www.ibama.gov.br',
      descricao: 'Instituto Brasileiro do Meio Ambiente e dos Recursos Naturais Renováveis'
    }
  ]
  
  // Filtrar portais relevantes ao termo
  return portais.filter(p => 
    p.nome.toLowerCase().includes(termo?.toLowerCase()) ||
    p.descricao.toLowerCase().includes(termo?.toLowerCase())
  )
}

export default {
  fetchWeatherData,
  fetchDisasterAlerts,
  fetchIBGEData,
  fetchGovernmentData,
  searchGovernmentPortals
}


