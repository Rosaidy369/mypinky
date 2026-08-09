import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { isPlanActive, isVipActive } from "../../lib/plan";
import { hashId } from "../../lib/mockDistance";
import { moodLabel } from "../../lib/profileLabels";
import PremiumDiamond from "../ui/PremiumDiamond";
import VipDiamond from "../ui/VipDiamond";
import BoostIcon from "../ui/BoostIcon";
import SuperLikeHeart from "../ui/SuperLikeHeart";
import SpecialTouchHeart from "../ui/SpecialTouchHeart";
import SwipeProfileDetail from "./SwipeProfileDetail";

// One heart-shaped path (reused from the same decorative hearts already
// drawn elsewhere in Swipe.jsx/SwipeProfileDetail.jsx) plus plain dots,
// staggered by nth-child in Swipe.css -- mirrors the existing
// .confetti-piece/.sparkle pattern in this same stylesheet.
const PINKY_PARTICLE_PATH =
  "M12 21s-7.5-4.9-10.2-9.3C.4 9.5 1 6.2 3.6 4.7c2.2-1.3 4.9-.7 6.4 1.3.6.8 1.3 1.9 2 3 .7-1.1 1.4-2.2 2-3 1.5-2 4.2-2.6 6.4-1.3 2.6 1.5 3.2 4.8 1.8 7-2.7 4.4-10.2 9.3-10.2 9.3z";

function PinkyParticles() {
  return (
    <div className="pinky-particles">
      {[0, 1, 2, 3, 4].map((i) =>
        i % 2 === 0 ? (
          <span className="pinky-particle pinky-particle-heart" key={i}>
            <svg viewBox="0 0 24 24" width="100%" height="100%">
              <path fill="currentColor" d={PINKY_PARTICLE_PATH} />
            </svg>
          </span>
        ) : (
          <span className="pinky-particle pinky-particle-spark" key={i}></span>
        )
      )}
    </div>
  );
}

function SwipeCard({ profile, onSwipe, isTop, depth, myInterests = [] }) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  const compatibility = 70 + (hashId(profile.id) % 30);
  const distance = typeof profile.distanceKm === "number" ? Math.round(profile.distanceKm) : null;

  const handlePointerDown = (e) => {
    if (!isTop) return;
    setDragging(true);
    startPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y,
    });
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);

    const threshold = 120;

    if (position.x > threshold) {
      triggerSwipe("right");
    } else if (position.x < -threshold) {
      triggerSwipe("left");
    } else {
      setPosition({ x: 0, y: 0 });
    }
  };

  const triggerSwipe = (direction) => {
    const flyX = direction === "right" ? 700 : -700;
    setPosition({ x: flyX, y: position.y - 50 });
    setTimeout(() => {
      onSwipe(direction, profile);
    }, 300);
  };

  const rotation = position.x / 18;
  const likeOpacity = Math.min(Math.max(position.x / 100, 0), 1);
  const nopeOpacity = Math.min(Math.max(-position.x / 100, 0), 1);

  const cardStyle = isTop
    ? {
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
        transition: dragging ? "none" : "transform .45s cubic-bezier(.2,.8,.3,1)",
        zIndex: 10,
      }
    : {
        transform: `scale(${1 - depth * 0.05}) translateY(${depth * 16}px)`,
        zIndex: 10 - depth,
      };

  return (
    <div
      className={`swipe-card ${isTop ? "swipe-card-top" : ""} ${profile.is_boosted ? "is-boosted" : ""} ${profile.received_super_like ? "pinky-pulse" : ""}`}
      style={cardStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="swipe-card-image"
        style={{ backgroundImage: `url(${profile.image})` }}
      >

        {isTop && (
          <>
            <span className="swipe-badge like-badge" style={{ opacity: likeOpacity }}>
              {t("swipe.card.like")}
            </span>

            <span className="swipe-badge nope-badge" style={{ opacity: nopeOpacity }}>
              {t("swipe.card.nope")}
            </span>
          </>
        )}

        {profile.received_super_like && <PinkyParticles />}

        {profile.special_touch_message ? (
          <>
            <span className="pinky-ribbon special-touch-ribbon">
              <SpecialTouchHeart size={13} /> {t("swipe.card.specialTouchRibbon")}
            </span>
            <div className="special-touch-bubble">
              <p>{profile.special_touch_message}</p>
            </div>
          </>
        ) : (
          profile.received_super_like && (
            <span className="pinky-ribbon">
              <SuperLikeHeart size={13} /> {t("swipe.card.superLikedRibbon")}
            </span>
          )
        )}

        <div className="swipe-top-row">

          <div className="swipe-top-left">

            {isVipActive(profile) ? (
              <span className="swipe-premium"><VipDiamond size={14} /> {t("swipe.card.vip")}</span>
            ) : isPlanActive(profile) && profile.plan === "premium" ? (
              <span className="swipe-premium"><PremiumDiamond size={14} /> {t("swipe.card.premium")}</span>
            ) : null}

          </div>

          <div className="swipe-top-right">

            {profile.is_online && <span className="online-dot swipe-online-dot" title={t("swipe.card.onlineTitle")}></span>}

            <span className="swipe-match">🔥 {t("swipe.card.matchPercent", { percent: compatibility })}</span>

          </div>

        </div>

        <div className="swipe-card-overlay">

          {profile.is_boosted && (
            <span className="boosted-tag"><BoostIcon size={12} /> {t("swipe.card.boosted")}</span>
          )}

          <div className="swipe-name-row">
            <h2>{profile.name}, {profile.age}</h2>
            {distance !== null && <span className="swipe-distance">📍 {distance} km</span>}
          </div>

          <p>{profile.country}</p>

          <div className="swipe-bottom-row">

            <div className="swipe-mood">{moodLabel(t, profile.mood)}</div>

            {isTop && (
              <button
                className="info-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetail(true);
                }}
                aria-label={t("swipe.card.moreInfoAria")}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9.5"></circle>
                  <line x1="12" y1="11" x2="12" y2="16.5"></line>
                  <circle cx="12" cy="7.7" r="0.9" fill="currentColor" stroke="none"></circle>
                </svg>
              </button>
            )}

          </div>

        </div>

      </div>

      {showDetail && (
        <SwipeProfileDetail
          profile={profile}
          myInterests={myInterests}
          onClose={() => setShowDetail(false)}
        />
      )}

    </div>
  );
}

export default SwipeCard;