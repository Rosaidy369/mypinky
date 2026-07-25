import "../../styles/Testimonials.css";

function Testimonials() {
  return (
    <section className="testimonials">

      <h2>Lo que dicen nuestros usuarios</h2>

      <div className="testimonial-grid">

        <div className="testimonial">
          <p>"Encontré personas increíbles con quienes hablar después del trabajo."</p>
          <h4>— Carlos, 31</h4>
        </div>

        <div className="testimonial">
          <p>"La plataforma es rápida, bonita y muy fácil de usar."</p>
          <h4>— Daniel, 27</h4>
        </div>

        <div className="testimonial">
          <p>"Me gusta porque puedo conversar cuando quiero, sin complicaciones."</p>
          <h4>— Miguel, 35</h4>
        </div>

      </div>

    </section>
  );
}

export default Testimonials;