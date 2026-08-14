import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import i18n from "../lib/i18n";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suspension, setSuspension] = useState(null);
  const [suspensionLoading, setSuspensionLoading] = useState(true);
  const [birthDateGateNeeded, setBirthDateGateNeeded] = useState(false);

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

  // Checked once per session (not per route) so a suspended/unmigrated user
  // can't see a flash of real app content while this resolves —
  // ProtectedRoute treats suspensionLoading as part of its own "still
  // loading" state.
  const loadGates = async (userId, isCancelled = () => false) => {
    if (!userId) {
      setSuspension(null);
      setBirthDateGateNeeded(false);
      setSuspensionLoading(false);
      return;
    }

    setSuspensionLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("suspended_until, suspension_reason, preferred_language, age, birth_date")
      .eq("id", userId)
      .single();

    if (isCancelled()) return;

    if (error) {
      console.error("Error verificando estado de la cuenta:", error.message, error);
    }

    const isActive = data?.suspended_until && new Date(data.suspended_until) > new Date();

    setSuspension(
      isActive ? { until: data.suspended_until, reason: data.suspension_reason } : null
    );

    // Only accounts created before birth_date existed (they have a real
    // typed-in age but never a birth date) hit the one-time migration gate
    // -- a brand-new signup gets birth_date immediately, and a fresh Google
    // signup has neither field yet and just fills it in during normal
    // onboarding, same as it fills in everything else. Both of those must
    // NOT trigger this gate.
    setBirthDateGateNeeded(data?.age != null && data?.birth_date == null);

    setSuspensionLoading(false);

    // Cross-device sync: an explicit stored preference wins over
    // whatever localStorage/browser default this particular device
    // detected on its own.
    if (data?.preferred_language && data.preferred_language !== i18n.language) {
      i18n.changeLanguage(data.preferred_language);
    }
  };

  useEffect(() => {
    const userId = session?.user?.id;
    let cancelled = false;

    loadGates(userId, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const refetchGates = () => loadGates(session?.user?.id);

  const register = async (email, password, name, birthDate) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, birth_date: birthDate },
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
      value={{
        session,
        isLoggedIn,
        loading,
        suspension,
        suspensionLoading,
        birthDateGateNeeded,
        refetchGates,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}