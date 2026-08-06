import { useTranslation } from "react-i18next";
import { INTERESTS } from "../../data/profileOptions";
import { interestLabel } from "../../lib/profileLabels";

function StepInterests({ selected, onToggle }) {
  const { t } = useTranslation();

  return (
    <div className="step-content">

      <h2>{t("onboarding.interests.heading")}</h2>
      <p className="step-subtitle">
        {t("onboarding.interests.subtitle")}
      </p>

      <div className="interest-grid">

        {INTERESTS.map(({ code }) => (
          <button
            type="button"
            key={code}
            className={`interest-chip ${selected.includes(code) ? "selected" : ""}`}
            onClick={() => onToggle(code)}
          >
            {interestLabel(t, code)}
          </button>
        ))}

      </div>

    </div>
  );
}

export default StepInterests;
