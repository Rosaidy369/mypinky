import { useTranslation } from "react-i18next";
import { DATING_INTENTS } from "../../data/profileOptions";
import { datingIntentLabel } from "../../lib/profileLabels";

function StepDatingIntent({ datingIntent, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="step-content">

      <h2>{t("onboarding.datingIntent.heading")}</h2>
      <p className="step-subtitle">{t("onboarding.datingIntent.subtitle")}</p>

      <div className="mood-options">

        {DATING_INTENTS.map(({ code }) => (
          <button
            type="button"
            key={code}
            className={`mood-option ${datingIntent === code ? "selected" : ""}`}
            onClick={() => onChange(code)}
          >
            <span className="mood-option-title">{datingIntentLabel(t, code)}</span>
          </button>
        ))}

      </div>

    </div>
  );
}

export default StepDatingIntent;
