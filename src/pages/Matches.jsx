import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../hooks/useNotifications";
import BackButton from "../components/ui/BackButton";
import "../styles/Matches.css";
import "../styles/BackButton.css";

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchToDelete, setMatchToDelete] = useState(null);
  const navigate = useNavigate();
  const { markMatchesViewed } = useNotifications();

  useEffect(() => {
    loadMatches();
    markMatchesViewed();
  }, []);

  const loadMatches = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("matches")
      .select("id, user_id, matched_profile_id, matched_at, user_profile:user_id(*), matched_profile:matched_profile_id(*)")
      .or(`user_id.eq.${user.id},matched_profile_id.eq.${user.id}`)
      .order("matched_at", { ascending: false });

    if (error) {
      console.error("Error cargando matches:", error.message);
    } else {
      const withOtherProfile = (data || []).map((m) => ({
        ...m,
        otherProfile: m.user_id === user.id ? m.matched_profile : m.user_profile,
      }));
      setMatches(withOtherProfile);
    }

    setLoading(false);
  };

  const confirmDeleteMatch = async () => {
    await supabase.from("matches").delete().eq("id", matchToDelete.id);
    setMatches((prev) => prev.filter((m) => m.id !== matchToDelete.id));
    setMatchToDelete(null);
  };

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando matches...</div>;
  }

  return (
    <div className="matches-page">

      <div className="matches-bg-decor">
        <span className="blob blob-1"></span>
        <span className="blob blob-2"></span>
      </div>

      <div className="matches-header">
        <BackButton />
        <h1>Mis Matches</h1>
        <p>{matches.length} {matches.length === 1 ? "persona" : "personas"} con quien hiciste match</p>
      </div>

      {matches.length === 0 ? (

        <div className="matches-empty">
          <div className="matches-empty-icon">💔</div>
          <h2>Aún no tienes matches</h2>
          <p>Ve a Descubrir y desliza para encontrar a alguien especial.</p>
        </div>

      ) : (

        <div className="matches-grid">

          {matches.map((match) => (
            <div className="match-card" key={match.id}>

              <button
                className="match-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setMatchToDelete(match);
                }}
                aria-label="Eliminar match"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                </svg>
              </button>

              <div onClick={() => navigate(`/chat/${match.id}`)}>
                <img src={match.otherProfile?.photos?.[0] || "https://via.placeholder.com/200"} alt={match.otherProfile?.name} />
                <div className="match-info">
                  <h3>{match.otherProfile?.name}</h3>
                  <p>{match.otherProfile?.mood}</p>
                </div>
              </div>

            </div>
          ))}

        </div>

      )}

      {matchToDelete && (
        <div className="delete-modal-backdrop" onClick={() => setMatchToDelete(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <h2>¿Eliminar este match?</h2>
            <p>Ya no podrás chatear con esta persona. No se puede deshacer.</p>

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setMatchToDelete(null)}>
                Cancelar
              </button>
              <button className="confirm-delete-btn" onClick={confirmDeleteMatch}>
                Sí, eliminar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Matches;