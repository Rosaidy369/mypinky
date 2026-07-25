import { Link } from "react-router-dom";
import "../styles/Legal.css";

const FAQS = [
  {
    q: "¿Cómo elimino mi cuenta?",
    a: "Ve a Configuración → Cuenta → Eliminar mi cuenta. Esta acción no se puede deshacer.",
  },
  {
    q: "¿Cómo cancelo mi suscripción Premium?",
    a: "Ve a Configuración → Suscripción y pago → Cancelar membresía.",
  },
  {
    q: "¿Puedo cambiar mi nombre o edad?",
    a: "No, por seguridad estos datos no se pueden editar después del registro.",
  },
  {
    q: "¿Cómo reporto un perfil sospechoso?",
    a: "Próximamente agregaremos un botón de reporte directo en cada perfil.",
  },
];

function Support() {
  return (
    <div className="legal-page">

      <div className="legal-content">

        <h1>Centro de Soporte</h1>
        <p className="legal-updated">¿En qué podemos ayudarte?</p>

        <div className="support-faqs">

          {FAQS.map((item, i) => (
            <div className="support-faq-item" key={i}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}

        </div>

        <div className="support-cta">
          <p>¿No encontraste lo que buscabas?</p>
          <Link to="/contacto" className="support-cta-btn">
            Contáctanos
          </Link>
        </div>

      </div>

    </div>
  );
}

export default Support;