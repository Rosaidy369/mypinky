import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { useNotifications } from "../hooks/useNotifications";
import { isVipActive } from "../lib/plan";
import SpecialTouchHeart from "../components/ui/SpecialTouchHeart";
import "../styles/Chat.css";

function ChatRoom() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { markMessagesReadForMatch } = useNotifications();

  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isVip, setIsVip] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  useEffect(() => {
    loadChat();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${id}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]
          );

          // The chat is open, so a message that just arrived counts as read
          // immediately rather than waiting for the next visit.
          if (payload.new.sender_id !== currentUserId) {
            markMessagesReadForMatch(id);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `match_id=eq.${id}` },
        (payload) => {
          // Lets a VIP sender see "Leído" appear live once the other
          // person opens the chat, without needing to reload.
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, read_at: payload.new.read_at } : m))
          );
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("Realtime chat subscription failed:", status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, currentUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChat = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data: matchData, error } = await supabase
      .from("matches")
      .select("id, user_id, matched_profile_id, created_via, user_profile:user_id(*), matched_profile:matched_profile_id(*)")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error cargando el chat:", error.message);
      setLoading(false);
      return;
    }

    const isOwner = matchData.user_id === user.id;
    setMatch({
      ...matchData,
      otherProfile: isOwner ? matchData.matched_profile : matchData.user_profile,
      otherProfileId: isOwner ? matchData.matched_profile_id : matchData.user_id,
      isSpecialTouchSender: isOwner && matchData.created_via === "special_touch",
    });

    // Read receipts ("Leído") are a VIP perk for the sender, not the
    // recipient -- derived from data already fetched above, no extra query.
    setIsVip(isVipActive(isOwner ? matchData.user_profile : matchData.matched_profile));

    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", id)
      .order("created_at", { ascending: true });

    setMessages(messagesData || []);
    setLoading(false);

    markMessagesReadForMatch(id);
  };

  const sendMessage = async () => {
    if (!text.trim()) return;

    const messageText = text;
    setText("");

    const { data, error } = await supabase
      .from("messages")
      .insert({
        match_id: id,
        sender_id: currentUserId,
        text: messageText,
      })
      .select()
      .single();

    if (error) {
      console.error("Error enviando mensaje:", error.message);
      return;
    }

    // Append immediately so sending feels instant even if the realtime
    // event for this same row arrives late (or Realtime is unavailable);
    // the postgres_changes handler above dedupes by id.
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
  };

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>{t("chat.room.loading")}</div>;
  }

  if (!match) {
    return (
      <div className="chatroom-page">
        <p className="chat-not-found">{t("chat.room.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="chatroom-page">

      <div className="chatroom-header">

        <button className="chat-back-btn" onClick={() => {
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate("/mensajes");
          }
        }}>
          ←
        </button>

        <Link to={`/profile/${match.otherProfileId}`} className="chat-header-profile-link">

          <img src={match.otherProfile?.photos?.[0] || "https://via.placeholder.com/100"} alt={match.otherProfile?.name} />

          <h2>{match.otherProfile?.name}</h2>

        </Link>

        {match.created_via === "special_touch" && (
          <span className="special-touch-header-badge"><SpecialTouchHeart size={14} /> {t("chat.room.specialTouchBadge")}</span>
        )}

      </div>

      {match.created_via === "special_touch" && (
        <div className="special-touch-banner">
          <span className="special-touch-banner-icon"><SpecialTouchHeart size={22} /></span>
          <div>
            <strong>{t("chat.room.specialTouchBadge")}</strong>
            <p>
              {match.isSpecialTouchSender
                ? t("chat.room.specialTouchBannerSender", { name: match.otherProfile?.name })
                : t("chat.room.specialTouchBannerReceiver", { name: match.otherProfile?.name })}
            </p>
          </div>
        </div>
      )}

      <div className="chatroom-messages">

        {messages.length === 0 && (
          <p className="chat-empty-hint">{t("chat.room.emptyHint", { name: match.otherProfile?.name })}</p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.sender_id === currentUserId ? "sent" : "received"}`}
          >
            {msg.text}

            {msg.sender_id === currentUserId && (
              <span className="chat-read-status">
                {isVip && msg.read_at
                  ? t("chat.room.readReceipt", {
                      time: new Date(msg.read_at).toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" }),
                    })
                  : t("chat.room.sentReceipt")}
              </span>
            )}
          </div>
        ))}

        <div ref={endRef}></div>

      </div>

      <div className="chatroom-input">

        <input
          type="text"
          placeholder={t("chat.room.inputPlaceholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button onClick={sendMessage}>➤</button>

      </div>

    </div>
  );
}

export default ChatRoom;