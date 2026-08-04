import { useState, useEffect, Fragment } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
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
  // ProtectedRoute already blocks rendering until useAuth's session is
  // resolved, so reading the id straight from context here avoids a second,
  // independent supabase.auth.getUser() network round-trip -- that redundant
  // call was the confirmed cause of a mobile session reading isVip/isPremium
  // as false for an account with a genuinely active VIP plan (a getUser()
  // race against a not-yet-refreshed token that useAuth's own
  // getSession()+onAuthStateChange flow doesn't have).
  const { session } = useAuth();
  const currentUserId = session?.user?.id ?? null;

  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (currentUserId) loadInitialData(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, filters.gender, filters.ageMin, filters.ageMax, filters.maxDistance, filters.onlineOnly]);

  // is_online is a snapshot from whenever the query ran -- without this, the
  // green dot would only ever reflect who was online at page load or the
  // last filter change, and would silently go stale the longer the page
  // stays open without a manual refresh.
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