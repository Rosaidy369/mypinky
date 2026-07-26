import PersonIcon from "../ui/PersonIcon";
import QuoteIcon from "../ui/QuoteIcon";
import "../../styles/OurMission.css";

function OurMission() {
  return (
    <section className="our-mission">

      <h2>Nuestra misión</h2>

      <div className="mission-letter">

        <span className="mission-quote-icon"><QuoteIcon size={46} /></span>

        <p className="mission-lede">
          Creé MyPinky porque quería una app de citas que fuera segura, pero también más humana.
        </p>

        <p>
          He visto cómo otras plataformas terminan bloqueando a sus usuarios de forma injusta,
          muchas veces sin explicación clara, y sin darles oportunidad de volver — incluso por
          errores pequeños. Eso no me parece justo.
        </p>

        <p>
          Mi idea con MyPinky es simple: mantener la seguridad como prioridad — sin perfiles
          falsos, con reglas claras que se deben respetar — pero con un trato más flexible y
          humano hacia quienes forman parte de esta comunidad. Queremos que te sientas libre de
          ser tú mismo, siempre y cuando también respetes a los demás.
        </p>

        <p>
          Esto apenas comienza, y me da mucha ilusión construirlo contigo desde el principio.
        </p>

        <div className="mission-signature">
          <span className="mission-avatar"><PersonIcon size={20} /></span>
          <span className="mission-signature-text">— Rosaidy Mercedes, fundadora de MyPinky</span>
        </div>

      </div>

    </section>
  );
}

export default OurMission;
