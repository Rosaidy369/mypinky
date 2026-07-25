import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive, isVipActive } from "../lib/plan";
import VoiceRecorder from "../components/profile/VoiceRecorder";
import StepPrompts from "../components/onboarding/StepPrompts";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import MicIcon from "../components/ui/MicIcon";
import "../styles/Profile.css";
import "../styles/MyProfile.css";
import "../styles/BackButton.css";

const ALL_INTERESTS = [
  "☕ Café", "🎵 Música", "✈️ Viajar", "🎬 Películas", "🏖 Playa",
  "🐶 Perros", "📚 Lectura", "🎨 Arte", "🍕 Pizza", "📸 Fotografía",
  "🏋️ Gym", "🎮 Videojuegos", "🥂 Vida nocturna", "🧘 Yoga", "🍳 Cocina"
];

const MOODS = [
  "💬 Quiero conversar",
  "😂 Quiero reír",
  "☕ Busco compañía",
  "🌙 No puedo dormir",
];

function calculateCompletion(user) {
  let score = 0;
  const total = 5;

  if (user.photos && user.photos.length > 0) score++;
  if (user.bio && user.bio.trim().length > 0) score++;
  if (user.interests && user.interests.length >= 3) score++;
  if (user.mood) score++;
  if (user.city) score++;

  return Math.round((score / total) * 100);
}

function MyProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const completion = calculateCompletion(user);

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

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 7 - draft.photos.length);
    e.target.value = "";

    for (const file of files) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage.from("photos").upload(fileName, file);

      if (error) {
        console.error("Error subiendo foto:", error.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from("photos").getPublicUrl(fileName);
      updateDraft("photos", [...draft.photos, publicUrlData.publicUrl]);
    }
  };

  const removePhoto = (index) => {
    updateDraft("photos", draft.photos.filter((_, i) => i !== index));
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
              />

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
                      💎 Premium
                    </span>
                  )}

                  <span className="locked-tag">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="10.5" width="16" height="10" rx="2.5"></rect>
                      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"></path>
                    </svg>
                    Nombre y edad verificados
                  </span>
                </h1>

                <p>📍 {user.city}</p>

              </div>

              <div className="mood">{user.mood}</div>

              <div className="about">
                <h2>Sobre mí</h2>
                <p>{user.bio}</p>
              </div>

              <div className="interests">
                <h2>Intereses</h2>
                <div className="tags">
                  {(user.interests || []).map((interest, i) => (
                    <span key={i}>{interest}</span>
                  ))}
                </div>
              </div>

              {user.prompts && user.prompts.filter((p) => p.question && p.answer).length > 0 && (
                <div className="about">
                  {user.prompts.filter((p) => p.question && p.answer).map((p, i) => (
                    <div className="prompt-card" key={i}>
                      <p className="prompt-question">{p.question}</p>
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

              <button className="edit-profile-btn" onClick={startEditing}>
                Editar perfil
              </button>

            </div>

          </>

        ) : (

          <div className="edit-form">

            <h2 className="edit-title">Editar perfil</h2>

            <div className="locked-fields-notice">
              🔒 Nombre y edad no se pueden editar por seguridad y verificación.
            </div>

            <label className="field-label">Fotos</label>

            <div className="photo-grid edit-photo-grid">

              {Array.from({ length: 7 }).map((_, i) => {
                const photo = draft.photos[i];

                return (
                  <div className={`photo-slot ${i === 0 ? "main-slot" : ""}`} key={i}>

                    {photo ? (
                      <>
                        <img src={photo} alt={`Foto ${i + 1}`} />

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
              {MOODS.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`option-pill ${draft.mood === option ? "selected" : ""}`}
                  onClick={() => updateDraft("mood", option)}
                >
                  {option}
                </button>
              ))}
            </div>

            <label className="field-label">Intereses</label>
            <div className="interest-grid">
              {ALL_INTERESTS.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  className={`interest-chip ${draft.interests.includes(interest) ? "selected" : ""}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>

            <StepPrompts
              prompts={draft.prompts || []}
              onChange={(val) => updateDraft("prompts", val)}
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
                <span>🔒 Solo disponible para usuarios VIP</span>
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

    </div>
  );
}

export default MyProfile;