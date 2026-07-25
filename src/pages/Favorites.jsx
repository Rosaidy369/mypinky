import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive, isVipActive } from "../lib/plan";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import "../styles/Explore.css";
import "../styles/Favorites.css";
import "../styles/BackButton.css";

function Favorites() {
  const navigate = useNavigate();
  const [favoriteProfiles, setFavoriteProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data, error } = await supabase
      .from("favorites")
      .select("favorite_profile_id, profiles:favorite_profile_id(*)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error cargando favoritos:", error.message);
    } else {
      setFavoriteProfiles((data || []).map((f) => f.profiles).filter(Boolean));
    }

    setLoading(false);
  };

  const toggleFavorite = async (profileId) => {
    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", currentUserId)
      .eq("favorite_profile_id", profileId);

    setFavoriteProfiles((prev) => prev.filter((p) => p.id !== profileId));
  };

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando favoritos...</div>;
  }

  return (
    <div className="explore">

      <div className="explore-bg-decor">
        <span className="blob blob-1"></span>
        <span className="blob blob-2"></span>
      </div>

      <BackButton />

      <div className="explore-header">
        <h1>Mis favoritos</h1>
        <p className="favorites-subtitle">
          Perfiles que has guardado para ver después
        </p>
      </div>

      {favoriteProfiles.length === 0 ? (

        <div className="favorites-empty">
          <div className="favorites-empty-icon">💔</div>
          <h2>Aún no tienes favoritos</h2>
          <p>Toca el corazón en cualquier perfil de Explorar para guardarlo aquí.</p>
          <Link to="/explore" className="favorites-empty-btn">
            Ir a Explorar
          </Link>
        </div>

      ) : (

        <div className="profiles-grid">

          {favoriteProfiles.map((profile) => (

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
                    <span className="premium-badge">💎 Premium</span>
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
                </p>

                <div className="mood-badge">
                  {profile.mood}
                </div>

                <div className="profile-actions">

                  <button
                    className="favorite-btn active"
                    onClick={() => toggleFavorite(profile.id)}
                  >
                    ❤️
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

export default Favorites;