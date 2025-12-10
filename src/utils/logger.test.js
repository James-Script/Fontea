// Testes Unitários - Logger Service
// npm test -- logger.test.js

import { describe, it, expect, beforeEach } from 'vitest'
import { Logger, createLogger } from '../utils/logger'

describe('Logger Service', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger('TestModule');
    logger.clearLogs();
  });

  describe('Criação de Logger', () => {
    it('deve criar um logger com nome do módulo', () => {
      expect(logger.moduleName).toBe('TestModule');
    });

    it('deve inicializar array de logs vazio', () => {
      expect(logger.getLogs().length).toBe(0);
    });

    it('deve criar logger via factory', () => {
      const newLogger = createLogger('FactoryTest');
      expect(newLogger).toBeInstanceOf(Logger);
      expect(newLogger.moduleName).toBe('FactoryTest');
    });
  });

  describe('Métodos de Log', () => {
    it('deve registrar log de DEBUG', () => {
      logger.debug('Teste debug');
      const logs = logger.getLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].level).toBe('DEBUG');
      expect(logs[0].message).toBe('Teste debug');
    });

    it('deve registrar log de INFO', () => {
      logger.info('Teste info');
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('INFO');
    });

    it('deve registrar log de WARN', () => {
      logger.warn('Teste warn');
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('WARN');
    });

    it('deve registrar log de ERROR', () => {
      logger.error('Teste error', new Error('Erro de teste'));
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('ERROR');
      expect(logs[0].data).toHaveProperty('message');
    });

    it('deve registrar dados adicionais', () => {
      const dados = { userId: 123, action: 'create' };
      logger.info('Ação executada', dados);
      const logs = logger.getLogs();
      expect(logs[0].data).toEqual(dados);
    });
  });

  describe('Log de Performance', () => {
    it('deve registrar log de performance com duração', () => {
      logger.performance('Operação lenta', 1234.56, { operacao: 'test' });
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('INFO');
      expect(logs[0].message).toContain('1234.56ms');
    });

    it('deve incluir detalhes na performance', () => {
      const detalhes = { items: 100, tipo: 'processamento' };
      logger.performance('Processamento em lote', 5000, detalhes);
      const logs = logger.getLogs();
      expect(logs[0].data).toHaveProperty('duration');
      expect(logs[0].data).toHaveProperty('items');
    });
  });

  describe('Gerenciamento de Logs', () => {
    it('deve limpar todos os logs', () => {
      logger.info('Log 1');
      logger.info('Log 2');
      logger.info('Log 3');
      expect(logger.getLogs().length).toBe(3);
      
      logger.clearLogs();
      expect(logger.getLogs().length).toBe(0);
    });

    it('deve limitar quantidade de logs em memória', () => {
      logger.maxLogs = 5;
      for (let i = 0; i < 10; i++) {
        logger.info(`Log ${i}`);
      }
      expect(logger.getLogs().length).toBe(5);
    });

    it('deve exportar logs como JSON', () => {
      logger.info('Teste export');
      const json = logger.exportLogs();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].message).toBe('Teste export');
    });

    it('deve exportar logs como CSV', () => {
      logger.info('Teste CSV', { campo: 'valor' });
      const csv = logger.exportLogsCSV();
      expect(csv).toContain('Timestamp');
      expect(csv).toContain('Level');
      expect(csv).toContain('Module');
      expect(csv).toContain('Teste CSV');
    });
  });

  describe('Timestamp e Metadata', () => {
    it('deve incluir timestamp ISO no log', () => {
      logger.info('Teste timestamp');
      const logs = logger.getLogs();
      expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('deve incluir nome do módulo em cada log', () => {
      logger.info('Teste módulo');
      const logs = logger.getLogs();
      expect(logs[0].module).toBe('TestModule');
    });

    it('deve incluir user agent quando disponível', () => {
      logger.info('Teste user agent');
      const logs = logger.getLogs();
      expect(logs[0]).toHaveProperty('userAgent');
    });
  });

  describe('Erro Handling', () => {
    it('deve capturar erro como Error object', () => {
      const erro = new Error('Teste de erro');
      logger.error('Erro capturado', erro);
      const logs = logger.getLogs();
      expect(logs[0].data).toHaveProperty('name', 'Error');
      expect(logs[0].data).toHaveProperty('message', 'Teste de erro');
      expect(logs[0].data).toHaveProperty('stack');
    });

    it('deve capturar erro como objeto comum', () => {
      logger.error('Erro genérico', { codigo: 500, tipo: 'API' });
      const logs = logger.getLogs();
      expect(logs[0].data).toHaveProperty('codigo', 500);
    });

    it('deve capturar erro sem dados adicionais', () => {
      logger.error('Erro simples');
      const logs = logger.getLogs();
      expect(logs[0].level).toBe('ERROR');
      expect(logs[0].data).toBeNull();
    });
  });
});
