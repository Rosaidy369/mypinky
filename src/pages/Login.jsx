import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/Login.css";

function Login() {
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
        setErrorMsg("Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada (y la carpeta de spam).");
      } else if (error.message === "Invalid login credentials") {
        setErrorMsg("Correo o contraseña incorrectos.");
      } else {
        setErrorMsg("Ocurrió un error al iniciar sesión. Intenta de nuevo.");
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

  return (

    <div className="login-page">

      <div className="login-card">

        <div className="login-header">

          <h1 className="auth-logo">
            My<span>Pinky</span>
          </h1>

          <h2>¡Bienvenido de nuevo!</h2>

          <p>
            Inicia sesión para seguir conociendo personas.
          </p>

        </div>

        <form className="login-form" onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {errorMsg && <p className="login-error">{errorMsg}</p>}

          <button type="submit">
            Iniciar sesión
          </button>

        </form>

        <div className="login-links">

          <Link to="#">
            ¿Olvidaste tu contraseña?
          </Link>

        </div>

        <div className="separator">

          <span>o</span>

        </div>

        <button className="google-btn">

  <img
    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
    alt="Google"
  />

  Continuar con Google

</button>

        <p className="login-register-link">

          ¿No tienes cuenta?

          <Link to="/register">
            Crear cuenta
          </Link>

        </p>

        <p className="back-home">

  <Link to="/">
    ← Volver al inicio
  </Link>

</p>

      </div>

    </div>
  );
}

export default Login;