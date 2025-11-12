// Mock database usando localStorage
// Em produção, substituir por API real ou ORM

// Função para obter credenciais do admin do .env
const getAdminCredentials = () => {
  return {
    id: import.meta.env.VITE_ADMIN_ID || 'FONADMIN',
    email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@fontea.com',
    senha: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
  };
};

// Dados iniciais (sem senhas hardcoded - apenas estrutura)
const initialUsers = [
  {
    id: getAdminCredentials().id,
    id_empresa: '000000',
    nome: 'Administrador',
    email: getAdminCredentials().email,
    senha: getAdminCredentials().senha,
    cargo: 'Administrador do Sistema',
    funcao: 'Administração',
    departamento: 'TI',
    telefone: '(81) 99999-9999',
    tipo_usuario: 'admin',
    nivel_acesso: 'admin',
    is_admin: true,
    ativo: true,
    pendente_aprovacao: false,
    briefings_criados: 0,
    ultimo_acesso: null,
    data_cadastro: new Date().toISOString(),
    lgpd_consentimento: true,
    lgpd_finalidade: 'Administração do sistema',
    lgpd_data_consentimento: new Date().toISOString(),
    foto_perfil: null
  }
];

const initialBriefings = [
  {
    id: 'BRI001',
    titulo: 'Situação das Chuvas em Pernambuco',
    conteudo: '# Situação das Chuvas\n\n## Resumo\nAs chuvas em Pernambuco estão dentro da normalidade para o período.\n\n## Dados\n- Precipitação média: 150mm\n- Regiões mais afetadas: Zona da Mata',
    tema: 'defesa_civil',
    status: 'aprovado',
    prioridade: 'alta',
    responsavel_id: 'FON001',
    responsavel_nome: 'Maria Silva',
    editado_por: [],
    historico_edicoes: [],
    fontes: ['INMET', 'CPRH'],
    data_criacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    data_atualizacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    visualizacoes: 45
  },
  {
    id: 'BRI002',
    titulo: 'Produção Agrícola - Safra 2024',
    conteudo: '# Produção Agrícola\n\n## Resumo\nA safra 2024 apresenta crescimento de 15% em relação ao ano anterior.\n\n## Principais Culturas\n- Milho\n- Feijão\n- Mandioca',
    tema: 'agricultura',
    status: 'em_revisao',
    prioridade: 'media',
    responsavel_id: 'FON002',
    responsavel_nome: 'João Santos',
    editado_por: [],
    historico_edicoes: [],
    fontes: ['IBGE', 'CONAB'],
    data_criacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    data_atualizacao: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    visualizacoes: 23
  }
];

const initialTemplates = [
  {
    id: 'TMP001',
    nome: 'Template Defesa Civil',
    descricao: 'Template para briefings de defesa civil',
    conteudo: '# Título do Briefing\n\n## Resumo\n\n## Situação Atual\n\n## Ações Recomendadas\n\n## Fontes',
    tema: 'defesa_civil',
    ativo: true
  },
  {
    id: 'TMP002',
    nome: 'Template Agricultura',
    descricao: 'Template para briefings agrícolas',
    conteudo: '# Título do Briefing\n\n## Resumo\n\n## Dados da Safra\n\n## Análise\n\n## Fontes',
    tema: 'agricultura',
    ativo: true
  }
];

