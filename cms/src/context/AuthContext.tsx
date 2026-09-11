import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'editor' | 'admin';

interface AuthContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
  username: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    return (localStorage.getItem('peblo_cms_role') as UserRole) || 'editor';
  });

  useEffect(() => {
    localStorage.setItem('peblo_cms_role', role);
  }, [role]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  const username = role === 'admin' ? 'admin_user' : 'content_editor';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ role, setRole, isAdmin, username }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
