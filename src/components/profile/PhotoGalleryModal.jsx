import { useState } from "react";
import { useTranslation } from "react-i18next";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";

function PhotoGalleryModal({ photos, onClose }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  useLockBodyScroll();

  return (
    <div className="gallery-modal-backdrop" onClick={onClose}>

      <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>

        <button className="gallery-modal-close" onClick={onClose} aria-label={t("common.close")}>
          ✕
        </button>

        <img src={photos[index]} alt={t("common.photoAlt", { count: index + 1 })} className="gallery-modal-image" />

        {photos.length > 1 && (
          <>
            <button
              className="gallery-modal-arrow left"
              onClick={() => setIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))}
              aria-label={t("common.previousPhoto")}
            >
              ‹
            </button>

            <button
              className="gallery-modal-arrow right"
              onClick={() => setIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))}
              aria-label={t("common.nextPhoto")}
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
          {t("common.galleryCounter", { current: index + 1, total: photos.length })}
        </span>

      </div>

    </div>
  );
}

export default PhotoGalleryModal;