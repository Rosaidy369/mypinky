import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import WarningIcon from "./ui/WarningIcon";
import "../styles/SuspendedScreen.css";

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SuspendedScreen({ suspension }) {
  const { logout } = useAuth();

  return (
    <div className="suspended-page">

      <div className="suspended-card">

        <div className="suspended-icon"><WarningIcon size={36} /></div>

        <h1>Tu cuenta está suspendida temporalmente</h1>

        <p className="suspended-until">
          Podrás volver a usar MyPinky a partir del <strong>{formatDate(suspension.until)}</strong>.
        </p>

        <div className="suspended-reason">
          <h2>Motivo</h2>
          <p>
            {suspension.reason
              ? suspension.reason
              : "Detectamos actividad que no cumple con nuestras reglas de la comunidad. Revisamos cada caso a mano para que la sanción sea justa."}
          </p>
        </div>

        <p className="suspended-note">
          Esto no es una expulsión definitiva — es temporal, y creemos en dar segundas oportunidades.
          Cuando pase la fecha, tu cuenta vuelve a funcionar normalmente sin que tengas que hacer nada.
        </p>

        <div className="suspended-actions">
          <Link to="/soporte" className="suspended-support-btn">
            Contactar a soporte
          </Link>

          <button className="suspended-logout-btn" onClick={logout}>
            Cerrar sesión
          </button>
        </div>

      </div>

    </div>
  );
}

export default SuspendedScreen;
