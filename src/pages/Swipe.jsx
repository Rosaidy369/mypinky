import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive } from "../lib/plan";
import { useSwipeFilters } from "../hooks/useSwipeFilters";
import { GENDER_FILTER_ALL } from "../data/profileOptions";
import SwipeCard from "../components/swipe/SwipeCard";
import BackButton from "../components/ui/BackButton";
import StarIcon from "../components/ui/StarIcon";
import LockIcon from "../components/ui/LockIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import XIcon from "../components/ui/XIcon";
import RewindIcon from "../components/ui/RewindIcon";
import HeartIcon from "../components/ui/HeartIcon";
import MessageIcon from "../components/ui/MessageIcon";
import HouseAdBanner from "../components/ads/HouseAdBanner";
import "../styles/Swipe.css";
import "../styles/Explore.css";
import "../styles/BackButton.css";

const AD_EVERY_N_SWIPES = 9;

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
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [stack, setStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchInfo, setMatchInfo] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [lastSwiped, setLastSwiped] = useState(null);
  const { filters } = useSwipeFilters();
  const [swipesLeft, setSwipesLeft] = useState(null);
  const [resetAt, setResetAt] = useState(null);
  const [, setSwipesSinceAd] = useState(0);

  const isPremium = isPlanActive(currentUser);
  const filtersAreDefault =
    filters.gender === GENDER_FILTER_ALL && filters.ageMin === 18 && filters.ageMax === 90 && filters.maxDistance === 100;

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filters]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const loadCurrentUser = async () => {
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

    if (myProfile) {
      const isPrem = isPlanActive(myProfile);
      setSwipesLeft(isPrem ? null : Math.max(20 - (myProfile.swipe_count || 0), 0));
      setResetAt(myProfile.swipe_reset_at ? new Date(myProfile.swipe_reset_at).getTime() : null);
    }
  };

  const loadCandidates = async () => {
    setLoading(true);

    // Server-side: never returns anyone else's exact coordinates, only the
    // already-computed distance_km (or null if either side lacks location).
    const { data: candidateProfiles, error } = await supabase.rpc("get_discoverable_profiles", {
      p_gender: filters.gender === GENDER_FILTER_ALL ? null : filters.gender,
      p_min_age: filters.ageMin,
      p_max_age: filters.ageMax,
      p_max_distance_km: filters.maxDistance,
      p_exclude_swiped: true,
      p_limit: 30,
    });

    if (error) {
      console.error("Error cargando perfiles para swipe:", error.message);
    }

    // "Pinky Pulse": flag candidates who already super liked the current
    // user, so their card can show that before a decision is made -- same
    // query shape WhoLikedMe.jsx already uses (swiped_profile_id = me),
    // just scoped to this page's candidate ids via `in`.
    const candidates = candidateProfiles || [];
    let superLikedByIds = new Set();

    if (candidates.length > 0) {
      const { data: superLikes, error: superLikesError } = await supabase
        .from("swipes")
        .select("swiper_id")
        .eq("swiped_profile_id", currentUser.id)
        .eq("direction", "superlike")
        .in("swiper_id", candidates.map((c) => c.id));

      if (superLikesError) {
        console.error("Error cargando super likes recibidos:", superLikesError.message);
      } else {
        superLikedByIds = new Set(superLikes.map((s) => s.swiper_id));
      }
    }

    setStack(candidates.map((c) => ({ ...c, received_super_like: superLikedByIds.has(c.id) })));
    setLoading(false);
  };

  const isBlocked = !isPremium && swipesLeft !== null && swipesLeft <= 0;

  const handleSwipe = async (direction, card, isSuperLike = false) => {
    setLastSwiped(card);
    setStack((prev) => prev.filter((p) => p.id !== card.id));

    const swipeDirection = direction === "right" ? (isSuperLike ? "superlike" : "like") : "dislike";

    // register_swipe is the ONLY way a swipe row gets created -- direct
    // inserts into `swipes` are revoked so the daily limit can't be
    // skipped by calling the API directly or clearing localStorage.
    const { data, error } = await supabase.rpc("register_swipe", {
      p_swiped_profile_id: card.id,
      p_direction: swipeDirection,
    });

    if (error) {
      console.error("Error registrando swipe:", error.message);
      setStack((prev) => [card, ...prev]);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (result) {
      setSwipesLeft(result.swipes_left);
      setResetAt(result.reset_at ? new Date(result.reset_at).getTime() : null);

      if (!result.allowed) {
        setStack((prev) => [card, ...prev]);
        return;
      }
    }

    if (!isPremium) {
      setSwipesSinceAd((prev) => {
        const next = prev + 1;
        if (next >= AD_EVERY_N_SWIPES) {
          setStack((prevStack) => [{ id: `housead-${Date.now()}`, isHouseAd: true }, ...prevStack]);
          return 0;
        }
        return next;
      });
    }

    if (direction === "right") {
      const { data: theyLikedMe } = await supabase
        .from("swipes")
        .select("id, direction")
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

        const isSuperLikeMatch = isSuperLike || theyLikedMe.direction === "superlike";

        setMatchInfo({ ...card, id: newMatch.id, profileId: card.id, isSuperLikeMatch });
      }
    }
  };

  const handleButtonSwipe = (direction, isSuperLike = false) => {
    if (stack.length === 0 || isBlocked) return;
    handleSwipe(direction, stack[0], isSuperLike);
  };

  const handleRewind = async () => {
    if (!isPremium || !lastSwiped) return;

    const { data, error } = await supabase.rpc("rewind_last_swipe", {
      p_swiped_profile_id: lastSwiped.id,
    });

    if (error || !data) {
      console.error("Error deshaciendo swipe:", error?.message);
      return;
    }

    setSwipesLeft((prev) => (prev === null ? prev : prev + 1));
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
  const timeLeft = resetAt ? resetAt - now : 0;
  const myPhoto = currentUser?.photos?.[0] || null;

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>{t("swipe.loading")}</div>;
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
        <h1>{t("swipe.header.title")}</h1>
        <p>{t("swipe.header.subtitle")}</p>
      </div>

      {isBlocked ? (

        <div className="paywall">

          <div className="paywall-icon"><PremiumDiamond size={44} /></div>

          <h2>{t("swipe.paywall.title")}</h2>

          <p>
            {t("swipe.paywall.bodyPrefix")}<strong>{t("nav.premium")}</strong>{t("swipe.paywall.bodySuffix")}
          </p>

          <Link to="/premium" className="paywall-premium-btn">
            <PremiumDiamond size={16} /> {t("swipe.paywall.unlockButton")}
          </Link>

          <div className="paywall-countdown">
            {t("swipe.paywall.countdown", { time: formatCountdown(timeLeft) })}
          </div>

        </div>

      ) : stack.length === 0 ? (

        <div className="swipe-empty">
          <h2>{t("swipe.empty.title")}</h2>
          <p>
            {filtersAreDefault
              ? t("swipe.empty.bodyDefault")
              : t("swipe.empty.bodyFiltered")}
          </p>
        </div>

      ) : (

        <>

          <div className="swipe-deck">

            {visibleCards.map((card, index) =>
              card.isHouseAd ? (
                <div
                  key={card.id}
                  className="swipe-card swipe-ad-card"
                  style={
                    index === 0
                      ? { zIndex: 10 }
                      : { transform: `scale(${1 - index * 0.05}) translateY(${index * 16}px)`, zIndex: 10 - index }
                  }
                >
                  <HouseAdBanner variant="deck" />
                  {index === 0 && (
                    <button
                      className="swipe-ad-dismiss"
                      onClick={() => setStack((prev) => prev.filter((c) => c.id !== card.id))}
                    >
                      {t("swipe.keepSwiping")}
                    </button>
                  )}
                </div>
              ) : (
                <SwipeCard
                  key={card.id}
                  profile={{ ...card, image: card.photos?.[0], country: card.city, distanceKm: card.distance_km }}
                  isTop={index === 0}
                  depth={index}
                  onSwipe={handleSwipe}
                  myInterests={currentUser?.interests || []}
                />
              )
            )}

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
                  <img src={myPhoto} alt={t("swipe.match.selfAlt")} />
                ) : (
                  <span className="match-photo-placeholder">👤</span>
                )}
              </div>

              <span className="match-photos-heart"><HeartIcon size={22} /></span>

              <div className="match-photo-circle theirs">
                <img src={matchInfo.photos?.[0]} alt={matchInfo.name} />
              </div>

            </div>

            {matchInfo.isSuperLikeMatch && (
              <span className="match-superlike-badge">
                <StarIcon size={13} /> {t("swipe.match.superlikeBadge")}
              </span>
            )}

            <h2>{t("swipe.match.title")}</h2>

            <p>{t("swipe.match.subtitle", { name: matchInfo.name })}</p>

            <div className="match-popup-actions">

              <button
                className="match-popup-btn secondary"
                onClick={() => setMatchInfo(null)}
              >
                {t("swipe.keepSwiping")}
              </button>

              <button
                className="match-popup-btn primary"
                onClick={() => navigate(`/chat/${matchInfo.id}`)}
              >
                <MessageIcon size={15} /> {t("swipe.match.sendMessage")}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Swipe;