import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive, isVipActive } from "../lib/plan";
import { INTERESTS, MOODS } from "../data/profileOptions";
import { moodLabel, interestLabel, promptQuestionLabel } from "../lib/profileLabels";
import VoiceRecorder from "../components/profile/VoiceRecorder";
import PhotoGalleryModal from "../components/profile/PhotoGalleryModal";
import PhotoCropModal from "../components/profile/PhotoCropModal";
import { getCroppedImageBlob } from "../lib/cropImage";
import StepPrompts from "../components/onboarding/StepPrompts";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import MicIcon from "../components/ui/MicIcon";
import LockIcon from "../components/ui/LockIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import CameraIcon from "../components/ui/CameraIcon";
import PinIcon from "../components/ui/PinIcon";
import CheckIcon from "../components/ui/CheckIcon";
import BoostIcon from "../components/ui/BoostIcon";
import { requestLocation } from "../lib/geolocation";
import "../styles/Profile.css";
import "../styles/MyProfile.css";
import "../styles/BackButton.css";

// Same generic messages as StepBasicInfo.jsx's onboarding step -- reused
// here since geolocation.js rejects with a code, not a message, and this
// mapping is the same regardless of whether location is shared during
// onboarding or from here.
const LOCATION_ERROR_KEYS = {
  unsupported: "onboarding.basicInfo.locationErrorUnsupported",
  denied: "onboarding.basicInfo.locationErrorDenied",
  failed: "onboarding.basicInfo.locationErrorFailed",
};

