import { useState, useEffect, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive, isVipActive } from "../lib/plan";
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
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [filters, setFilters] = useState({
    gender: "Todos",
    maxDistance: 100,
    ageMin: 18,
    ageMax: 90,
    onlineOnly: false,
    locationSearch: "",
  });

  const [favorites, setFavorites] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [isVip, setIsVip] = useState(false);

  // Temporary diagnostic for the "en línea" report -- shows exactly what
  // this specific client/session sent and got back, to compare VIP+phone
  // vs VIP+PC side by side without needing Safari dev tools.
  const [queryDebug, setQueryDebug] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUserId) loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, filters.gender, filters.ageMin, filters.ageMax, filters.maxDistance, filters.onlineOnly]);

  // is_online is a snapshot from whenever the query ran -- without this, the
  // green dot would only ever reflect who was online at page load or the
  // last filter change, and would silently go stale the longer the page
  // stays open without a manual refresh (confirmed: this, not any VIP- or
  // device-specific branch, is what caused the "no se ve conectado" reports --
  // the debug panel showed a query 3 minutes old on a 2-minute threshold).
  useEffect(() => {
    if (!currentUserId) return;

    const interval = setInterval(() => {
      loadProfiles();
    }, 30000);

    // Also refresh immediately when the tab/app regains focus, so coming
    // back after switching apps or locking the screen doesn't leave a stale
    // snapshot on screen until the next 30s tick.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadProfiles();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const loadInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", user.id)
      .single();

    setIsPremium(isPlanActive(myProfile));
    setIsVip(isVipActive(myProfile));

    const { data: favoritesData } = await supabase
      .from("favorites")
      .select("favorite_profile_id")
      .eq("user_id", user.id);

    setFavorites((favoritesData || []).map((f) => f.favorite_profile_id));
  };

  const loadProfiles = async () => {
    setLoading(true);

    const rpcParams = {
      p_gender: filters.gender,
      p_min_age: filters.ageMin,
      p_max_age: filters.ageMax,
      p_max_distance_km: filters.maxDistance,
      p_exclude_swiped: false,
      p_limit: 60,
      p_online_only: filters.onlineOnly,
    };

    // Server-side: never returns anyone else's exact coordinates, only the
    // already-computed distance_km (or null if either side lacks location).
    const { data: profilesData, error } = await supabase.rpc("get_discoverable_profiles", rpcParams);

    if (error) {
      console.error("Error cargando perfiles:", error.message);
    } else {
      setProfiles(profilesData || []);
    }

    setQueryDebug({
      time: new Date().toLocaleTimeString(),
      currentUserId,
      isVip,
      isPremium,
      rpcParams,
      error: error?.message || null,
      count: profilesData?.length ?? 0,
      profiles: (profilesData || []).map((p) => ({ name: p.name, is_online: p.is_online })),
    });

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

      {queryDebug && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            background: "#0d1b3d",
            color: "#eaf1ff",
            fontSize: "11px",
            padding: "8px 10px",
            fontFamily: "monospace",
            maxHeight: "40vh",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px", color: "#7fd4ff" }}>
            queryDebug @ {queryDebug.time}
          </div>
          <div>currentUserId: {queryDebug.currentUserId}</div>
          <div>isVip: {String(queryDebug.isVip)} · isPremium: {String(queryDebug.isPremium)}</div>
          <div>rpcParams: {JSON.stringify(queryDebug.rpcParams)}</div>
          <div>error: {queryDebug.error || "ninguno"}</div>
          <div>count: {queryDebug.count}</div>
          <div>
            profiles: {queryDebug.profiles.map((p) => `${p.name}=${p.is_online}`).join(", ")}
          </div>
        </div>
      )}

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
                  {profile.mood}
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

    </div>
  );
}

export default Explore;