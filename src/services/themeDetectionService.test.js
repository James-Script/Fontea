import { describe, it, expect, beforeEach } from 'vitest'
import { 
  detectTheme, 
  getThemeName, 
  getPriorityColors, 
  getThemeBadge,
  PRIORITY_COLORS,
  COLOR_MEANINGS 
} from '../services/themeDetectionService'

describe('ThemeDetectionService', () => {
  describe('detectTheme', () => {
    it('deve detectar tema Defesa Civil', () => {
      const conteudo = 'Análise de enchentes e deslizamentos em áreas de risco, coordenação com CENAD'
      const resultado = detectTheme(conteudo)
      
      expect(resultado.tema).toBe('defesa_civil')
      expect(resultado.confianca).toBeGreaterThan(50)
      expect(resultado.palavrasDetectadas).toBeDefined()
      expect(Array.isArray(resultado.palavrasDetectadas)).toBe(true)
    })

    it('deve detectar tema Agricultura', () => {
      const conteudo = 'Produção agrícola de soja em Mato Grosso, dados CONAB, safra 2024'
      const resultado = detectTheme(conteudo)
      
      expect(resultado.tema).toBe('agricultura')
      expect(resultado.confianca).toBeGreaterThan(50)
    })

    it('deve detectar tema Monitoramento Costeiro', () => {
      const conteudo = 'Erosão costeira no litoral de Pernambuco, monitoramento marinho realizado'
      const resultado = detectTheme(conteudo)
      
      expect(resultado.tema).toBe('monitoramento')
      expect(resultado.confianca).toBeGreaterThan(50)
    })

    it('deve detectar tema Fiscalização Ambiental', () => {
      const conteudo = 'Desmatamento na Amazônia, ações do IBAMA, proteção de flora e fauna'
      const resultado = detectTheme(conteudo)
      
      expect(resultado.tema).toBe('fiscalizacao')
      expect(resultado.confianca).toBeGreaterThan(50)
    })

    it('deve detectar tema Relações Internacionais', () => {
      const conteudo = 'Diplomacia, negociações comerciais, acordo internacional, MERCOSUL'
      const resultado = detectTheme(conteudo)
      
      expect(resultado.tema).toBe('relacoes')
      expect(resultado.confianca).toBeGreaterThan(30)
    })

    it('deve retornar confiança entre 0 e 100', () => {
      const conteudo = 'Briefing genérico'
      const resultado = detectTheme(conteudo)
      
      expect(resultado.confianca).toBeGreaterThanOrEqual(0)
      expect(resultado.confianca).toBeLessThanOrEqual(100)
    })

    it('deve retornar tema padrão para conteúdo vazio', () => {
      const resultado = detectTheme('')
      
      expect(resultado.tema).toBe('defesa_civil')
      expect(resultado.confianca).toBe(0)
      expect(resultado.palavrasDetectadas).toEqual([])
    })

    it('deve ser case-insensitive', () => {
      const conteudo1 = 'ENCHENTE E DESLIZAMENTO'
      const conteudo2 = 'enchente e deslizamento'
      const conteudo3 = 'Enchente E Deslizamento'
      
      const resultado1 = detectTheme(conteudo1)
      const resultado2 = detectTheme(conteudo2)
      const resultado3 = detectTheme(conteudo3)
      
      expect(resultado1.tema).toBe(resultado2.tema)
      expect(resultado2.tema).toBe(resultado3.tema)
    })

    it('deve detectar múltiplas ocorrências da mesma palavra', () => {
      const conteudo = 'Desastre natural, calamidade pública, emergência civil com desastre'
      const resultado = detectTheme(conteudo)
      
      expect(resultado.palavrasDetectadas.length).toBeGreaterThan(0)
      const palavras = resultado.palavrasDetectadas.map(p => p.palavra)
      expect(palavras).toContain('desastre')
    })

    it('deve dar mais peso a organizações que palavras-chave', () => {
      const conteudo1 = 'enchente produção agrícola CONAB'
      const conteudo2 = 'enchente produção agrícola enchente'
      
      const resultado1 = detectTheme(conteudo1)
      const resultado2 = detectTheme(conteudo2)
      
      // CONAB tem peso 4, palavra tem peso 2
      // Resultado1 deve ter mais peso para agricultura
      expect(resultado1.confianca).toBeGreaterThan(resultado2.confianca)
    })

    it('deve retornar palavras detectadas limitadas a 10', () => {
      const conteudo = 'enchente enchente enchente enchente enchente ' +
                       'desastre desastre desastre desastre desastre ' +
                       'emergência emergência emergência'
      const resultado = detectTheme(conteudo)
      
      expect(resultado.palavrasDetectadas.length).toBeLessThanOrEqual(10)
    })
  })

  describe('getThemeName', () => {
    it('deve retornar nomes formatados para todos os temas', () => {
      expect(getThemeName('defesa_civil')).toBe('Defesa Civil')
      expect(getThemeName('agricultura')).toBe('Agricultura')
      expect(getThemeName('monitoramento')).toBe('Monitoramento Costeiro')
      expect(getThemeName('fiscalizacao')).toBe('Fiscalização Ambiental')
      expect(getThemeName('relacoes')).toBe('Relações Internacionais')
    })

    it('deve retornar nome original se tema não existir', () => {
      expect(getThemeName('tema_desconhecido')).toBe('tema_desconhecido')
    })
  })

  describe('getPriorityColors', () => {
    it('deve retornar cores para prioridade alta', () => {
      const cores = getPriorityColors('alta')
      
      expect(cores).toBeDefined()
      expect(cores.bg).toBeDefined()
      expect(cores.border).toBeDefined()
      expect(cores.text).toBeDefined()
      expect(cores.badge).toBeDefined()
      expect(cores.dot).toBeDefined()
      expect(cores.description).toContain('Vermelh')
    })

    it('deve retornar cores para prioridade média', () => {
      const cores = getPriorityColors('media')
      
      expect(cores.description).toContain('Amarel')
    })

    it('deve retornar cores para prioridade baixa', () => {
      const cores = getPriorityColors('baixa')
      
      expect(cores.description).toContain('Verde')
    })

    it('deve retornar cores padrão para prioridade inválida', () => {
      const cores = getPriorityColors('invalida')
      
      expect(cores).toBeDefined()
      expect(cores).toEqual(PRIORITY_COLORS.media)
    })

    it('deve conter classes Tailwind válidas', () => {
      const cores = getPriorityColors('alta')
      
      expect(cores.bg).toMatch(/^bg-/)
      expect(cores.border).toMatch(/^border-/)
      expect(cores.text).toMatch(/^text-/)
      expect(cores.badge).toMatch(/^bg-|text-/)
      expect(cores.dot).toMatch(/^bg-/)
    })
  })

  describe('getThemeBadge', () => {
    it('deve retornar badge para tema defesa_civil', () => {
      const badge = getThemeBadge('defesa_civil')
      
      expect(badge).toBeDefined()
      expect(badge.bg).toBeDefined()
      expect(badge.text).toBeDefined()
      expect(badge.icon).toBe('🛡️')
    })

    it('deve retornar badge com ícone para agricultura', () => {
      const badge = getThemeBadge('agricultura')
      expect(badge.icon).toBe('🌾')
    })

    it('deve retornar badge com ícone para monitoramento', () => {
      const badge = getThemeBadge('monitoramento')
      expect(badge.icon).toBe('🌊')
    })

    it('deve retornar badge com ícone para fiscalização', () => {
      const badge = getThemeBadge('fiscalizacao')
      expect(badge.icon).toBe('🔍')
    })

    it('deve retornar badge com ícone para relações', () => {
      const badge = getThemeBadge('relacoes')
      expect(badge.icon).toBe('🌍')
    })

    it('deve retornar badge padrão para tema inválido', () => {
      const badge = getThemeBadge('tema_desconhecido')
      
      expect(badge).toBeDefined()
      expect(badge.icon).toBe('📋')
    })

    it('deve conter classes Tailwind válidas', () => {
      const badge = getThemeBadge('agricultura')
      
      expect(badge.bg).toMatch(/^bg-/)
      expect(badge.text).toMatch(/^text-/)
    })
  })

  describe('PRIORITY_COLORS', () => {
    it('deve conter configuração para alta prioridade', () => {
      expect(PRIORITY_COLORS.alta).toBeDefined()
      expect(PRIORITY_COLORS.alta.bg).toContain('red')
    })

    it('deve conter configuração para média prioridade', () => {
      expect(PRIORITY_COLORS.media).toBeDefined()
      expect(PRIORITY_COLORS.media.bg).toContain('yellow')
    })

    it('deve conter configuração para baixa prioridade', () => {
      expect(PRIORITY_COLORS.baixa).toBeDefined()
      expect(PRIORITY_COLORS.baixa.bg).toContain('green')
    })

    it('deve ter descrição para cada prioridade', () => {
      expect(PRIORITY_COLORS.alta.description).toBeDefined()
      expect(PRIORITY_COLORS.media.description).toBeDefined()
      expect(PRIORITY_COLORS.baixa.description).toBeDefined()
    })
  })

  describe('COLOR_MEANINGS', () => {
    it('deve conter significado para cor vermelha', () => {
      expect(COLOR_MEANINGS.red).toBeDefined()
      expect(COLOR_MEANINGS.red.label).toContain('Vermelho')
      expect(COLOR_MEANINGS.red.meaning).toBeDefined()
      expect(COLOR_MEANINGS.red.context).toBeDefined()
    })

    it('deve conter significado para cor amarela', () => {
      expect(COLOR_MEANINGS.yellow).toBeDefined()
      expect(COLOR_MEANINGS.yellow.label).toContain('Amarelo')
    })

    it('deve conter significado para cor verde', () => {
      expect(COLOR_MEANINGS.green).toBeDefined()
      expect(COLOR_MEANINGS.green.label).toContain('Verde')
    })
  })

  describe('Integração completa', () => {
    it('deve processar texto real completo', () => {
      const textoReal = `
        Briefing sobre situação de enchentes em Pernambuco.
        Coordenação entre defesa civil local e CENAD.
        Desastres naturais afetando comunidades.
        Ações de proteção em andamento.
      `
      
      const resultado = detectTheme(textoReal)
      
      expect(resultado.tema).toBe('defesa_civil')
      expect(resultado.confianca).toBeGreaterThan(60)
      expect(resultado.palavrasDetectadas.length).toBeGreaterThan(0)
    })

    it('deve funcionar com texto misto de temas', () => {
      const textoMisto = 'Produção agrícola afetada por erosão costeira'
      const resultado = detectTheme(textoMisto)
      
      // Deve detectar um dos temas
      expect(['agricultura', 'monitoramento']).toContain(resultado.tema)
    })

    it('deve retornar estrutura consistente', () => {
      const resultado = detectTheme('qualquer conteúdo')
      
      expect(resultado).toHaveProperty('tema')
      expect(resultado).toHaveProperty('confianca')
      expect(resultado).toHaveProperty('palavrasDetectadas')
      expect(typeof resultado.tema).toBe('string')
      expect(typeof resultado.confianca).toBe('number')
      expect(Array.isArray(resultado.palavrasDetectadas)).toBe(true)
    })
  })
})
