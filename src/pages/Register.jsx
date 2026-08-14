import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { isAtLeast18 } from "../lib/age";
import EmailSentIcon from "../components/ui/EmailSentIcon";
import BirthDatePicker from "../components/ui/BirthDatePicker";
import "../styles/Register.css";

function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", birthDate: null, email: "", password: "", confirmPassword: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [registered, setRegistered] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/swipe` },
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

          <input
            type="text"
            placeholder={t("auth.register.namePlaceholder")}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />

          <BirthDatePicker
            value={form.birthDate}
            onChange={(value) => updateField("birthDate", value)}
          />

          <input
            type="email"
            placeholder={t("auth.register.emailPlaceholder")}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />

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