const BOOST_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function formatBoostCooldown(ms) {
  const totalHours = Math.max(Math.ceil(ms / (1000 * 60 * 60)), 0);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

// Weighted, not just "5 boxes checked" -- otherwise the minimum bar (1
// photo, 3 interests, a mood, a city, any bio) already reads 100% even
// with 6 empty photo slots and no prompts answered, which doesn't
// encourage anyone to keep going. Voice note only counts toward the
// total for VIP users, since only they can record one -- everyone else's
// 100% is scored against what's actually available to them.
function calculateCompletion(user, isVip) {
  const PHOTO_WEIGHT = 25;
  const PHOTOS_FOR_FULL_CREDIT = 5; // out of 7 slots -- a cap, not all 7 required
  const BIO_WEIGHT = 15;
  const INTERESTS_WEIGHT = 15;
  const MOOD_WEIGHT = 10;
  const CITY_WEIGHT = 10;
  const PROMPTS_WEIGHT = 15;
  const PROMPTS_FOR_FULL_CREDIT = 2;
  const VOICE_WEIGHT = 10;

  const promptsAnswered = (user.prompts || []).filter(
    (p) => p.question && p.answer && p.answer.trim().length > 0
  ).length;

  let score = 0;
  let maxPossible = 0;

  score += Math.min((user.photos?.length || 0) / PHOTOS_FOR_FULL_CREDIT, 1) * PHOTO_WEIGHT;
  maxPossible += PHOTO_WEIGHT;

  if (user.bio && user.bio.trim().length > 0) score += BIO_WEIGHT;
  maxPossible += BIO_WEIGHT;

  if (user.interests && user.interests.length >= 3) score += INTERESTS_WEIGHT;
  maxPossible += INTERESTS_WEIGHT;

  if (user.mood) score += MOOD_WEIGHT;
  maxPossible += MOOD_WEIGHT;

  if (user.city) score += CITY_WEIGHT;
  maxPossible += CITY_WEIGHT;

  score += Math.min(promptsAnswered / PROMPTS_FOR_FULL_CREDIT, 1) * PROMPTS_WEIGHT;
  maxPossible += PROMPTS_WEIGHT;

  if (isVip) {
    if (user.voice_note_url) score += VOICE_WEIGHT;
    maxPossible += VOICE_WEIGHT;
  }

  return Math.round((score / maxPossible) * 100);
}

function MyProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [cropQueue, setCropQueue] = useState([]);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");
  const [boosting, setBoosting] = useState(false);
  const [boostError, setBoostError] = useState("");

  const isVip = isVipActive(user);
  const isPremiumPlan = isPlanActive(user) && user?.plan === "premium";

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error) {
      console.error("Error cargando perfil:", error.message);
      setLoading(false);
      return;
    }

    setUser(data);
    setLoading(false);

    if (!data.city && !data.bio) {
      navigate("/onboarding");
    }
  };

  if (loading) {
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando tu perfil...</div>;
  }

  if (!user) return null;

  const completion = calculateCompletion(user, isVip);

  const isBoostedNow = user.boosted_until && new Date(user.boosted_until) > new Date();
  const nextBoostAt = user.last_boost_used_at
    ? new Date(new Date(user.last_boost_used_at).getTime() + BOOST_COOLDOWN_MS)
    : null;
  const canBoost = !nextBoostAt || nextBoostAt <= new Date();

  const handleBoost = async () => {
    setBoosting(true);
    setBoostError("");

    const { data, error } = await supabase.rpc("activate_boost");
    const result = Array.isArray(data) ? data[0] : data;

    setBoosting(false);

    if (error) {
      setBoostError("No se pudo impulsar tu perfil. Intenta de nuevo.");
      // Temporary: log the full Supabase/Postgres error (code, details,
      // hint), not just .message, to diagnose the real rejection reason
      // instead of guessing again.
      console.error("activate_boost error completo:", error);
      return;
    }

    if (!result?.activated) {
      if (result?.reason === "not_vip") {
        setBoostError("Tu plan VIP no está activo ahora mismo (puede haber vencido). Revisa tu plan en Configuración.");
      } else if (result?.reason === "cooldown") {
        setBoostError("Todavía no puedes volver a impulsar tu perfil.");
      } else {
        setBoostError("No se pudo impulsar tu perfil. Intenta de nuevo.");
        console.error("activate_boost devolvió una razón inesperada:", result?.reason);
      }
    }

    loadProfile();
  };

  const startEditing = () => {
    setDraft({ ...user, photos: user.photos || [], interests: user.interests || [], prompts: user.prompts || [] });
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
  };

  const saveChanges = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        city: draft.city,
        latitude: draft.latitude,
        longitude: draft.longitude,
        bio: draft.bio,
        mood: draft.mood,
        interests: draft.interests,
        photos: draft.photos,
        prompts: draft.prompts,
        voice_note_url: draft.voice_note_url,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      console.error("Error guardando perfil:", error.message);
      return;
    }

    setUser(draft);
    setEditing(false);
    setDraft(null);
  };

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleShareLocation = async () => {
    setLocationStatus("loading");
    setLocationError("");

    try {
      const { latitude, longitude } = await requestLocation();
      updateDraft("latitude", latitude);
      updateDraft("longitude", longitude);
      setLocationStatus("granted");
    } catch (err) {
      setLocationStatus("idle");
      setLocationError(t(LOCATION_ERROR_KEYS[err.code] || LOCATION_ERROR_KEYS.failed));
    }
  };

  const toggleInterest = (interest) => {
    setDraft((prev) => {
      const has = prev.interests.includes(interest);
      return {
        ...prev,
        interests: has
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  // Files go through the crop modal one at a time before upload — queueing
  // here lets a multi-file selection still crop each photo individually.
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 7 - draft.photos.length);
    e.target.value = "";
    if (files.length === 0) return;

    setCropQueue(files);
    setCropImageSrc(URL.createObjectURL(files[0]));
  };

  const advanceCropQueue = (remaining) => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);

    if (remaining.length === 0) {
      setCropQueue([]);
      setCropImageSrc(null);
      return;
    }

    setCropQueue(remaining);
    setCropImageSrc(URL.createObjectURL(remaining[0]));
  };

  const handleCropCancel = () => {
    advanceCropQueue(cropQueue.slice(1));
  };

  const handleCropConfirm = async (croppedAreaPixels) => {
    try {
      const blob = await getCroppedImageBlob(cropImageSrc, croppedAreaPixels);
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

      const { error } = await supabase.storage
        .from("photos")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (error) {
        console.error("Error subiendo foto:", error.message);
      } else {
        const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(fileName);
        setDraft((prev) => ({ ...prev, photos: [...prev.photos, publicUrlData.publicUrl] }));
      }
    } finally {
      advanceCropQueue(cropQueue.slice(1));
    }
  };

  const removePhoto = (index) => {
    updateDraft("photos", draft.photos.filter((_, i) => i !== index));
  };

  // Pointer Events (not the HTML5 drag-and-drop API) so reordering works
  // with touch on phones, not just mouse on desktop.
  const handlePhotoPointerDown = (index, e) => {
    if (!draft.photos[index]) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragIndex(index);
  };

  const handlePhotoPointerMove = (e) => {
    if (dragIndex === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slot = el && el.closest("[data-photo-slot]");
    const overIndex = slot ? Number(slot.dataset.photoSlot) : null;
    setDragOverIndex(overIndex !== null && draft.photos[overIndex] ? overIndex : null);
  };

  const handlePhotoPointerUp = () => {
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const updated = [...draft.photos];
      [updated[dragIndex], updated[dragOverIndex]] = [updated[dragOverIndex], updated[dragIndex]];
      updateDraft("photos", updated);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleVoiceSave = async (blob) => {
    // Must start with the user's own id, same as photos, to satisfy the
    // storage policy that scopes uploads to `${auth.uid()}/...`.
    const fileName = `${user.id}/voice-${Date.now()}.webm`;

    // Use the blob's real recorded type, not a fixed literal — a mismatched
    // declared content-type can produce a file that "plays" silently.
    const { error } = await supabase.storage
      .from("photos")
      .upload(fileName, blob, { contentType: blob.type || "audio/webm" });

    if (error) {
      console.error("Error subiendo nota de voz:", error.message);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(fileName);
    updateDraft("voice_note_url", publicUrlData.publicUrl);
  };

  return (
    <div className="profile-page">

      <div className="profile-back-wrapper">
        <BackButton />
      </div>

      <div className="profile-cover"></div>

      <div className="profile-container my-profile-container">

        {!editing ? (

          <>

            <div className="profile-left">

              <img
                className="profile-photo"
                src={user.photos && user.photos[0] ? user.photos[0] : "https://via.placeholder.com/220"}
                alt={user.name}
                onClick={() => user.photos?.length > 0 && setShowGallery(true)}
                style={{ cursor: user.photos?.length > 0 ? "pointer" : "default" }}
              />

              {user.photos && user.photos.length > 1 && (
                <button className="view-photos-btn" onClick={() => setShowGallery(true)}>
                  <CameraIcon size={15} /> Ver fotos ({user.photos.length})
                </button>
              )}

              <div className="completion-box">
                <div className="completion-label">
                  Perfil completo: {completion}%
                </div>
                <div className="completion-track">
                  <div
                    className="completion-fill"
                    style={{ width: `${completion}%` }}
                  ></div>
                </div>
              </div>

            </div>

            <div className="profile-right">

              <div className="profile-header">

                <h1>
                  {user.name}, {user.age}

                  {isVip && (
                    <span className="vip-badge-inline">
                      <VipDiamond size={20} /> VIP
                    </span>
                  )}

                  {isPremiumPlan && (
                    <span className="premium-badge-inline">
                      <PremiumDiamond size={16} /> Premium
                    </span>
                  )}

                  <span className="locked-tag">
                    <LockIcon size={13} />
                    Nombre y edad verificados
                  </span>
                </h1>

                <p>📍 {user.city}</p>

              </div>

              <div className="mood">{moodLabel(t, user.mood)}</div>

              <div className="about">
                <h2>Sobre mí</h2>
                <p>{user.bio}</p>
              </div>

              <div className="interests">
                <h2>Intereses</h2>
                <div className="tags">
                  {(user.interests || []).map((interest, i) => (
                    <span key={i}>{interestLabel(t, interest)}</span>
                  ))}
                </div>
              </div>

              {user.prompts && user.prompts.filter((p) => p.question && p.answer).length > 0 && (
                <div className="about">
                  {user.prompts.filter((p) => p.question && p.answer).map((p, i) => (
                    <div className="prompt-card" key={i}>
                      <p className="prompt-question">{promptQuestionLabel(t, p.question)}</p>
                      <p className="prompt-answer">{p.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {user.voice_note_url && (
                <div className="voice-display">
                  <h2><MicIcon size={17} className="voice-title-icon" /> Nota de voz</h2>
                  <audio controls src={user.voice_note_url} className="voice-audio"></audio>
                </div>
              )}

              {isVip && (
                <div className="boost-section">

                  <button
                    className="boost-btn"
                    onClick={handleBoost}
                    disabled={boosting || (!canBoost && !isBoostedNow)}
                  >
                    {boosting ? (
                      "Impulsando..."
                    ) : isBoostedNow ? (
                      <><BoostIcon size={20} /> Perfil destacado activo</>
                    ) : canBoost ? (
                      <><BoostIcon size={20} /> Impulsar mi perfil</>
                    ) : (
                      `Disponible en ${formatBoostCooldown(nextBoostAt - new Date())}`
                    )}
                  </button>

                  {boostError && <p className="boost-error">{boostError}</p>}

                </div>
              )}

              <button className="edit-profile-btn" onClick={startEditing}>
                Editar perfil
              </button>

            </div>

          </>

        ) : (

          <div className="edit-form">

            <h2 className="edit-title">Editar perfil</h2>

            <div className="locked-fields-notice">
              <LockIcon size={14} /> Nombre y edad no se pueden editar por seguridad y verificación.
            </div>

            <label className="field-label">Fotos</label>
            <p className="drag-hint">Arrastra una foto sobre otra para cambiar el orden. La primera es tu foto principal.</p>

            <div className="photo-grid edit-photo-grid">

              {Array.from({ length: 7 }).map((_, i) => {
                const photo = draft.photos[i];

                return (
                  <div
                    className={`photo-slot ${i === 0 ? "main-slot" : ""} ${dragIndex === i ? "dragging" : ""} ${dragOverIndex === i ? "drag-over" : ""}`}
                    key={i}
                    data-photo-slot={i}
                  >

                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt={`Foto ${i + 1}`}
                          className="draggable-photo"
                          onPointerDown={(e) => handlePhotoPointerDown(i, e)}
                          onPointerMove={handlePhotoPointerMove}
                          onPointerUp={handlePhotoPointerUp}
                          onPointerCancel={handlePhotoPointerUp}
                        />

                        <button
                          type="button"
                          className="remove-photo"
                          onClick={() => removePhoto(i)}
                        >
                          ✕
                        </button>

                        {i === 0 && <span className="main-tag">Principal</span>}
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
                        />
                      </label>
                    )}

                  </div>
                );
              })}

            </div>

            <label className="field-label">Ciudad</label>
            <input
              type="text"
              value={draft.city || ""}
              onChange={(e) => updateDraft("city", e.target.value)}
            />

            <div className="location-share-row">

              <button
                type="button"
                className={`location-share-btn ${draft.latitude ? "granted" : ""}`}
                onClick={handleShareLocation}
                disabled={locationStatus === "loading"}
              >
                {draft.latitude ? (
                  <><CheckIcon size={15} /> Ubicación actualizada</>
                ) : (
                  <><PinIcon size={15} /> {locationStatus === "loading" ? "Obteniendo ubicación..." : "Actualizar mi ubicación (opcional)"}</>
                )}
              </button>

              {locationError && <p className="location-share-error">{locationError}</p>}

            </div>

            <label className="field-label">Biografía</label>
            <textarea
              rows={5}
              maxLength={300}
              value={draft.bio || ""}
              onChange={(e) => updateDraft("bio", e.target.value)}
            />
            <span className="char-counter">{(draft.bio || "").length}/300</span>

            <label className="field-label">¿Qué buscas?</label>
            <div className="option-pills">
              {MOODS.map(({ code }) => (
                <button
                  type="button"
                  key={code}
                  className={`option-pill ${draft.mood === code ? "selected" : ""}`}
                  onClick={() => updateDraft("mood", code)}
                >
                  {moodLabel(t, code)}
                </button>
              ))}
            </div>

            <label className="field-label">Intereses</label>
            <div className="interest-grid">
              {INTERESTS.map(({ code }) => (
                <button
                  type="button"
                  key={code}
                  className={`interest-chip ${draft.interests.includes(code) ? "selected" : ""}`}
                  onClick={() => toggleInterest(code)}
                >
                  {interestLabel(t, code)}
                </button>
              ))}
            </div>

            <StepPrompts
              prompts={draft.prompts || []}
              onChange={(val) => updateDraft("prompts", val)}
              isEditing
            />

            <label className="field-label">Nota de voz (10s)</label>

            {isVip ? (

              <VoiceRecorder
                voiceNote={draft.voice_note_url}
                onSave={handleVoiceSave}
                onRemove={() => updateDraft("voice_note_url", null)}
              />

            ) : (

              <div className="voice-locked">
                <span><LockIcon size={13} /> Solo disponible para usuarios VIP</span>
                <Link to="/premium" className="voice-unlock-btn">
                  <VipDiamond size={14} /> Hazte VIP
                </Link>
              </div>

            )}

            <div className="edit-actions">
              <button className="cancel-btn" onClick={cancelEditing} disabled={saving}>
                Cancelar
              </button>
              <button className="save-btn" onClick={saveChanges} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>

          </div>

        )}

      </div>

      {showGallery && user.photos && user.photos.length > 0 && (
        <PhotoGalleryModal
          photos={user.photos}
          onClose={() => setShowGallery(false)}
        />
      )}

      {cropImageSrc && (
        <PhotoCropModal
          imageSrc={cropImageSrc}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}

    </div>
  );
}

export default MyProfile;