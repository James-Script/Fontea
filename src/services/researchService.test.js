// Testes Unitários - Research Service
// npm test -- researchService.test.js

import { describe, it, expect } from 'vitest'
import {
  getAcademicSources,
  getThematicData,
  enrichPromptWithData,
  generateAPACitation,
  generateSourcesSummary,
  validateResearchData
} from '../services/researchService'

describe('Research Service', () => {
  const TEMAS_VALIDOS = ['defesa_civil', 'agricultura', 'monitoramento', 'fiscalizacao', 'relacoes'];

  describe('getAcademicSources', () => {
    it('deve retornar fontes para tema válido', () => {
      const sources = getAcademicSources('defesa_civil');

      expect(sources).toHaveProperty('institucional');
      expect(sources).toHaveProperty('academico');
      expect(Array.isArray(sources.institucional)).toBe(true);
      expect(Array.isArray(sources.academico)).toBe(true);
    });

    it('deve retornar fontes para todos os temas válidos', () => {
      TEMAS_VALIDOS.forEach(tema => {
        const sources = getAcademicSources(tema);

        expect(sources.institucional.length).toBeGreaterThan(0);
        expect(sources.academico.length).toBeGreaterThan(0);
      });
    });

    it('deve ter estrutura correta em fontes institucionais', () => {
      const sources = getAcademicSources('agricultura');

      sources.institucional.forEach(fonte => {
        expect(fonte).toHaveProperty('nome');
        expect(fonte).toHaveProperty('url');
        expect(fonte).toHaveProperty('descricao');
        expect(fonte).toHaveProperty('tipo', 'governamental');
      });
    });

    it('deve ter estrutura correta em fontes acadêmicas', () => {
      const sources = getAcademicSources('monitoramento');

      sources.academico.forEach(pub => {
        expect(pub).toHaveProperty('nome');
        expect(pub).toHaveProperty('descricao');
        expect(pub).toHaveProperty('issn');
        expect(pub).toHaveProperty('tipo', 'academico');
      });
    });

    it('deve retornar fontes padrão para tema inválido', () => {
      const sources = getAcademicSources('tema_inexistente');

      expect(sources).toHaveProperty('institucional');
      expect(sources).toHaveProperty('academico');
      expect(sources.institucional.length).toBeGreaterThan(0);
    });

    it('deve conter URLs válidas em fontes', () => {
      const sources = getAcademicSources('defesa_civil');
      const urlRegex = /^https?:\/\/[^\s]+$/;

      sources.institucional.forEach(fonte => {
        expect(fonte.url).toMatch(urlRegex);
      });
    });

    it('deve conter ISSN em formato correto', () => {
      const sources = getAcademicSources('agricultura');
      const issnRegex = /^\d{4}-\d{4}$/;

      sources.academico.forEach(pub => {
        expect(pub.issn).toMatch(issnRegex);
      });
    });
  });

  describe('getThematicData', () => {
    it('deve retornar dados para tema válido', () => {
      const dados = getThematicData('defesa_civil');

      expect(dados).toHaveProperty('titulo');
      expect(dados).toHaveProperty('dados');
      expect(Array.isArray(dados.dados)).toBe(true);
    });

    it('deve retornar dados para todos os temas', () => {
      TEMAS_VALIDOS.forEach(tema => {
        const dados = getThematicData(tema);

        expect(dados.dados.length).toBeGreaterThan(0);
        expect(dados.titulo).toContain(tema.replace('_', ' '));
      });
    });

    it('deve ter estrutura correta em métricas', () => {
      const dados = getThematicData('agricultura');

      dados.dados.forEach(metrica => {
        expect(metrica).toHaveProperty('metrica');
        expect(metrica).toHaveProperty('valor');
        expect(metrica).toHaveProperty('fonte');
        expect(metrica).toHaveProperty('descricao');
      });
    });

    it('deve conter 3 métricas por tema', () => {
      TEMAS_VALIDOS.forEach(tema => {
        const dados = getThematicData(tema);
        expect(dados.dados.length).toBe(3);
      });
    });

    it('deve retornar dados padrão para tema inválido', () => {
      const dados = getThematicData('tema_inexistente');

      expect(dados).toHaveProperty('dados');
      expect(dados.dados.length).toBeGreaterThan(0);
    });
  });

  describe('enrichPromptWithData', () => {
    it('deve enriquecer prompt com dados', () => {
      const prompt = enrichPromptWithData('defesa_civil', 'Análise de riscos');

      expect(prompt).toContain('Fontes Disponíveis para Pesquisa');
      expect(prompt).toContain('Instituições Governamentais');
      expect(prompt).toContain('Publicações Acadêmicas');
      expect(prompt).toContain('Dados Estatísticos');
    });

    it('deve conter URLs em dados enriquecidos', () => {
      const prompt = enrichPromptWithData('agricultura', 'Safra 2024');

      expect(prompt).toContain('https://');
    });

    it('deve conter ISSN em dados enriquecidos', () => {
      const prompt = enrichPromptWithData('monitoramento', 'Monitoramento');

      expect(prompt).toMatch(/ISSN:/);
    });

    it('deve enriquecer para todos os temas', () => {
      TEMAS_VALIDOS.forEach(tema => {
        const prompt = enrichPromptWithData(tema, 'Teste');

        expect(prompt).toContain('Fontes Disponíveis');
        expect(prompt.length).toBeGreaterThan(100);
      });
    });

    it('deve conter métricos com valores reais', () => {
      const prompt = enrichPromptWithData('fiscalizacao', 'Análise');

      expect(prompt).toMatch(/[0-9]+\.[0-9]*|[0-9]+/);
    });
  });

  describe('generateAPACitation', () => {
    it('deve gerar citação para fonte governamental', () => {
      const fonte = {
        nome: 'IBGE - Instituto Brasileiro de Geografia e Estatística',
        descricao: 'Dados estatísticos',
        url: 'https://www.ibge.gov.br',
        tipo: 'governamental'
      };

      const citacao = generateAPACitation(fonte);

      expect(citacao).toContain('IBGE');
      expect(citacao).toContain('https://www.ibge.gov.br');
      expect(citacao).toMatch(/\d{4}/);
    });

    it('deve gerar citação para publicação acadêmica', () => {
      const pub = {
        nome: 'Revista Brasileira de Pesquisa',
        descricao: 'Artigos científicos',
        issn: '1234-5678',
        tipo: 'academico'
      };

      const citacao = generateAPACitation(pub);

      expect(citacao).toContain('Revista Brasileira de Pesquisa');
      expect(citacao).toContain('1234-5678');
    });

    it('deve gerar citação para fonte institucional', () => {
      const fonte = {
        nome: 'EMBRAPA',
        descricao: 'Pesquisa agropecuária',
        url: 'https://www.embrapa.br',
        tipo: 'institucional'
      };

      const citacao = generateAPACitation(fonte);

      expect(citacao).toContain('EMBRAPA');
      expect(citacao).toContain('https://www.embrapa.br');
    });

    it('deve gerar citação padrão para tipo desconhecido', () => {
      const fonte = {
        nome: 'Fonte Desconhecida',
        descricao: 'Tipo não definido',
        tipo: 'tipo_novo'
      };

      const citacao = generateAPACitation(fonte);

      expect(citacao).toContain('Fonte Desconhecida');
    });
  });

  describe('generateSourcesSummary', () => {
    it('deve gerar sumário de fontes', () => {
      const sumario = generateSourcesSummary('defesa_civil');

      expect(sumario).toHaveProperty('totalFontes');
      expect(sumario).toHaveProperty('fontesGovernamentais');
      expect(sumario).toHaveProperty('fontesAcademicas');
      expect(sumario).toHaveProperty('cobertura');
    });

    it('deve conter números corretos', () => {
      const sumario = generateSourcesSummary('agricultura');

      expect(sumario.totalFontes).toBeGreaterThan(0);
      expect(sumario.fontesGovernamentais).toBeGreaterThan(0);
      expect(sumario.fontesAcademicas).toBeGreaterThan(0);
      expect(sumario.totalFontes).toBe(
        sumario.fontesGovernamentais + sumario.fontesAcademicas
      );
    });

    it('deve ter cobertura definida', () => {
      const sumario = generateSourcesSummary('monitoramento');

      expect(sumario.cobertura).toBeTruthy();
      expect(sumario.cobertura).toMatch(/nacional|internacional/i);
    });
  });

  describe('validateResearchData', () => {
    it('deve validar dados de pesquisa', () => {
      const conteudo = 'Conteúdo de teste';
      const sources = [
        {
          nome: 'Fonte 1',
          descricao: 'Descrição',
          url: 'https://exemplo.com',
          tipo: 'governamental'
        }
      ];

      const resultado = validateResearchData(conteudo, sources);

      expect(resultado).toHaveProperty('conteudo', conteudo);
      expect(resultado).toHaveProperty('fontes');
      expect(resultado).toHaveProperty('dataGeracao');
      expect(resultado).toHaveProperty('qualidade', 'validada');
    });

    it('deve incluir timestamp na validação', () => {
      const resultado = validateResearchData('teste', []);

      expect(resultado.dataGeracao).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('deve marcar fontes com URL como validadas', () => {
      const sources = [
        {
          nome: 'Fonte com URL',
          url: 'https://exemplo.com',
          tipo: 'governamental'
        }
      ];

      const resultado = validateResearchData('teste', sources);

      expect(resultado.fontes[0].validada).toBe(true);
    });

    it('deve marcar fontes com ISSN como validadas', () => {
      const sources = [
        {
          nome: 'Publicação',
          issn: '1234-5678',
          tipo: 'academico'
        }
      ];

      const resultado = validateResearchData('teste', sources);

      expect(resultado.fontes[0].validada).toBe(true);
    });

    it('deve marcar fontes sem URL/ISSN como não validadas', () => {
      const sources = [
        {
          nome: 'Fonte sem referência',
          tipo: 'institucional'
        }
      ];

      const resultado = validateResearchData('teste', sources);

      expect(resultado.fontes[0].validada).toBe(false);
    });

    it('deve preservar tipo de fonte', () => {
      const sources = [
        { nome: 'Fonte Gov', url: 'https://gov.br', tipo: 'governamental' },
        { nome: 'Publicação', issn: '1234-5678', tipo: 'academico' }
      ];

      const resultado = validateResearchData('teste', sources);

      expect(resultado.fontes[0].tipo).toBe('governamental');
      expect(resultado.fontes[1].tipo).toBe('academico');
    });
  });

  describe('Integrações', () => {
    it('deve integrar dados enriquecidos com validação', () => {
      const prompt = enrichPromptWithData('defesa_civil', 'Análise');
      const sources = getAcademicSources('defesa_civil').institucional;

      const validado = validateResearchData(prompt, sources);

      expect(validado.qualidade).toBe('validada');
      expect(validado.conteudo.length).toBeGreaterThan(0);
    });

    it('deve gerar sumário para dados enriquecidos', () => {
      const sumario = generateSourcesSummary('agricultura');

      expect(sumario.totalFontes).toBeGreaterThan(0);
      expect(sumario.totalFontes).toBe(
        sumario.fontesGovernamentais + sumario.fontesAcademicas
      );
    });

    it('deve processar pipeline completo', () => {
      const tema = 'monitoramento';

      // 1. Enriquecer dados
      const prompt = enrichPromptWithData(tema, 'Análise completa');

      // 2. Obter metadados
      const dados = getThematicData(tema);
      const sources = getAcademicSources(tema);

      // 3. Validar
      const validado = validateResearchData(prompt, sources.institucional);

      // 4. Gerar sumário
      const sumario = generateSourcesSummary(tema);

      expect(prompt).toBeTruthy();
      expect(dados.dados.length).toBeGreaterThan(0);
      expect(validado.qualidade).toBe('validada');
      expect(sumario.totalFontes).toBeGreaterThan(0);
    });
  });
});
