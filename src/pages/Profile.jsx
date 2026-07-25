import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive, isVipActive } from "../lib/plan";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import MicIcon from "../components/ui/MicIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import CameraIcon from "../components/ui/CameraIcon";
import MessageIcon from "../components/ui/MessageIcon";
import PhotoGalleryModal from "../components/profile/PhotoGalleryModal";
import "../styles/Profile.css";
import "../styles/MyProfile.css";
import "../styles/BackButton.css";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myInterests, setMyInterests] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [existingMatch, setExistingMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [matching, setMatching] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    setLoading(true);
    setNotFound(false);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("interests")
      .eq("id", user.id)
      .single();

    setMyInterests(myProfile?.interests || []);

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !profileData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const { data: matchData } = await supabase
      .from("matches")
      .select("id")
      .or(`and(user_id.eq.${user.id},matched_profile_id.eq.${id}),and(user_id.eq.${id},matched_profile_id.eq.${user.id})`)
      .maybeSingle();

    setExistingMatch(matchData);
    setLoading(false);
  };

  const sharedCount = profile
    ? (profile.interests || []).filter((i) => myInterests.includes(i)).length
    : 0;

  const handleMensajePremium = () => {
    navigate(`/mensaje-premium/${profile.id}`);
  };

  const handleDarMatch = async () => {
    if (!currentUserId || matching) return;
    setMatching(true);

    const { data: newMatch, error } = await supabase
      .from("matches")
      .insert({ user_id: currentUserId, matched_profile_id: profile.id, created_via: "direct_match" })
      .select()
      .single();

    if (!error) {
      setExistingMatch(newMatch);
    } else {
      console.error("Error creando match:", error.message);
    }

    setMatching(false);
  };

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando perfil...</div>;
  }

  if (notFound || !profile) {
    return (
      <h1 style={{ padding: "120px" }}>
        Perfil no encontrado
      </h1>
    );
  }

  return (
    <div className="profile-page">

      <div className="profile-back-wrapper">
        <BackButton />
      </div>

      <div className="profile-cover"></div>

      <div className="profile-container">

        <div className="profile-left">

          <img
            className="profile-photo"
            src={profile.photos?.[0] || "https://via.placeholder.com/220"}
            alt={profile.name}
            onClick={() => profile.photos?.length > 0 && setShowGallery(true)}
            style={{ cursor: profile.photos?.length > 0 ? "pointer" : "default" }}
          />

          {profile.photos && profile.photos.length > 1 && (
            <button className="view-photos-btn" onClick={() => setShowGallery(true)}>
              <CameraIcon size={15} /> Ver fotos ({profile.photos.length})
            </button>
          )}

        </div>

        <div className="profile-right">

          <div className="profile-header">

            <h1>
              {profile.name}, {profile.age}

              {isVipActive(profile) ? (
                <span className="vip-badge-inline">
                  <VipDiamond size={18} /> VIP
                </span>
              ) : isPlanActive(profile) && profile.plan === "premium" ? (
                <span className="premium-badge-inline">
                  <PremiumDiamond size={16} /> Premium
                </span>
              ) : null}

            </h1>

            <p>
              📍 {profile.city}
            </p>

          </div>

          <div className="mood">

            {profile.mood}

          </div>

          {sharedCount > 0 && (
            <div className="profile-compatibility">
              ✨ {sharedCount} {sharedCount === 1 ? "interés en común" : "intereses en común"} contigo
            </div>
          )}

          <div className="about">

            <h2>Sobre mí</h2>

            <p>
              {profile.bio}
            </p>

          </div>

          {profile.prompts && profile.prompts.filter((p) => p.question && p.answer).length > 0 && (
            <div className="about">
              {profile.prompts.filter((p) => p.question && p.answer).map((p, i) => (
                <div className="prompt-card" key={i}>
                  <p className="prompt-question">{p.question}</p>
                  <p className="prompt-answer">{p.answer}</p>
                </div>
              ))}
            </div>
          )}

          <div className="interests">

            <h2>Intereses</h2>

            <div className="tags">

              {(profile.interests || []).map((interest, i) => (
                <span
                  key={i}
                  className={myInterests.includes(interest) ? "tag-shared" : ""}
                >
                  {interest}
                  {myInterests.includes(interest) && " ✓"}
                </span>
              ))}

            </div>

          </div>

          {profile.voice_note_url && (
            <div className="voice-display">
              <h2><MicIcon size={17} className="voice-title-icon" /> Nota de voz</h2>
              <audio controls src={profile.voice_note_url} className="voice-audio"></audio>
            </div>
          )}

          <div className="profile-buttons">

            {!existingMatch && (
              <button className="match-btn" onClick={handleDarMatch} disabled={matching}>
                {matching ? "Creando match..." : "❤️ Dar Match"}
              </button>
            )}

            {existingMatch ? (
              <Link to={`/chat/${existingMatch.id}`} className="message-btn">
                <MessageIcon size={15} /> Enviar mensaje
              </Link>
            ) : (
              <button className="message-btn" disabled>
                <MessageIcon size={15} /> Requiere match
              </button>
            )}

            {!existingMatch && (
              <button className="premium-btn" onClick={handleMensajePremium}>
                <PremiumDiamond size={16} /> Mensaje Premium
              </button>
            )}

          </div>

        </div>

      </div>

      {showGallery && profile.photos && profile.photos.length > 0 && (
        <PhotoGalleryModal
          photos={profile.photos}
          onClose={() => setShowGallery(false)}
        />
      )}

    </div>
  );
}

export default Profile;
