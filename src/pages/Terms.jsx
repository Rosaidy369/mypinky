import { useTranslation } from "react-i18next";
import "../styles/Legal.css";

function Terms() {
  const { t } = useTranslation();
  const sections = t("terms.sections", { returnObjects: true });

  return (
    <div className="legal-page">

      <div className="legal-content">

        <h1>{t("terms.title")}</h1>
        <p className="legal-updated">{t("terms.updated")}</p>

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

export default Terms;
