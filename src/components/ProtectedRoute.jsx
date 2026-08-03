import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import SuspendedScreen from "./SuspendedScreen";

const HEARTBEAT_INTERVAL_MS = 90000;

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, suspension, suspensionLoading, session } = useAuth();
  const location = useLocation();
  const userId = session?.user?.id;

  // Powers "Solo conectados": a simple heartbeat while the user is on any
  // protected page, rather than tracking real presence/sockets.
  useEffect(() => {
    if (!userId || suspension) return;

    const updateLastSeen = async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        console.error("Error actualizando last_seen_at:", error.message);
      }
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId, suspension]);

  if (loading || (isLoggedIn && suspensionLoading)) {
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando...</div>;
  }

  if (!isLoggedIn) {
    sessionStorage.setItem("mypinky_redirect_after_login", location.pathname);
    return <Navigate to="/login" replace />;
  }

  if (suspension) {
    return <SuspendedScreen suspension={suspension} />;
  }

  return children;
}

export default ProtectedRoute;