import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { GOOGLE_AUTH_ENABLED } from "../lib/authConfig";
import "../styles/Login.css";

function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { error } = await login(email, password);

    if (error) {
      if (error.message === "Email not confirmed") {
        setErrorMsg(t("auth.login.notConfirmed"));
      } else if (error.message === "Invalid login credentials") {
        setErrorMsg(t("auth.login.invalidCredentials"));
      } else {
        setErrorMsg(t("auth.login.genericError"));
      }
      return;
    }

    const redirectTo = sessionStorage.getItem("mypinky_redirect_after_login");
    if (redirectTo) {
      sessionStorage.removeItem("mypinky_redirect_after_login");
      navigate(redirectTo);
    } else {
      navigate("/swipe");
    }
  };

  const handleGoogleLogin = async () => {
    // Same redirect-intent key the email/password path already honors
    // (set by ProtectedRoute when a logged-out user is bounced from a
    // deep link) -- Google's OAuth flow is a full page redirect, not a
    // client-side navigate, so the target has to be baked into
    // redirectTo itself rather than read after the fact.
    const target = sessionStorage.getItem("mypinky_redirect_after_login") || "/swipe";
    sessionStorage.removeItem("mypinky_redirect_after_login");

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${target}` },
    });
  };

  return (

    <div className="login-page">

      <div className="login-card">

        <div className="login-header">

          <h1 className="auth-logo">
            My<span>Pinky</span>
          </h1>

          <h2>{t("auth.login.heading")}</h2>

          <p>
            {t("auth.login.subtitle")}
          </p>

        </div>

        <form className="login-form" onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder={t("auth.login.emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder={t("auth.login.passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {errorMsg && <p className="login-error">{errorMsg}</p>}

          <button type="submit">
            {t("auth.login.submit")}
          </button>

        </form>

        <div className="login-links">

          <Link to="/olvide-contrasena">
            {t("auth.login.forgotPassword")}
          </Link>

        </div>

        {GOOGLE_AUTH_ENABLED && (
          <>
            <div className="separator">

              <span>{t("auth.login.separator")}</span>

            </div>

            <button type="button" className="google-btn" onClick={handleGoogleLogin}>

              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google"
              />

              {t("auth.login.googleButton")}

            </button>
          </>
        )}

        <p className="login-register-link">

          {t("auth.login.noAccount")}

          <Link to="/register">
            {t("auth.login.registerLink")}
          </Link>

        </p>

        <p className="back-home">

  <Link to="/">
    {t("auth.login.backHome")}
  </Link>

</p>

      </div>

    </div>
  );
}

export default Login;