// Função para inicializar o banco de dados
const initializeDatabase = () => {
  const stored = localStorage.getItem('fontea_database');
  if (!stored) {
    const db = {
      users: initialUsers,
      briefings: initialBriefings,
      templates: initialTemplates,
      profileChangeRequests: []
    };
    localStorage.setItem('fontea_database', JSON.stringify(db));
    return db;
  }
  
  const db = JSON.parse(stored);
  
  // Garantir que profileChangeRequests existe e preservar dados existentes
  if (!db.profileChangeRequests) {
    db.profileChangeRequests = [];
    console.log('initializeDatabase - profileChangeRequests inicializado como array vazio');
  } else {
    console.log('initializeDatabase - profileChangeRequests já existe com', db.profileChangeRequests.length, 'solicitações');
  }
  
  // Garantir que o admin sempre existe e está atualizado
  const adminCreds = getAdminCredentials();
  const adminIndex = db.users.findIndex(u => u.is_admin || u.id === adminCreds.id);
  
  if (adminIndex === -1) {
    // Admin não existe, criar
    db.users.push({
      id: adminCreds.id,
      id_empresa: '000000',
      nome: 'Administrador',
      email: adminCreds.email,
      senha: adminCreds.senha,
      cargo: 'Administrador do Sistema',
      funcao: 'Administração',
      departamento: 'TI',
      telefone: '(81) 99999-9999',
      tipo_usuario: 'admin',
      nivel_acesso: 'admin',
      is_admin: true,
      ativo: true,
      pendente_aprovacao: false,
      briefings_criados: 0,
      ultimo_acesso: null,
      data_cadastro: new Date().toISOString(),
      lgpd_consentimento: true,
      lgpd_finalidade: 'Administração do sistema',
      lgpd_data_consentimento: new Date().toISOString(),
      foto_perfil: null
    });
  } else {
    // Atualizar credenciais do admin existente
    db.users[adminIndex].id = adminCreds.id;
    db.users[adminIndex].email = adminCreds.email;
    db.users[adminIndex].senha = adminCreds.senha;
    db.users[adminIndex].is_admin = true;
    db.users[adminIndex].nivel_acesso = 'admin';
    db.users[adminIndex].ativo = true;
    db.users[adminIndex].pendente_aprovacao = false;
  }
  
  localStorage.setItem('fontea_database', JSON.stringify(db));
  return db;
};

// Função para obter o banco de dados
export const getDatabase = () => {
  return initializeDatabase();
};

// Função para salvar o banco de dados
export const saveDatabase = (db) => {
  try {
    // Verificar se profileChangeRequests existe antes de salvar
    if (!db.profileChangeRequests) {
      db.profileChangeRequests = [];
    }
    const saved = JSON.stringify(db);
    localStorage.setItem('fontea_database', saved);
    console.log('saveDatabase - Banco salvo. Total de solicitações:', db.profileChangeRequests?.length || 0);
    
    // Verificar se foi salvo corretamente
    const verify = JSON.parse(localStorage.getItem('fontea_database'));
    console.log('saveDatabase - Verificação: Total de solicitações após salvar:', verify.profileChangeRequests?.length || 0);
  } catch (error) {
    console.error('Erro ao salvar banco de dados:', error);
    throw error;
  }
};

// Função para encontrar usuário por ID, email ou id_empresa
export const findUser = (identifier, password = null) => {
  const db = getDatabase();
  const user = db.users.find(u => 
    u.id === identifier || 
    u.email === identifier || 
    u.id_empresa === identifier
  );
  
  if (!user) return null;
  
  if (password !== null && user.senha !== password) {
    return null;
  }
  
  return user;
};

// Função para obter briefings do usuário
export const getUserBriefings = (userId) => {
  const db = getDatabase();
  return db.briefings.filter(b => b.responsavel_id === userId);
};

// Função para obter estatísticas do usuário
export const getUserStats = (userId) => {
  const db = getDatabase();
  const userBriefings = db.briefings.filter(b => b.responsavel_id === userId);
  
  return {
    total: userBriefings.length,
    totalBriefings: userBriefings.length,
    aprovados: userBriefings.filter(b => b.status === 'aprovado').length,
    emRevisao: userBriefings.filter(b => b.status === 'em_revisao').length,
    rascunho: userBriefings.filter(b => b.status === 'rascunho').length,
    tempoMedioAprovacao: userBriefings.length > 0
      ? userBriefings.reduce((sum, b) => {
          const diff = new Date(b.data_atualizacao) - new Date(b.data_criacao);
          return sum + diff;
        }, 0) / userBriefings.length / (1000 * 60 * 60)
      : 0
  };
};

// Função para gerar ID único para novo usuário
const generateUserId = (idEmpresa) => {
  if (idEmpresa) {
    return `FON${idEmpresa}`;
  }
  const db = getDatabase();
  const existingIds = db.users.map(u => {
    if (u.id === getAdminCredentials().id) return 0;
    const num = parseInt(u.id.replace('FON', ''));
    return isNaN(num) ? 0 : num;
  });
  const nextNum = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  return `FON${String(nextNum).padStart(6, '0')}`;
};

