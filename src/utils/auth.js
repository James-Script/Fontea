// Sistema de autenticação

import { findUser, getDatabase, saveDatabase } from '../data/database'

export const login = (identifier, password) => {
  const user = findUser(identifier, password);
  
  if (user && user.ativo && !user.pendente_aprovacao) {
    // Salvar sessão
    const session = {
      userId: user.id,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      tipo_usuario: user.tipo_usuario,
      nivel_acesso: user.nivel_acesso,
      is_admin: user.is_admin || false,
      loginTime: new Date().toISOString()
    };
    
    localStorage.setItem('fontea_session', JSON.stringify(session));
    
    // Atualizar último acesso
    const db = getDatabase();
    const userIndex = db.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      db.users[userIndex].ultimo_acesso = new Date().toISOString();
      saveDatabase(db);
    }
    
    return { success: true, user: session };
  }
  
  if (user && !user.ativo) {
    return { success: false, error: 'Sua conta está inativa. Entre em contato com o administrador.' };
  }
  
  if (user && user.pendente_aprovacao) {
    return { success: false, error: 'Sua conta está aguardando aprovação do administrador.' };
  }
  
  return { success: false, error: 'ID/Email ou senha incorretos' };
};

export const logout = () => {
  localStorage.removeItem('fontea_session');
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  const session = localStorage.getItem('fontea_session');
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

export const hasPermission = (requiredLevel) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin sempre tem todas as permissões
  if (user.is_admin || user.nivel_acesso === 'admin') {
    return true;
  }
  
  const levels = { basico: 1, mediano: 2, total: 3 };
  const userLevel = levels[user.nivel_acesso] || 0;
  const required = levels[requiredLevel] || 0;
  
  return userLevel >= required;
};

export const canApproveBriefings = () => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin sempre pode aprovar
  if (user.is_admin || user.nivel_acesso === 'admin') {
    return true;
  }
  
  return user.nivel_acesso === 'mediano' || user.nivel_acesso === 'total';
};

export const canManageUsers = () => {
  const user = getCurrentUser();
  if (!user) return false;
  // Admin ou nível total
  return user.is_admin || user.nivel_acesso === 'admin' || hasPermission('total');
};

// Função para verificar se pode aprovar cadastros (Coordenadores e Admins)
export const canApproveUsers = () => {
  const user = getCurrentUser();
  if (!user) return false;
  // Admin, nível total (coordenadores) ou nível mediano (gestores)
  return user.is_admin || 
         user.nivel_acesso === 'admin' || 
         user.nivel_acesso === 'total' || 
         user.nivel_acesso === 'mediano';
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.is_admin === true || user?.nivel_acesso === 'admin';
};

export const canDeleteBriefings = () => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Admin sempre pode deletar
  if (user.is_admin || user.nivel_acesso === 'admin') {
    return true;
  }
  
  return hasPermission('total');
};

