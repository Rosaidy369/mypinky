import { useTranslation } from "react-i18next";
import PersonIcon from "../ui/PersonIcon";
import SearchIcon from "../ui/SearchIcon";
import MatchHeartIcon from "../ui/MatchHeartIcon";
import MessageIcon from "../ui/MessageIcon";
import "../../styles/HowItWorks.css";

// Text lives in the locale files (home.howItWorks.steps); icons don't
// translate, so they're kept here in the same order and zipped by index.
const STEP_ICONS = [PersonIcon, SearchIcon, MatchHeartIcon, MessageIcon];

function HowItWorks() {
  const { t } = useTranslation();
  const steps = t("home.howItWorks.steps", { returnObjects: true });

  return (
    <section className="how-it-works">

      <h2>{t("home.howItWorks.title")}</h2>

      <div className="steps-timeline">

        {steps.map(({ title, description }, i) => {
          const Icon = STEP_ICONS[i];
          return (
            <div className="step" key={i}>

              <div className="step-marker">
                <div className="step-icon"><Icon size={26} /></div>
                {i < steps.length - 1 && <span className="step-connector"></span>}
              </div>

              <div className="step-content">
                <h3>{title}</h3>
                <p>{description}</p>
              </div>

            </div>
          );
        })}

      </div>

    </section>
  );
}

export default HowItWorks;
