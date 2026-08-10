import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import EmailSentIcon from "../components/ui/EmailSentIcon";
import "../styles/Login.css";
import "../styles/Register.css";

function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    });

    setSending(false);

    if (error) {
      // Supabase enforces a cooldown between consecutive password-reset
      // emails per address (returns status 429 / code
      // "over_email_send_rate_limit") -- surfaced as a specific message
      // so it doesn't read like a real failure.
      console.error("Error enviando enlace de restablecimiento:", error.status, error.code, error.message);

      if (error.code === "over_email_send_rate_limit" || error.status === 429) {
        setErrorMsg(t("auth.forgotPassword.rateLimitError"));
      } else {
        setErrorMsg(t("auth.forgotPassword.genericError"));
      }
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="login-page">
        <div className="login-card">

          <div className="login-header">
            <h1 className="auth-logo">My<span>Pinky</span></h1>
          </div>

          <div className="confirm-email-message">
            <EmailSentIcon size={64} />
            <h2>{t("auth.forgotPassword.sentHeading")}</h2>
            <p>
              {t("auth.forgotPassword.sentMessagePrefix")}<strong>{email}</strong>{t("auth.forgotPassword.sentMessageSuffix")}
            </p>
            <Link to="/login" className="confirm-email-btn">
              {t("auth.forgotPassword.goToLogin")}
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <h1 className="auth-logo">My<span>Pinky</span></h1>
          <h2>{t("auth.forgotPassword.heading")}</h2>
          <p>{t("auth.forgotPassword.subtitle")}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder={t("auth.forgotPassword.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {errorMsg && <p className="login-error">{errorMsg}</p>}

          <button type="submit" disabled={sending}>
            {sending ? t("auth.forgotPassword.submitSending") : t("auth.forgotPassword.submit")}
          </button>

        </form>

        <p className="back-home">
          <Link to="/login">{t("auth.forgotPassword.backToLogin")}</Link>
        </p>

      </div>
    </div>
  );
}

export default ForgotPassword;
