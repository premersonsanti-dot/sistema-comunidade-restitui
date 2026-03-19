
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email,
          email: session.user.email
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email,
          email: session.user.email
        });
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (stayConnected: boolean, credentials: { user: string; pass: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: credentials.user,
      password: credentials.pass,
    });

    if (error) {
      alert(`Erro ao entrar: ${error.message}`);
      return false;
    }

    if (stayConnected) {
      localStorage.setItem('medsys_remembered_user', JSON.stringify({
        user: credentials.user,
        pass: credentials.pass
      }));
    } else {
      localStorage.removeItem('medsys_remembered_user');
    }

    return true;
  };

  const handleRegister = async (userData: any) => {
    const { error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          clinic_code: userData.clinicCode
        }
      }
    });

    if (error) {
      alert(`Erro ao cadastrar: ${error.message}`);
      return false;
    }

    alert('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta antes de tentar o primeiro login.');
    return true;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      alert(`Erro ao entrar com Google: ${error.message}`);
    }
  };

  return {
    isLoggedIn,
    currentUser,
    loading,
    handleLogin,
    handleRegister,
    handleLogout,
    handleGoogleLogin
  };
};
