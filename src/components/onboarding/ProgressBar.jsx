import { useTranslation } from "react-i18next";

function ProgressBar({ step, totalSteps }) {
  const { t } = useTranslation();
  const percent = (step / totalSteps) * 100;

  return (
    <div className="progress-wrapper">

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }}></div>
      </div>

      <span className="progress-label">
        {t("onboarding.progress", { step, totalSteps })}
      </span>

    </div>
  );
}

export default ProgressBar;