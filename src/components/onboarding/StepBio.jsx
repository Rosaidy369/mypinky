import { useTranslation } from "react-i18next";

const MAX_LENGTH = 300;

function StepBio({ bio, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="step-content">

      <h2>{t("onboarding.bio.heading")}</h2>
      <p className="step-subtitle">
        {t("onboarding.bio.subtitle")}
      </p>

      <textarea
        placeholder={t("onboarding.bio.placeholder")}
        maxLength={MAX_LENGTH}
        value={bio}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
      />

      <span className="char-counter">
        {bio.length}/{MAX_LENGTH}
      </span>

    </div>
  );
}

export default StepBio;