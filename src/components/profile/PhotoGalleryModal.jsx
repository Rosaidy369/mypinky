import { useState } from "react";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";

function PhotoGalleryModal({ photos, onClose }) {
  const [index, setIndex] = useState(0);
  useLockBodyScroll();

  return (
    <div className="gallery-modal-backdrop" onClick={onClose}>

      <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>

        <button className="gallery-modal-close" onClick={onClose}>
          ✕
        </button>

        <img src={photos[index]} alt={`Foto ${index + 1}`} className="gallery-modal-image" />

        {photos.length > 1 && (
          <>
            <button
              className="gallery-modal-arrow left"
              onClick={() => setIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
            >
              ‹
            </button>

            <button
              className="gallery-modal-arrow right"
              onClick={() => setIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
            >
              ›
            </button>
          </>
        )}

        <div className="gallery-modal-dots">
          {photos.map((_, i) => (
            <span
              key={i}
              className={`dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
            ></span>
          ))}
        </div>

        <span className="gallery-modal-counter">
          {index + 1} / {photos.length}
        </span>

      </div>

    </div>
  );
}

export default PhotoGalleryModal;