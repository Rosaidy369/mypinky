import "../../styles/Benefits.css";

function Benefits() {
  return (
    <section className="benefits">

      <h2>¿Por qué elegir MyPinky?</h2>

      <div className="benefits-grid">

        <div className="benefit">
          <div className="icon">💬</div>
          <h3>Conversaciones reales</h3>
          <p>Conoce personas con quienes compartir momentos y conversar.</p>
        </div>

        <div className="benefit">
          <div className="icon">🛡️</div>
          <h3>Mayor privacidad</h3>
          <p>Tú decides con quién hablar y cuándo hacerlo.</p>
        </div>

        <div className="benefit">
          <div className="icon">⭐</div>
          <h3>Experiencia Premium</h3>
          <p>Una plataforma rápida, moderna y diseñada para adultos.</p>
        </div>

      </div>

    </section>
  );
}

export default Benefits;