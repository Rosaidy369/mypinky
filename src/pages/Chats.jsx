import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import BackButton from "../components/ui/BackButton";
import SpecialTouchHeart from "../components/ui/SpecialTouchHeart";
import MessageIcon from "../components/ui/MessageIcon";
import "../styles/Chat.css";
import "../styles/BackButton.css";

function Chats() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: matchesData, error } = await supabase
      .from("matches")
      .select("id, user_id, matched_profile_id, created_via, user_profile:user_id(*), matched_profile:matched_profile_id(*)")
      .or(`user_id.eq.${user.id},matched_profile_id.eq.${user.id}`)
      .order("matched_at", { ascending: false });

    if (error) {
      console.error("Error cargando conversaciones:", error.message);
      setLoading(false);
      return;
    }

    const withLastMessage = await Promise.all(
      (matchesData || []).map(async (match) => {
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("text")
          .eq("match_id", match.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { count: unreadCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("match_id", match.id)
          .is("read_at", null)
          .neq("sender_id", user.id);

        const otherProfile = match.user_id === user.id ? match.matched_profile : match.user_profile;

        return {
          ...match,
          otherProfile,
          lastMessage: lastMsg?.text || t("chat.list.defaultLastMessage"),
          unreadCount: unreadCount || 0,
        };
      })
    );

    setConversations(withLastMessage);
    setLoading(false);
  };

  const confirmDelete = async () => {
    await supabase.from("matches").delete().eq("id", toDelete.id);
    setConversations((prev) => prev.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
  };

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>{t("chat.list.loading")}</div>;
  }

  return (
    <div className="chats-page">

      <div className="chats-bg-decor">
        <span className="blob blob-1"></span>
        <span className="blob blob-2"></span>
      </div>

      <div className="chats-header">
        <BackButton />
        <h1>{t("chat.list.heading")}</h1>
      </div>

      {conversations.length === 0 ? (

        <div className="matches-empty">
          <div className="matches-empty-icon"><MessageIcon size={46} /></div>
          <h2>{t("chat.list.emptyTitle")}</h2>
          <p>{t("chat.list.emptyBody")}</p>
        </div>

      ) : (

        <div className="chats-list">

          {conversations.map((chat) => (
            <div
              className={`chat-item-wrapper ${chat.created_via === "special_touch" ? "is-special-touch" : ""} ${chat.unreadCount > 0 ? "is-unread" : ""}`}
              key={chat.id}
            >

              <Link to={`/chat/${chat.id}`} className="chat-item">
                <img src={chat.otherProfile?.photos?.[0] || "https://via.placeholder.com/100"} alt={chat.otherProfile?.name} />
                <div className="chat-item-info">
                  <h3>
                    {chat.otherProfile?.name}
                    {chat.created_via === "special_touch" && (
                      <span className="special-touch-chat-tag" title={t("chat.list.specialTouchTag")}><SpecialTouchHeart size={13} /></span>
                    )}
                  </h3>
                  <p>{chat.lastMessage}</p>
                </div>
                {chat.unreadCount > 0 && <span className="chat-unread-dot"></span>}
              </Link>

              <button
                className="chat-delete-btn"
                onClick={() => setToDelete(chat)}
                aria-label={t("chat.list.deleteAriaLabel")}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
                </svg>
              </button>

            </div>
          ))}

        </div>

      )}

      {toDelete && (
        <div className="delete-modal-backdrop" onClick={() => setToDelete(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <h2>{t("chat.list.deleteModalTitle")}</h2>
            <p>{t("chat.list.deleteModalBody", { name: toDelete.otherProfile?.name })}</p>

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setToDelete(null)}>
                {t("chat.list.cancel")}
              </button>
              <button className="confirm-delete-btn" onClick={confirmDelete}>
                {t("chat.list.confirmDelete")}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Chats;