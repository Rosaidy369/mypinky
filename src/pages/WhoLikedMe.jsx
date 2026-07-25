import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive } from "../lib/plan";
import BackButton from "../components/ui/BackButton";
import HeartIcon from "../components/ui/HeartIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import "../styles/WhoLikedMe.css";
import "../styles/BackButton.css";

function WhoLikedMe() {
  const navigate = useNavigate();
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadLikers();
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

    const { data, error } = await supabase
      .from("swipes")
      .select("swiper_id, profiles:swiper_id(*)")
      .eq("swiped_profile_id", user.id)
      .in("direction", ["like", "superlike"]);

    if (error) {
      console.error("Error cargando likes:", error.message);
    } else {
      const uniqueProfiles = [];
      const seenIds = new Set();
      for (const l of data || []) {
        if (l.profiles && !seenIds.has(l.profiles.id)) {
          seenIds.add(l.profiles.id);
          uniqueProfiles.push(l.profiles);
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
        <h1><HeartIcon size={24} /> A quién le gustas</h1>
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