import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive } from "../lib/plan";
import { useNotifications } from "../hooks/useNotifications";
import BackButton from "../components/ui/BackButton";
import EyeIcon from "../components/ui/EyeIcon";
import StarIcon from "../components/ui/StarIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import "../styles/WhoLikedMe.css";
import "../styles/BackButton.css";

function WhoLikedMe() {
  const navigate = useNavigate();
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const { markLikesViewed } = useNotifications();

  useEffect(() => {
    loadLikers();
    markLikesViewed();
  }, []);

  const loadLikers = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    setIsPremium(isPlanActive(myProfile));

    const [{ data: swipesData, error: swipesError }, { data: matchesData, error: matchesError }] = await Promise.all([
      supabase
        .from("swipes")
        .select("swiper_id, direction, profiles:swiper_id(*)")
        .eq("swiped_profile_id", user.id)
        .in("direction", ["like", "superlike"]),
      supabase
        .from("matches")
        .select("user_id, matched_profile_id")
        .or(`user_id.eq.${user.id},matched_profile_id.eq.${user.id}`),
    ]);

    if (swipesError || matchesError) {
      console.error("Error cargando likes:", swipesError?.message || matchesError?.message);
    } else {
      // Someone already matched shouldn't also show up here as a "pending"
      // like -- Matches.jsx is the one place for mutual/confirmed likes.
      const matchedIds = new Set(
        (matchesData || []).map((m) => (m.user_id === user.id ? m.matched_profile_id : m.user_id))
      );

      const uniqueProfiles = [];
      const seenIds = new Set();
      for (const l of swipesData || []) {
        if (l.profiles && !matchedIds.has(l.profiles.id) && !seenIds.has(l.profiles.id)) {
          seenIds.add(l.profiles.id);
          uniqueProfiles.push({ ...l.profiles, isSuperLike: l.direction === "superlike" });
        }
      }
      setLikers(uniqueProfiles);
    }

    setLoading(false);
  };

  const handleCardClick = (profile) => {
    if (isPremium) {
      navigate(`/profile/${profile.id}`);
    } else {
      navigate("/premium");
    }
  };

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando...</div>;
  }

  return (
    <div className="wholiked-page">

      <BackButton />

      <div className="wholiked-header">
        <h1><EyeIcon size={24} /> A quién le gustas</h1>
        <p>{likers.length} personas ya te dieron like</p>
      </div>

      {likers.length === 0 ? (

        <p style={{ textAlign: "center", marginTop: "40px", color: "#777" }}>
          Aún nadie te ha dado like. ¡Sigue explorando!
        </p>

      ) : (

        <div className="wholiked-grid">

          {likers.map((profile) => (

            <div
              className={`wholiked-card ${!isPremium ? "is-blurred" : ""}`}
              key={profile.id}
              onClick={() => handleCardClick(profile)}
            >

              <img src={profile.photos?.[0] || "https://via.placeholder.com/300"} alt={profile.name} />

              {profile.isSuperLike && (
                <span className="wholiked-superlike-badge">
                  <StarIcon size={12} /> Super Like
                </span>
              )}

              {isPremium ? (

                <div className="wholiked-info">
                  <h3>{profile.name}, {profile.age}</h3>
                  <p>📍 {profile.city}</p>
                </div>

              ) : (

                <div className="wholiked-lock-overlay">

                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="10.5" width="16" height="10" rx="2.5"></rect>
                    <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"></path>
                  </svg>

                  <span>Toca para desbloquear</span>

                </div>

              )}

            </div>

          ))}

        </div>

      )}

      {!isPremium && likers.length > 0 && (

        <div className="wholiked-cta">

          <h2>Descubre quién ya quiere conocerte</h2>
          <p>Desbloquea esta lista con Premium o VIP.</p>

          <Link to="/premium" className="wholiked-cta-btn">
            <PremiumDiamond size={16} /> Ver con Premium
          </Link>

        </div>

      )}

    </div>
  );
}

export default WhoLikedMe;