import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import SuccessCheck from "../components/ui/SuccessCheck";
import "../styles/Login.css";
import "../styles/Register.css";

function ResetPassword() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 6) {
      setErrorMsg(t("auth.resetPassword.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t("auth.resetPassword.passwordMismatch"));
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setErrorMsg(t("auth.resetPassword.updateError"));
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="login-page">
        <div className="login-card">

          <div className="login-header">
            <h1 className="auth-logo">My<span>Pinky</span></h1>
          </div>

          <div className="confirm-email-message">
            <div className="success-icon"><SuccessCheck size={48} /></div>
            <h2>{t("auth.resetPassword.doneHeading")}</h2>
            <p>{t("auth.resetPassword.doneMessage")}</p>
            <Link to="/login" className="confirm-email-btn">
              {t("auth.resetPassword.goToLogin")}
            </Link>
          </div>

        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="login-page">
        <div className="login-card">

          <div className="login-header">
            <h1 className="auth-logo">My<span>Pinky</span></h1>
          </div>

          <div className="confirm-email-message">
            <div className="confirm-email-icon">⚠️</div>
            <h2>{t("auth.resetPassword.invalidHeading")}</h2>
            <p>{t("auth.resetPassword.invalidMessage")}</p>
            <Link to="/olvide-contrasena" className="confirm-email-btn">
              {t("auth.resetPassword.requestNewLink")}
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
          <h2>{t("auth.resetPassword.heading")}</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>

          <input
            type="password"
            placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <input
            type="password"
            placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {errorMsg && <p className="login-error">{errorMsg}</p>}

          <button type="submit" disabled={saving}>
            {saving ? t("auth.resetPassword.submitSaving") : t("auth.resetPassword.submit")}
          </button>

        </form>

      </div>
    </div>
  );
}

export default ResetPassword;
