import { useState, useRef } from "react";
import { isPlanActive } from "../../lib/plan";
import { hashId } from "../../lib/mockDistance";
import PremiumDiamond from "../ui/PremiumDiamond";
import BoostIcon from "../ui/BoostIcon";
import SwipeProfileDetail from "./SwipeProfileDetail";

function SwipeCard({ profile, onSwipe, isTop, depth, myInterests = [] }) {
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
      className={`swipe-card ${isTop ? "swipe-card-top" : ""}`}
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
              LIKE
            </span>

            <span className="swipe-badge nope-badge" style={{ opacity: nopeOpacity }}>
              NOPE
            </span>
          </>
        )}

        {profile.is_online && <span className="online-dot swipe-online-dot" title="En línea"></span>}

        <div className="swipe-top-row">

          <div className="swipe-top-left">

            {profile.is_boosted && (
              <span className="boosted-badge"><BoostIcon size={15} /> Destacado</span>
            )}

            {isPlanActive(profile) && (
              <span className="swipe-premium"><PremiumDiamond size={14} /> Premium</span>
            )}

          </div>

          <div className="swipe-top-right">

            <span className="swipe-match">🔥 {compatibility}% match</span>

          </div>

        </div>

        <div className="swipe-card-overlay">

          <div className="swipe-name-row">
            <h2>{profile.name}, {profile.age}</h2>
            {distance !== null && <span className="swipe-distance">📍 {distance} km</span>}
          </div>

          <p>{profile.country}</p>

          <div className="swipe-bottom-row">

            <div className="swipe-mood">{profile.mood}</div>

            {isTop && (
              <button
                className="info-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetail(true);
                }}
                aria-label="Ver más información"
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