import { useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import SuspendedScreen from "./SuspendedScreen";

const HEARTBEAT_INTERVAL_MS = 90000;
const ACTIVITY_MIN_GAP_MS = 45000;

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, suspension, suspensionLoading, session } = useAuth();
  const location = useLocation();
  const userId = session?.user?.id;

  const lastSentAtRef = useRef(0);

  // Powers "Solo conectados": a simple heartbeat while the user is on any
  // protected page, rather than tracking real presence/sockets.
  useEffect(() => {
    if (!userId || suspension) return;

    const updateLastSeen = async () => {
      lastSentAtRef.current = Date.now();

      const { error } = await supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) console.error("Error actualizando last_seen_at:", error.message);
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, HEARTBEAT_INTERVAL_MS);

    // Mobile browsers throttle/pause timers once the tab loses focus or the
    // screen locks, so the 90s interval alone can leave a stale last_seen_at
    // for a while after switching back -- fire an extra update immediately
    // when the app becomes visible again instead of waiting for the next tick.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") updateLastSeen();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Belt-and-suspenders: some browsers throttle background/idle timers
    // even while the tab stays in the foreground (power-saving heuristics
    // based on lack of interaction, not just tab visibility). Real taps/
    // clicks/scrolls are a much more reliable "still actually here" signal
    // than a bare setInterval, so piggyback a heartbeat on those too,
    // throttled so it doesn't fire on every single click.
    const handleActivity = () => {
      if (Date.now() - lastSentAtRef.current >= ACTIVITY_MIN_GAP_MS) updateLastSeen();
    };
    window.addEventListener("click", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("scroll", handleActivity, true);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleActivity, true);
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

  return children;
}

export default ProtectedRoute;
