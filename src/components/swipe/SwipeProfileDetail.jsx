import { useState } from "react";
import { isPlanActive } from "../../lib/plan";

function SwipeProfileDetail({ profile, onClose, myInterests = [] }) {
  const photos = profile.photos && profile.photos.length > 0
    ? profile.photos
    : [profile.image];

  const [photoIndex, setPhotoIndex] = useState(0);

  const interests = profile.interests || [];
  const sharedCount = interests.filter((i) => myInterests.includes(i)).length;

  const prompts = profile.prompts || [];

  return (
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

          {isPlanActive(profile) && (
            <span className="detail-premium">💎 Premium</span>
          )}

        </div>

        <div className="detail-body">

          <div className="detail-name-row">
            <h2>{profile.name}, {profile.age}</h2>
          </div>

          <p className="detail-location">📍 {profile.country}</p>

          <div className="detail-mood">{profile.mood}</div>

          {sharedCount > 0 && (
            <div className="detail-compatibility">
              ✨ {sharedCount} {sharedCount === 1 ? "interés en común" : "intereses en común"} contigo
            </div>
          )}

          <div className="detail-section">
            <h3>Sobre mí</h3>
            <p>{profile.bio}</p>
          </div>

          {prompts.length > 0 && (
            <div className="detail-section">
              {prompts.map((p, i) => (
                <div className="prompt-card" key={i}>
                  <p className="prompt-question">{p.question}</p>
                  <p className="prompt-answer">{p.answer}</p>
                </div>
              ))}
            </div>
          )}

          <div className="detail-section">
            <h3>Intereses</h3>
            <div className="detail-tags">
              {interests.map((interest, i) => (
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

        </div>

      </div>

    </div>
  );
}

export default SwipeProfileDetail;