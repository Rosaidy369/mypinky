import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import i18n from "../lib/i18n";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suspension, setSuspension] = useState(null);
  const [suspensionLoading, setSuspensionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Checked once per session (not per route) so a suspended user can't see
  // a flash of real app content while this resolves — ProtectedRoute treats
  // suspensionLoading as part of its own "still loading" state.
  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      setSuspension(null);
      setSuspensionLoading(false);
      return;
    }

    let cancelled = false;
    setSuspensionLoading(true);

    supabase
      .from("profiles")
      .select("suspended_until, suspension_reason, preferred_language")
      .eq("id", userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error("Error verificando estado de suspensión:", error.message, error);
        }

        const isActive = data?.suspended_until && new Date(data.suspended_until) > new Date();

        setSuspension(
          isActive ? { until: data.suspended_until, reason: data.suspension_reason } : null
        );
        setSuspensionLoading(false);

        // Cross-device sync: an explicit stored preference wins over
        // whatever localStorage/browser default this particular device
        // detected on its own.
        if (data?.preferred_language && data.preferred_language !== i18n.language) {
          i18n.changeLanguage(data.preferred_language);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const register = async (email, password, name, age) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, age },
        emailRedirectTo: `${window.location.origin}/correo-verificado`,
      },
    });
    return { data, error };
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const isLoggedIn = !!session;

  return (
    <AuthContext.Provider
      value={{ session, isLoggedIn, loading, suspension, suspensionLoading, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}