// Função para criar novo usuário
export const createUser = (userData) => {
  try {
    const db = getDatabase();
    
    const emailExists = db.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (emailExists) {
      return { success: false, error: 'Este email já está cadastrado' };
    }

    // Verificar se id_empresa já existe (se fornecido)
    if (userData.id_empresa) {
      const idExists = db.users.some(u => u.id_empresa === userData.id_empresa);
      if (idExists) {
        return { success: false, error: 'Este ID da empresa já está cadastrado' };
      }
    }

    // Gerar ID se não fornecido
    const newId = userData.id || generateUserId(userData.id_empresa);
    
    // Verificar se ID já existe
    const idExists = db.users.some(u => u.id === newId);
    if (idExists) {
      return { success: false, error: 'Este ID já está cadastrado' };
    }

    const newUser = {
      id: newId,
      id_empresa: userData.id_empresa || String(db.users.length + 1).padStart(6, '0'),
      nome: userData.nome,
      email: userData.email.toLowerCase(),
      senha: userData.senha,
      cargo: userData.cargo,
      funcao: userData.funcao || userData.cargo,
      departamento: userData.departamento,
      telefone: userData.telefone,
      tipo_usuario: userData.tipo_usuario || 'analista',
      nivel_acesso: userData.nivel_acesso || 'basico',
      is_admin: userData.is_admin || false,
      ativo: userData.ativo !== undefined ? userData.ativo : true,
      pendente_aprovacao: userData.pendente_aprovacao !== undefined ? userData.pendente_aprovacao : false,
      briefings_criados: 0,
      ultimo_acesso: null,
      data_cadastro: userData.data_cadastro || new Date().toISOString(),
      lgpd_consentimento: userData.lgpd_consentimento || false,
      lgpd_finalidade: userData.lgpd_finalidade || '',
      lgpd_data_consentimento: userData.lgpd_data_consentimento || null,
      foto_perfil: userData.foto_perfil || null
    };

    db.users.push(newUser);
    saveDatabase(db);
    
    return { success: true, user: newUser };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { success: false, error: 'Erro ao criar usuário. Tente novamente.' };
  }
};

// Função para aprovar ou rejeitar usuário
export const approveUser = (userId, approved) => {
  try {
    const db = getDatabase();
    const userIndex = db.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    if (approved) {
      db.users[userIndex].ativo = true;
      db.users[userIndex].pendente_aprovacao = false;
    } else {
      // Rejeitar: remover o usuário
      db.users.splice(userIndex, 1);
    }
    
    saveDatabase(db);
    return { success: true };
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error);
    return { success: false, error: 'Erro ao processar aprovação' };
  }
};

// Função para obter usuários pendentes de aprovação
export const getPendingUsers = () => {
  const db = getDatabase();
  return db.users.filter(u => u.pendente_aprovacao === true);
};

