import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import "../styles/Chat.css";

function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
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
  }, [id]);

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
      isPremiumMessagePayer: isOwner && matchData.created_via === "premium_message",
    });

    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", id)
      .order("created_at", { ascending: true });

    setMessages(messagesData || []);
    setLoading(false);
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
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando conversación...</div>;
  }

  if (!match) {
    return (
      <div className="chatroom-page">
        <p className="chat-not-found">Conversación no encontrada.</p>
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

        {match.created_via === "premium_message" && (
          <span className="premium-header-badge"><PremiumDiamond size={14} /> Mensaje Premium</span>
        )}

      </div>

      {match.created_via === "premium_message" && (
        <div className="premium-unlock-banner">
          <span className="premium-unlock-icon"><PremiumDiamond size={22} /></span>
          <div>
            <strong>Mensaje Premium</strong>
            <p>
              {match.isPremiumMessagePayer
                ? `Pagaste para escribirle directamente a ${match.otherProfile?.name}.`
                : `${match.otherProfile?.name} pagó para escribirte directamente.`}
            </p>
          </div>
        </div>
      )}

      <div className="chatroom-messages">

        {messages.length === 0 && (
          <p className="chat-empty-hint">Es un match con {match.otherProfile?.name}. ¡Rompe el hielo! 💬</p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.sender_id === currentUserId ? "sent" : "received"}`}
          >
            {msg.text}
          </div>
        ))}

        <div ref={endRef}></div>

      </div>

      <div className="chatroom-input">

        <input
          type="text"
          placeholder="Escribe un mensaje..."
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