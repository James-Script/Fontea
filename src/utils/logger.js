// Sistema centralizado de logging
// Fornece logs estruturados para toda a aplicação

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

const LOG_COLORS = {
  DEBUG: '#7C3AED', // Violeta
  INFO: '#0EA5E9',  // Azul
  WARN: '#F59E0B', // Âmbar
  ERROR: '#EF4444'  // Vermelho
};

class Logger {
  constructor(moduleName) {
    this.moduleName = moduleName;
    this.logs = [];
    this.maxLogs = 500; // Limita logs em memória
  }

  /**
   * Registra um log
   * @param {string} level - Nível do log (DEBUG, INFO, WARN, ERROR)
   * @param {string} message - Mensagem do log
   * @param {object} data - Dados adicionais (opcional)
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      module: this.moduleName,
      message,
      data,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    };

    // Armazenar localmente
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console com cores
    this.printToConsole(logEntry);

    // Armazenar em localStorage para auditoria
    this.saveToLocalStorage(logEntry);

    return logEntry;
  }

  debug(message, data = null) {
    return this.log(LOG_LEVELS.DEBUG, message, data);
  }

  info(message, data = null) {
    return this.log(LOG_LEVELS.INFO, message, data);
  }

  warn(message, data = null) {
    return this.log(LOG_LEVELS.WARN, message, data);
  }

  error(message, error = null) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    return this.log(LOG_LEVELS.ERROR, message, errorData);
  }

  /**
   * Log de performance
   * @param {string} label - Rótulo da operação
   * @param {number} duration - Duração em ms
   * @param {object} details - Detalhes adicionais
   */
  performance(label, duration, details = null) {
    const message = `[PERF] ${label} - ${duration.toFixed(2)}ms`;
    return this.log(LOG_LEVELS.INFO, message, { duration, ...details });
  }

  /**
   * Imprime no console com formatação
   */
  printToConsole(logEntry) {
    const { level, module, message, data, timestamp } = logEntry;
    const color = LOG_COLORS[level] || '#9CA3AF';
    const icon = this.getIcon(level);

    if (data) {
      console.log(
        `%c${icon} [${timestamp}] [${module}] ${message}`,
        `color: ${color}; font-weight: bold; font-size: 12px;`,
        data
      );
    } else {
      console.log(
        `%c${icon} [${timestamp}] [${module}] ${message}`,
        `color: ${color}; font-weight: bold; font-size: 12px;`
      );
    }
  }

  /**
   * Salva log em localStorage
   */
  saveToLocalStorage(logEntry) {
    try {
      const key = `fontea_logs_${new Date().toISOString().split('T')[0]}`;
      const existingLogs = localStorage.getItem(key);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push(logEntry);
      
      // Manter apenas últimos 1000 logs por dia
      if (logs.length > 1000) {
        logs.shift();
      }
      
      localStorage.setItem(key, JSON.stringify(logs));
    } catch (e) {
      console.warn('Erro ao salvar logs em localStorage:', e);
    }
  }

  /**
   * Retorna ícone baseado no nível
   */
  getIcon(level) {
    const icons = {
      DEBUG: '🐛',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌'
    };
    return icons[level] || '📝';
  }

  /**
   * Retorna todos os logs armazenados
   */
  getLogs() {
    return this.logs;
  }

  /**
   * Limpa todos os logs
   */
  clearLogs() {
    this.logs = [];
    this.info('Logs limpos');
  }

  /**
   * Exporta logs como JSON
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Exporta logs como CSV
   */
  exportLogsCSV() {
    if (this.logs.length === 0) return '';

    const headers = ['Timestamp', 'Level', 'Module', 'Message', 'Data'];
    const rows = this.logs.map(log => [
      log.timestamp,
      log.level,
      log.module,
      log.message,
      JSON.stringify(log.data)
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }
}

// Factory para criar loggers
export const createLogger = (moduleName) => {
  return new Logger(moduleName);
};

// Logger global
export const globalLogger = new Logger('GLOBAL');

// Exportar classe para testes
export { Logger };
