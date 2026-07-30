import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import "../styles/Register.css";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", age: "", email: "", password: "", confirmPassword: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [registered, setRegistered] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    const { error } = await register(form.email, form.password, form.name, Number(form.age));

    if (error) {
      console.log("ERROR REAL DE SUPABASE:", error.message);
      setErrorMsg(error.message === "User already registered"
        ? "Ya existe una cuenta con ese correo."
        : "Ocurrió un error al crear tu cuenta.");
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
            <div className="confirm-email-icon">📧</div>
            <h2>¡Revisa tu correo!</h2>
            <p>
              Te enviamos un enlace de confirmación a <strong>{form.email}</strong>.
              Ábrelo para activar tu cuenta (revisa también la carpeta de spam).
            </p>
            <Link to="/login" className="confirm-email-btn">
              Ir a iniciar sesión
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

          <h2>Crea tu cuenta</h2>

          <p>
            Regístrate y empieza a conocer personas nuevas.
          </p>

        </div>

        <form className="register-form" onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Nombre completo"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Edad"
            min="18"
            value={form.age}
            onChange={(e) => updateField("age", e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
            minLength={6}
          />

          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={form.confirmPassword}
            onChange={(e) => updateField("confirmPassword", e.target.value)}
            required
          />

          <label className="terms">

            <input type="checkbox" required />

            <span>
              Acepto los{" "}
              <Link to="/terminos" target="_blank" rel="noopener noreferrer">
                términos y condiciones
              </Link>
            </span>

          </label>

          {errorMsg && <p className="register-error">{errorMsg}</p>}

          <button type="submit">
            Crear cuenta
          </button>

        </form>

        <div className="separator">
          <span>o</span>
        </div>

        <button type="button" className="google-btn" onClick={handleGoogleRegister}>

          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
            alt="Google"
          />

          Continuar con Google

        </button>

        <p className="login-redirect">

          ¿Ya tienes cuenta?

          <Link to="/login">
            Iniciar sesión
          </Link>

        </p>

        <p className="back-home">
          <Link to="/">← Volver al inicio</Link>
        </p>

      </div>

    </div>
  );
}

export default Register;