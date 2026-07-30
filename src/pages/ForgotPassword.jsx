import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import "../styles/Login.css";
import "../styles/Register.css";

function ForgotPassword() {
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
      setErrorMsg("Ocurrió un error al enviar el enlace. Intenta de nuevo.");
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
            <div className="confirm-email-icon">📧</div>
            <h2>¡Revisa tu correo!</h2>
            <p>
              Si existe una cuenta con <strong>{email}</strong>, te enviamos un enlace
              para restablecer tu contraseña (revisa también la carpeta de spam).
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
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <h1 className="auth-logo">My<span>Pinky</span></h1>
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>Escribe tu correo y te enviamos un enlace para restablecerla.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {errorMsg && <p className="login-error">{errorMsg}</p>}

          <button type="submit" disabled={sending}>
            {sending ? "Enviando..." : "Enviar enlace"}
          </button>

        </form>

        <p className="back-home">
          <Link to="/login">← Volver a iniciar sesión</Link>
        </p>

      </div>
    </div>
  );
}

export default ForgotPassword;
