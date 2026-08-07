import { useState, useEffect, Fragment } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { isPlanActive, isVipActive } from "../lib/plan";
import { GENDER_FILTER_ALL } from "../data/profileOptions";
import { moodLabel } from "../lib/profileLabels";
import FilterBar from "../components/filters/FilterBar";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import HouseAdBanner from "../components/ads/HouseAdBanner";
import BoostIcon from "../components/ui/BoostIcon";
import SearchIcon from "../components/ui/SearchIcon";
import "../styles/Explore.css";
import "../styles/BackButton.css";

const AD_EVERY_N_PROFILES = 6;

function Explore() {
  // ProtectedRoute already blocks rendering until useAuth's session is
  // resolved, so reading the id straight from context here avoids a second,
  // independent supabase.auth.getUser() network round-trip -- that redundant
  // call was the confirmed cause of a mobile session reading isVip/isPremium
  // as false for an account with a genuinely active VIP plan (a getUser()
  // race against a not-yet-refreshed token that useAuth's own
  // getSession()+onAuthStateChange flow doesn't have).
  const { t } = useTranslation();
  const { session } = useAuth();
  const currentUserId = session?.user?.id ?? null;

  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    gender: GENDER_FILTER_ALL,
    maxDistance: 100,
    ageMin: 18,
    ageMax: 90,
    onlineOnly: false,
    locationSearch: "",
  });

  const [favorites, setFavorites] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [isVip, setIsVip] = useState(false);

  // Temporary on-screen diagnostic for the asymmetric online-status bug --
  // no Safari devtools access on the phone, so this surfaces the exact RPC
  // params/response/timing directly on screen instead. Remove once resolved.
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [debugLog, setDebugLog] = useState([]);
  const [visEvents, setVisEvents] = useState(0);
  const [lastVisChangeAt, setLastVisChangeAt] = useState(null);
  const [lastVisState, setLastVisState] = useState(
    typeof document !== "undefined" ? document.visibilityState : "unknown"
  );
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!debugOpen) return;
    const tick = setInterval(() => forceTick((x) => x + 1), 1000);
    return () => clearInterval(tick);
  }, [debugOpen]);

  useEffect(() => {
    if (currentUserId) loadInitialData(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) loadProfiles("mount/filters");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, filters.gender, filters.ageMin, filters.ageMax, filters.maxDistance, filters.onlineOnly]);

  // is_online is a snapshot from whenever the query ran -- without this, the
  // green dot would only ever reflect who was online at page load or the
  // last filter change, and would silently go stale the longer the page
  // stays open without a manual refresh.
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
      loadProfiles("interval");
    }, 30000);

    // Also refresh immediately when the tab/app regains focus, so coming
    // back after switching apps or locking the screen doesn't leave a stale
    // snapshot on screen until the next 30s tick.
    const handleVisibilityChange = () => {
      setVisEvents((prev) => prev + 1);
      setLastVisChangeAt(Date.now());
      setLastVisState(document.visibilityState);
      if (document.visibilityState === "visible") loadProfiles("visibilitychange");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const loadInitialData = async (userId) => {
    const { data: myProfile, error: profileError } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error cargando el plan propio:", profileError.message, profileError);
    }

    setIsPremium(isPlanActive(myProfile));
    setIsVip(isVipActive(myProfile));

    const { data: favoritesData, error: favoritesError } = await supabase
      .from("favorites")
      .select("favorite_profile_id")
      .eq("user_id", userId);

    if (favoritesError) {
      console.error("Error cargando favoritos:", favoritesError.message, favoritesError);
    }

    setFavorites((favoritesData || []).map((f) => f.favorite_profile_id));
  };

  const loadProfiles = async (reason = "unknown") => {
    setLoading(true);

    const rpcParams = {
      p_gender: filters.gender === GENDER_FILTER_ALL ? null : filters.gender,
      p_min_age: filters.ageMin,
      p_max_age: filters.ageMax,
      p_max_distance_km: filters.maxDistance,
      p_exclude_swiped: false,
      p_limit: 60,
      p_online_only: filters.onlineOnly,
    };

    // Server-side: never returns anyone else's exact coordinates, only the
    // already-computed distance_km (or null if either side lacks location).
    const calledAt = Date.now();
    const [profilesResult, serverTimeResult] = await Promise.all([
      supabase.rpc("get_discoverable_profiles", rpcParams),
      // get_server_time() is a diagnostic-only RPC (see chat) -- if it
      // hasn't been created yet in this DB, this just errors out silently
      // below and the rest of the panel still works.
      supabase.rpc("get_server_time"),
    ]);
    const respondedAt = Date.now();

    const { data: profilesData, error } = profilesResult;
    const { data: serverTimeData, error: serverTimeError } = serverTimeResult;

    if (error) {
      console.error("Error cargando perfiles:", error.message);
    } else {
      setProfiles(profilesData || []);
    }

    const rows = (profilesData || []).map((p) => ({
      id: p.id,
      name: p.name,
      is_online: p.is_online,
      plan: p.plan,
    }));

    const serverNow = serverTimeError ? null : new Date(serverTimeData).getTime();
    const roundTripMs = respondedAt - calledAt;
    // Rough estimate assuming symmetric latency: the server likely evaluated
    // "now()" around the midpoint of the request/response round trip.
    const estimatedSkewMs = serverNow ? serverNow - (calledAt + roundTripMs / 2) : null;

    setDebugInfo((prev) => ({
      at: calledAt,
      reason,
      currentUserId,
      rpcParams,
      error: error?.message || null,
      rowCount: rows.length,
      pollCount: (prev?.pollCount || 0) + 1,
      rows,
      serverTimeError: serverTimeError?.message || null,
      serverNow,
      roundTripMs,
      estimatedSkewMs,
    }));

    setDebugLog((prev) => [{ at: calledAt, reason, rowCount: rows.length, rows }, ...prev].slice(0, 8));

    setLoading(false);
  };

  const toggleFavorite = async (profileId) => {
    const isFav = favorites.includes(profileId);

    if (isFav) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", currentUserId)
        .eq("favorite_profile_id", profileId);

      setFavorites((prev) => prev.filter((id) => id !== profileId));
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: currentUserId, favorite_profile_id: profileId });

      setFavorites((prev) => [...prev, profileId]);
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Gender/age/distance are already applied server-side (get_discoverable_profiles);
  // only the free-text search boxes still need filtering here.
  const filteredProfiles = profiles.filter((profile) => {
    const matchesSearch = profile.name?.toLowerCase().includes(search.toLowerCase());
    const matchesLocation =
      !filters.locationSearch ||
      profile.city?.toLowerCase().includes(filters.locationSearch.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  return (
    <div className="explore">

      <div className="explore-bg-decor">
        <span className="blob blob-1"></span>
        <span className="blob blob-2"></span>
      </div>

      <BackButton />

      <div className="explore-header">

        <h1>Explorar perfiles</h1>

        <div className="search-box">

          <span className="search-icon"><SearchIcon size={17} /></span>

          <input
            type="text"
            placeholder="Buscar personas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

      </div>

      <FilterBar filters={filters} onChange={updateFilter} isPremium={isPremium} isVip={isVip} />

      {loading ? (

        <p style={{ textAlign: "center", marginTop: "40px" }}>Cargando perfiles...</p>

      ) : filteredProfiles.length === 0 ? (

        <div className="no-results">
          <h2>😕 Aún no hay perfiles para mostrar</h2>
          <p>Cuando más personas se unan a MyPinky, aparecerán aquí.</p>
        </div>

      ) : (

        <div className="profiles-grid">

          {filteredProfiles.map((profile, index) => (

            <Fragment key={profile.id}>

            <div className={`profile-card ${profile.is_boosted ? "is-boosted" : ""}`}>

              <div className="profile-image">

                <img
                  src={profile.photos?.[0] || "https://via.placeholder.com/300"}
                  alt={profile.name}
                />

                {profile.is_online && <span className="online-dot" title="En línea"></span>}

                <div className="image-overlay">

                  {isVipActive(profile) ? (
                    <span className="premium-badge"><VipDiamond size={14} /> VIP</span>
                  ) : isPlanActive(profile) && profile.plan === "premium" ? (
                    <span className="premium-badge"><PremiumDiamond size={14} /> Premium</span>
                  ) : null}

                </div>

              </div>

              <div className="profile-info">

                {profile.is_boosted && (
                  <span className="boosted-tag"><BoostIcon size={12} /> Destacado</span>
                )}

                <div className="profile-top">

                  <h3>{profile.name}</h3>

                  <span className="age">
                    {profile.age}
                  </span>

                </div>

                <p className="country">
                  📍 {profile.city}
                  {typeof profile.distance_km === "number" && ` · ${Math.round(profile.distance_km)} km`}
                </p>

                <div className="mood-badge">
                  {moodLabel(t, profile.mood)}
                </div>

                <div className="profile-actions">

                  <button
                    className={`favorite-btn ${favorites.includes(profile.id) ? "active" : ""}`}
                    onClick={() => toggleFavorite(profile.id)}
                  >
                    {favorites.includes(profile.id) ? "❤️" : "🤍"}
                  </button>

                  <Link
                    to={`/profile/${profile.id}`}
                    className="profile-button"
                  >
                    Ver perfil
                  </Link>

                </div>

              </div>

            </div>

            {!isPremium && (index + 1) % AD_EVERY_N_PROFILES === 0 && (
              <HouseAdBanner variant="grid" />
            )}

            </Fragment>

          ))}

        </div>

      )}

      <button
        type="button"
        onClick={() => setDebugOpen((prev) => !prev)}
        style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          zIndex: 5000,
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: "none",
          background: "#222",
          color: "#fff",
          fontSize: "16px",
          opacity: 0.55,
        }}
      >
        🔍
      </button>

      {debugOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "60px",
            left: "16px",
            zIndex: 5000,
            width: "min(340px, calc(100vw - 32px))",
            maxHeight: "70vh",
            overflowY: "auto",
            background: "rgba(20,20,20,.95)",
            color: "#0f0",
            fontFamily: "monospace",
            fontSize: "11px",
            padding: "10px",
            borderRadius: "10px",
            lineHeight: 1.5,
          }}
        >
          <div><b>currentUserId:</b> {debugInfo?.currentUserId || "—"}</div>
          <div><b>isVip / isPremium:</b> {String(isVip)} / {String(isPremium)}</div>
          <div><b>pollCount:</b> {debugInfo?.pollCount ?? 0}</div>
          <div>
            <b>lastFetch:</b>{" "}
            {debugInfo?.at
              ? `${new Date(debugInfo.at).toLocaleTimeString()} (hace ${Math.round((Date.now() - debugInfo.at) / 1000)}s, causa: ${debugInfo.reason})`
              : "—"}
          </div>
          <div>
            <b>visibilityState:</b> {lastVisState} ·{" "}
            <b>cambios:</b> {visEvents}
            {lastVisChangeAt && ` (último hace ${Math.round((Date.now() - lastVisChangeAt) / 1000)}s)`}
          </div>
          {debugInfo?.error && <div style={{ color: "#f66" }}><b>error:</b> {debugInfo.error}</div>}
          <div>
            <b>server now:</b>{" "}
            {debugInfo?.serverTimeError
              ? `error: ${debugInfo.serverTimeError} (corre la migración de get_server_time)`
              : debugInfo?.serverNow
              ? new Date(debugInfo.serverNow).toLocaleTimeString(undefined, { hour12: false, second: "2-digit", minute: "2-digit", hour: "2-digit", fractionalSecondDigits: 3 })
              : "—"}
          </div>
          <div>
            <b>round-trip:</b> {debugInfo?.roundTripMs ?? "—"}ms ·{" "}
            <b>skew estimado:</b> {debugInfo?.estimatedSkewMs != null ? `${debugInfo.estimatedSkewMs}ms` : "—"}
          </div>
          <div><b>rowCount:</b> {debugInfo?.rowCount ?? "—"}</div>
          <div><b>rpcParams:</b> {JSON.stringify(debugInfo?.rpcParams)}</div>
          <div style={{ marginTop: "6px" }}>
            <b>search filter:</b> "{search}"
          </div>
          <div style={{ marginTop: "4px", borderTop: "1px solid #444", paddingTop: "6px" }}>
            {(debugInfo?.rows || [])
              .filter((r) => !search || r.name?.toLowerCase().includes(search.toLowerCase()))
              .map((r) => (
                <div key={r.id}>
                  {r.is_online ? "🟢" : "⚪"} {r.name} · plan={r.plan || "free"} · id={r.id.slice(0, 8)}
                </div>
              ))}
            {search && !(debugInfo?.rows || []).some((r) => r.name?.toLowerCase().includes(search.toLowerCase())) && (
              <div style={{ color: "#f66" }}>"{search}" no aparece en esta respuesta ({debugInfo?.rowCount ?? 0} filas totales)</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => loadProfiles("manual")}
            style={{
              marginTop: "8px",
              padding: "6px 10px",
              background: "#ff3f87",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontFamily: "inherit",
              fontSize: "11px",
            }}
          >
            Refetch ahora
          </button>
          <div style={{ marginTop: "8px", borderTop: "1px solid #444", paddingTop: "6px" }}>
            <b>historial (últimos {debugLog.length}):</b>
            {debugLog.map((entry, i) => {
              const match = search && entry.rows.find((r) => r.name?.toLowerCase().includes(search.toLowerCase()));
              return (
                <div key={i}>
                  {new Date(entry.at).toLocaleTimeString()} · {entry.reason} · {entry.rowCount} filas
                  {search && (match ? ` · "${search}": ${match.is_online ? "🟢" : "⚪"}` : ` · "${search}": no aparece`)}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

export default Explore;