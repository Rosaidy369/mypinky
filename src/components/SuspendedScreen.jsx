import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import WarningIcon from "./ui/WarningIcon";
import "../styles/SuspendedScreen.css";

function formatDate(isoString, locale) {
  return new Date(isoString).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SuspendedScreen({ suspension }) {
  const { t, i18n } = useTranslation();
  const { logout } = useAuth();

  return (
    <div className="suspended-page">

      <div className="suspended-card">

        <div className="suspended-icon"><WarningIcon size={36} /></div>

        <h1>{t("suspended.title")}</h1>

        <p className="suspended-until">
          {t("suspended.untilPrefix")} <strong>{formatDate(suspension.until, i18n.language)}</strong>.
        </p>

        <div className="suspended-reason">
          <h2>{t("suspended.reasonHeading")}</h2>
          <p>
            {suspension.reason
              ? suspension.reason
              : t("suspended.reasonFallback")}
          </p>
        </div>

        <p className="suspended-note">
          {t("suspended.note")}
        </p>

        <div className="suspended-actions">
          <Link to="/soporte" className="suspended-support-btn">
            {t("suspended.contactSupport")}
          </Link>

          <button className="suspended-logout-btn" onClick={logout}>
            {t("suspended.logout")}
          </button>
        </div>

      </div>

    </div>
  );
}

export default SuspendedScreen;
