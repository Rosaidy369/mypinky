import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import ProgressBar from "../components/onboarding/ProgressBar";
import StepBasicInfo from "../components/onboarding/StepBasicInfo";
import StepPhotos from "../components/onboarding/StepPhotos";
import StepBio from "../components/onboarding/StepBio";
import StepInterests from "../components/onboarding/StepInterests";
import StepLookingFor from "../components/onboarding/StepLookingFor";
import StepPrompts from "../components/onboarding/StepPrompts";
import "../styles/Onboarding.css";

const TOTAL_STEPS = 6;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    city: "",
    latitude: null,
    longitude: null,
    photos: [],
    bio: "",
    interests: [],
    mood: "",
    prompts: [],
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest) => {
    setFormData((prev) => {
      const alreadySelected = prev.interests.includes(interest);
      return {
        ...prev,
        interests: alreadySelected
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  const addPhoto = (photoData) => {
    setFormData((prev) => ({ ...prev, photos: [...prev.photos, photoData] }));
  };

  const removePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const isStepValid = () => {
    if (step === 1) return formData.name && formData.age && formData.gender && formData.city;
    if (step === 2) return formData.photos.length >= 1;
    if (step === 3) return formData.bio.trim().length > 0;
    if (step === 4) return formData.interests.length >= 3;
    if (step === 5) return formData.mood !== "";
    return true;
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    setSaving(true);
    setSaveError("");

    const cleanPrompts = formData.prompts.filter(
      (p) => p.question && p.answer && p.answer.trim().length > 0
    );

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("profiles")
      .update({
        gender: formData.gender,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
        photos: formData.photos,
        bio: formData.bio,
        interests: formData.interests,
        mood: formData.mood,
        prompts: cleanPrompts,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      setSaveError("Ocurrió un error al guardar tu perfil. Intenta de nuevo.");
      console.error(error.message);
      return;
    }

    const redirectTo = sessionStorage.getItem("mypinky_redirect_after_login");
    if (redirectTo) {
      sessionStorage.removeItem("mypinky_redirect_after_login");
      navigate(redirectTo);
    } else {
      navigate("/swipe");
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="onboarding-page">

      <div className="onboarding-card">

        <ProgressBar step={step} totalSteps={TOTAL_STEPS} />

        {step === 1 && (
          <StepBasicInfo data={formData} onChange={updateField} />
        )}

        {step === 2 && (
          <StepPhotos
            photos={formData.photos}
            onAddPhotos={addPhoto}
            onRemovePhoto={removePhoto}
          />
        )}

        {step === 3 && (
          <StepBio bio={formData.bio} onChange={(val) => updateField("bio", val)} />
        )}

        {step === 4 && (
          <StepInterests selected={formData.interests} onToggle={toggleInterest} />
        )}

        {step === 5 && (
          <StepLookingFor
            mood={formData.mood}
            onChange={(val) => updateField("mood", val)}
          />
        )}

        {step === 6 && (
          <StepPrompts
            prompts={formData.prompts}
            onChange={(val) => updateField("prompts", val)}
          />
        )}

        {saveError && <p className="onboarding-error">{saveError}</p>}

        <div className="onboarding-actions">

          {step > 1 ? (
            <button className="onboarding-back-btn" onClick={handleBack}>
              Atrás
            </button>
          ) : (
            <span></span>
          )}

          <button
            className="onboarding-next-btn"
            onClick={handleNext}
            disabled={!isStepValid() || saving}
          >
            {saving ? "Guardando..." : step === TOTAL_STEPS ? "Finalizar" : "Continuar"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default Onboarding;