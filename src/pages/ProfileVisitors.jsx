import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive } from "../lib/plan";
import { calculateAge } from "../lib/age";
import { useNotifications } from "../hooks/useNotifications";
import BackButton from "../components/ui/BackButton";
import EyeIcon from "../components/ui/EyeIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import PinIcon from "../components/ui/PinIcon";
import "../styles/WhoLikedMe.css";
import "../styles/BackButton.css";

function ProfileVisitors() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const { markVisitorsViewed } = useNotifications();

  const loadVisitors = async () => {
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

    const { data: visitsData, error: visitsError } = await supabase
      .from("profile_visits")
      .select("visitor_id, last_visited_at, profiles:visitor_id(*)")
      .eq("visited_profile_id", user.id)
      .order("last_visited_at", { ascending: false });

    if (visitsError) {
      console.error("Error cargando visitas:", visitsError.message);
    } else {
      setVisitors((visitsData || []).filter((v) => v.profiles).map((v) => v.profiles));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadVisitors();
    markVisitorsViewed();
  }, []);

  const handleCardClick = (profile) => {
    if (isPremium) {
      navigate(`/profile/${profile.id}`);
    } else {
      navigate("/premium");
    }
  };

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>{t("whoVisitedMe.loading")}</div>;
  }

  return (
    <div className="wholiked-page">

      <BackButton />

      <div className="wholiked-header">
        <h1><EyeIcon size={24} /> {t("whoVisitedMe.heading")}</h1>
        <p>{t("whoVisitedMe.visitCount", { count: visitors.length })}</p>
      </div>

      {visitors.length === 0 ? (

        <p style={{ textAlign: "center", marginTop: "40px", color: "#777" }}>
          {t("whoVisitedMe.emptyState")}
        </p>

      ) : (

        <div className="wholiked-grid">

          {visitors.map((profile) => (

            <div
              className={`wholiked-card ${!isPremium ? "is-blurred" : ""}`}
              key={profile.id}
              onClick={() => handleCardClick(profile)}
            >

              <img src={profile.photos?.[0] || "https://via.placeholder.com/300"} alt={profile.name} />

              {isPremium ? (

                <div className="wholiked-info">
                  <h3>{profile.name}, {calculateAge(profile.birth_date)}</h3>
                  <p className="wholiked-location"><PinIcon size={12} className="wholiked-location-icon" /> {profile.city}</p>
                </div>

              ) : (

                <div className="wholiked-lock-overlay">

                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="10.5" width="16" height="10" rx="2.5"></rect>
                    <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"></path>
                  </svg>

                  <span>{t("whoVisitedMe.lockOverlay")}</span>

                </div>

              )}

            </div>

          ))}

        </div>

      )}

      {!isPremium && visitors.length > 0 && (

        <div className="wholiked-cta">

          <h2>{t("whoVisitedMe.cta.heading")}</h2>
          <p>{t("whoVisitedMe.cta.body")}</p>

          <Link to="/premium" className="wholiked-cta-btn">
            <PremiumDiamond size={16} /> {t("whoVisitedMe.cta.button")}
          </Link>

        </div>

      )}

    </div>
  );
}

export default ProfileVisitors;
