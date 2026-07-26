import PersonIcon from "../ui/PersonIcon";
import SearchIcon from "../ui/SearchIcon";
import MatchHeartIcon from "../ui/MatchHeartIcon";
import MessageIcon from "../ui/MessageIcon";
import "../../styles/HowItWorks.css";

const STEPS = [
  {
    Icon: PersonIcon,
    title: "Crea tu perfil",
    description: "Sube tus fotos, cuéntanos quién eres y qué buscas",
  },
  {
    Icon: SearchIcon,
    title: "Descubre personas",
    description: "Explora perfiles reales, filtra por lo que te importa",
  },
  {
    Icon: MatchHeartIcon,
    title: "Haz match",
    description: "Cuando el interés es mutuo, se abre la conversación",
  },
  {
    Icon: MessageIcon,
    title: "Empieza a conversar",
    description: "Rompe el hielo y conoce a alguien especial",
  },
];

function HowItWorks() {
  return (
    <section className="how-it-works">

      <h2>Cómo funciona</h2>

      <div className="steps-timeline">

        {STEPS.map(({ Icon, title, description }, i) => (
          <div className="step" key={title}>

            <div className="step-marker">
              <div className="step-icon"><Icon size={26} /></div>
              {i < STEPS.length - 1 && <span className="step-connector"></span>}
            </div>

            <div className="step-content">
              <h3>{title}</h3>
              <p>{description}</p>
            </div>

          </div>
        ))}

      </div>

    </section>
  );
}

export default HowItWorks;