// Função para criar solicitação de alteração de perfil (cargo/departamento)
export const createProfileChangeRequest = (userId, changes) => {
  try {
    const db = getDatabase();
    const user = db.users.find(u => u.id === userId);
    
    if (!user) {
      console.error('Usuário não encontrado para criar solicitação:', userId);
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Garantir que profileChangeRequests existe
    if (!db.profileChangeRequests) {
      db.profileChangeRequests = [];
    }

    // Verificar se já existe solicitação pendente para este usuário
    const existingRequestIndex = db.profileChangeRequests.findIndex(
      r => r.userId === userId && r.status === 'pendente'
    );
    
    const cargoAntigo = (user.cargo || '').trim();
    const cargoNovo = (changes.cargo || '').trim();
    const departamentoAntigo = (user.departamento || '').trim();
    const departamentoNovo = (changes.departamento || '').trim();
    const nivelAcessoAntigo = user.nivel_acesso || 'basico';
    const nivelAcessoNovo = changes.nivel_acesso || user.nivel_acesso || 'basico';
    
    console.log('createProfileChangeRequest - Valores:', {
      userId,
      cargoAntigo,
      cargoNovo,
      departamentoAntigo,
      departamentoNovo,
      nivelAcessoAntigo,
      nivelAcessoNovo,
      existingRequestIndex
    });
    
    if (existingRequestIndex !== -1) {
      // Atualizar solicitação existente
      const existingRequest = db.profileChangeRequests[existingRequestIndex];
      existingRequest.cargo_novo = cargoNovo;
      existingRequest.departamento_novo = departamentoNovo;
      existingRequest.cargo_antigo = cargoAntigo;
      existingRequest.departamento_antigo = departamentoAntigo;
      existingRequest.nivel_acesso_antigo = nivelAcessoAntigo;
      existingRequest.nivel_acesso_novo = nivelAcessoNovo;
      existingRequest.data_solicitacao = new Date().toISOString();
      console.log('Solicitação existente atualizada:', existingRequest);
    } else {
      // Criar nova solicitação
      const newRequest = {
        id: `PCR${Date.now()}`,
        userId: userId,
        nome_usuario: user.nome,
        email_usuario: user.email,
        cargo_antigo: cargoAntigo,
        cargo_novo: cargoNovo,
        departamento_antigo: departamentoAntigo,
        departamento_novo: departamentoNovo,
        nivel_acesso_antigo: nivelAcessoAntigo,
        nivel_acesso_novo: nivelAcessoNovo,
        status: 'pendente',
        data_solicitacao: new Date().toISOString(),
        aprovado_por: null,
        data_aprovacao: null
      };
      
      db.profileChangeRequests.push(newRequest);
      console.log('Nova solicitação criada:', newRequest);
    }
    
    saveDatabase(db);
    console.log('Solicitação salva no banco. Total de solicitações:', db.profileChangeRequests.length);
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar solicitação:', error);
    return { success: false, error: 'Erro ao criar solicitação: ' + error.message };
  }
};

// Função para obter solicitações de alteração pendentes
export const getPendingProfileChangeRequests = () => {
  const db = getDatabase();
  const requests = db.profileChangeRequests?.filter(r => r.status === 'pendente') || [];
  console.log('getPendingProfileChangeRequests - Total de solicitações pendentes:', requests.length);
  console.log('getPendingProfileChangeRequests - Solicitações:', requests);
  return requests;
};

// Função para aprovar ou rejeitar solicitação de alteração
export const approveProfileChangeRequest = (requestId, approved) => {
  try {
    const db = getDatabase();
    const requestIndex = db.profileChangeRequests?.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1 || !db.profileChangeRequests) {
      return { success: false, error: 'Solicitação não encontrada' };
    }

    const request = db.profileChangeRequests[requestIndex];
    const userIndex = db.users.findIndex(u => u.id === request.userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    if (approved) {
      // Aprovar: atualizar cargo, departamento e nível de acesso do usuário
      db.users[userIndex].cargo = request.cargo_novo;
      db.users[userIndex].departamento = request.departamento_novo;
      if (request.nivel_acesso_novo) {
        db.users[userIndex].nivel_acesso = request.nivel_acesso_novo;
      }
      
      // Atualizar solicitação
      request.status = 'aprovado';
      request.aprovado_por = getCurrentUserFromSession()?.userId || 'Sistema';
      request.data_aprovacao = new Date().toISOString();
    } else {
      // Rejeitar
      request.status = 'rejeitado';
      request.aprovado_por = getCurrentUserFromSession()?.userId || 'Sistema';
      request.data_aprovacao = new Date().toISOString();
    }
    
    saveDatabase(db);
    return { success: true };
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return { success: false, error: 'Erro ao processar solicitação' };
  }
};

// Função auxiliar para obter usuário atual
const getCurrentUserFromSession = () => {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('fontea_session');
  if (!session) return null;
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
};

// Função para deletar usuário (apenas admin)
export const deleteUser = (userId) => {
  try {
    const db = getDatabase();
    const userIndex = db.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    const user = db.users[userIndex];
    
    // Não permitir deletar o próprio admin
    if (user.is_admin || user.nivel_acesso === 'admin') {
      return { success: false, error: 'Não é possível deletar o administrador principal' };
    }

    // Remover usuário
    db.users.splice(userIndex, 1);
    
    // Remover briefings do usuário ou transferir para outro usuário
    // Por enquanto, vamos apenas remover os briefings
    db.briefings = db.briefings.filter(b => b.responsavel_id !== userId);
    
    saveDatabase(db);
    return { success: true };
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return { success: false, error: 'Erro ao deletar usuário' };
  }
};

// Função para atualizar perfil de usuário (admin)
export const updateUserProfile = (userId, userData) => {
  try {
    const db = getDatabase();
    const userIndex = db.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Atualizar dados do usuário
    db.users[userIndex] = {
      ...db.users[userIndex],
      ...userData,
      // Manter campos importantes
      id: db.users[userIndex].id,
      id_empresa: userData.id_empresa || db.users[userIndex].id_empresa
    };
    
    saveDatabase(db);
    return { success: true, user: db.users[userIndex] };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { success: false, error: 'Erro ao atualizar perfil' };
  }
};

