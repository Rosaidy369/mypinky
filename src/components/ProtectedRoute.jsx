import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import SuspendedScreen from "./SuspendedScreen";

const HEARTBEAT_INTERVAL_MS = 90000;
const ACTIVITY_MIN_GAP_MS = 45000;
const MAX_LOG_ENTRIES = 8;

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading, suspension, suspensionLoading, session } = useAuth();
  const location = useLocation();
  const userId = session?.user?.id;

  // Temporary on-screen diagnostic for the "en línea" report -- logs EVERY
  // attempt (not just successes), shows the exact error for failed ones,
  // and a live "segundos desde el último intento" counter driven by its own
  // 1s ticker so a frozen interval is visible in real time (the counter
  // just keeps climbing past ~90-100s) instead of only discoverable minutes
  // later by re-checking the database.
  const [heartbeatLog, setHeartbeatLog] = useState([]);
  const [secondsSinceLastAttempt, setSecondsSinceLastAttempt] = useState(null);
  const lastSentAtRef = useRef(0);
  const lastAttemptTimeRef = useRef(null);

  useEffect(() => {
    const tick = setInterval(() => {
      if (lastAttemptTimeRef.current) {
        setSecondsSinceLastAttempt(Math.floor((Date.now() - lastAttemptTimeRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Powers "Solo conectados": a simple heartbeat while the user is on any
  // protected page, rather than tracking real presence/sockets.
  useEffect(() => {
    if (!userId || suspension) {
      setHeartbeatLog((prev) => [
        { time: new Date().toLocaleTimeString(), status: `detenido (userId: ${userId ? "sí" : "no"}, suspendido: ${suspension ? "sí" : "no"})` },
        ...prev,
      ].slice(0, MAX_LOG_ENTRIES));
      return;
    }

    const updateLastSeen = async (source) => {
      const attemptTime = new Date();
      lastSentAtRef.current = Date.now();
      lastAttemptTimeRef.current = Date.now();
      setSecondsSinceLastAttempt(0);

      let entry;
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ last_seen_at: attemptTime.toISOString() })
          .eq("id", userId);

        entry = error
          ? { time: attemptTime.toLocaleTimeString(), status: `ERROR (${source}): ${error.message}` }
          : { time: attemptTime.toLocaleTimeString(), status: `OK (${source})` };

        if (error) console.error("Error actualizando last_seen_at:", error.message);
      } catch (err) {
        entry = { time: attemptTime.toLocaleTimeString(), status: `EXCEPCIÓN (${source}): ${err.message}` };
        console.error("Excepción actualizando last_seen_at:", err);
      }

      setHeartbeatLog((prev) => [entry, ...prev].slice(0, MAX_LOG_ENTRIES));
    };

    updateLastSeen("inicial");
    const interval = setInterval(() => updateLastSeen("intervalo 90s"), HEARTBEAT_INTERVAL_MS);

    // Mobile browsers throttle/pause timers once the tab loses focus or the
    // screen locks, so the 90s interval alone can leave a stale last_seen_at
    // for a while after switching back -- fire an extra update immediately
    // when the app becomes visible again instead of waiting for the next tick.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateLastSeen("visibilitychange");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Belt-and-suspenders: some browsers throttle background/idle timers
    // even while the tab stays in the foreground (power-saving heuristics
    // based on lack of interaction, not just tab visibility). Real taps/
    // clicks/scrolls are a much more reliable "still actually here" signal
    // than a bare setInterval, so piggyback a heartbeat on those too,
    // throttled so it doesn't fire on every single click.
    const handleActivity = () => {
      if (Date.now() - lastSentAtRef.current >= ACTIVITY_MIN_GAP_MS) {
        updateLastSeen("actividad");
      }
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

  const secondsLabel = secondsSinceLastAttempt === null ? "—" : `${secondsSinceLastAttempt}s`;
  const secondsIsStale = secondsSinceLastAttempt !== null && secondsSinceLastAttempt > 100;

  return (
    <>
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: "#1a1a1a",
          color: "white",
          fontSize: "11px",
          padding: "8px 10px",
          fontFamily: "monospace",
          maxHeight: "40vh",
          overflowY: "auto",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "4px", color: secondsIsStale ? "#ff5c5c" : "#5cff8f" }}>
          Segundos desde el último intento: {secondsLabel} {secondsIsStale && "⚠️ el temporizador parece detenido"}
        </div>

        {heartbeatLog.map((entry, i) => (
          <div key={i} style={{ opacity: i === 0 ? 1 : 0.7 }}>
            {entry.time} — {entry.status}
          </div>
        ))}
      </div>
      {children}
    </>
  );
}

export default ProtectedRoute;