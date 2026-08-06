import { useTranslation } from "react-i18next";
import MessageIcon from "../ui/MessageIcon";
import ShieldIcon from "../ui/ShieldIcon";
import StarIcon from "../ui/StarIcon";
import "../../styles/Benefits.css";

function Benefits() {
  const { t } = useTranslation();

  return (
    <section className="benefits">

      <h2>{t("home.benefits.title")}</h2>

      <div className="benefits-grid">

        <div className="benefit">
          <div className="icon"><MessageIcon size={26} /></div>
          <h3>{t("home.benefits.item1.title")}</h3>
          <p>{t("home.benefits.item1.body")}</p>
        </div>

        <div className="benefit">
          <div className="icon"><ShieldIcon size={26} /></div>
          <h3>{t("home.benefits.item2.title")}</h3>
          <p>{t("home.benefits.item2.body")}</p>
        </div>

        <div className="benefit">
          <div className="icon"><StarIcon size={26} /></div>
          <h3>{t("home.benefits.item3.title")}</h3>
          <p>{t("home.benefits.item3.body")}</p>
        </div>

      </div>

    </section>
  );
}

export default Benefits;
