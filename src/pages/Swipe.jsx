import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive } from "../lib/plan";
import SwipeCard from "../components/swipe/SwipeCard";
import BackButton from "../components/ui/BackButton";
import StarIcon from "../components/ui/StarIcon";
import LockIcon from "../components/ui/LockIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import XIcon from "../components/ui/XIcon";
import RewindIcon from "../components/ui/RewindIcon";
import HeartIcon from "../components/ui/HeartIcon";
import MessageIcon from "../components/ui/MessageIcon";
import "../styles/Swipe.css";
import "../styles/BackButton.css";

const SWIPE_LIMIT = 20;
const STORAGE_KEY = "mypinky_swipe_data";
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

function loadSwipeData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { count: 0, resetAt: null };

  const data = JSON.parse(raw);

  if (data.resetAt && Date.now() > data.resetAt) {
    return { count: 0, resetAt: null };
  }

  return data;
}

function formatCountdown(ms) {
  const totalMinutes = Math.max(Math.floor(ms / 60000), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

function GradientHeart({ id, from, to, size }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="mp-heart-svg">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M12 21s-7.5-4.9-10.2-9.3C.4 9.5 1 6.2 3.6 4.7c2.2-1.3 4.9-.7 6.4 1.3.6.8 1.3 1.9 2 3 .7-1.1 1.4-2.2 2-3 1.5-2 4.2-2.6 6.4-1.3 2.6 1.5 3.2 4.8 1.8 7-2.7 4.4-10.2 9.3-10.2 9.3z" />
    </svg>
  );
}

function Swipe() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [stack, setStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchInfo, setMatchInfo] = useState(null);
  const [swipeData, setSwipeData] = useState(loadSwipeData);
  const [now, setNow] = useState(Date.now());
  const [lastSwiped, setLastSwiped] = useState(null);

  const isPremium = isPlanActive(currentUser);

  useEffect(() => {
    loadEverything();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const loadEverything = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setCurrentUser(myProfile);

    const { data: alreadySwiped } = await supabase
      .from("swipes")
      .select("swiped_profile_id")
      .eq("swiper_id", user.id);

    const swipedIds = (alreadySwiped || []).map((s) => s.swiped_profile_id);

    let query = supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .not("bio", "is", null)
      .is("deleted_at", null);

    if (swipedIds.length > 0) {
      query = query.not("id", "in", `(${swipedIds.join(",")})`);
    }

    const { data: candidateProfiles, error } = await query.limit(20);

    if (error) {
      console.error("Error cargando perfiles para swipe:", error.message);
    }

    setStack(candidateProfiles || []);
    setLoading(false);
  };

  const swipesLeft = SWIPE_LIMIT - swipeData.count;
  const isBlocked = swipesLeft <= 0;

  const handleSwipe = async (direction, card, isSuperLike = false) => {
    setLastSwiped(card);

    setStack((prev) => prev.filter((p) => p.id !== card.id));

    setSwipeData((prev) => {
      const newCount = prev.count + 1;
      const newData = {
        count: newCount,
        resetAt: newCount >= SWIPE_LIMIT ? Date.now() + TWELVE_HOURS : prev.resetAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });

    const swipeDirection = direction === "right" ? (isSuperLike ? "superlike" : "like") : "dislike";

    await supabase.from("swipes").insert({
      swiper_id: currentUser.id,
      swiped_profile_id: card.id,
      direction: swipeDirection,
    });

    if (direction === "right") {
      const { data: theyLikedMe } = await supabase
        .from("swipes")
        .select("id")
        .eq("swiper_id", card.id)
        .eq("swiped_profile_id", currentUser.id)
        .in("direction", ["like", "superlike"])
        .maybeSingle();

      if (theyLikedMe) {
        const { data: newMatch } = await supabase
          .from("matches")
          .insert({ user_id: currentUser.id, matched_profile_id: card.id })
          .select()
          .single();

        setMatchInfo({ ...card, id: newMatch.id, profileId: card.id });
      }
    }
  };

  const handleButtonSwipe = (direction, isSuperLike = false) => {
    if (stack.length === 0 || isBlocked) return;
    handleSwipe(direction, stack[0], isSuperLike);
  };

  const handleRewind = async () => {
    if (!isPremium || !lastSwiped) return;

    await supabase
      .from("swipes")
      .delete()
      .eq("swiper_id", currentUser.id)
      .eq("swiped_profile_id", lastSwiped.id);

    setSwipeData((prev) => {
      const newData = { count: Math.max(prev.count - 1, 0), resetAt: prev.resetAt };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });

    setStack((prev) => [lastSwiped, ...prev]);
    setLastSwiped(null);
  };

  const handleSuperLike = () => {
    if (!isPremium) {
      navigate("/premium");
      return;
    }
    handleButtonSwipe("right", true);
  };

  const visibleCards = stack.slice(0, 3);
  const timeLeft = swipeData.resetAt ? swipeData.resetAt - now : 0;
  const myPhoto = currentUser?.photos?.[0] || null;

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando perfiles...</div>;
  }

  return (
    <div className="swipe-page">

      <BackButton />

      <div className="swipe-bg-decor">
        <span className="blob blob-1"></span>
        <span className="blob blob-2"></span>

        <span className="glow-orb orb-1"></span>
        <span className="glow-orb orb-2"></span>
        <span className="glow-orb orb-3"></span>

        <svg className="floating-heart-svg heart-1" viewBox="0 0 24 24" width="34" height="34">
          <defs>
            <linearGradient id="heartGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9dc3" />
              <stop offset="100%" stopColor="#ff3f87" />
            </linearGradient>
          </defs>
          <path fill="url(#heartGrad1)" d="M12 21s-7.5-4.9-10.2-9.3C.4 9.5 1 6.2 3.6 4.7c2.2-1.3 4.9-.7 6.4 1.3.6.8 1.3 1.9 2 3 .7-1.1 1.4-2.2 2-3 1.5-2 4.2-2.6 6.4-1.3 2.6 1.5 3.2 4.8 1.8 7-2.7 4.4-10.2 9.3-10.2 9.3z"/>
        </svg>

        <svg className="floating-heart-svg heart-2" viewBox="0 0 24 24" width="22" height="22">
          <defs>
            <linearGradient id="heartGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffc2dd" />
              <stop offset="100%" stopColor="#ff6ea8" />
            </linearGradient>
          </defs>
          <path fill="url(#heartGrad2)" d="M12 21s-7.5-4.9-10.2-9.3C.4 9.5 1 6.2 3.6 4.7c2.2-1.3 4.9-.7 6.4 1.3.6.8 1.3 1.9 2 3 .7-1.1 1.4-2.2 2-3 1.5-2 4.2-2.6 6.4-1.3 2.6 1.5 3.2 4.8 1.8 7-2.7 4.4-10.2 9.3-10.2 9.3z"/>
        </svg>

        <svg className="floating-heart-svg heart-3" viewBox="0 0 24 24" width="28" height="28">
          <defs>
            <linearGradient id="heartGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff9dc3" />
              <stop offset="100%" stopColor="#ff3f87" />
            </linearGradient>
          </defs>
          <path fill="url(#heartGrad3)" d="M12 21s-7.5-4.9-10.2-9.3C.4 9.5 1 6.2 3.6 4.7c2.2-1.3 4.9-.7 6.4 1.3.6.8 1.3 1.9 2 3 .7-1.1 1.4-2.2 2-3 1.5-2 4.2-2.6 6.4-1.3 2.6 1.5 3.2 4.8 1.8 7-2.7 4.4-10.2 9.3-10.2 9.3z"/>
        </svg>

        <span className="sparkle sparkle-1"></span>
        <span className="sparkle sparkle-2"></span>
        <span className="sparkle sparkle-3"></span>
        <span className="sparkle sparkle-4"></span>

      </div>

      <div className="swipe-header">
        <h1>Descubrir</h1>
        <p>Desliza para conocer gente nueva</p>
      </div>

      {isBlocked ? (

        <div className="paywall">

          <div className="paywall-icon"><PremiumDiamond size={44} /></div>

          <h2>¡Sigue conociendo personas!</h2>

          <p>
            Con <strong>Premium</strong> tienes deslizados ilimitados, sin esperas.
          </p>

          <Link to="/premium" className="paywall-premium-btn">
            <PremiumDiamond size={16} /> Desbloquear Premium
          </Link>

          <div className="paywall-countdown">
            o vuelve a deslizar gratis en {formatCountdown(timeLeft)}
          </div>

        </div>

      ) : stack.length === 0 ? (

        <div className="swipe-empty">
          <h2>😅 No hay más perfiles por ahora</h2>
          <p>Vuelve más tarde para ver gente nueva</p>
        </div>

      ) : (

        <>

          <div className="swipe-deck">

            {visibleCards.map((card, index) => (
              <SwipeCard
                key={card.id}
                profile={{ ...card, image: card.photos?.[0], country: card.city }}
                isTop={index === 0}
                depth={index}
                onSwipe={handleSwipe}
                myInterests={currentUser?.interests || []}
              />
            ))}

          </div>

          <div className="swipe-actions">

            <button
              className="swipe-btn rewind"
              disabled={!isPremium}
              onClick={handleRewind}
            >
              {!isPremium && (
                <span className="lock-icon">
                  <LockIcon size={11} />
                </span>
              )}
              <RewindIcon size={20} />
            </button>

            <button className="swipe-btn nope" onClick={() => handleButtonSwipe("left")}>
              <XIcon size={26} />
            </button>

            <button
              className={`swipe-btn superlike ${!isPremium ? "locked" : ""}`}
              onClick={handleSuperLike}
            >
              {!isPremium && (
                <span className="lock-icon">
                  <LockIcon size={11} />
                </span>
              )}
              <StarIcon size={22} />
            </button>

            <button className="swipe-btn like" onClick={() => handleButtonSwipe("right")}>
              <HeartIcon size={26} />
            </button>

          </div>

        </>

      )}

      {matchInfo && (
        <div className="match-popup">

          <div className="match-popup-hearts">
            <span><GradientHeart id="mpHeart1" from="#ff9dc3" to="#ff3f87" size={22} /></span>
            <span><GradientHeart id="mpHeart2" from="#ffc2dd" to="#ff6ea8" size={16} /></span>
            <span><GradientHeart id="mpHeart3" from="#ff9dc3" to="#ff3f87" size={30} /></span>
            <span><GradientHeart id="mpHeart4" from="#ffc2dd" to="#ff6ea8" size={18} /></span>
            <span><GradientHeart id="mpHeart5" from="#ff9dc3" to="#ff3f87" size={24} /></span>
            <span><GradientHeart id="mpHeart6" from="#ffc2dd" to="#ff6ea8" size={14} /></span>
          </div>

          <div className="match-popup-confetti">
            <span className="confetti-piece"></span>
            <span className="confetti-piece"></span>
            <span className="confetti-piece"></span>
            <span className="confetti-piece"></span>
            <span className="confetti-piece"></span>
            <span className="confetti-piece"></span>
            <span className="confetti-piece"></span>
            <span className="confetti-piece"></span>
          </div>

          <div className="match-popup-content">

            <button className="match-popup-close" onClick={() => setMatchInfo(null)}>
              ✕
            </button>

            <div className="match-photos">

              <div className="match-photo-circle mine">
                {myPhoto ? (
                  <img src={myPhoto} alt="Tú" />
                ) : (
                  <span className="match-photo-placeholder">👤</span>
                )}
              </div>

              <span className="match-photos-heart"><HeartIcon size={22} /></span>

              <div className="match-photo-circle theirs">
                <img src={matchInfo.photos?.[0]} alt={matchInfo.name} />
              </div>

            </div>

            <h2>¡Es un Match!</h2>

            <p>Tú y {matchInfo.name} se gustaron mutuamente</p>

            <div className="match-popup-actions">

              <button
                className="match-popup-btn secondary"
                onClick={() => setMatchInfo(null)}
              >
                Seguir deslizando
              </button>

              <button
                className="match-popup-btn primary"
                onClick={() => navigate(`/chat/${matchInfo.id}`)}
              >
                <MessageIcon size={15} /> Enviar mensaje
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Swipe;