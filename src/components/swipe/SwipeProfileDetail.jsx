import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { isPlanActive, isVipActive } from "../../lib/plan";
import { moodLabel, interestLabel, promptQuestionLabel, sharedInterestCount } from "../../lib/profileLabels";
import PremiumDiamond from "../ui/PremiumDiamond";
import VipDiamond from "../ui/VipDiamond";
import MicIcon from "../ui/MicIcon";
import PinIcon from "../ui/PinIcon";
import SpecialTouchHeart from "../ui/SpecialTouchHeart";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";

function SwipeProfileDetail({ profile, onClose, myInterests = [] }) {
  const { t } = useTranslation();
  const photos = profile.photos && profile.photos.length > 0
    ? profile.photos
    : [profile.image];

  const [photoIndex, setPhotoIndex] = useState(0);
  useLockBodyScroll();

  const interests = profile.interests || [];
  const sharedCount = sharedInterestCount(interests, myInterests);

  const prompts = profile.prompts || [];

  // Portaled to <body> so the sheet is a real DOM sibling of the swipe deck,
  // not a child of the draggable .swipe-card. Otherwise clicks to close it
  // still bubble through the card's pointer handlers underneath, which can
  // leave the card mid-"dragging" with a corrupted transform until reload.
  return createPortal(
    <div className="detail-sheet-backdrop" onClick={onClose}>

      <div className="detail-sheet" onClick={(e) => e.stopPropagation()}>

        <button className="detail-close" onClick={onClose}>
          ✕
        </button>

        <div className="detail-gallery">

          <img src={photos[photoIndex]} alt={profile.name} />

          <div className="detail-gallery-dots">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`dot ${i === photoIndex ? "active" : ""}`}
                onClick={() => setPhotoIndex(i)}
              ></span>
            ))}
          </div>

          {photos.length > 1 && (
            <>
              <button
                className="gallery-arrow left"
                onClick={() =>
                  setPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
                }
              >
                ‹
              </button>

              <button
                className="gallery-arrow right"
                onClick={() =>
                  setPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
                }
              >
                ›
              </button>
            </>
          )}

          {isVipActive(profile) ? (
            <span className="detail-premium"><VipDiamond size={14} /> {t("swipe.card.vip")}</span>
          ) : isPlanActive(profile) && profile.plan === "premium" ? (
            <span className="detail-premium"><PremiumDiamond size={14} /> {t("swipe.card.premium")}</span>
          ) : null}

        </div>

        <div className="detail-body">

          <div className="detail-name-row">
            <h2>{profile.name}, {profile.age}</h2>
          </div>

          <p className="detail-location"><PinIcon size={13} className="detail-location-icon" /> {profile.country}</p>

          <div className="detail-mood">{moodLabel(t, profile.mood)}</div>

          {profile.special_touch_message && (
            <div className="detail-special-touch">
              <h3><SpecialTouchHeart size={15} /> {t("swipe.detail.specialTouchHeading")}</h3>
              <p>{profile.special_touch_message}</p>
            </div>
          )}

          {sharedCount > 0 && (
            <div className="detail-compatibility">
              ✨ {t("swipe.detail.sharedInterests", { count: sharedCount })}
            </div>
          )}

          <div className="detail-section">
            <h3>{t("swipe.detail.aboutMe")}</h3>
            <p>{profile.bio}</p>
          </div>

          {prompts.length > 0 && (
            <div className="detail-section">
              {prompts.map((p, i) => (
                <div className="prompt-card" key={i}>
                  <p className="prompt-question">{promptQuestionLabel(t, p.question)}</p>
                  <p className="prompt-answer">{p.answer}</p>
                </div>
              ))}
            </div>
          )}

          <div className="detail-section">
            <h3>{t("swipe.detail.interests")}</h3>
            <div className="detail-tags">
              {interests.map((interest, i) => (
                <span
                  key={i}
                  className={myInterests.includes(interest) ? "tag-shared" : ""}
                >
                  {interestLabel(t, interest)}
                  {myInterests.includes(interest) && " ✓"}
                </span>
              ))}
            </div>
          </div>

          {profile.voice_note_url && (
            <div className="detail-section">
              <h3><MicIcon size={15} className="voice-title-icon" /> {t("swipe.detail.voiceNote")}</h3>
              <audio controls src={profile.voice_note_url} className="voice-audio"></audio>
            </div>
          )}

        </div>

      </div>

    </div>,
    document.body
  );
}

export default SwipeProfileDetail;