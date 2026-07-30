import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive, isVipActive } from "../lib/plan";
import FilterBar from "../components/filters/FilterBar";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import "../styles/Explore.css";
import "../styles/BackButton.css";

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

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (currentUserId) loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, filters.gender, filters.ageMin, filters.ageMax, filters.maxDistance]);

  const loadInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    setIsPremium(isPlanActive(myProfile));

    const { data: favoritesData } = await supabase
      .from("favorites")
      .select("favorite_profile_id")
      .eq("user_id", user.id);

    setFavorites((favoritesData || []).map((f) => f.favorite_profile_id));
  };

  const loadProfiles = async () => {
    setLoading(true);

    // Server-side: never returns anyone else's exact coordinates, only the
    // already-computed distance_km (or null if either side lacks location).
    const { data: profilesData, error } = await supabase.rpc("get_discoverable_profiles", {
      p_gender: filters.gender,
      p_min_age: filters.ageMin,
      p_max_age: filters.ageMax,
      p_max_distance_km: filters.maxDistance,
      p_exclude_swiped: false,
      p_limit: 60,
    });

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

          <span className="search-icon">🔍</span>

          <input
            type="text"
            placeholder="Buscar personas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

      </div>

      <FilterBar filters={filters} onChange={updateFilter} isPremium={isPremium} />

      {loading ? (

        <p style={{ textAlign: "center", marginTop: "40px" }}>Cargando perfiles...</p>

      ) : filteredProfiles.length === 0 ? (

        <div className="no-results">
          <h2>😕 Aún no hay perfiles para mostrar</h2>
          <p>Cuando más personas se unan a MyPinky, aparecerán aquí.</p>
        </div>

      ) : (

        <div className="profiles-grid">

          {filteredProfiles.map((profile) => (

            <div className="profile-card" key={profile.id}>

              <div className="profile-image">

                <img
                  src={profile.photos?.[0] || "https://via.placeholder.com/300"}
                  alt={profile.name}
                />

                <div className="image-overlay">

                  {isVipActive(profile) ? (
                    <span className="premium-badge"><VipDiamond size={14} /> VIP</span>
                  ) : isPlanActive(profile) && profile.plan === "premium" ? (
                    <span className="premium-badge"><PremiumDiamond size={14} /> Premium</span>
                  ) : null}

                </div>

              </div>

              <div className="profile-info">

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

          ))}

        </div>

      )}

    </div>
  );
}

export default Explore;