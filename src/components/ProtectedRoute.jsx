import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import SuspendedScreen from "./SuspendedScreen";

const HEARTBEAT_INTERVAL_MS = 90000;

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, suspension, suspensionLoading, session } = useAuth();
  const location = useLocation();
  const userId = session?.user?.id;

  // Temporary on-screen diagnostic for the "en línea" report -- shows
  // whether the heartbeat effect is actually running and succeeding on
  // this exact device/session, without needing console access.
  const [heartbeatDebug, setHeartbeatDebug] = useState("aún no se ha ejecutado");

  // Powers "Solo conectados": a simple heartbeat while the user is on any
  // protected page, rather than tracking real presence/sockets.
  useEffect(() => {
    if (!userId || suspension) {
      setHeartbeatDebug(`detenido (userId: ${userId ? "sí" : "no"}, suspendido: ${suspension ? "sí" : "no"})`);
      return;
    }

    const updateLastSeen = async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        console.error("Error actualizando last_seen_at:", error.message);
        setHeartbeatDebug(`ERROR: ${error.message} (${new Date().toLocaleTimeString()})`);
      } else {
        setHeartbeatDebug(`OK: enviado a las ${new Date().toLocaleTimeString()}`);
      }
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, HEARTBEAT_INTERVAL_MS);

    // Mobile browsers throttle/pause timers once the tab loses focus or the
    // screen locks, so the 90s interval alone can leave a stale last_seen_at
    // for a while after switching back -- fire an extra update immediately
    // when the app becomes visible again instead of waiting for the next tick.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateLastSeen();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: "#e63946",
          color: "white",
          fontSize: "12px",
          padding: "6px 10px",
          textAlign: "center",
          fontFamily: "monospace",
        }}
      >
        HEARTBEAT: {heartbeatDebug}
      </div>
      {children}
    </>
  );
}

export default ProtectedRoute;