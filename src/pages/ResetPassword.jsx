import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import SuccessCheck from "../components/ui/SuccessCheck";
import "../styles/Login.css";
import "../styles/Register.css";

function ResetPassword() {
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
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      setErrorMsg("No se pudo actualizar tu contraseña. El enlace puede haber expirado.");
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
            <h2>¡Contraseña actualizada!</h2>
            <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <Link to="/login" className="confirm-email-btn">
              Ir a iniciar sesión
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
            <h2>Enlace inválido o expirado</h2>
            <p>Solicita un nuevo enlace para restablecer tu contraseña.</p>
            <Link to="/olvide-contrasena" className="confirm-email-btn">
              Solicitar enlace nuevo
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
          <h2>Crea una nueva contraseña</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>

          <input
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {errorMsg && <p className="login-error">{errorMsg}</p>}

          <button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar contraseña"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default ResetPassword;
