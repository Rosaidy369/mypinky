import { useTranslation } from "react-i18next";
import "../styles/Legal.css";

function Privacy() {
  const { t } = useTranslation();
  const sections = t("privacy.sections", { returnObjects: true });

  return (
    <div className="legal-page">

      <div className="legal-content">

        <h1>{t("privacy.title")}</h1>
        <p className="legal-updated">{t("privacy.updated")}</p>

        {sections.map((section, i) => (
          <div key={i}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </div>
        ))}

      </div>

    </div>
  );
}

export default Privacy;
