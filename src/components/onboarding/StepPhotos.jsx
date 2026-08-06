import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabaseClient";

function StepPhotos({ photos, onAddPhotos, onRemovePhoto }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 7 - photos.length);
    e.target.value = "";

    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("photos")
        .upload(fileName, file);

      if (error) {
        console.error("Error subiendo foto:", error.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("photos")
        .getPublicUrl(fileName);

      onAddPhotos(publicUrlData.publicUrl);
    }

    setUploading(false);
  };

  return (
    <div className="step-content">

      <h2>{t("onboarding.photos.heading")}</h2>
      <p className="step-subtitle">
        {t("onboarding.photos.subtitle")}
      </p>

      {uploading && <p className="uploading-hint">{t("onboarding.photos.uploading")}</p>}

      <div className="photo-grid">

        {Array.from({ length: 7 }).map((_, i) => {
          const photo = photos[i];

          return (
            <div className={`photo-slot ${i === 0 ? "main-slot" : ""}`} key={i}>

              {photo ? (
                <>
                  <img src={photo} alt={t("onboarding.photos.photoAlt", { index: i + 1 })} />

                  <button
                    type="button"
                    className="remove-photo"
                    onClick={() => onRemovePhoto(i)}
                  >
                    ✕
                  </button>

                  {i === 0 && <span className="main-tag">{t("onboarding.photos.mainBadge")}</span>}
                </>
              ) : (
                <label className="add-photo-label">
                  <span>+</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    hidden
                    disabled={uploading}
                  />
                </label>
              )}

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default StepPhotos;