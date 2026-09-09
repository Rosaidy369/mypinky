import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { isAtLeast18 } from "../lib/age";
import { GOOGLE_AUTH_ENABLED } from "../lib/authConfig";
import { suggestEmailCorrection } from "../lib/emailTypoCheck";
import EmailSentIcon from "../components/ui/EmailSentIcon";
import BirthDatePicker from "../components/ui/BirthDatePicker";
import "../styles/Register.css";

function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", birthDate: null, email: "", password: "", confirmPassword: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [registered, setRegistered] = useState(false);
  const [emailSuggestion, setEmailSuggestion] = useState(null);

  const updateField = (field, value) => {
    if (field === "email") setEmailSuggestion(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Checked on blur, not on every keystroke, so the suggestion doesn't
  // flash while the person is still mid-typing. Purely a hint -- never
  // blocks submit, since a real (if unusual) domain shouldn't be
  // second-guessed just because it resembles a common one.
  const checkEmailTypo = () => {
    setEmailSuggestion(suggestEmailCorrection(form.email));
  };

  const applyEmailSuggestion = () => {
    updateField("email", emailSuggestion);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (form.password !== form.confirmPassword) {
      setErrorMsg(t("auth.register.passwordMismatch"));
      return;
    }

    if (!form.birthDate) {
      setErrorMsg(t("auth.register.birthDateRequired"));
      return;
    }

    if (!isAtLeast18(form.birthDate)) {
      setErrorMsg(t("auth.register.underageError"));
      return;
    }

    const { error } = await register(form.email, form.password, form.name, form.birthDate);

    if (error) {
      console.error("Error de registro:", error.message);
      setErrorMsg(error.message === "User already registered"
        ? t("auth.register.emailTaken")
        : t("auth.register.genericError"));
      return;
    }

    setRegistered(true);
  };

  const handleGoogleRegister = async () => {
    // Same redirect-intent key Login.jsx's Google path honors -- see the
    // comment there. A brand-new signup still lands in Onboarding first
    // regardless (ProtectedRoute's profileIncompleteGateNeeded), but an
    // existing Google account clicking "Register" again should still
    // return to whatever deep link sent them to auth in the first place.
    const target = sessionStorage.getItem("mypinky_redirect_after_login") || "/swipe";
    sessionStorage.removeItem("mypinky_redirect_after_login");

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${target}` },
    });
  };

  if (registered) {
    return (
      <div className="register-page">
        <div className="register-card">

          <div className="register-header">
            <h1 className="auth-logo">
              My<span>Pinky</span>
            </h1>
          </div>

          <div className="confirm-email-message">
            <EmailSentIcon size={64} />
            <h2>{t("auth.register.confirmHeading")}</h2>
            <p>
              {t("auth.register.confirmMessagePrefix")}<strong>{form.email}</strong>{t("auth.register.confirmMessageSuffix")}
            </p>
            <Link to="/login" className="confirm-email-btn">
              {t("auth.register.confirmGoToLogin")}
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (

    <div className="register-page">

      <div className="register-card">

        <div className="register-header">

          <h1 className="auth-logo">
            My<span>Pinky</span>
          </h1>

          <h2>{t("auth.register.heading")}</h2>

          <p>
            {t("auth.register.subtitle")}
          </p>

        </div>

        <form className="register-form" onSubmit={handleSubmit}>

          <div className="name-field-group">
            <label className="field-label">{t("auth.register.nameLabel")}</label>
            <input
              type="text"
              placeholder={t("auth.register.namePlaceholder")}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
            <p className="field-hint">{t("auth.register.nameHint")}</p>
          </div>

          <BirthDatePicker
            value={form.birthDate}
            onChange={(value) => updateField("birthDate", value)}
          />

          <input
            type="email"
            placeholder={t("auth.register.emailPlaceholder")}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            onBlur={checkEmailTypo}
            required
          />

          {emailSuggestion && (
            <p className="email-typo-suggestion">
              {t("auth.emailTypo.question", { email: emailSuggestion })}{" "}
              <button type="button" onClick={applyEmailSuggestion}>
                {t("auth.emailTypo.applyBtn")}
              </button>
            </p>
          )}

          <input
            type="password"
            placeholder={t("auth.register.passwordPlaceholder")}
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
            minLength={6}
          />

          <input
            type="password"
            placeholder={t("auth.register.confirmPasswordPlaceholder")}
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            required
          />

          <label className="terms">

            <input type="checkbox" required />

            <span>
              {t("auth.register.termsAgreePrefix")}
              <Link to="/terminos" target="_blank" rel="noopener noreferrer">
                {t("auth.register.termsLink")}
              </Link>
            </span>

          </label>

          {errorMsg && <p className="register-error">{errorMsg}</p>}

          <button type="submit">
            {t("auth.register.submit")}
          </button>

        </form>

        {GOOGLE_AUTH_ENABLED && (
          <>
            <div className="separator">
              <span>{t("auth.register.separator")}</span>
            </div>

            <button type="button" className="google-btn" onClick={handleGoogleRegister}>

              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                alt="Google"
              />

              {t("auth.register.googleButton")}

            </button>
          </>
        )}

        <p className="login-redirect">

          {t("auth.register.haveAccount")}

          <Link to="/login">
            {t("auth.register.loginLink")}
          </Link>

        </p>

        <p className="back-home">
          <Link to="/">{t("auth.register.backHome")}</Link>
        </p>

      </div>

    </div>
  );
}

export default Register;
