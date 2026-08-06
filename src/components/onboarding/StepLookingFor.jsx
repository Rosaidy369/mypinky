import { useTranslation } from "react-i18next";
import { MOODS } from "../../data/profileOptions";
import { moodLabel, moodDesc } from "../../lib/profileLabels";

function StepLookingFor({ mood, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="step-content">

      <h2>{t("onboarding.lookingFor.heading")}</h2>
      <p className="step-subtitle">{t("onboarding.lookingFor.subtitle")}</p>

      <div className="mood-options">

        {MOODS.map(({ code }) => (
          <button
            type="button"
            key={code}
            className={`mood-option ${mood === code ? "selected" : ""}`}
            onClick={() => onChange(code)}
          >
            <span className="mood-option-title">{moodLabel(t, code)}</span>
            <span className="mood-option-desc">{moodDesc(t, code)}</span>
          </button>
        ))}

      </div>

    </div>
  );
}

export default StepLookingFor;
