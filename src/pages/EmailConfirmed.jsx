import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import SuccessCheck from "../components/ui/SuccessCheck";
import "../styles/Login.css";
import "../styles/Register.css";

function EmailConfirmed() {
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  // Clicking the confirmation link makes Supabase establish a session via
  // the URL token before this page mounts -- same detection pattern as
  // ResetPassword.jsx's PASSWORD_RECOVERY handling, just for SIGNED_IN.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <h1 className="auth-logo">My<span>Pinky</span></h1>
        </div>

        <div className="confirm-email-message">
          <div className="success-icon"><SuccessCheck size={48} /></div>
          <h2>{t("auth.emailConfirmed.heading")}</h2>
          <p>{t("auth.emailConfirmed.message")}</p>
          <Link to={ready ? "/onboarding" : "/login"} className="confirm-email-btn">
            {ready ? t("auth.emailConfirmed.continueButton") : t("auth.emailConfirmed.goToLogin")}
          </Link>
        </div>

      </div>
    </div>
  );
}

export default EmailConfirmed;
